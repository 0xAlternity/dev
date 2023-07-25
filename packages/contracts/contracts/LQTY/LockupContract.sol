// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import "../Dependencies/SafeMath.sol";
import "../Dependencies/IERC20.sol";
import "../Dependencies/SafeERC20.sol";

contract LockupContract {
    using SafeMath for uint256;
    using SafeMath for uint64;

    // --- Data ---
    string public constant NAME = "LockupContract";

    mapping(address => uint256) private _released;
    address private immutable _beneficiary;
    uint64 private immutable _start;
    uint64 private immutable _duration;

    // --- Events ---

    event LockupContractCreated(address _beneficiary, uint256 _unlockTime);
    event LockupContractReleased(address _token, uint256 _amount);

    // --- Functions ---

    constructor(
        address beneficiaryAddress,
        uint64 startTimestamp,
        uint64 durationSeconds
    ) public {
        require(beneficiaryAddress != address(0), "LockupContract: beneficiary is zero address");
        _beneficiary = beneficiaryAddress;
        _start = startTimestamp;
        _duration = durationSeconds;
        emit LockupContractCreated(beneficiaryAddress, startTimestamp.add(durationSeconds));
    }

    /**
     * @dev Getter for the beneficiary address.
     */
    function beneficiary() public view returns (address) {
        return _beneficiary;
    }

    /**
     * @dev Getter for the start timestamp.
     */
    function start() public view returns (uint256) {
        return _start;
    }

    /**
     * @dev Getter for the vesting duration.
     */
    function duration() public view returns (uint256) {
        return _duration;
    }

    /**
     * @dev Getter for the end timestamp.
     */
    function end() public view returns (uint256) {
        return start().add(duration());
    }

    /**
     * @dev Amount of token already released
     */
    function released(address token) public view returns (uint256) {
        return _released[token];
    }

    /**
     * @dev Getter for the amount of releasable `token` tokens. `token` should be the address of an
     * IERC20 contract.
     */
    function releasable(address token) public view returns (uint256) {
        return vestedAmount(token, block.timestamp).sub(released(token));
    }

    function release(address token) external {
        require(msg.sender == beneficiary(), "LockupContract: caller is not the beneficiary");

        uint256 amount = releasable(token);
        _released[token] = _released[token].add(amount);
        emit LockupContractReleased(token, amount);
        SafeERC20.safeTransfer(IERC20(token), beneficiary(), amount);
    }

    /**
     * @dev Calculates the amount of tokens that has already vested. Default implementation is a linear vesting curve.
     */
    function vestedAmount(address token, uint256 timestamp) public view returns (uint256) {
        uint256 _balance = IERC20(token).balanceOf(address(this));
        return _vestingSchedule(_balance.add(released(token)), timestamp);
    }

    /**
     * @dev Virtual implementation of the vesting formula. This returns the amount vested, as a function of time, for
     * an asset given its total historical allocation.
     */
    function _vestingSchedule(uint256 totalAllocation, uint256 timestamp)
        internal
        view
        returns (uint256)
    {
        if (timestamp < start()) {
            return 0;
        } else if (timestamp > end()) {
            return totalAllocation;
        } else {
            return (totalAllocation.mul(timestamp.sub(start()))).div(duration());
        }
    }
}
