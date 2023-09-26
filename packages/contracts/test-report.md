# Test coverage

To check test coverage you can run:
```
yarn coverage
```

You can see the coverage status at mainnet deployment [here](https://coveralls.io/github/0xAlternity/dev).

# Test output
The following is the output of a complete test run, made on commit [`325b5b5`](https://github.com/0xAlternity/dev/commit/325b5b5b276fc92c8f9ee8784907ea76c859b153), from Sep 25th, 2023.

```
Run yarn test-contracts
yarn run v1.22.19
$ yarn workspace @liquity/contracts test
$ hardhat test
(node:3276) Warning: Accessing non-existent property 'VERSION' of module exports inside circular dependency
(Use `node --trace-warnings ...` to show where the warning was created)
web3-shh package will be deprecated in version 1.3.5 and will no longer be supported.
web3-bzz package will be deprecated in version 1.3.5 and will no longer be supported.
(node:3276) [DEP0128] DeprecationWarning: Invalid 'main' field in '/home/runner/work/dev/dev/node_modules/ansi-mark/package.json' of 'ansi-mark'. Please either fix that or report it to the module author
(node:3276) [DEP0128] DeprecationWarning: Invalid 'main' field in '/home/runner/work/dev/dev/node_modules/super-split/package.json' of 'super-split'. Please either fix that or report it to the module author


  Contract: Access Control: Liquity functions with the caller restricted to Liquity contract(s)
Your project has Truffle migrations, which have to be turned into a fixture to run your tests with Hardhat
    BorrowerOperations
      ✓ moveETHGainToTrove(): reverts when called by an account that is not StabilityPool (75ms)
    TroveManager
      ✓ applyPendingRewards(): reverts when called by an account that is not BorrowerOperations
      ✓ updateRewardSnapshots(): reverts when called by an account that is not BorrowerOperations
      ✓ removeStake(): reverts when called by an account that is not BorrowerOperations
      ✓ updateStakeAndTotalStakes(): reverts when called by an account that is not BorrowerOperations
      ✓ closeTrove(): reverts when called by an account that is not BorrowerOperations
      ✓ addTroveOwnerToArray(): reverts when called by an account that is not BorrowerOperations
      ✓ setTroveStatus(): reverts when called by an account that is not BorrowerOperations
      ✓ increaseTroveColl(): reverts when called by an account that is not BorrowerOperations
      ✓ decreaseTroveColl(): reverts when called by an account that is not BorrowerOperations
      ✓ increaseTroveDebt(): reverts when called by an account that is not BorrowerOperations
      ✓ decreaseTroveDebt(): reverts when called by an account that is not BorrowerOperations (40ms)
    ActivePool
      ✓ sendETH(): reverts when called by an account that is not BO nor TroveM nor SP
      ✓ increaseLUSDDebt(): reverts when called by an account that is not BO nor TroveM
      ✓ decreaseLUSDDebt(): reverts when called by an account that is not BO nor TroveM nor SP
      ✓ fallback(): reverts when called by an account that is not Borrower Operations nor Default Pool
    DefaultPool
      ✓ sendETHToActivePool(): reverts when called by an account that is not TroveManager
      ✓ increaseLUSDDebt(): reverts when called by an account that is not TroveManager
      ✓ decreaseLUSD(): reverts when called by an account that is not TroveManager
      ✓ fallback(): reverts when called by an account that is not the Active Pool
    StabilityPool
      ✓ offset(): reverts when called by an account that is not TroveManager
      ✓ fallback(): reverts when called by an account that is not the Active Pool
    LUSDToken
      ✓ mint(): reverts when called by an account that is not BorrowerOperations
    ✓ liquidateTroves(): Liquidating troves with SP deposits correctly impacts their SP deposit and ETH gain (1580ms)
    ✓ liquidateTroves(): when SP > 0, triggers LQTY reward event - increases the sum G (2083ms)
    ✓ liquidateTroves(): when SP is empty, doesn't update G (2115ms)
    ✓ batchLiquidateTroves(): liquidates a Trove that a) was skipped in a previous liquidation and b) has pending rewards (2733ms)
    ✓ batchLiquidateTroves(): closes every trove with ICR < MCR in the given array (1907ms)
    ✓ batchLiquidateTroves(): does not liquidate troves that are not in the given array (2029ms)
    ✓ batchLiquidateTroves(): does not close troves with ICR >= MCR in the given array (1968ms)
    ✓ batchLiquidateTroves(): reverts if array is empty (1676ms)
    ✓ batchLiquidateTroves(): skips if trove is non-existent (1693ms)
    ✓ batchLiquidateTroves(): skips if a trove has been closed (2173ms)
    ✓ batchLiquidateTroves: when SP > 0, triggers LQTY reward event - increases the sum G (1930ms)
    ✓ batchLiquidateTroves(): when SP is empty, doesn't update G (2023ms)
    ✓ getRedemptionHints(): gets the address of the first Trove and the final ICR of the last Trove involved in a redemption (1143ms)
    ✓ getRedemptionHints(): returns 0 as partialRedemptionHintNICR when reaching _maxIterations (1097ms)
    ✓ redeemCollateral(): cancels the provided LUSD with debt from Troves with the lowest ICRs and sends an equivalent amount of Ether (1497ms)
    ✓ redeemCollateral(): with invalid first hint, zero address (1508ms)
    ✓ redeemCollateral(): with invalid first hint, non-existent trove (1546ms)
    ✓ redeemCollateral(): with invalid first hint, trove below MCR (2022ms)
    ✓ redeemCollateral(): ends the redemption sequence when the token redemption request has been filled (2231ms)
    ✓ redeemCollateral(): ends the redemption sequence when max iterations have been reached (1751ms)
    ✓ redeemCollateral(): performs partial redemption if resultant debt is > minimum net debt (1880ms)
    ✓ redeemCollateral(): doesn't perform partial redemption if resultant debt would be < minimum net debt (1992ms)
    ✓ redeemCollateral(): doesnt perform the final partial redemption in the sequence if the hint is out-of-date (1911ms)
    - redeemCollateral(): can redeem if there is zero active debt but non-zero debt in DefaultPool
    ✓ redeemCollateral(): doesn't touch Troves with ICR < 110% (578ms)
    ✓ redeemCollateral(): finds the last Trove with ICR == 110% even if there is more than one (1739ms)
    ✓ redeemCollateral(): reverts when TCR < MCR (2092ms)
    ✓ redeemCollateral(): reverts when argument _amount is 0 (1558ms)
    ✓ redeemCollateral(): reverts if max fee > 100% (2246ms)
    ✓ redeemCollateral(): reverts if max fee < 0.5% (3533ms)
    ✓ redeemCollateral(): reverts if fee exceeds max fee percentage (5057ms)
    ✓ redeemCollateral(): succeeds if fee is less than max fee percentage (4895ms)
    ✓ redeemCollateral(): doesn't affect the Stability Pool deposits or ETH gain of redeemed-from troves (3070ms)
    ✓ redeemCollateral(): caller can redeem their entire LUSDToken balance (1602ms)
    ✓ redeemCollateral(): reverts when requested redemption amount exceeds caller's LUSD token balance (1957ms)
    ✓ redeemCollateral(): value of issued ETH == face value of redeemed LUSD (assuming 1 LUSD has value of $1) (2099ms)
    ✓ redeemCollateral(): reverts if there is zero outstanding system debt (159ms)
    ✓ redeemCollateral(): reverts if caller's tries to redeem more than the outstanding system debt (634ms)
    ✓ redeemCollateral(): a redemption made when base rate is zero increases the base rate (1932ms)
    ✓ redeemCollateral(): a redemption made when base rate is non-zero increases the base rate, for negligible time passed (2617ms)
    ✓ redeemCollateral(): lastFeeOpTime doesn't update if less time than decay interval has passed since the last fee operation [ @skip-on-coverage ] (4894ms)
    ✓ redeemCollateral(): a redemption made at zero base rate send a non-zero ETHFee to LQTY staking contract (1879ms)
    ✓ redeemCollateral(): a redemption made at zero base increases the ETH-fees-per-LQTY-staked in LQTY Staking contract (2140ms)
    ✓ redeemCollateral(): a redemption made at a non-zero base rate send a non-zero ETHFee to LQTY staking contract (2819ms)
    ✓ redeemCollateral(): a redemption made at a non-zero base rate increases ETH-per-LQTY-staked in the staking contract (2598ms)
    ✓ redeemCollateral(): a redemption sends the ETH remainder (ETHDrawn - ETHFee) to the redeemer (1963ms)
    ✓ redeemCollateral(): a full redemption (leaving trove with 0 debt), closes the trove (2239ms)
    ✓ redeemCollateral(): emits correct debt and coll values in each redeemed trove's TroveUpdated event (2257ms)
    ✓ redeemCollateral(): a redemption that closes a trove leaves the trove's ETH surplus (collateral - ETH drawn) available for the trove owner to claim (2473ms)
    ✓ redeemCollateral(): a redemption that closes a trove leaves the trove's ETH surplus (collateral - ETH drawn) available for the trove owner after re-opening trove (3008ms)
    ✓ redeemCollateral(): reverts if fee eats up all returned collateral (1951ms)
    ✓ getPendingLUSDDebtReward(): Returns 0 if there is no pending LUSDDebt reward (1021ms)
    ✓ getPendingETHReward(): Returns 0 if there is no pending ETH reward (1067ms)
    ✓ computeICR(): Returns 0 if trove's coll is worth 0
    ✓ computeICR(): Returns 2^256-1 for ETH:USD = 100, coll = 1 ETH, debt = 100 LUSD
    ✓ computeICR(): returns correct ICR for ETH:USD = 100, coll = 200 ETH, debt = 30 LUSD
    ✓ computeICR(): returns correct ICR for ETH:USD = 250, coll = 1350 ETH, debt = 127 LUSD
    ✓ computeICR(): returns correct ICR for ETH:USD = 100, coll = 1 ETH, debt = 54321 LUSD
    ✓ computeICR(): Returns 2^256-1 if trove has non-zero coll and zero debt
    ✓ checkRecoveryMode(): Returns true when TCR < 150% (832ms)
    ✓ checkRecoveryMode(): Returns false when TCR == 150% (598ms)
    ✓ checkRecoveryMode(): Returns false when TCR > 150% (675ms)
    ✓ checkRecoveryMode(): Returns false when TCR == 0 (842ms)
    ✓ getTroveStake(): Returns stake (730ms)
    ✓ getTroveColl(): Returns coll (732ms)
    ✓ getTroveDebt(): Returns debt (730ms)
    ✓ getTroveStatus(): Returns status (1000ms)
    ✓ hasPendingRewards(): Returns false it trove is not active


  962 passing (34m)
  9 pending

Done in 2032.36s.
```
