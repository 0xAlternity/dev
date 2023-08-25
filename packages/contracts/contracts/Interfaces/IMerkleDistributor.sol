// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.5.0;

// Allows anyone to claim a token if they exist in a merkle root.
interface IMerkleDistributor {
    // Returns true if the account has been marked claimed.
    function isClaimed(address account) external view returns (bool);

    // Returns true if contract has enought tokens for the claim amount.
    function canClaim(address account, uint256 amount) external view returns (bool);

    // Claim the given amount of the token to the given address. Reverts if the inputs are invalid.
    function claim(
        address account,
        uint256 amount,
        bytes32[] calldata merkleProof
    ) external;
}
