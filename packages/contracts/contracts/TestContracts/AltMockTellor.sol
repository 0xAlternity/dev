// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

contract AltMockTellor {
    // Tellor requestId for ETH/USD Oracle
    uint256 public constant ETHUSD_TELLOR_REQ_ID = 1;
    //TODO Update request id for tellor oracle CNY/USD Oracle
    uint256 public constant CNYUSD_TELLOR_REQ_ID = 999;

    // --- Mock price data ---

    bool didRetrieve = true; // default to a positive retrieval
    uint256 private ethPrice;
    uint256 private cnyPrice;
    uint256 private updateTime;

    bool private revertRequest;

    // --- Setters for mock price data ---

    function setPrice(uint256 _price) external {
        ethPrice = _price;
        cnyPrice = _price;
    }

    function setEthPrice(uint256 _price) external {
        ethPrice = _price;
    }

    function setCnyPrice(uint256 _price) external {
        cnyPrice = _price;
    }

    function setDidRetrieve(bool _didRetrieve) external {
        didRetrieve = _didRetrieve;
    }

    function setUpdateTime(uint256 _updateTime) external {
        updateTime = _updateTime;
    }

    function setRevertRequest() external {
        revertRequest = !revertRequest;
    }

    // --- Mock data reporting functions ---

    function getTimestampbyRequestIDandIndex(uint256, uint256) external view returns (uint256) {
        return updateTime;
    }

    function getNewValueCountbyRequestId(uint256) external view returns (uint256) {
        if (revertRequest) {
            require(1 == 0, "Tellor request reverted");
        }
        return 1;
    }

    function retrieveData(uint256 _requestId, uint256) external view returns (uint256) {
        if (_requestId == ETHUSD_TELLOR_REQ_ID) {
            return ethPrice;
        } else if (_requestId == CNYUSD_TELLOR_REQ_ID) {
            return cnyPrice;
        }
        return 0;
    }
}
