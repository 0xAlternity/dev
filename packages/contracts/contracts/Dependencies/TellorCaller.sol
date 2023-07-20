// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import "../Interfaces/ITellorCaller.sol";
import "./ITellor.sol";
import "./SafeMath.sol";

/*
 * This contract has a single external function that calls Tellor: getTellorCurrentValue().
 *
 * The function is called by the Liquity contract PriceFeed.sol. If any of its inner calls to Tellor revert,
 * this function will revert, and PriceFeed will catch the failure and handle it accordingly.
 *
 * The function comes from Tellor's own wrapper contract, 'UsingTellor.sol':
 * https://github.com/tellor-io/usingtellor/blob/master/contracts/UsingTellor.sol
 *
 */
contract TellorCaller is ITellorCaller {
    using SafeMath for uint256;

    ITellor public tellor;

    constructor(address _tellorMasterAddress) public {
        tellor = ITellor(_tellorMasterAddress);
    }

    /**
     * identical to getDataBefore() in UsingTellor.sol
     * @dev Retrieves the latest value for the queryId before the specified timestamp
     * @param _queryId is the queryId to look up the value for
     * @param _timestamp before which to search for latest value
     * @return _value the value retrieved
     * @return _timestampRetrieved the value's timestamp
     */
    function getDataBefore(bytes32 _queryId, uint256 _timestamp)
        public
        view
        returns (bytes memory _value, uint256 _timestampRetrieved)
    {
        (, _value, _timestampRetrieved) = tellor.getDataBefore(_queryId, _timestamp);
    }

    /*
     * getTellorCurrentValue(): identical to valueFor() in UsingTellor.sol
     *
     * @dev Allows the user to get the latest value for the queryId specified
     * @param _queryId is the queryId to look up the value for
     * @return ifRetrieve bool true if it is able to retrieve a value, the value, and the value's timestamp
     * @return value the value retrieved
     * @return _timestampRetrieved the value's timestamp
     */
    function getTellorCurrentValue(bytes32 _queryId)
        external
        view
        override
        returns (
            bool ifRetrieve,
            uint256 value,
            uint256 _timestampRetrieved
        )
    {
        bytes memory _valueBytes;
        (_valueBytes, _timestampRetrieved) = getDataBefore(_queryId, block.timestamp - 15 minutes);

        if (_timestampRetrieved == 0) {
            return (false, 0, 0);
        }

        value = _sliceUint(_valueBytes);

        if (value > 0) return (true, value, _timestampRetrieved);

        return (false, 0, _timestampRetrieved);
    }

    // Internal functions
    /**
     * @dev Convert bytes to uint256
     * @param _b bytes value to convert to uint256
     * @return _number uint256 converted from bytes
     */
    function _sliceUint(bytes memory _b) internal pure returns (uint256 _number) {
        for (uint256 _i = 0; _i < _b.length; _i++) {
            _number = _number * 256 + uint8(_b[_i]);
        }
    }
}
