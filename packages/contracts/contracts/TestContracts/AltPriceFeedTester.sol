// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import "../AltPriceFeed.sol";

contract AltPriceFeedTester is AltPriceFeed {
    function setLastGoodPrice(uint256 _lastGoodPrice) external {
        lastGoodPrice = _lastGoodPrice;
    }

    function setStatus(Status _status) external {
        status = _status;
    }
}
