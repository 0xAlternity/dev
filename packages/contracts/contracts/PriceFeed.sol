// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import "./Interfaces/IPriceFeed.sol";
import "./Interfaces/ITellorCaller.sol";
import "./Dependencies/AggregatorV3Interface.sol";
import "./Dependencies/SafeMath.sol";
import "./Dependencies/Ownable.sol";
import "./Dependencies/CheckContract.sol";
import "./Dependencies/BaseMath.sol";
import "./Dependencies/LiquityMath.sol";
import "./Dependencies/console.sol";

/*
 * PriceFeed for mainnet deployment, to be connected to Chainlink's live ETH:USD and CNY/USD
 * aggregator reference contracts, and a wrapper contract TellorCaller, which connects to 
 * TellorMaster contract.
 * The PriceFeed calculates cross pair price for ETH/CNY via both connected oracles.
 *
 * The PriceFeed uses Chainlink as primary oracle, and Tellor as fallback. It contains logic for
 * switching oracles based on oracle failures, timeouts, and conditions for returning to the primary
 * Chainlink oracle.
 */
contract PriceFeed is Ownable, CheckContract, BaseMath, IPriceFeed {
    using SafeMath for uint256;

    string constant public NAME = "PriceFeed";

    AggregatorV3Interface public priceAggregatorEth; // Mainnet Chainlink aggregator ETH/USD
    AggregatorV3Interface public priceAggregatorCny; // Mainnet Chainlink aggregator CNY/USD
    ITellorCaller public tellorCaller; // Wrapper contract that calls the Tellor system

    // Core Liquity contracts
    address borrowerOperationsAddress;
    address troveManagerAddress;

    // Tellor queryId for ETH/USD Oracle
    bytes32 public immutable ETHUSD_TELLOR_REQ_ID = keccak256(abi.encode("SpotPrice", abi.encode("eth", "usd")));
    //Tellor queryId for CNY/USD Oracle
    bytes32 public immutable CNYUSD_TELLOR_REQ_ID = keccak256(abi.encode("SpotPrice", abi.encode("cny", "usd")));

    // Use to convert a price answer to an 18-digit precision uint
    uint constant public TARGET_DIGITS = 18;
    uint constant public TELLOR_DIGITS = 18;

    // Maximum time period allowed since Chainlink's latest round data timestamp, beyond which Chainlink is considered frozen.
    uint constant public TIMEOUT = 14400; // 4 hours: 60 * 60 * 4
    uint256 constant public CNY_TIMEOUT = 129600; // 36 hours: 60 * 60 * 36

    // Maximum deviation allowed between two consecutive Chainlink oracle prices. 18-digit precision.
    uint constant public MAX_PRICE_DEVIATION_FROM_PREVIOUS_ROUND =  5e17; // 50%

    /*
     * The maximum relative price difference between two oracle responses allowed in order for the PriceFeed
     * to return to using the Chainlink oracle. 18-digit precision.
     */
    uint constant public MAX_PRICE_DIFFERENCE_BETWEEN_ORACLES = 5e16; // 5%

    // The last good price seen from an oracle by Liquity
    uint public lastGoodPrice;

    struct ChainlinkResponse {
        uint80 roundId;
        uint80 cnyRoundId;
        int256 answer;
        uint256 timestamp;
        uint256 cnyTimestamp;
        bool success;
        uint8 decimals;
    }

    struct TellorResponse {
        bool ifRetrieve;
        uint256 value;
        uint256 timestamp;
        uint256 cnyTimestamp;
        bool success;
    }

    enum Status {
        chainlinkWorking,
        usingTellorChainlinkUntrusted,
        bothOraclesUntrusted,
        usingTellorChainlinkFrozen,
        usingChainlinkTellorUntrusted
    }

    // The current status of the PricFeed, which determines the conditions for the next price fetch attempt
    Status public status;

    event LastGoodPriceUpdated(uint _lastGoodPrice);
    event PriceFeedStatusChanged(Status newStatus);

    // --- Dependency setters ---

    function setAddresses(
        address _priceAggregatorAddressEth,
        address _priceAggregatorAddressCny,
        address _tellorCallerAddress
    ) external onlyOwner {
        checkContract(_priceAggregatorAddressEth);
        checkContract(_priceAggregatorAddressCny);
        checkContract(_tellorCallerAddress);

        priceAggregatorEth = AggregatorV3Interface(_priceAggregatorAddressEth);
        priceAggregatorCny = AggregatorV3Interface(_priceAggregatorAddressCny);
        tellorCaller = ITellorCaller(_tellorCallerAddress);

        // Explicitly set initial system status
        status = Status.chainlinkWorking;

        // Get an initial price from Chainlink to serve as first reference for lastGoodPrice
        ChainlinkResponse memory chainlinkResponse = _getCurrentChainlinkResponse();
        ChainlinkResponse memory prevChainlinkResponse = _getPrevChainlinkResponse(
            chainlinkResponse.roundId,
            chainlinkResponse.cnyRoundId,
            chainlinkResponse.decimals
        );

        require(!_chainlinkIsBroken(chainlinkResponse, prevChainlinkResponse) && !_chainlinkIsFrozen(chainlinkResponse),
            "PriceFeed: Chainlink must be working and current");

        _storeChainlinkPrice(chainlinkResponse);

        _renounceOwnership();
    }

    // --- Functions ---

    /*
     * fetchPrice():
     * Returns the latest price obtained from the Oracle. Called by Liquity functions that require a current price.
     *
     * Also callable by anyone externally.
     *
     * Non-view function - it stores the last good price seen by Liquity.
     *
     * Uses a main oracle (Chainlink) and a fallback oracle (Tellor) in case Chainlink fails. If both fail,
     * it uses the last good price seen by Liquity.
     *
     */
    function fetchPrice() external override returns (uint) {
        // Get current and previous price data from Chainlink, and current price data from Tellor
        ChainlinkResponse memory chainlinkResponse = _getCurrentChainlinkResponse();
        ChainlinkResponse memory prevChainlinkResponse = _getPrevChainlinkResponse(
            chainlinkResponse.roundId,
            chainlinkResponse.cnyRoundId,
            chainlinkResponse.decimals
        );
        TellorResponse memory tellorResponse = _getCurrentTellorResponse();

        // --- CASE 1: System fetched last price from Chainlink  ---
        if (status == Status.chainlinkWorking) {
            // If Chainlink is broken, try Tellor
            if (_chainlinkIsBroken(chainlinkResponse, prevChainlinkResponse)) {
                // If Tellor is broken then both oracles are untrusted, so return the last good price
                if (_tellorIsBroken(tellorResponse)) {
                    _changeStatus(Status.bothOraclesUntrusted);
                    return lastGoodPrice;
                }
                /*
                 * If Tellor is only frozen but otherwise returning valid data, return the last good price.
                 * Tellor may need to be tipped to return current data.
                 */
                if (_tellorIsFrozen(tellorResponse)) {
                    _changeStatus(Status.usingTellorChainlinkUntrusted);
                    return lastGoodPrice;
                }

                // If Chainlink is broken and Tellor is working, switch to Tellor and return current Tellor price
                _changeStatus(Status.usingTellorChainlinkUntrusted);
                return _storeTellorPrice(tellorResponse);
            }

            // If Chainlink is frozen, try Tellor
            if (_chainlinkIsFrozen(chainlinkResponse)) {
                // If Tellor is broken too, remember Tellor broke, and return last good price
                if (_tellorIsBroken(tellorResponse)) {
                    _changeStatus(Status.usingChainlinkTellorUntrusted);
                    return lastGoodPrice;
                }

                // If Tellor is frozen or working, remember Chainlink froze, and switch to Tellor
                _changeStatus(Status.usingTellorChainlinkFrozen);

                if (_tellorIsFrozen(tellorResponse)) {return lastGoodPrice;}

                // If Tellor is working, use it
                return _storeTellorPrice(tellorResponse);
            }

            // If Chainlink price has changed by > 50% between two consecutive rounds, compare it to Tellor's price
            if (_chainlinkPriceChangeAboveMax(chainlinkResponse, prevChainlinkResponse)) {
                // If Tellor is broken, both oracles are untrusted, and return last good price
                if (_tellorIsBroken(tellorResponse)) {
                    _changeStatus(Status.bothOraclesUntrusted);
                    return lastGoodPrice;
                }

                // If Tellor is frozen, switch to Tellor and return last good price
                if (_tellorIsFrozen(tellorResponse)) {
                    _changeStatus(Status.usingTellorChainlinkUntrusted);
                    return lastGoodPrice;
                }

                /*
                 * If Tellor is live and both oracles have a similar price, conclude that Chainlink's large price deviation between
                 * two consecutive rounds was likely a legitmate market price movement, and so continue using Chainlink
                 */
                if (_bothOraclesSimilarPrice(chainlinkResponse, tellorResponse)) {
                    return _storeChainlinkPrice(chainlinkResponse);
                }

                // If Tellor is live but the oracles differ too much in price, conclude that Chainlink's initial price deviation was
                // an oracle failure. Switch to Tellor, and use Tellor price
                _changeStatus(Status.usingTellorChainlinkUntrusted);
                return _storeTellorPrice(tellorResponse);
            }

            // If Chainlink is working and Tellor is broken, remember Tellor is broken
            if (_tellorIsBroken(tellorResponse)) {
                _changeStatus(Status.usingChainlinkTellorUntrusted);
            }

            // If Chainlink is working, return Chainlink current price (no status change)
            return _storeChainlinkPrice(chainlinkResponse);
        }


        // --- CASE 2: The system fetched last price from Tellor ---
        if (status == Status.usingTellorChainlinkUntrusted) {
            // If both Tellor and Chainlink are live, unbroken, and reporting similar prices, switch back to Chainlink
            if (_bothOraclesLiveAndUnbrokenAndSimilarPrice(chainlinkResponse, prevChainlinkResponse, tellorResponse)) {
                _changeStatus(Status.chainlinkWorking);
                return _storeChainlinkPrice(chainlinkResponse);
            }

            if (_tellorIsBroken(tellorResponse)) {
                _changeStatus(Status.bothOraclesUntrusted);
                return lastGoodPrice;
            }

            /*
             * If Tellor is only frozen but otherwise returning valid data, just return the last good price.
             * Tellor may need to be tipped to return current data.
             */
            if (_tellorIsFrozen(tellorResponse)) {return lastGoodPrice;}

            // Otherwise, use Tellor price
            return _storeTellorPrice(tellorResponse);
        }

        // --- CASE 3: Both oracles were untrusted at the last price fetch ---
        if (status == Status.bothOraclesUntrusted) {
            /*
             * If both oracles are now live, unbroken and similar price, we assume that they are reporting
             * accurately, and so we switch back to Chainlink.
             */
            if (_bothOraclesLiveAndUnbrokenAndSimilarPrice(chainlinkResponse, prevChainlinkResponse, tellorResponse)) {
                _changeStatus(Status.chainlinkWorking);
                return _storeChainlinkPrice(chainlinkResponse);
            }

            // Otherwise, return the last good price - both oracles are still untrusted (no status change)
            return lastGoodPrice;
        }

        // --- CASE 4: Using Tellor, and Chainlink is frozen ---
        if (status == Status.usingTellorChainlinkFrozen) {
            if (_chainlinkIsBroken(chainlinkResponse, prevChainlinkResponse)) {
                // If both Oracles are broken, return last good price
                if (_tellorIsBroken(tellorResponse)) {
                    _changeStatus(Status.bothOraclesUntrusted);
                    return lastGoodPrice;
                }

                // If Chainlink is broken, remember it and switch to using Tellor
                _changeStatus(Status.usingTellorChainlinkUntrusted);

                if (_tellorIsFrozen(tellorResponse)) {return lastGoodPrice;}

                // If Tellor is working, return Tellor current price
                return _storeTellorPrice(tellorResponse);
            }

            if (_chainlinkIsFrozen(chainlinkResponse)) {
                // if Chainlink is frozen and Tellor is broken, remember Tellor broke, and return last good price
                if (_tellorIsBroken(tellorResponse)) {
                    _changeStatus(Status.usingChainlinkTellorUntrusted);
                    return lastGoodPrice;
                }

                // If both are frozen, just use lastGoodPrice
                if (_tellorIsFrozen(tellorResponse)) {return lastGoodPrice;}

                // if Chainlink is frozen and Tellor is working, keep using Tellor (no status change)
                return _storeTellorPrice(tellorResponse);
            }

            // if Chainlink is live and Tellor is broken, remember Tellor broke, and return Chainlink price
            if (_tellorIsBroken(tellorResponse)) {
                _changeStatus(Status.usingChainlinkTellorUntrusted);
                return _storeChainlinkPrice(chainlinkResponse);
            }

            // If Chainlink is live and Tellor is frozen, just use last good price (no status change) since we have no basis for comparison
            if (_tellorIsFrozen(tellorResponse)) {return lastGoodPrice;}

            // If Chainlink is live and Tellor is working, compare prices. Switch to Chainlink
            // if prices are within 5%, and return Chainlink price.
            if (_bothOraclesSimilarPrice(chainlinkResponse, tellorResponse)) {
                _changeStatus(Status.chainlinkWorking);
                return _storeChainlinkPrice(chainlinkResponse);
            }

            // Otherwise if Chainlink is live but price not within 5% of Tellor, distrust Chainlink, and return Tellor price
            _changeStatus(Status.usingTellorChainlinkUntrusted);
            return _storeTellorPrice(tellorResponse);
        }

        // --- CASE 5: Using Chainlink, Tellor is untrusted ---
        if (status == Status.usingChainlinkTellorUntrusted) {
            // If Chainlink breaks, now both oracles are untrusted
            if (_chainlinkIsBroken(chainlinkResponse, prevChainlinkResponse)) {
                _changeStatus(Status.bothOraclesUntrusted);
                return lastGoodPrice;
            }

            // If Chainlink is frozen, return last good price (no status change)
            if (_chainlinkIsFrozen(chainlinkResponse)) {
                return lastGoodPrice;
            }

            // If Chainlink and Tellor are both live, unbroken and similar price, switch back to chainlinkWorking and return Chainlink price
            if (_bothOraclesLiveAndUnbrokenAndSimilarPrice(chainlinkResponse, prevChainlinkResponse, tellorResponse)) {
                _changeStatus(Status.chainlinkWorking);
                return _storeChainlinkPrice(chainlinkResponse);
            }

            // If Chainlink is live but deviated >50% from it's previous price and Tellor is still untrusted, switch
            // to bothOraclesUntrusted and return last good price
            if (_chainlinkPriceChangeAboveMax(chainlinkResponse, prevChainlinkResponse)) {
                _changeStatus(Status.bothOraclesUntrusted);
                return lastGoodPrice;
            }

            // Otherwise if Chainlink is live and deviated <50% from it's previous price and Tellor is still untrusted,
            // return Chainlink price (no status change)
            return _storeChainlinkPrice(chainlinkResponse);
        }
    }

    // --- Helper functions ---

    /* Chainlink is considered broken if its current or previous round data is in any way bad. We check the previous round
     * for two reasons:
     *
     * 1) It is necessary data for the price deviation check in case 1,
     * and
     * 2) Chainlink is the PriceFeed's preferred primary oracle - having two consecutive valid round responses adds
     * peace of mind when using or returning to Chainlink.
     */
    function _chainlinkIsBroken(ChainlinkResponse memory _currentResponse, ChainlinkResponse memory _prevResponse) internal view returns (bool) {
        return _badChainlinkResponse(_currentResponse) || _badChainlinkResponse(_prevResponse);
    }

    function _badChainlinkResponse(ChainlinkResponse memory _response) internal view returns (bool) {
        // Check for response call reverted
        if (!_response.success) {return true;}
        // Check for an invalid roundId that is 0
        if (_response.roundId == 0) {return true;}
        // Check for an invalid timeStamp that is 0, or in the future
        if (_response.timestamp == 0 || _response.timestamp > block.timestamp) {return true;}
        if (_response.cnyTimestamp == 0 || _response.cnyTimestamp > block.timestamp) {return true;}
        // Check for non-positive price
        if (_response.answer <= 0) {return true;}

        return false;
    }

    // Oracle is frozen if any of the connected data feeds timeouts
    function _chainlinkIsFrozen(ChainlinkResponse memory _response) internal view returns (bool) {
        return block.timestamp.sub(_response.timestamp) > TIMEOUT || block.timestamp.sub(_response.cnyTimestamp) > CNY_TIMEOUT;
    }

    function _chainlinkPriceChangeAboveMax(ChainlinkResponse memory _currentResponse, ChainlinkResponse memory _prevResponse) internal pure returns (bool) {
        uint currentScaledPrice = _scaleChainlinkPriceByDigits(uint256(_currentResponse.answer), _currentResponse.decimals);
        uint prevScaledPrice = _scaleChainlinkPriceByDigits(uint256(_prevResponse.answer), _prevResponse.decimals);

        uint minPrice = LiquityMath._min(currentScaledPrice, prevScaledPrice);
        uint maxPrice = LiquityMath._max(currentScaledPrice, prevScaledPrice);

        /*
         * Use the larger price as the denominator:
         * - If price decreased, the percentage deviation is in relation to the the previous price.
         * - If price increased, the percentage deviation is in relation to the current price.
         */
        uint percentDeviation = maxPrice.sub(minPrice).mul(DECIMAL_PRECISION).div(maxPrice);

        // Return true if price has more than doubled, or more than halved.
        return percentDeviation > MAX_PRICE_DEVIATION_FROM_PREVIOUS_ROUND;
    }

    function _tellorIsBroken(TellorResponse memory _response) internal view returns (bool) {
        // Check for response call reverted
        if (!_response.success) {return true;}
        // Check for an invalid timeStamp that is 0, or in the future
        if (_response.timestamp == 0 || _response.timestamp > block.timestamp) {return true;}
        if (_response.cnyTimestamp == 0 || _response.cnyTimestamp > block.timestamp) {return true;}
        // Check for zero price
        if (_response.value == 0) {return true;}

        return false;
    }

    // Oracle is frozen if any of the connected data feeds timeouts
    function _tellorIsFrozen(TellorResponse  memory _tellorResponse) internal view returns (bool) {
        return block.timestamp.sub(_tellorResponse.timestamp) > TIMEOUT || block.timestamp.sub(_tellorResponse.cnyTimestamp) > CNY_TIMEOUT;
    }

    function _bothOraclesLiveAndUnbrokenAndSimilarPrice
    (
        ChainlinkResponse memory _chainlinkResponse,
        ChainlinkResponse memory _prevChainlinkResponse,
        TellorResponse memory _tellorResponse
    )
        internal
        view
        returns (bool)
    {
        // Return false if either oracle is broken or frozen
        if
        (
            _tellorIsBroken(_tellorResponse) ||
            _tellorIsFrozen(_tellorResponse) ||
            _chainlinkIsBroken(_chainlinkResponse, _prevChainlinkResponse) ||
            _chainlinkIsFrozen(_chainlinkResponse)
        )
        {
            return false;
        }

        return _bothOraclesSimilarPrice(_chainlinkResponse, _tellorResponse);
    }

    function _bothOraclesSimilarPrice( ChainlinkResponse memory _chainlinkResponse, TellorResponse memory _tellorResponse) internal pure returns (bool) {
        uint scaledChainlinkPrice = _scaleChainlinkPriceByDigits(uint256(_chainlinkResponse.answer), _chainlinkResponse.decimals);
        uint scaledTellorPrice = _scaleTellorPriceByDigits(_tellorResponse.value);

        // Get the relative price difference between the oracles. Use the lower price as the denominator, i.e. the reference for the calculation.
        uint minPrice = LiquityMath._min(scaledTellorPrice, scaledChainlinkPrice);
        uint maxPrice = LiquityMath._max(scaledTellorPrice, scaledChainlinkPrice);
        uint percentPriceDifference = maxPrice.sub(minPrice).mul(DECIMAL_PRECISION).div(minPrice);

        /*
         * Return true if the relative price difference is <= 3%: if so, we assume both oracles are probably reporting
         * the honest market price, as it is unlikely that both have been broken/hacked and are still in-sync.
         */
        return percentPriceDifference <= MAX_PRICE_DIFFERENCE_BETWEEN_ORACLES;
    }

    function _scaleChainlinkPriceByDigits(uint _price, uint _answerDigits) internal pure returns (uint) {
        /*
         * Convert the price returned by the Chainlink oracle to an 18-digit decimal for use by Liquity.
         * At date of Liquity launch, Chainlink uses an 8-digit price, but we also handle the possibility of
         * future changes.
         *
         */
        uint price;
        if (_answerDigits >= TARGET_DIGITS) {
            // Scale the returned price value down to Liquity's target precision
            price = _price.div(10 ** (_answerDigits - TARGET_DIGITS));
        }
        else if (_answerDigits < TARGET_DIGITS) {
            // Scale the returned price value up to Liquity's target precision
            price = _price.mul(10 ** (TARGET_DIGITS - _answerDigits));
        }
        return price;
    }

    function _scaleTellorPriceByDigits(uint _price) internal pure returns (uint) {
        return _price.mul(10**(TARGET_DIGITS - TELLOR_DIGITS));
    }

    function _changeStatus(Status _status) internal {
        status = _status;
        emit PriceFeedStatusChanged(_status);
    }

    function _storePrice(uint _currentPrice) internal {
        lastGoodPrice = _currentPrice;
        emit LastGoodPriceUpdated(_currentPrice);
    }

     function _storeTellorPrice(TellorResponse memory _tellorResponse) internal returns (uint) {
        uint scaledTellorPrice = _scaleTellorPriceByDigits(_tellorResponse.value);
        _storePrice(scaledTellorPrice);

        return scaledTellorPrice;
    }

    function _storeChainlinkPrice(ChainlinkResponse memory _chainlinkResponse) internal returns (uint) {
        uint scaledChainlinkPrice = _scaleChainlinkPriceByDigits(uint256(_chainlinkResponse.answer), _chainlinkResponse.decimals);
        _storePrice(scaledChainlinkPrice);

        return scaledChainlinkPrice;
    }

    // --- Oracle response wrapper functions ---

    function _getCurrentTellorResponse()
        internal
        view
        returns (TellorResponse memory tellorResponse)
    {
        // 1 Getting Tellor response from ETH/USD Oracle
        TellorResponse memory tellorResponseEth;

        try tellorCaller.getTellorCurrentValue(ETHUSD_TELLOR_REQ_ID) returns (
            bool ifRetrieve,
            uint256 value,
            uint256 _timestampRetrieved
        ) {
            // If call to Tellor succeeds, return the response and success = true
            tellorResponseEth.ifRetrieve = ifRetrieve;
            tellorResponseEth.value = value;
            tellorResponseEth.timestamp = _timestampRetrieved;
            tellorResponseEth.success = true;
        } catch {
            // If call to Tellor reverts, return a zero response with success = false
            return (tellorResponse);
        }

        // 2 Getting Tellor response from CNY/USD Oracle
        TellorResponse memory tellorResponseCny;
        try tellorCaller.getTellorCurrentValue(CNYUSD_TELLOR_REQ_ID) returns (
            bool ifRetrieve,
            uint256 value,
            uint256 _timestampRetrieved
        ) {
            // If call to Tellor succeeds, return the response and success = true
            tellorResponseCny.ifRetrieve = ifRetrieve;
            tellorResponseCny.value = value;
            tellorResponseCny.timestamp = _timestampRetrieved;
            tellorResponseCny.success = true;
        } catch {
            // If call to Tellor reverts, return a zero response with success = false
            return (tellorResponse);
        }

        // 3 Calculate cross pair price ETH/CNY and return the response

        // check both answers
        if (tellorResponseEth.value > 0 && tellorResponseCny.value > 0) {
            tellorResponse.ifRetrieve = true;
            tellorResponse.value = _getTellorDerivedPrice(
                tellorResponseEth.value,
                tellorResponseCny.value
            );
            tellorResponse.timestamp = tellorResponseEth.timestamp;
            tellorResponse.cnyTimestamp = tellorResponseCny.timestamp;
            tellorResponse.success = true;
        } else {
            // If any answer from Tellor returns zero, return a zero response with success = false
            return tellorResponse;
        }

        return tellorResponse;
    }

    function _getCurrentChainlinkResponse()
        internal
        view
        returns (ChainlinkResponse memory chainlinkResponse)
    {
        // 1 Getting chainlink response from ETH/USD Oracle
        ChainlinkResponse memory chainlinkResponseEth;

        // First, try to get current decimal precision:
        try priceAggregatorEth.decimals() returns (uint8 decimals) {
            // If call to Chainlink succeeds, record the current decimal precision
            chainlinkResponseEth.decimals = decimals;
        } catch {
            // If call to Chainlink aggregator reverts, return a zero response with success = false
            return chainlinkResponse;
        }
        uint8 _currentDecimals = chainlinkResponseEth.decimals;

        // Secondly, try to get latest price data:
        try priceAggregatorEth.latestRoundData() returns (
            uint80 roundId,
            int256 answer,
            uint256, /* startedAt */
            uint256 timestamp,
            uint80 /* answeredInRound */
        ) {
            // If call to Chainlink succeeds, return the response and success = true
            chainlinkResponseEth.roundId = roundId;
            chainlinkResponseEth.answer = answer;
            chainlinkResponseEth.timestamp = timestamp;
            chainlinkResponseEth.success = true;
        } catch {
            // If call to Chainlink aggregator reverts, return a zero response with success = false
            return chainlinkResponse;
        }

        // 2 Getting chainlink response from CNY/USD Oracle
        ChainlinkResponse memory chainlinkResponseCny;

        // First, try to get current decimal precision:
        try priceAggregatorCny.decimals() returns (uint8 decimals) {
            // If call to Chainlink succeeds, record the current decimal precision
            chainlinkResponseCny.decimals = decimals;
        } catch {
            // If call to Chainlink aggregator reverts, return a zero response with success = false
            return chainlinkResponse;
        }

        // Secondly, try to get latest price data:
        try priceAggregatorCny.latestRoundData() returns (
            uint80 roundId,
            int256 answer,
            uint256, /* startedAt */
            uint256 timestamp,
            uint80 /* answeredInRound */
        ) {
            // If call to Chainlink succeeds, return the response and success = true
            chainlinkResponseCny.roundId = roundId;
            chainlinkResponseCny.answer = answer;
            chainlinkResponseCny.timestamp = timestamp;
            chainlinkResponseCny.success = true;
        } catch {
            // If call to Chainlink aggregator reverts, return a zero response with success = false
            return chainlinkResponse;
        }

        // 3 Calculate cross pair price ETH/CNY and return the response
        // check both answers
        if (chainlinkResponseEth.answer > 0 && chainlinkResponseCny.answer > 0) {
            chainlinkResponse.roundId = chainlinkResponseEth.roundId;
            chainlinkResponse.cnyRoundId = chainlinkResponseCny.roundId;
            chainlinkResponse.decimals = chainlinkResponseEth.decimals;
            chainlinkResponse.timestamp = chainlinkResponseEth.timestamp;
            chainlinkResponse.cnyTimestamp = chainlinkResponseCny.timestamp;
            chainlinkResponse.answer = _getDerivedPrice(
                chainlinkResponseEth.answer,
                chainlinkResponseEth.decimals,
                chainlinkResponseCny.answer,
                chainlinkResponseCny.decimals,
                _currentDecimals
            );
            chainlinkResponse.success = true;
        } else {
            // If any answer from Chainlink aggregator returns zero, return a zero response with success = false
            return chainlinkResponse;
        }

        return chainlinkResponse;
    }

    function _getPrevChainlinkResponse(
        uint80 _ethRoundId,
        uint80 _cnyRoundId,
        uint8 _currentDecimals
    ) internal view returns (ChainlinkResponse memory prevChainlinkResponse) {
        /*
         * NOTE: Chainlink only offers a current decimals() value - there is no way to obtain the decimal precision used in a
         * previous round.  We assume the decimals used in the previous round are the same as the current round.
         */

        /*
         * NOTE: We assume that decimals for ETH/USD and CNY/USD oracles are the same (i.e. 8 digits)
         */

        // 1 Getting chainlink response from ETH/USD Oracle
        ChainlinkResponse memory chainlinkResponseEth;

        // Try to get the price data from the previous round:
        try priceAggregatorEth.getRoundData(_ethRoundId - 1) returns (
            uint80 roundId,
            int256 answer,
            uint256, /* startedAt */
            uint256 timestamp,
            uint80 /* answeredInRound */
        ) {
            // If call to Chainlink succeeds, return the response and success = true
            chainlinkResponseEth.roundId = roundId;
            chainlinkResponseEth.answer = answer;
            chainlinkResponseEth.timestamp = timestamp;
            chainlinkResponseEth.decimals = _currentDecimals;
            chainlinkResponseEth.success = true;
        } catch {
            // If call to Chainlink aggregator reverts, return a zero response with success = false
            return prevChainlinkResponse;
        }

        // 2 Getting chainlink response from CNY/USD Oracle
        ChainlinkResponse memory chainlinkResponseCny;

        // Secondly, try to get latest price data:
        try priceAggregatorCny.getRoundData(_cnyRoundId - 1) returns (
            uint80 roundId,
            int256 answer,
            uint256, /* startedAt */
            uint256 timestamp,
            uint80 /* answeredInRound */
        ) {
            // If call to Chainlink succeeds, return the response and success = true
            chainlinkResponseCny.roundId = roundId;
            chainlinkResponseCny.answer = answer;
            chainlinkResponseCny.timestamp = timestamp;
            chainlinkResponseCny.decimals = _currentDecimals;
            chainlinkResponseCny.success = true;
        } catch {
            // If call to Chainlink aggregator reverts, return a zero response with success = false
            return prevChainlinkResponse;
        }

        // 3 Calculate cross pair price ETH/CNY and return the response

        // check both answers
        if (chainlinkResponseEth.answer > 0 && chainlinkResponseCny.answer > 0) {
            prevChainlinkResponse.roundId = chainlinkResponseEth.roundId;
            prevChainlinkResponse.cnyRoundId = chainlinkResponseCny.roundId;
            prevChainlinkResponse.decimals = chainlinkResponseEth.decimals;
            prevChainlinkResponse.timestamp = chainlinkResponseEth.timestamp;
            prevChainlinkResponse.cnyTimestamp = chainlinkResponseCny.timestamp;
            prevChainlinkResponse.answer = _getDerivedPrice(
                chainlinkResponseEth.answer,
                chainlinkResponseEth.decimals,
                chainlinkResponseCny.answer,
                chainlinkResponseCny.decimals,
                _currentDecimals
            );
            prevChainlinkResponse.success = true;
        } else {
            // If any answer from Chainlink aggregator returns zero, return a zero response with success = false
            return prevChainlinkResponse;
        }

        return prevChainlinkResponse;
    }

    function _getDerivedPrice(
        int256 _basePrice,
        uint8 _baseDecimals,
        int256 _quotePrice,
        uint8 _quoteDecimals,
        uint8 _decimals
    ) internal pure returns (int256) {
        uint256 decimals = 10**uint256(_decimals);
        uint256 basePrice = _scalePrice(uint256(_basePrice), _baseDecimals, _decimals);
        uint256 quotePrice = _scalePrice(uint256(_quotePrice), _quoteDecimals, _decimals);

        return int256(basePrice.mul(decimals).div(quotePrice));
    }

    function _getTellorDerivedPrice(uint256 _basePrice, uint256 _quotePrice)
        internal
        pure
        returns (uint256)
    {
        uint256 decimals = 10**uint256(TELLOR_DIGITS);
        return _basePrice.mul(decimals).div(_quotePrice);
    }

    function _scalePrice(
        uint256 _price,
        uint8 _priceDecimals,
        uint8 _decimals
    ) internal pure returns (uint256) {
        if (_priceDecimals < _decimals) {
            return _price.mul(10**uint256(_decimals - _priceDecimals));
        } else if (_priceDecimals > _decimals) {
            return _price.div(10**uint256(_priceDecimals - _decimals));
        }
        return _price;
    }
}
