// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

contract MockTellor {
    // --- Mock price data ---

    bool didRetrieve = true; // default to a positive retrieval
    uint256 private ethPrice;
    uint256 private cnyPrice;
    uint256 private ethUpdateTime;
    uint256 private cnyUpdateTime;

    bool private revertRequest;

    // Tellor queryId for ETH/USD Oracle
    bytes32 public immutable ETHUSD_TELLOR_REQ_ID;
    //Tellor queryId for CNY/USD Oracle
    bytes32 public immutable CNYUSD_TELLOR_REQ_ID;

    constructor() public {
        //Set tellor queryIds
        bytes memory ethQueryData = abi.encode("SpotPrice", abi.encode("eth", "usd"));
        ETHUSD_TELLOR_REQ_ID = keccak256(ethQueryData);
        bytes memory cnyQueryData = abi.encode("SpotPrice", abi.encode("cny", "usd"));
        CNYUSD_TELLOR_REQ_ID = keccak256(cnyQueryData);
    }

    // --- Setters for mock price data ---

    function setPrice(uint256 _price) external {
        ethPrice = _price;
        cnyPrice = _price;
        ethUpdateTime = block.timestamp;
        cnyUpdateTime = block.timestamp;
    }

    function setEthPrice(uint256 _price) external {
        ethPrice = _price;
        ethUpdateTime = block.timestamp;
    }

    function setCnyPrice(uint256 _price) external {
        cnyPrice = _price;
        cnyUpdateTime = block.timestamp;
    }

    function setDidRetrieve(bool _didRetrieve) external {
        didRetrieve = _didRetrieve;
    }

    function setUpdateTime(uint256 _updateTime) external {
        ethUpdateTime = _updateTime;
        cnyUpdateTime = _updateTime;
    }

    function setEthUpdateTime(uint256 _updateTime) external {
        ethUpdateTime = _updateTime;
    }

    function setCnyUpdateTime(uint256 _updateTime) external {
        cnyUpdateTime = _updateTime;
    }

    function setRevertRequest() external {
        revertRequest = !revertRequest;
    }

    // --- Mock data reporting functions ---
    function getDataBefore(bytes32 _queryId, uint256)
        external
        view
        returns (
            bool _ifRetrieve,
            bytes memory _value,
            uint256 _timestampRetrieved
        )
    {
        if (revertRequest) {
            require(1 == 0, "Tellor request reverted");
        }
        if (_queryId == ETHUSD_TELLOR_REQ_ID) {
            return (true, abi.encodePacked(ethPrice), ethUpdateTime);
        } else if (_queryId == CNYUSD_TELLOR_REQ_ID) {
            return (true, abi.encodePacked(cnyPrice), cnyUpdateTime);
        }
        uint256 _price = 0;
        return (false, abi.encodePacked(_price), 0);
    }
}
