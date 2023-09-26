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
      ✓ burn(): reverts when called by an account that is not BO nor TroveM nor SP
      ✓ sendToPool(): reverts when called by an account that is not StabilityPool
      ✓ returnFromPool(): reverts when called by an account that is not TroveManager nor StabilityPool
    SortedTroves
      ✓ insert(): reverts when called by an account that is not BorrowerOps or TroveM
      ✓ remove(): reverts when called by an account that is not TroveManager
      ✓ reinsert(): reverts when called by an account that is neither BorrowerOps nor TroveManager
    LockupContract
      ✓ withdrawLQTY(): reverts when caller is not beneficiary (95ms)
    LQTYStaking
      ✓ increaseF_LUSD(): reverts when caller is not TroveManager
    LQTYToken
      ✓ sendToLQTYStaking(): reverts when caller is not the LQTYSstaking (74ms)
    CommunityIssuance
      ✓ sendLQTY(): reverts when caller is not the StabilityPool
      ✓ issueLQTY(): reverts when caller is not the StabilityPool

  Contract: BorrowerOperations
    Without proxy
      ✓ addColl(): reverts when top-up would leave trove with ICR < MCR (492ms)
      ✓ addColl(): Increases the activePool ETH and raw ether balance by correct amount (305ms)
      ✓ addColl(), active Trove: adds the correct collateral amount to the Trove (302ms)
      ✓ addColl(), active Trove: Trove is in sortedList before and after (312ms)
      ✓ addColl(), active Trove: updates the stake and updates the total stakes (349ms)
      ✓ addColl(), active Trove: applies pending rewards and updates user's L_ETH, L_LUSDDebt snapshots (1127ms)
      ✓ addColl(), reverts if trove is non-existent or closed (874ms)
      ✓ addColl(): can add collateral in Recovery Mode (524ms)
      ✓ withdrawColl(): reverts when withdrawal would leave trove with ICR < MCR (658ms)
      ✓ withdrawColl(): reverts when calling address does not have active trove (787ms)
      ✓ withdrawColl(): reverts when system is in Recovery Mode (960ms)
      ✓ withdrawColl(): reverts when requested ETH withdrawal is > the trove's collateral (1126ms)
      ✓ withdrawColl(): reverts when withdrawal would bring the user's ICR < MCR (928ms)
      ✓ withdrawColl(): reverts if system is in Recovery Mode (1063ms)
      ✓ withdrawColl(): doesn’t allow a user to completely withdraw all collateral from their Trove (due to gas compensation) (1070ms)
      ✓ withdrawColl(): leaves the Trove active when the user withdraws less than all the collateral (729ms)
      ✓ withdrawColl(): reduces the Trove's collateral by the correct amount (625ms)
      ✓ withdrawColl(): reduces ActivePool ETH and raw ether by correct amount (632ms)
      ✓ withdrawColl(): updates the stake and updates the total stakes (480ms)
      ✓ withdrawColl(): sends the correct amount of ETH to the user (641ms)
      ✓ withdrawColl(): applies pending rewards and updates user's L_ETH, L_LUSDDebt snapshots (2096ms)
      ✓ withdrawLUSD(): reverts when withdrawal would leave trove with ICR < MCR (1012ms)
      ✓ withdrawLUSD(): decays a non-zero base rate (1804ms)
      ✓ withdrawLUSD(): reverts if max fee > 100% (1077ms)
      ✓ withdrawLUSD(): reverts if max fee < 0.5% in Normal mode (1123ms)
      ✓ withdrawLUSD(): reverts if fee exceeds max fee percentage (1714ms)
      ✓ withdrawLUSD(): succeeds when fee is less than max fee percentage (2333ms)
      ✓ withdrawLUSD(): doesn't change base rate if it is already zero (1863ms)
      ✓ withdrawLUSD(): lastFeeOpTime doesn't update if less time than decay interval has passed since the last fee operation (1437ms)
      ✓ withdrawLUSD(): borrower can't grief the baseRate and stop it decaying by issuing debt at higher frequency than the decay granularity (1586ms)
      ✓ withdrawLUSD(): borrowing at non-zero base rate sends LUSD fee to LQTY staking contract (1681ms)
      ✓ withdrawLUSD(): borrowing at non-zero base records the (drawn debt + fee) on the Trove struct (1607ms)
      ✓ withdrawLUSD(): Borrowing at non-zero base rate increases the LQTY staking contract LUSD fees-per-unit-staked (1618ms)
      ✓ withdrawLUSD(): Borrowing at non-zero base rate sends requested amount to the user (1601ms)
      ✓ withdrawLUSD(): Borrowing at zero base rate changes LUSD fees-per-unit-staked (1467ms)
      ✓ withdrawLUSD(): Borrowing at zero base rate sends debt request to user (1661ms)
      ✓ withdrawLUSD(): reverts when calling address does not have active trove (874ms)
      ✓ withdrawLUSD(): reverts when requested withdrawal amount is zero LUSD (924ms)
      ✓ withdrawLUSD(): reverts when system is in Recovery Mode (1126ms)
      ✓ withdrawLUSD(): reverts when withdrawal would bring the trove's ICR < MCR (643ms)
      ✓ withdrawLUSD(): reverts when a withdrawal would cause the TCR of the system to fall below the CCR (789ms)
      ✓ withdrawLUSD(): reverts if system is in Recovery Mode (653ms)
      ✓ withdrawLUSD(): increases the Trove's LUSD debt by the correct amount (573ms)
      ✓ withdrawLUSD(): increases LUSD debt in ActivePool by correct amount (761ms)
      ✓ withdrawLUSD(): increases user LUSDToken balance by correct amount (624ms)
      ✓ repayLUSD(): reverts when repayment would leave trove with ICR < MCR (800ms)
      ✓ repayLUSD(): Succeeds when it would leave trove with net debt >= minimum net debt (902ms)
      ✓ repayLUSD(): reverts when it would leave trove with net debt < minimum net debt (398ms)
      ✓ repayLUSD(): reverts when calling address does not have active trove (1024ms)
      ✓ repayLUSD(): reverts when attempted repayment is > the debt of the trove (1053ms)
      ✓ repayLUSD(): reduces the Trove's LUSD debt by the correct amount (883ms)
      ✓ repayLUSD(): decreases LUSD debt in ActivePool by correct amount (820ms)
      ✓ repayLUSD(): decreases user LUSDToken balance by correct amount (651ms)
      ✓ repayLUSD(): can repay debt in Recovery Mode (815ms)
      ✓ repayLUSD(): Reverts if borrower has insufficient LUSD balance to cover his debt repayment (921ms)
      ✓ adjustTrove(): reverts when adjustment would leave trove with ICR < MCR (884ms)
      ✓ adjustTrove(): reverts if max fee < 0.5% in Normal mode (517ms)
      ✓ adjustTrove(): allows max fee < 0.5% in Recovery mode (1133ms)
      ✓ adjustTrove(): decays a non-zero base rate (2232ms)
      ✓ adjustTrove(): doesn't decay a non-zero base rate when user issues 0 debt (1880ms)
      ✓ adjustTrove(): doesn't change base rate if it is already zero (1035ms)
      ✓ adjustTrove(): lastFeeOpTime doesn't update if less time than decay interval has passed since the last fee operation (1657ms)
      ✓ adjustTrove(): borrower can't grief the baseRate and stop it decaying by issuing debt at higher frequency than the decay granularity (1614ms)
      ✓ adjustTrove(): borrowing at non-zero base rate sends LUSD fee to LQTY staking contract (1444ms)
      ✓ adjustTrove(): borrowing at non-zero base records the (drawn debt + fee) on the Trove struct (1726ms)
      ✓ adjustTrove(): Borrowing at non-zero base rate increases the LQTY staking contract LUSD fees-per-unit-staked (1667ms)
      ✓ adjustTrove(): Borrowing at non-zero base rate sends requested amount to the user (1773ms)
      ✓ adjustTrove(): Borrowing at zero base rate changes LUSD balance of LQTY staking contract (1454ms)
      ✓ adjustTrove(): Borrowing at zero base rate changes LQTY staking contract LUSD fees-per-unit-staked (1815ms)
      ✓ adjustTrove(): Borrowing at zero base rate sends total requested LUSD to the user (1515ms)
      ✓ adjustTrove(): reverts when calling address has no active trove (987ms)
      ✓ adjustTrove(): reverts in Recovery Mode when the adjustment would reduce the TCR (1122ms)
      ✓ adjustTrove(): collateral withdrawal reverts in Recovery Mode (889ms)
      ✓ adjustTrove(): debt increase that would leave ICR < 150% reverts in Recovery Mode (765ms)
      ✓ adjustTrove(): debt increase that would reduce the ICR reverts in Recovery Mode (1080ms)
      ✓ adjustTrove(): A trove with ICR < CCR in Recovery Mode can adjust their trove to ICR > CCR (875ms)
      ✓ adjustTrove(): A trove with ICR > CCR in Recovery Mode can improve their ICR (891ms)
      ✓ adjustTrove(): debt increase in Recovery Mode charges no fee (1065ms)
      ✓ adjustTrove(): reverts when change would cause the TCR of the system to fall below the CCR (878ms)
      ✓ adjustTrove(): reverts when LUSD repaid is > debt of the trove (769ms)
      ✓ adjustTrove(): reverts when attempted ETH withdrawal is >= the trove's collateral (1061ms)
      ✓ adjustTrove(): reverts when change would cause the ICR of the trove to fall below the MCR (1115ms)
      ✓ adjustTrove(): With 0 coll change, doesnt change borrower's coll or ActivePool coll (578ms)
      ✓ adjustTrove(): With 0 debt change, doesnt change borrower's debt or ActivePool debt (472ms)
      ✓ adjustTrove(): updates borrower's debt and coll with an increase in both (752ms)
      ✓ adjustTrove(): updates borrower's debt and coll with a decrease in both (787ms)
      ✓ adjustTrove(): updates borrower's  debt and coll with coll increase, debt decrease (840ms)
      ✓ adjustTrove(): updates borrower's debt and coll with coll decrease, debt increase (844ms)
      ✓ adjustTrove(): updates borrower's stake and totalStakes with a coll increase (873ms)
      ✓ adjustTrove():  updates borrower's stake and totalStakes with a coll decrease (808ms)
      ✓ adjustTrove(): changes LUSDToken balance by the requested decrease (624ms)
      ✓ adjustTrove(): changes LUSDToken balance by the requested increase (684ms)
      ✓ adjustTrove(): Changes the activePool ETH and raw ether balance by the requested decrease (687ms)
      ✓ adjustTrove(): Changes the activePool ETH and raw ether balance by the amount of ETH sent (765ms)
      ✓ adjustTrove(): Changes the LUSD debt in ActivePool by requested decrease (701ms)
      ✓ adjustTrove(): Changes the LUSD debt in ActivePool by requested increase (794ms)
      ✓ adjustTrove(): new coll = 0 and new debt = 0 is not allowed, as gas compensation still counts toward ICR (861ms)
      ✓ adjustTrove(): Reverts if requested debt increase and amount is zero (826ms)
      ✓ adjustTrove(): Reverts if requested coll withdrawal and ether is sent (597ms)
      ✓ adjustTrove(): Reverts if it’s zero adjustment (519ms)
      ✓ adjustTrove(): Reverts if requested coll withdrawal is greater than trove's collateral (978ms)
      ✓ adjustTrove(): Reverts if borrower has insufficient LUSD balance to cover his debt repayment (952ms)
      ✓ Internal _adjustTrove(): reverts when op is a withdrawal and _borrower param is not the msg.sender (957ms)
      ✓ closeTrove(): reverts when it would lower the TCR below CCR (672ms)
      ✓ closeTrove(): reverts when calling address does not have active trove (744ms)
      ✓ closeTrove(): reverts when system is in Recovery Mode (1164ms)
      ✓ closeTrove(): reverts when trove is the only one in the system (637ms)
      ✓ closeTrove(): reduces a Trove's collateral to zero (878ms)
      ✓ closeTrove(): reduces a Trove's debt to zero (791ms)
      ✓ closeTrove(): sets Trove's stake to zero (800ms)
      ✓ closeTrove(): zero's the troves reward snapshots (1914ms)
      ✓ closeTrove(): sets trove's status to closed and removes it from sorted troves list (878ms)
      ✓ closeTrove(): reduces ActivePool ETH and raw ether by correct amount (787ms)
      ✓ closeTrove(): reduces ActivePool debt by correct amount (862ms)
      ✓ closeTrove(): updates the the total stakes (1104ms)
      ✓ closeTrove(): sends the correct amount of ETH to the user (927ms)
      ✓ closeTrove(): subtracts the debt of the closed Trove from the Borrower's LUSDToken balance (826ms)
      ✓ closeTrove(): applies pending rewards (2366ms)
      ✓ closeTrove(): reverts if borrower has insufficient LUSD balance to repay his entire debt (832ms)
      ✓ openTrove(): emits a TroveUpdated event with the correct collateral and debt (1579ms)
      ✓ openTrove(): Opens a trove with net debt >= minimum net debt (628ms)
      ✓ openTrove(): reverts if net debt < minimum net debt (742ms)
      ✓ openTrove(): decays a non-zero base rate (1829ms)
      ✓ openTrove(): doesn't change base rate if it is already zero (1795ms)
      ✓ openTrove(): lastFeeOpTime doesn't update if less time than decay interval has passed since the last fee operation (1704ms)
      ✓ openTrove(): reverts if max fee > 100% (274ms)
      ✓ openTrove(): reverts if max fee < 0.5% in Normal mode (172ms)
      ✓ openTrove(): allows max fee < 0.5% in Recovery Mode (943ms)
      ✓ openTrove(): reverts if fee exceeds max fee percentage (1380ms)
      ✓ openTrove(): succeeds when fee is less than max fee percentage (2088ms)
      ✓ openTrove(): borrower can't grief the baseRate and stop it decaying by issuing debt at higher frequency than the decay granularity (1791ms)
      ✓ openTrove(): borrowing at non-zero base rate sends LUSD fee to LQTY staking contract (1598ms)
      ✓ openTrove(): borrowing at non-zero base records the (drawn debt + fee  + liq. reserve) on the Trove struct (1542ms)
      ✓ openTrove(): Borrowing at non-zero base rate increases the LQTY staking contract LUSD fees-per-unit-staked (1593ms)
      ✓ openTrove(): Borrowing at non-zero base rate sends requested amount to the user (1518ms)
      ✓ openTrove(): Borrowing at zero base rate changes the LQTY staking contract LUSD fees-per-unit-staked (1125ms)
      ✓ openTrove(): Borrowing at zero base rate charges minimum fee (889ms)
      ✓ openTrove(): reverts when system is in Recovery Mode and ICR < CCR (935ms)
      ✓ openTrove(): reverts when trove ICR < MCR (1049ms)
      ✓ openTrove(): reverts when opening the trove would cause the TCR of the system to fall below the CCR (575ms)
      ✓ openTrove(): reverts if trove is already active (1161ms)
      ✓ openTrove(): Can open a trove with ICR >= CCR when system is in Recovery Mode (1058ms)
      ✓ openTrove(): Reverts opening a trove with min debt when system is in Recovery Mode (958ms)
      ✓ openTrove(): creates a new Trove and assigns the correct collateral and debt amount (196ms)
      ✓ openTrove(): adds Trove owner to TroveOwners array (310ms)
      ✓ openTrove(): creates a stake and adds it to total stakes (335ms)
      ✓ openTrove(): inserts Trove to Sorted Troves list (411ms)
      ✓ openTrove(): Increases the activePool ETH and raw ether balance by correct amount (394ms)
      ✓ openTrove(): records up-to-date initial snapshots of L_ETH and L_LUSDDebt (1138ms)
      ✓ openTrove(): allows a user to open a Trove, then close it, then re-open it (1452ms)
      ✓ openTrove(): increases the Trove's LUSD debt by the correct amount (306ms)
      ✓ openTrove(): increases LUSD debt in ActivePool by the debt of the trove (332ms)
      ✓ openTrove(): increases user LUSDToken balance by correct amount (277ms)
      ✓ getCompositeDebt(): returns debt + gas comp
      ✓ closeTrove(): fails if owner cannot receive ETH (920ms)
      getNewICRFromTroveChange() returns the correct ICR
        ✓ collChange = 0, debtChange = 0
        ✓ collChange = 0, debtChange is positive
        ✓ collChange = 0, debtChange is negative
        ✓ collChange is positive, debtChange is 0
        ✓ collChange is negative, debtChange is 0
        ✓ collChange is negative, debtChange is negative
        ✓ collChange is positive, debtChange is positive
        ✓ collChange is positive, debtChange is negative
        ✓ collChange is negative, debtChange is positive
      getNewTCRFromTroveChange() returns the correct TCR
        ✓ collChange = 0, debtChange = 0 (1066ms)
        ✓ collChange = 0, debtChange is positive (1094ms)
        ✓ collChange = 0, debtChange is negative (1005ms)
        ✓ collChange is positive, debtChange is 0 (1018ms)
        ✓ collChange is negative, debtChange is 0 (972ms)
        ✓ collChange is negative, debtChange is negative (1036ms)
        ✓ collChange is positive, debtChange is positive (976ms)
        ✓ collChange is positive, debtChange is negative (856ms)
        ✓ collChange is negative, debtChange is positive (856ms)

  Contract: CollSurplusPool
    ✓ CollSurplusPool::getETH(): Returns the ETH balance of the CollSurplusPool after redemption (1632ms)
    ✓ CollSurplusPool: claimColl(): Reverts if caller is not Borrower Operations (52ms)
    ✓ CollSurplusPool: claimColl(): Reverts if nothing to claim (38ms)
    ✓ CollSurplusPool: claimColl(): Reverts if owner cannot receive ETH surplus (1541ms)
    ✓ CollSurplusPool: reverts trying to send ETH to it
    ✓ CollSurplusPool: accountSurplus: reverts if caller is not Trove Manager

  Contract: Deployment script - Sets correct contract addresses dependencies after deployment
    ✓ Sets the correct PriceFeed address in TroveManager
    ✓ Sets the correct LUSDToken address in TroveManager
    ✓ Sets the correct SortedTroves address in TroveManager
    ✓ Sets the correct BorrowerOperations address in TroveManager
    ✓ Sets the correct ActivePool address in TroveManager
    ✓ Sets the correct DefaultPool address in TroveManager
    ✓ Sets the correct StabilityPool address in TroveManager
    ✓ Sets the correct LQTYStaking address in TroveManager
    ✓ Sets the correct StabilityPool address in ActivePool
    ✓ Sets the correct DefaultPool address in ActivePool
    ✓ Sets the correct BorrowerOperations address in ActivePool
    ✓ Sets the correct TroveManager address in ActivePool
    ✓ Sets the correct ActivePool address in StabilityPool
    ✓ Sets the correct BorrowerOperations address in StabilityPool
    ✓ Sets the correct LUSDToken address in StabilityPool
    ✓ Sets the correct TroveManager address in StabilityPool
    ✓ Sets the correct TroveManager address in DefaultPool
    ✓ Sets the correct ActivePool address in DefaultPool
    ✓ Sets the correct TroveManager address in SortedTroves
    ✓ Sets the correct BorrowerOperations address in SortedTroves
    ✓ Sets the correct TroveManager address in BorrowerOperations
    ✓ Sets the correct PriceFeed address in BorrowerOperations
    ✓ Sets the correct SortedTroves address in BorrowerOperations
    ✓ Sets the correct ActivePool address in BorrowerOperations
    ✓ Sets the correct DefaultPool address in BorrowerOperations
    ✓ Sets the correct LQTYStaking address in BorrowerOperations
    ✓ Sets the correct LQTYToken address in LQTYStaking
    ✓ Sets the correct ActivePool address in LQTYStaking
    ✓ Sets the correct ActivePool address in LQTYStaking
    ✓ Sets the correct ActivePool address in LQTYStaking
    ✓ Sets the correct BorrowerOperations address in LQTYStaking
    ✓ Sets the correct CommunityIssuance address in LQTYToken
    ✓ Sets the correct LQTYStaking address in LQTYToken
    ✓ Sets the correct LockupContractFactory address in LQTYToken
    ✓ Sets the correct LQTYToken address in LockupContractFactory
    ✓ Sets the correct LQTYToken address in CommunityIssuance
    ✓ Sets the correct StabilityPool address in CommunityIssuance

  Contract: DefaultPool
    ✓ sendETHToActivePool(): fails if receiver cannot receive ETH (41ms)

  Contract: Fee arithmetic tests
    ✓ minutesPassedSinceLastFeeOp(): returns minutes passed for no time increase (92ms)
    ✓ minutesPassedSinceLastFeeOp(): returns minutes passed between time of last fee operation and current block.timestamp, rounded down to nearest minutes (1748ms)
    ✓ decayBaseRateFromBorrowing(): returns the initial base rate for no time increase (179ms)
    ✓ decayBaseRateFromBorrowing(): returns the initial base rate for less than one minute passed  (368ms)
    ✓ decayBaseRateFromBorrowing(): returns correctly decayed base rate, for various durations. Initial baseRate = 0.01 (6325ms)
    ✓ decayBaseRateFromBorrowing(): returns correctly decayed base rate, for various durations. Initial baseRate = 0.1 (6194ms)
    ✓ decayBaseRateFromBorrowing(): returns correctly decayed base rate, for various durations. Initial baseRate = 0.34539284 (6801ms)
    ✓ decayBaseRateFromBorrowing(): returns correctly decayed base rate, for various durations. Initial baseRate = 0.9976 (6726ms)
    Basic exponentiation
      ✓ decPow(): for exponent = 0, returns 1, regardless of base
      ✓ decPow(): for exponent = 1, returns base, regardless of base (38ms)
      ✓ decPow(): for base = 0, returns 0 for any exponent other than 0 (157ms)
      ✓ decPow(): for base = 1, returns 1 for any exponent (174ms)
      ✓ decPow(): for exponent = 2, returns the square of the base (52ms)
      ✓ decPow(): correct output for various bases and exponents (415ms)
      ✓ decPow(): abs. error < 1e-9 for exponent = 7776000 (seconds in three months) (5416ms)
      ✓ decPow(): abs. error < 1e-9 for exponent = 2592000 (seconds in one month) (4954ms)
      ✓ decPow(): abs. error < 1e-9 for exponent = 43200 (minutes in one month) (3655ms)
      ✓ decPow(): abs. error < 1e-9 for exponent = 525600 (minutes in one year) (4013ms)
      ✓ decPow(): abs. error < 1e-9 for exponent = 2628000 (minutes in five years) (4812ms)
      ✓ decPow(): abs. error < 1e-9 for exponent = minutes in ten years (4987ms)
      ✓ decPow(): abs. error < 1e-9 for exponent = minutes in one hundred years (5181ms)
      - decPow(): overflow test: doesn't overflow for exponent = minutes in 1000 years

  Contract: Gas compensation tests
    ✓ _getCollGasCompensation(): returns the 0.5% of collaterall if it is < $10 in value (64ms)
    ✓ _getCollGasCompensation(): returns 0.5% of collaterall when 0.5% of collateral < $10 in value
    ✓ getCollGasCompensation(): returns 0.5% of collaterall when 0.5% of collateral = $10 in value
    ✓ getCollGasCompensation(): returns 0.5% of collaterall when 0.5% of collateral = $10 in value (83ms)
    ✓ getCompositeDebt(): returns (debt + 50) when collateral < $10 in value
    ✓ getCompositeDebt(): returns (debt + 50) collateral = $10 in value
    ✓ getCompositeDebt(): returns (debt + 50) when 0.5% of collateral > $10 in value (121ms)
    ✓ getCurrentICR(): Incorporates virtual debt, and returns the correct ICR for new troves (2627ms)
    ✓ Gas compensation from pool-offset liquidations. All collateral paid as compensation (3185ms)
    ✓ gas compensation from pool-offset liquidations: 0.5% collateral < $10 in value. Compensates $10 worth of collateral, liquidates the remainder (2558ms)
    ✓ gas compensation from pool-offset liquidations: 0.5% collateral > $10 in value. Compensates 0.5% of  collateral, liquidates the remainder (2566ms)
TCR: 249.109003222666871044
TCR: 12.442994710972210208
    ✓ Gas compensation from pool-offset liquidations. Liquidation event emits the correct gas compensation and total liquidated coll and debt (2474ms)
    ✓ gas compensation from pool-offset liquidations. Liquidation event emits the correct gas compensation and total liquidated coll and debt (2386ms)
    ✓ gas compensation from pool-offset liquidations: 0.5% collateral > $10 in value. Liquidation event emits the correct gas compensation and total liquidated coll and debt (2140ms)
    ✓ liquidateTroves(): full offset.  Compensates the correct amount, and liquidates the remainder (2282ms)
    ✓ liquidateTroves(): full redistribution. Compensates the correct amount, and liquidates the remainder (1632ms)
    ✓ liquidateTroves(): full offset. Liquidation event emits the correct gas compensation and total liquidated coll and debt (2222ms)
    ✓ liquidateTroves(): full redistribution. Liquidation event emits the correct gas compensation and total liquidated coll and debt (2184ms)
    ✓ Trove ordering: same collateral, decreasing debt. Price successively increases. Troves should maintain ordering by ICR (2394ms)
    ✓ Trove ordering: increasing collateral, constant debt. Price successively increases. Troves should maintain ordering by ICR (4756ms)
    ✓ Trove ordering: Constant raw collateral ratio (excluding virtual debt). Price successively increases. Troves should maintain ordering by ICR (3217ms)

  Contract: ALTR Token
    ✓ balanceOf(): gets the balance of the account (45ms)
    ✓ totalSupply(): gets the total supply
    ✓ name(): returns the token's name
    ✓ symbol(): returns the token's symbol
    ✓ version(): returns the token contract's version
    ✓ decimal(): returns the number of decimal digits used
    ✓ allowance(): returns an account's spending allowance for another account's balance (81ms)
    ✓ approve(): approves an account to spend the specified ammount (102ms)
    ✓ approve(): reverts when spender param is address(0) (112ms)
    ✓ approve(): reverts when owner param is address(0) (116ms)
    ✓ transferFrom(): successfully transfers from an account which it is approved to transfer from (269ms)
    ✓ transfer(): increases the recipient's balance by the correct amount (151ms)
    ✓ transfer(): reverts when amount exceeds sender's balance (151ms)
    ✓ transfer(): transfer to a blacklisted address reverts (334ms)
    ✓ transfer(): transfer to or from the zero-address reverts (117ms)
    ✓ mint(): issues correct amount of tokens to the given address (49ms)
    ✓ mint(): reverts when beneficiary is address(0) (49ms)
    ✓ increaseAllowance(): increases an account's allowance by the correct amount (41ms)
    ✓ decreaseAllowance(): decreases an account's allowance by the correct amount (104ms)
    ✓ sendToLQTYStaking(): changes balances of LQTYStaking and calling account by the correct amounts (123ms)
    ✓ Initializes PERMIT_TYPEHASH correctly
    ✓ Initializes DOMAIN_SEPARATOR correctly
    ✓ Initial nonce for a given address is 0
    ✓ permit(): permits and emits an Approval event (replay protected) (208ms)
    ✓ permit(): fails with expired deadline (82ms)
    ✓ permit(): fails with the wrong signature (43ms)

  Contract: HintHelpers
    ✓ setup: makes accounts with nominal ICRs increasing by 1% consecutively (74ms)
    ✓ getApproxHint(): returns the address of a Trove within sqrt(length) positions of the correct insert position (1420ms)
    ✓ getApproxHint(): returns the head of the list if the CR is the max uint256 value (350ms)
    ✓ getApproxHint(): returns the tail of the list if the CR is lower than ICR of any Trove (348ms)
    ✓ computeNominalCR()

  Contract: Deploying and funding One Year Lockup Contracts
    Deploying LCs
      ✓ LQTY Deployer can deploy LCs through the Factory (49ms)
      ✓ Anyone can deploy LCs through the Factory (62ms)
      ✓ LQTY Deployer can deploy LCs directly (49ms)
      ✓ Anyone can deploy LCs directly (207ms)
      ✓ LC deployment stores the beneficiary's address in the LC (127ms)
      ✓ LC deployment through the Factory registers the LC in the Factory (110ms)
      ✓ LC deployment through the Factory records the LC contract address and deployer as a k-v pair in the Factory (293ms)
      ✓ LC deployment through the Factory sets the unlockTime in the LC (76ms)
      ✓ Direct deployment of LC sets the unlockTime in the LC (73ms)
    Funding LCs
      ✓ LQTY transfer from LQTY deployer to their deployed LC increases the LQTY balance of the LC (395ms)
      ✓ LQTY Multisig can transfer LQTY to LCs deployed through the factory by anyone (245ms)
    Withdrawal attempts on funded, inactive LCs immediately after funding
      ✓ Beneficiary can withdraw from their funded LC (377ms)
      ✓ LQTY multisig can't withraw from a LC which it funded (235ms)
      ✓ No one can withraw from a LC (163ms)

  Contract: Deploying the LQTY contracts: LCF, CI, LQTYStaking, and LQTYToken 
    CommunityIssuance deployment
      ✓ Stores the deployer's address
    LQTYStaking deployment
      ✓ Stores the deployer's address
    LQTYToken deployment
      ✓ Stores the multisig's address
      ✓ Stores the CommunityIssuance address
      ✓ Stores the LockupContractFactory address
      ✓ Mints the correct LQTY amount to the multisig's address: 25 million
      ✓ Mints the correct LQTY amount to the CommunityIssuance contract address: 50 million
      ✓ Mints the correct LQTY amount to the bountyAddress EOA: 5 million
      ✓ Mints the correct LQTY amount to the lpRewardsAddress EOA: 20 million
    Community Issuance deployment
      ✓ Stores the deployer's address
      ✓ Has a supply cap of 32 million
      ✓ Liquity AG can set addresses if CI's LQTY balance is equal or greater than 50 million  (396ms)
      ✓ Liquity AG can't set addresses if CI's LQTY balance is < 50 million  (543ms)
    Connecting LQTYToken to LCF, CI and LQTYStaking
      ✓ sets the correct LQTYToken address in LQTYStaking (478ms)
      ✓ sets the correct LQTYToken address in LockupContractFactory
      ✓ sets the correct LQTYToken address in CommunityIssuance (480ms)

  Contract: Deploying and funding One Year Lockup Contracts
    LC: Token release schedule
      ✓ 15 months vesting schedule (278ms)
      ✓ 30 months vesting schedule (316ms)
    LC: Benificiary changes
      ✓ Owner can change beneficiary (218ms)

  Contract: LiquityMath
    ✓ max works if a > b
    ✓ max works if a = b
    ✓ max works if a < b

  Contract: LiquitySafeMath128Tester
    ✓ add(): reverts if overflows
    ✓ sub(): reverts if underflows

  Contract: LQTY community issuance arithmetic tests
issuance fraction before: 221529352078264
issuance fraction after: 221529352078264
    ✓ getCumulativeIssuanceFraction(): fraction doesn't increase if less than a minute has passed (68ms)
    ✓ Cumulative issuance fraction is 0.0000013 after a minute
    ✓ Cumulative issuance fraction is 0.000079 after an hour
    ✓ Cumulative issuance fraction is 0.0019 after a day
    ✓ Cumulative issuance fraction is 0.013 after a week
    ✓ Cumulative issuance fraction is 0.055 after a month
    ✓ Cumulative issuance fraction is 0.16 after 3 months (39ms)
    ✓ Cumulative issuance fraction is 0.29 after 6 months (44ms)
    ✓ Cumulative issuance fraction is 0.5 after a year
    ✓ Cumulative issuance fraction is 0.75 after 2 years
    ✓ Cumulative issuance fraction is 0.875 after 3 years
    ✓ Cumulative issuance fraction is 0.9375 after 4 years
    ✓ Cumulative issuance fraction is 0.999 after 10 years (40ms)
    ✓ Cumulative issuance fraction is 0.999999 after 20 years (38ms)
    ✓ Cumulative issuance fraction is 0.999999999 after 30 years (42ms)
    ✓ Total LQTY tokens issued is 65.93 after a minute (66ms)
    ✓ Total LQTY tokens issued is 3,956.16 after an hour (59ms)
    ✓ Total LQTY tokens issued is 94,861.57 after a day (74ms)
    ✓ Total LQTY tokens issued is 660,263.44 after a week (88ms)
    ✓ Total LQTY tokens issued is 2,768,926.90 after a month (84ms)
    ✓ Total LQTY tokens issued is 7,855,255.04 after 3 months (91ms)
    ✓ Total LQTY tokens issued is 14,476,409.44 after 6 months (111ms)
    ✓ Total LQTY tokens issued is 25,000,000 after a year (96ms)
    ✓ Total LQTY tokens issued is 37,500,000 after 2 years (86ms)
    ✓ Total LQTY tokens issued is 43,750,000 after 3 years (101ms)
    ✓ Total LQTY tokens issued is 46,875,000 after 4 years (96ms)
    ✓ Total LQTY tokens issued is 50,000,000 after 10 years (101ms)
    ✓ Total LQTY tokens issued is 50,000,000 after 20 years (107ms)
    ✓ Total LQTY tokens issued is 50,000,000 after 30 years (119ms)
    - Frequent token issuance: issuance event every year, for 30 years
    - Frequent token issuance: issuance event every day, for 30 years
    - Frequent token issuance: issuance event every minute, for 1 month
    - Frequent token issuance: issuance event every minute, for 1 year

  Contract: LQTYStaking revenue share tests
    ✓ stake(): reverts if amount is zero (123ms)
    ✓ ETH fee per LQTY staked increases when a redemption fee is triggered and totalStakes > 0 (2512ms)
    ✓ ETH fee per LQTY staked doesn't change when a redemption fee is triggered and totalStakes == 0 (2565ms)
    ✓ LUSD fee per LQTY staked increases when a redemption fee is triggered and totalStakes > 0 (2760ms)
    ✓ LUSD fee per LQTY staked doesn't change when a redemption fee is triggered and totalStakes == 0 (2624ms)
    ✓ LQTY Staking: A single staker earns all ETH and LQTY fees that occur (3582ms)
    ✓ stake(): Top-up sends out all accumulated ETH and LUSD gains to the staker (4793ms)
    ✓ getPendingETHGain(): Returns the staker's correct pending ETH gain (2730ms)
    ✓ getPendingLUSDGain(): Returns the staker's correct pending LUSD gain (3330ms)
    ✓ LQTY Staking: Multiple stakers earn the correct share of all ETH and LQTY fees, based on their stake size (5492ms)
    ✓ unstake(): reverts if caller has ETH gains and can't receive ETH (2157ms)
    ✓ receive(): reverts when it receives ETH from an address that is not the Active Pool
    ✓ unstake(): reverts if user has no stake
    ✓ Test requireCallerIsTroveManager

  Contract: LUSDToken
    Basic token functions, without Proxy
      ✓ balanceOf(): gets the balance of the account
      ✓ totalSupply(): gets the total supply
      ✓ name(): returns the token's name
      ✓ symbol(): returns the token's symbol
      ✓ decimal(): returns the number of decimal digits used
      ✓ allowance(): returns an account's spending allowance for another account's balance (66ms)
      ✓ approve(): approves an account to spend the specified amount
      ✓ approve(): reverts when spender param is address(0) (42ms)
      ✓ approve(): reverts when owner param is address(0)
      ✓ transferFrom(): successfully transfers from an account which is it approved to transfer from (211ms)
      ✓ transfer(): increases the recipient's balance by the correct amount (72ms)
      ✓ transfer(): reverts if amount exceeds sender's balance
      ✓ transfer(): transferring to a blacklisted address reverts (314ms)
      ✓ increaseAllowance(): increases an account's allowance by the correct amount (72ms)
      ✓ mint(): issues correct amount of tokens to the given address (80ms)
      ✓ burn(): burns correct amount of tokens from the given address (64ms)
      ✓ sendToPool(): changes balances of Stability pool and user by the correct amounts (48ms)
      ✓ returnFromPool(): changes balances of Stability pool and user by the correct amounts (84ms)
      ✓ transfer(): transferring to a blacklisted address reverts (257ms)
      ✓ decreaseAllowance(): decreases allowance by the expected amount (81ms)
      ✓ decreaseAllowance(): fails trying to decrease more than previously allowed (56ms)
      ✓ version(): returns the token contract's version
      ✓ Initializes PERMIT_TYPEHASH correctly
      ✓ Initializes DOMAIN_SEPARATOR correctly
      ✓ Initial nonce for a given address is 0
      ✓ permits and emits an Approval event (replay protected) (178ms)
      ✓ permits(): fails with expired deadline (58ms)
      ✓ permits(): fails with the wrong signature (90ms)
    Basic token functions, with Proxy
      ✓ balanceOf(): gets the balance of the account
      ✓ totalSupply(): gets the total supply
      ✓ name(): returns the token's name
      ✓ symbol(): returns the token's symbol
      ✓ decimal(): returns the number of decimal digits used
      ✓ allowance(): returns an account's spending allowance for another account's balance (67ms)
      ✓ approve(): approves an account to spend the specified amount (90ms)
      ✓ transferFrom(): successfully transfers from an account which is it approved to transfer from (259ms)
      ✓ transfer(): increases the recipient's balance by the correct amount (59ms)
      ✓ transfer(): reverts if amount exceeds sender's balance
      ✓ transfer(): transferring to a blacklisted address reverts (128ms)
      ✓ increaseAllowance(): increases an account's allowance by the correct amount
      ✓ transfer(): transferring to a blacklisted address reverts (299ms)
      ✓ decreaseAllowance(): decreases allowance by the expected amount (106ms)
      ✓ decreaseAllowance(): fails trying to decrease more than previously allowed (110ms)

  Contract: MerkleDistributor
    MerkleDistributor
      ✓ Allow Alice to claim 100e18 tokens (87ms)
      ✓ Prevent Alice from claiming twice (82ms)
      ✓ Prevent Alice from claiming with invalid proof (41ms)
      ✓ Prevent Alice from claiming with invalid amount (114ms)
      ✓ Prevent Bob from claiming (38ms)
      ✓ Let Bob claim on behalf of Alice (57ms)

  Contract: All Liquity functions with onlyOwner modifier
    TroveManager
      ✓ setAddresses(): reverts when called by non-owner, with wrong addresses, or twice (1535ms)
    BorrowerOperations
      ✓ setAddresses(): reverts when called by non-owner, with wrong addresses, or twice (1131ms)
    DefaultPool
      ✓ setAddresses(): reverts when called by non-owner, with wrong addresses, or twice (300ms)
    StabilityPool
      ✓ setAddresses(): reverts when called by non-owner, with wrong addresses, or twice (781ms)
    ActivePool
      ✓ setAddresses(): reverts when called by non-owner, with wrong addresses, or twice (454ms)
    SortedTroves
      ✓ setParams(): reverts when called by non-owner, with wrong addresses, or twice (263ms)
    CommunityIssuance
      ✓ setAddresses(): reverts when called by non-owner, with wrong addresses, or twice (222ms)
    LQTYStaking
      ✓ setAddresses(): reverts when called by non-owner, with wrong addresses, or twice (508ms)
    LockupContractFactory
      ✓ setLQTYAddress(): reverts when called by non-owner, with wrong address, or twice (175ms)

  Contract: StabilityPool
    ✓ getETH(): gets the recorded ETH balance
    ✓ getTotalLUSDDeposits(): gets the recorded LUSD balance

  Contract: ActivePool
    ✓ getETH(): gets the recorded ETH balance
    ✓ getLUSDDebt(): gets the recorded LUSD balance
    ✓ increaseLUSD(): increases the recorded LUSD balance by the correct amount (39ms)
    ✓ decreaseLUSD(): decreases the recorded LUSD balance by the correct amount (73ms)
    ✓ sendETH(): decreases the recorded ETH balance by the correct amount (53ms)

  Contract: DefaultPool
    ✓ getETH(): gets the recorded LUSD balance
    ✓ getLUSDDebt(): gets the recorded LUSD balance
    ✓ increaseLUSD(): increases the recorded LUSD balance by the correct amount
    ✓ decreaseLUSD(): decreases the recorded LUSD balance by the correct amount (62ms)
    ✓ sendETHToActivePool(): decreases the recorded ETH balance by the correct amount (102ms)

  Contract: PriceFeed
    ✓ C1 Chainlink working: fetchPrice should return the correct price, taking into account the number of decimal digits on the aggregator (1080ms)
    ✓ C1 Chainlink breaks, Tellor working: fetchPrice should return the correct Tellor price, taking into account Tellor's 18-digit granularity (512ms)
    ✓ C1 chainlinkWorking: Chainlink broken by zero latest roundId, Tellor working: switch to usingChainlinkTellorUntrusted (232ms)
    ✓ C1 chainlinkWorking: Chainlink broken by zero latest roundId, Tellor working: use Tellor price (353ms)
    ✓ C1 chainlinkWorking: Chainlink broken by zero timestamp, Tellor working, switch to usingChainlinkTellorUntrusted (353ms)
    ✓ C1 chainlinkWorking: Chainlink broken by zero timestamp, Tellor working, return Tellor price (304ms)
    ✓ C1 chainlinkWorking: Chainlink broken by future timestamp, Tellor working, switch to usingChainlinkTellorUntrusted (338ms)
    ✓ C1 chainlinkWorking: Chainlink broken by future timestamp, Tellor working, return Tellor price (313ms)
    ✓ C1 chainlinkWorking: Chainlink broken by negative price, Tellor working,  switch to usingChainlinkTellorUntrusted (251ms)
    ✓ C1 chainlinkWorking: Chainlink broken by negative price, Tellor working, return Tellor price (282ms)
    ✓ C1 chainlinkWorking: Chainlink broken - decimals call reverted, Tellor working, switch to usingChainlinkTellorUntrusted (325ms)
    ✓ C1 chainlinkWorking: Chainlink broken - decimals call reverted, Tellor working, return Tellor price (298ms)
    ✓ C1 chainlinkWorking: Chainlink broken - latest round call reverted, Tellor working, switch to usingChainlinkTellorUntrusted (320ms)
    ✓ C1 chainlinkWorking: latest round call reverted, Tellor working, return the Tellor price (340ms)
    ✓ C1 chainlinkWorking: previous round call reverted, Tellor working, switch to usingChainlinkTellorUntrusted (295ms)
    ✓ C1 chainlinkWorking: previous round call reverted, Tellor working, return Tellor Price (275ms)
    ✓ C1 chainlinkWorking: Chainlink frozen, Tellor working: switch to usingTellorChainlinkFrozen (352ms)
    ✓ C1 chainlinkWorking: Chainlink frozen, Tellor working: return Tellor price (336ms)
    ✓ C1 chainlinkWorking: Chainlink frozen, Tellor frozen: switch to usingTellorChainlinkFrozen (340ms)
    ✓ C1 chainlinkWorking: Chainlink frozen, Tellor frozen: return last good price (586ms)
    ✓ C1 chainlinkWorking: Chainlink times out, Tellor broken by 0 price: switch to usingChainlinkTellorUntrusted (477ms)
    ✓ C1 chainlinkWorking: Chainlink times out, Tellor broken by 0 price: return last good price (571ms)
    ✓ C1 chainlinkWorking: Chainlink is out of date by <4hrs: remain chainlinkWorking (415ms)
    ✓ C1 chainlinkWorking: Chainlink is out of date by <4hrs: return Chainklink price (385ms)
    ✓ C1 chainlinkWorking: Chainlink price drop of >50%, switch to usingChainlinkTellorUntrusted (470ms)
    ✓ C1 chainlinkWorking: Chainlink price drop of >50%, return the Tellor price (460ms)
    ✓ C1 chainlinkWorking: Chainlink price drop of 50%, remain chainlinkWorking (442ms)
    ✓ C1 chainlinkWorking: Chainlink price drop of 50%, return the Chainlink price (418ms)
    ✓ C1 chainlinkWorking: Chainlink price drop of <50%, remain chainlinkWorking (322ms)
    ✓ C1 chainlinkWorking: Chainlink price drop of <50%, return Chainlink price (349ms)
    ✓ C1 chainlinkWorking: Chainlink price increase of >100%, switch to usingChainlinkTellorUntrusted (325ms)
    ✓ C1 chainlinkWorking: Chainlink price increase of >100%, return Tellor price (311ms)
    ✓ C1 chainlinkWorking: Chainlink price increase of 100%, remain chainlinkWorking (354ms)
    ✓ C1 chainlinkWorking: Chainlink price increase of 100%, return Chainlink price (294ms)
    ✓ C1 chainlinkWorking: Chainlink price increase of <100%, remain chainlinkWorking (312ms)
    ✓ C1 chainlinkWorking: Chainlink price increase of <100%,  return Chainlink price (278ms)
    ✓ C1 chainlinkWorking: Chainlink price drop of >50% and Tellor price matches: remain chainlinkWorking (353ms)
    ✓ C1 chainlinkWorking: Chainlink price drop of >50% and Tellor price matches: return Chainlink price (580ms)
    ✓ C1 chainlinkWorking: Chainlink price drop of >50% and Tellor price within 5% of Chainlink: remain chainlinkWorking (412ms)
    ✓ C1 chainlinkWorking: Chainlink price drop of >50% and Tellor price within 5% of Chainlink: return Chainlink price (394ms)
    ✓ C1 chainlinkWorking: Chainlink price drop of >50% and Tellor live but not within 5% of Chainlink: switch to usingChainlinkTellorUntrusted (397ms)
    ✓ C1 chainlinkWorking: Chainlink price drop of >50% and Tellor live but not within 5% of Chainlink: return Tellor price (458ms)
    ✓ C1 chainlinkWorking: Chainlink price drop of >50% and Tellor frozen: switch to usingChainlinkTellorUntrusted (413ms)
    ✓ C1 chainlinkWorking: Chainlink price drop of >50% and Tellor frozen: return last good price (185ms)
    ✓ C1 chainlinkWorking: Chainlink price drop of >50% and Tellor is broken by 0 price: switch to bothOracleSuspect (184ms)
    ✓ C1 chainlinkWorking: Chainlink price drop of >50% and Tellor is broken by 0 price: return last good price (197ms)
    ✓ C1 chainlinkWorking: Chainlink price drop of >50% and Tellor is broken by 0 timestamp: switch to bothOracleSuspect (195ms)
    ✓ C1 chainlinkWorking: Chainlink price drop of >50% and Tellor is broken by 0 timestamp: return last good price (239ms)
    ✓ C1 chainlinkWorking: Chainlink price drop of >50% and Tellor is broken by future timestamp: Pricefeed switches to bothOracleSuspect (278ms)
    ✓ C1 chainlinkWorking: Chainlink price drop of >50% and Tellor is broken by future timestamp: return last good price (439ms)
    ✓ C1 chainlinkWorking: Chainlink is working and Tellor is working - remain on chainlinkWorking (404ms)
    ✓ C1 chainlinkWorking: Chainlink is working and Tellor is working - return Chainlink price (386ms)
    ✓ C1 chainlinkWorking: Chainlink is working and Tellor freezes - remain on chainlinkWorking (514ms)
    ✓ C1 chainlinkWorking: Chainlink is working and Tellor freezes - return Chainlink price (481ms)
    ✓ C1 chainlinkWorking: Chainlink is working and Tellor breaks: switch to usingChainlinkTellorUntrusted (301ms)
    ✓ C1 chainlinkWorking: Chainlink is working and Tellor breaks: return Chainlink price (300ms)
    ✓ C2 usingTellorChainlinkUntrusted: Tellor breaks by zero price: switch to bothOraclesSuspect (306ms)
    ✓ C2 usingTellorChainlinkUntrusted: Tellor breaks by zero price: return last good price (348ms)
    ✓ C2 usingTellorChainlinkUntrusted: Tellor breaks by call reverted: switch to bothOraclesSuspect (359ms)
    ✓ C2 usingTellorChainlinkUntrusted: Tellor breaks by call reverted: return last good price (506ms)
    ✓ C2 usingTellorChainlinkUntrusted: Tellor breaks by zero timestamp: switch to bothOraclesSuspect (482ms)
    ✓ C2 usingTellorChainlinkUntrusted: Tellor breaks by zero timestamp: return last good price (415ms)
    ✓ C2 usingTellorChainlinkUntrusted: Tellor freezes - remain usingChainlinkTellorUntrusted (512ms)
    ✓ C2 usingTellorChainlinkUntrusted: Tellor freezes - return last good price (376ms)
    ✓ C2 usingTellorChainlinkUntrusted: both Tellor and Chainlink are live and <= 5% price difference - switch to chainlinkWorking (284ms)
    ✓ C2 usingTellorChainlinkUntrusted: both Tellor and Chainlink are live and <= 5% price difference - return Chainlink price (290ms)
    ✓ C2 usingTellorChainlinkUntrusted: both Tellor and Chainlink are live and > 5% price difference - remain usingChainlinkTellorUntrusted (262ms)
    ✓ C2 usingTellorChainlinkUntrusted: both Tellor and Chainlink are live and > 5% price difference - return Tellor price (307ms)
    ✓ C3 bothOraclesUntrusted: both Tellor and Chainlink are live and > 5% price difference remain bothOraclesSuspect (237ms)
    ✓ C3 bothOraclesUntrusted: both Tellor and Chainlink are live and > 5% price difference, return last good price (377ms)
    ✓ C3 bothOraclesUntrusted: both Tellor and Chainlink are live and <= 5% price difference, switch to chainlinkWorking (355ms)
    ✓ C3 bothOraclesUntrusted: both Tellor and Chainlink are live and <= 5% price difference, return Chainlink price (407ms)
    ✓ C4 usingTellorChainlinkFrozen: when both Chainlink and Tellor break, switch to bothOraclesSuspect (464ms)
    ✓ C4 usingTellorChainlinkFrozen: when both Chainlink and Tellor break, return last good price (377ms)
    ✓ C4 usingTellorChainlinkFrozen: when Chainlink breaks and Tellor freezes, switch to usingChainlinkTellorUntrusted (455ms)
    ✓ C4 usingTellorChainlinkFrozen: when Chainlink breaks and Tellor freezes, return last good price (440ms)
    ✓ C4 usingTellorChainlinkFrozen: when Chainlink breaks and Tellor live, switch to usingChainlinkTellorUntrusted (345ms)
    ✓ C4 usingTellorChainlinkFrozen: when Chainlink breaks and Tellor live, return Tellor price (319ms)
    ✓ C4 usingTellorChainlinkFrozen: when Chainlink is live and Tellor is live with <5% price difference, switch back to chainlinkWorking (392ms)
    ✓ C4 usingTellorChainlinkFrozen: when Chainlink is live and Tellor is live with <5% price difference, return Chainlink current price (366ms)
    ✓ C4 usingTellorChainlinkFrozen: when Chainlink is live and Tellor is live with >5% price difference, switch back to usingChainlinkTellorUntrusted (457ms)
    ✓ C4 usingTellorChainlinkFrozen: when Chainlink is live and Tellor is live with >5% price difference, return Chainlink current price (407ms)
    ✓ C4 usingTellorChainlinkFrozen: when Chainlink is live and Tellor is live with similar price, switch back to chainlinkWorking (427ms)
    ✓ C4 usingTellorChainlinkFrozen: when Chainlink is live and Tellor is live with similar price, return Chainlink current price (415ms)
    ✓ C4 usingTellorChainlinkFrozen: when Chainlink is live and Tellor breaks, switch to usingChainlinkTellorUntrusted (314ms)
    ✓ C4 usingTellorChainlinkFrozen: when Chainlink is live and Tellor breaks, return Chainlink current price (328ms)
    ✓ C4 usingTellorChainlinkFrozen: when Chainlink still frozen and Tellor breaks, switch to usingChainlinkTellorUntrusted (526ms)
    ✓ C4 usingTellorChainlinkFrozen: when Chainlink still frozen and Tellor broken, return last good price (379ms)
    ✓ C4 usingTellorChainlinkFrozen: when Chainlink still frozen and Tellor live, remain usingTellorChainlinkFrozen (535ms)
    ✓ C4 usingTellorChainlinkFrozen: when Chainlink still frozen and Tellor live, return Tellor price (500ms)
    ✓ C4 usingTellorChainlinkFrozen: when Chainlink still frozen and Tellor freezes, remain usingTellorChainlinkFrozen (475ms)
    ✓ C4 usingTellorChainlinkFrozen: when Chainlink still frozen and Tellor freezes, return last good price (393ms)
    ✓ C5 usingChainlinkTellorUntrusted: when Chainlink is live and Tellor price >5% - no status change (442ms)
    ✓ C5 usingChainlinkTellorUntrusted: when Chainlink is live and Tellor price >5% - return Chainlink price (475ms)
    ✓ C5 usingChainlinkTellorUntrusted: when Chainlink is live and Tellor price within <5%, switch to chainlinkWorking (406ms)
    ✓ C5 usingChainlinkTellorUntrusted: when Chainlink is live, Tellor price not within 5%, return Chainlink price (401ms)
    ✓ C5 usingChainlinkTellorUntrusted: when Chainlink is live, <50% price deviation from previous, Tellor price not within 5%, remain on usingChainlinkTellorUntrusted (440ms)
    ✓ C5 usingChainlinkTellorUntrusted: when Chainlink is live, <50% price deviation from previous, Tellor price not within 5%, return Chainlink price (443ms)
    ✓ C5 usingChainlinkTellorUntrusted: when Chainlink is live, >50% price deviation from previous, Tellor price not within 5%, remain on usingChainlinkTellorUntrusted (479ms)
    ✓ C5 usingChainlinkTellorUntrusted: when Chainlink is live, >50% price deviation from previous,  Tellor price not within 5%, return Chainlink price (431ms)
    ✓ C5 usingChainlinkTellorUntrusted: when Chainlink is live, <50% price deviation from previous, and Tellor is frozen, remain on usingChainlinkTellorUntrusted (571ms)
    ✓ C5 usingChainlinkTellorUntrusted: when Chainlink is live, <50% price deviation from previous, Tellor is frozen, return Chainlink price (570ms)
    ✓ C5 usingChainlinkTellorUntrusted: when Chainlink is live, >50% price deviation from previous, Tellor is frozen, remain on usingChainlinkTellorUntrusted (545ms)
    ✓ C5 usingChainlinkTellorUntrusted: when Chainlink is live, >50% price deviation from previous, Tellor is frozen, return Chainlink price (609ms)
    ✓ C5 usingChainlinkTellorUntrusted: when Chainlink frozen, remain on usingChainlinkTellorUntrusted (153ms)
    ✓ C5 usingChainlinkTellorUntrusted: when Chainlink frozen, return last good price (173ms)
    ✓ C5 usingChainlinkTellorUntrusted: when Chainlink breaks too, switch to bothOraclesSuspect (201ms)
    ✓ C5 usingChainlinkTellorUntrusted: Chainlink breaks too, return last good price (220ms)
    PriceFeed internal testing contract
      ✓ fetchPrice before setPrice should return the default price
      ✓ should be able to fetchPrice after setPrice, output of former matching input of latter (40ms)
    Mainnet PriceFeed setup
      ✓ fetchPrice should fail on contract with no chainlink address set (63ms)
      ✓ fetchPrice should fail on contract with no tellor address set (75ms)
      ✓ setAddresses should fail whe called by nonOwner
      ✓ setAddresses should fail after address has already been set (169ms)

  Contract: BorrowerWrappers
    ✓ proxy owner can recover ETH
    ✓ non proxy owner cannot recover ETH (103ms)
    ✓ claimCollateralAndOpenTrove(): reverts if nothing to claim (916ms)
    ✓ claimCollateralAndOpenTrove(): without sending any value (2149ms)
    ✓ claimCollateralAndOpenTrove(): sending value in the transaction (1968ms)
    ✓ claimSPRewardsAndRecycle(): only owner can call it (1473ms)
    ✓ claimSPRewardsAndRecycle(): working cycle (1988ms)
    ✓ claimStakingGainsAndRecycle(): only owner can call it (2203ms)
    ✓ claimStakingGainsAndRecycle(): reverts if user has no trove (2175ms)
    ✓ claimStakingGainsAndRecycle(): with only ETH gain (2529ms)
    ✓ claimStakingGainsAndRecycle(): with only LUSD gain (1213ms)
    ✓ claimStakingGainsAndRecycle(): with both ETH and LUSD gains (2554ms)

  Contract: SortedTroves
    SortedTroves
      ✓ contains(): returns true for addresses that have opened troves (875ms)
      ✓ contains(): returns false for addresses that have not opened troves (880ms)
      ✓ contains(): returns false for addresses that opened and then closed a trove (1590ms)
      ✓ contains(): returns true for addresses that opened, closed and then re-opened a trove (2387ms)
      ✓ contains(): returns false when there are no troves in the system
      ✓ contains(): true when list size is 1 and the trove the only one in system (317ms)
      ✓ contains(): false when list size is 1 and trove is not in the system (339ms)
      ✓ getMaxSize(): Returns the maximum list size
      ✓ Finds the correct insert position given two addresses that loosely bound the correct position (2011ms)
      - stays ordered after troves with 'infinite' ICR receive a redistribution
    SortedTroves with mock dependencies
      when params are wrongly set
        ✓ setParams(): reverts if size is zero
      when params are properly set
        ✓ insert(): fails if list is full (56ms)
        ✓ insert(): fails if list already contains the node
        ✓ insert(): fails if id is zero
        ✓ insert(): fails if NICR is zero (167ms)
        ✓ remove(): fails if id is not in the list
        ✓ reInsert(): fails if list doesn’t contain the node (67ms)
        ✓ reInsert(): fails if new NICR is zero (38ms)
        ✓ findInsertPosition(): No prevId for hint - ascend list starting from nextId, result is after the tail

  Contract: StabilityPool - LQTY Rewards
    LQTY Rewards
      ✓ liquidation < 1 minute after a deposit does not change totalLQTYIssued (1175ms)
      ✓ withdrawFromSP(): reward term G does not update when no LQTY is issued (1059ms)
      ✓ withdrawFromSP(): Depositors with equal initial deposit withdraw correct LQTY gain. No liquidations. No front end. (2836ms)
      ✓ withdrawFromSP(): Depositors with varying initial deposit withdraw correct LQTY gain. No liquidations. No front end. (2716ms)
      ✓ withdrawFromSP(): Depositors with varying initial deposit withdraw correct LQTY gain. No liquidations. No front end. (3262ms)
      ✓ withdrawFromSP(): Depositor withdraws correct LQTY gain after serial pool-emptying liquidations. No front-ends. (5182ms)
      ✓ LQTY issuance for a given period is not obtainable if the SP was empty during the period (1090ms)
      ✓ withdrawFromSP(): Several deposits of 100 LUSD span one scale factor change. Depositors withdraw correct LQTY gains (5691ms)
      ✓ withdrawFromSP(): Depositors with equal initial deposit withdraw correct LQTY gain. No liquidations. Front ends and kickback rates. (2558ms)
      ✓ withdrawFromSP(): Depositors with varying initial deposit withdraw correct LQTY gain. Front ends and kickback rates (3199ms)
      ✓ withdrawFromSP(): Several deposits of 10k LUSD span one scale factor change. Depositors withdraw correct LQTY gains (3606ms)

  Contract: Pool Manager: Sum-Product rounding errors
    - Rounding errors: 100 deposits of 100LUSD into SP, then 200 liquidations of 49LUSD

  Contract: StabilityPool - Withdrawal of stability deposit - Reward calculations
    Stability Pool Withdrawal
      ✓ withdrawFromSP(): Depositors with equal initial deposit withdraw correct compounded deposit and ETH Gain after one liquidation (1064ms)
      ✓ withdrawFromSP(): Depositors with equal initial deposit withdraw correct compounded deposit and ETH Gain after two identical liquidations (1464ms)
      ✓ withdrawFromSP():  Depositors with equal initial deposit withdraw correct compounded deposit and ETH Gain after three identical liquidations (1852ms)
      ✓ withdrawFromSP(): Depositors with equal initial deposit withdraw correct compounded deposit and ETH Gain after two liquidations of increasing LUSD (1488ms)
      ✓ withdrawFromSP(): Depositors with equal initial deposit withdraw correct compounded deposit and ETH Gain after three liquidations of increasing LUSD (2062ms)
      ✓ withdrawFromSP(): Depositors with varying deposits withdraw correct compounded deposit and ETH Gain after two identical liquidations (1430ms)
      ✓ withdrawFromSP(): Depositors with varying deposits withdraw correct compounded deposit and ETH Gain after three identical liquidations (2158ms)
      ✓ withdrawFromSP(): Depositors with varying deposits withdraw correct compounded deposit and ETH Gain after three varying liquidations (2111ms)
      ✓ withdrawFromSP(): A, B, C Deposit -> 2 liquidations -> D deposits -> 1 liquidation. All deposits and liquidations = 100 LUSD.  A, B, C, D withdraw correct LUSD deposit and ETH Gain (2256ms)
      ✓ withdrawFromSP(): A, B, C Deposit -> 2 liquidations -> D deposits -> 2 liquidations. All deposits and liquidations = 100 LUSD.  A, B, C, D withdraw correct LUSD deposit and ETH Gain (2794ms)
      ✓ withdrawFromSP(): A, B, C Deposit -> 2 liquidations -> D deposits -> 2 liquidations. Various deposit and liquidation vals.  A, B, C, D withdraw correct LUSD deposit and ETH Gain (2644ms)
      ✓ withdrawFromSP(): A, B, C, D deposit -> 2 liquidations -> D withdraws -> 2 liquidations. All deposits and liquidations = 100 LUSD.  A, B, C, D withdraw correct LUSD deposit and ETH Gain (2655ms)
      ✓ withdrawFromSP(): A, B, C, D deposit -> 2 liquidations -> D withdraws -> 2 liquidations. Various deposit and liquidation vals. A, B, C, D withdraw correct LUSD deposit and ETH Gain (4428ms)
      ✓ withdrawFromSP(): A, B, D deposit -> 2 liquidations -> C makes deposit -> 1 liquidation -> D withdraws -> 1 liquidation. All deposits: 100 LUSD. Liquidations: 100,100,100,50.  A, B, C, D withdraw correct LUSD deposit and ETH Gain (2295ms)
      ✓ withdrawFromSP(): Depositor withdraws correct compounded deposit after liquidation empties the pool (1602ms)
      ✓ withdrawFromSP(): Pool-emptying liquidation increases epoch by one, resets scaleFactor to 0, and resets P to 1e18 (2152ms)
      ✓ withdrawFromSP(): Depositors withdraw correct compounded deposit after liquidation empties the pool (1849ms)
      ✓ withdrawFromSP(): single deposit fully offset. After subsequent liquidations, depositor withdraws 0 deposit and *only* the ETH Gain from one liquidation (1520ms)
      ✓ withdrawFromSP(): Depositor withdraws correct compounded deposit after liquidation empties the pool (3200ms)
      ✓ withdrawFromSP(): deposit spans one scale factor change: Single depositor withdraws correct compounded deposit and ETH Gain after one liquidation (1416ms)
      ✓ withdrawFromSP(): Several deposits of varying amounts span one scale factor change. Depositors withdraw correct compounded deposit and ETH Gain after one liquidation (1923ms)
      ✓ withdrawFromSP(): deposit spans one scale factor change: Single depositor withdraws correct compounded deposit and ETH Gain after one liquidation (1503ms)
      ✓ withdrawFromSP(): Several deposits of varying amounts span one scale factor change. Depositors withdraws correct compounded deposit and ETH Gain after one liquidation (2043ms)
      ✓ withdrawFromSP(): Deposit that decreases to less than 1e-9 of it's original value is reduced to 0 (895ms)
      ✓ withdrawFromSP(): Several deposits of 10000 LUSD span one scale factor change. Depositors withdraws correct compounded deposit and ETH Gain after one liquidation (2697ms)
      ✓ withdrawFromSP(): 2 depositors can withdraw after each receiving half of a pool-emptying liquidation (2846ms)
      ✓ withdrawFromSP(): Depositor's ETH gain stops increasing after two scale changes (2909ms)
      ✓ withdrawFromSP(): Large liquidated coll/debt, deposits and ETH price (1512ms)
      ✓ withdrawFromSP(): Small liquidated coll/debt, large deposits and ETH price (1389ms)

  Contract: StabilityPool - Withdrawal of stability deposit - Reward calculations
    Stability Pool Withdrawal
      ✓ withdrawETHGainToTrove(): Depositors with equal initial deposit withdraw correct compounded deposit and ETH Gain after one liquidation (2444ms)
      ✓ withdrawETHGainToTrove(): Depositors with equal initial deposit withdraw correct compounded deposit and ETH Gain after two identical liquidations (2599ms)
      ✓ withdrawETHGainToTrove():  Depositors with equal initial deposit withdraw correct compounded deposit and ETH Gain after three identical liquidations (3134ms)
      ✓ withdrawETHGainToTrove(): Depositors with equal initial deposit withdraw correct compounded deposit and ETH Gain after two liquidations of increasing LUSD (2549ms)
      ✓ withdrawETHGainToTrove(): Depositors with equal initial deposit withdraw correct compounded deposit and ETH Gain after three liquidations of increasing LUSD (3124ms)
      ✓ withdrawETHGainToTrove(): Depositors with varying deposits withdraw correct compounded deposit and ETH Gain after two identical liquidations (2591ms)
      ✓ withdrawETHGainToTrove(): Depositors with varying deposits withdraw correct compounded deposit and ETH Gain after three identical liquidations (2832ms)
      ✓ withdrawETHGainToTrove(): Depositors with varying deposits withdraw correct compounded deposit and ETH Gain after three varying liquidations (2935ms)
      ✓ withdrawETHGainToTrove(): A, B, C Deposit -> 2 liquidations -> D deposits -> 1 liquidation. All deposits and liquidations = 100 LUSD.  A, B, C, D withdraw correct LUSD deposit and ETH Gain (3451ms)
      ✓ withdrawETHGainToTrove(): A, B, C Deposit -> 2 liquidations -> D deposits -> 2 liquidations. All deposits and liquidations = 100 LUSD.  A, B, C, D withdraw correct LUSD deposit and ETH Gain (3706ms)
      ✓ withdrawETHGainToTrove(): A, B, C Deposit -> 2 liquidations -> D deposits -> 2 liquidations. Various deposit and liquidation vals.  A, B, C, D withdraw correct LUSD deposit and ETH Gain (3726ms)
      ✓ withdrawETHGainToTrove(): A, B, C, D deposit -> 2 liquidations -> D withdraws -> 2 liquidations. All deposits and liquidations = 100 LUSD.  A, B, C, D withdraw correct LUSD deposit and ETH Gain (3643ms)
      ✓ withdrawETHGainToTrove(): A, B, C, D deposit -> 2 liquidations -> D withdraws -> 2 liquidations. Various deposit and liquidation vals. A, B, C, D withdraw correct LUSD deposit and ETH Gain (3408ms)
      ✓ withdrawETHGainToTrove(): A, B, D deposit -> 2 liquidations -> C makes deposit -> 1 liquidation -> D withdraws -> 1 liquidation. All deposits: 100 LUSD. Liquidations: 100,100,100,50.  A, B, C, D withdraw correct LUSD deposit and ETH Gain (3466ms)
      ✓ withdrawETHGainToTrove(): Depositor withdraws correct compounded deposit after liquidation empties the pool (3125ms)
      ✓ withdrawETHGainToTrove(): Pool-emptying liquidation increases epoch by one, resets scaleFactor to 0, and resets P to 1e18 (3021ms)
      ✓ withdrawETHGainToTrove(): Depositors withdraw correct compounded deposit after liquidation empties the pool (3834ms)
      ✓ withdrawETHGainToTrove(): single deposit fully offset. After subsequent liquidations, depositor withdraws 0 deposit and *only* the ETH Gain from one liquidation (2693ms)
      ✓ withdrawETHGainToTrove(): Depositor withdraws correct compounded deposit after liquidation empties the pool (5647ms)
      ✓ withdrawETHGainToTrove(): deposit spans one scale factor change: Single depositor withdraws correct compounded deposit and ETH Gain after one liquidation (3299ms)
      ✓ withdrawETHGainToTrove(): Several deposits of varying amounts span one scale factor change. Depositors withdraw correct compounded deposit and ETH Gain after one liquidation (2870ms)
      ✓ withdrawETHGainToTrove(): deposit spans one scale factor change: Single depositor withdraws correct compounded deposit and ETH Gain after one liquidation (2043ms)
      ✓ withdrawETHGainToTrove(): Several deposits of varying amounts span one scale factor change. Depositors withdraws correct compounded deposit and ETH Gain after one liquidation (2714ms)
      ✓ withdrawETHGainToTrove(): Deposit that decreases to less than 1e-9 of it's original value is reduced to 0 (943ms)
      ✓ withdrawETHGainToTrove(): Several deposits of 10000 LUSD span one scale factor change. Depositors withdraws correct compounded deposit and ETH Gain after one liquidation (3845ms)
      ✓ withdrawETHGainToTrove(): 2 depositors can withdraw after each receiving half of a pool-emptying liquidation (6861ms)
      ✓ withdrawETHGainToTrove(): Large liquidated coll/debt, deposits and ETH price (1628ms)
      ✓ withdrawETHGainToTrove(): Small liquidated coll/debt, large deposits and ETH price (1361ms)

  Contract: StabilityPool
    Stability Pool Mechanisms
      ✓ provideToSP(): increases the Stability Pool LUSD balance (420ms)
      ✓ provideToSP(): updates the user's deposit record in StabilityPool (510ms)
      ✓ provideToSP(): reduces the user's LUSD balance by the correct amount (367ms)
      ✓ provideToSP(): increases totalLUSDDeposits by correct amount (426ms)
      ✓ provideToSP(): Correctly updates user snapshots of accumulated rewards per unit staked (1762ms)
      ✓ provideToSP(), multiple deposits: updates user's deposit and snapshots (3392ms)
      ✓ provideToSP(): reverts if user tries to provide more than their LUSD balance (1312ms)
      ✓ provideToSP(): reverts if user tries to provide 2^256-1 LUSD, which exceeds their balance (994ms)
      ✓ provideToSP(): reverts if cannot receive ETH Gain (1793ms)
      ✓ provideToSP(): doesn't impact other users' deposits or ETH gains (2964ms)
      ✓ provideToSP(): doesn't impact system debt, collateral or TCR (2587ms)
      ✓ provideToSP(): doesn't impact any troves, including the caller's trove (1685ms)
      ✓ provideToSP(): doesn't protect the depositor's trove from liquidation (1303ms)
      ✓ provideToSP(): providing 0 LUSD reverts (1138ms)
      ✓ provideToSP(), new deposit: when SP > 0, triggers LQTY reward event - increases the sum G (1140ms)
      ✓ provideToSP(), new deposit: when SP is empty, doesn't update G (1301ms)
      ✓ provideToSP(), new deposit: sets the correct front end tag (1629ms)
      ✓ provideToSP(), new deposit: depositor does not receive any LQTY rewards (952ms)
      ✓ provideToSP(), new deposit after past full withdrawal: depositor does not receive any LQTY rewards (2261ms)
      ✓ provideToSP(), new eligible deposit: tagged front end receives LQTY rewards (2271ms)
      ✓ provideToSP(), new eligible deposit: tagged front end's stake increases (1284ms)
      ✓ provideToSP(), new eligible deposit: tagged front end's snapshots update (2378ms)
      ✓ provideToSP(), new deposit: depositor does not receive ETH gains (1097ms)
      ✓ provideToSP(), new deposit after past full withdrawal: depositor does not receive ETH gains (2557ms)
      ✓ provideToSP(), topup: triggers LQTY reward event - increases the sum G (1346ms)
      ✓ provideToSP(), topup from different front end: doesn't change the front end tag (1952ms)
      ✓ provideToSP(), topup: depositor receives LQTY rewards (1756ms)
      ✓ provideToSP(), topup: tagged front end receives LQTY rewards (1662ms)
      ✓ provideToSP(), topup: tagged front end's stake increases (2514ms)
      ✓ provideToSP(), topup: tagged front end's snapshots update (2567ms)
      ✓ provideToSP(): reverts when amount is zero (1051ms)
      ✓ provideToSP(): reverts if user is a registered front end (1123ms)
      ✓ provideToSP(): reverts if provided tag is not a registered front end (828ms)
      ✓ withdrawFromSP(): reverts when user has no active deposit (759ms)
      ✓ withdrawFromSP(): reverts when amount > 0 and system has an undercollateralized trove (715ms)
      ✓ withdrawFromSP(): partial retrieval - retrieves correct LUSD amount and the entire ETH Gain, and updates deposit (1678ms)
      ✓ withdrawFromSP(): partial retrieval - leaves the correct amount of LUSD in the Stability Pool (1601ms)
      ✓ withdrawFromSP(): full retrieval - leaves the correct amount of LUSD in the Stability Pool (1687ms)
      ✓ withdrawFromSP(): Subsequent deposit and withdrawal attempt from same account, with no intermediate liquidations, withdraws zero ETH (2047ms)
      ✓ withdrawFromSP(): it correctly updates the user's LUSD and ETH snapshots of entitled reward per unit staked (1650ms)
      ✓ withdrawFromSP(): decreases StabilityPool ETH (1323ms)
      ✓ withdrawFromSP(): All depositors are able to withdraw from the SP to their account (3889ms)
      ✓ withdrawFromSP(): increases depositor's LUSD token balance by the expected amount (3246ms)
      ✓ withdrawFromSP(): doesn't impact other users Stability deposits or ETH gains (2191ms)
      ✓ withdrawFromSP(): doesn't impact system debt, collateral or TCR  (2169ms)
      ✓ withdrawFromSP(): doesn't impact any troves, including the caller's trove (1464ms)
      ✓ withdrawFromSP(): succeeds when amount is 0 and system has an undercollateralized trove (1132ms)
      ✓ withdrawFromSP(): withdrawing 0 LUSD doesn't alter the caller's deposit or the total LUSD in the Stability Pool (1197ms)
      ✓ withdrawFromSP(): withdrawing 0 ETH Gain does not alter the caller's ETH balance, their trove collateral, or the ETH  in the Stability Pool (1978ms)
      ✓ withdrawFromSP(): Request to withdraw > caller's deposit only withdraws the caller's compounded deposit (1998ms)
      ✓ withdrawFromSP(): Request to withdraw 2^256-1 LUSD only withdraws the caller's compounded deposit (1979ms)
      ✓ withdrawFromSP(): caller can withdraw full deposit and ETH gain during Recovery Mode (2076ms)
      ✓ getDepositorETHGain(): depositor does not earn further ETH gains from liquidations while their compounded deposit == 0:  (2599ms)
      ✓ withdrawFromSP(): triggers LQTY reward event - increases the sum G (1383ms)
      ✓ withdrawFromSP(), partial withdrawal: doesn't change the front end tag (2008ms)
      ✓ withdrawFromSP(), partial withdrawal: depositor receives LQTY rewards (1499ms)
      ✓ withdrawFromSP(), partial withdrawal: tagged front end receives LQTY rewards (1608ms)
      ✓ withdrawFromSP(), partial withdrawal: tagged front end's stake decreases (2794ms)
      ✓ withdrawFromSP(), partial withdrawal: tagged front end's snapshots update (2574ms)
      ✓ withdrawFromSP(), full withdrawal: removes deposit's front end tag (1405ms)
      ✓ withdrawFromSP(), full withdrawal: zero's depositor's snapshots (2594ms)
      ✓ withdrawFromSP(), full withdrawal that reduces front end stake to 0: zero’s the front end’s snapshots (2144ms)
      ✓ withdrawFromSP(), reverts when initial deposit value is 0 (1445ms)
      ✓ withdrawETHGainToTrove(): reverts when user has no active deposit (1764ms)
      ✓ withdrawETHGainToTrove(): Applies LUSDLoss to user's deposit, and redirects ETH reward to user's Trove (1464ms)
      ✓ withdrawETHGainToTrove(): reverts if it would leave trove with ICR < MCR (1147ms)
      ✓ withdrawETHGainToTrove(): Subsequent deposit and withdrawal attempt from same account, with no intermediate liquidations, withdraws zero ETH (1665ms)
      ✓ withdrawETHGainToTrove(): decreases StabilityPool ETH and increases activePool ETH (1456ms)
      ✓ withdrawETHGainToTrove(): All depositors are able to withdraw their ETH gain from the SP to their Trove (4022ms)
      ✓ withdrawETHGainToTrove(): All depositors withdraw, each withdraw their correct ETH gain (3803ms)
      ✓ withdrawETHGainToTrove(): caller can withdraw full deposit and ETH gain to their trove during Recovery Mode (2059ms)
      ✓ withdrawETHGainToTrove(): reverts if user has no trove (1552ms)
      ✓ withdrawETHGainToTrove(): triggers LQTY reward event - increases the sum G (3822ms)
      ✓ withdrawETHGainToTrove(), partial withdrawal: doesn't change the front end tag (2281ms)
      ✓ withdrawETHGainToTrove(), eligible deposit: depositor receives LQTY rewards (2426ms)
      ✓ withdrawETHGainToTrove(), eligible deposit: tagged front end receives LQTY rewards (2489ms)
      ✓ withdrawETHGainToTrove(), eligible deposit: tagged front end's stake decreases (3259ms)
      ✓ withdrawETHGainToTrove(), eligible deposit: tagged front end's snapshots update (2841ms)
      ✓ withdrawETHGainToTrove(): reverts when depositor has no ETH gain (1669ms)
      ✓ registerFrontEnd(): registers the front end and chosen kickback rate (170ms)
      ✓ registerFrontEnd(): reverts if the front end is already registered (81ms)
      ✓ registerFrontEnd(): reverts if the kickback rate >1 (65ms)
      ✓ registerFrontEnd(): reverts if address has a non-zero deposit already (1104ms)

  Contract: TroveManager
    - A given trove's stake decline is negligible with adjustments and tiny liquidations

  Contract: TroveManager - Redistribution reward calculations
    ✓ redistribution: A, B Open. B Liquidated. C, D Open. D Liquidated. Distributes correct rewards (1483ms)
    ✓ redistribution: A, B, C Open. C Liquidated. D, E, F Open. F Liquidated. Distributes correct rewards (2323ms)
    ✓ redistribution: Sequence of alternate opening/liquidation: final surviving trove has ETH from all previously liquidated troves (3022ms)
    ✓ redistribution: A,B,C,D,E open. Liq(A). B adds coll. Liq(C). B and D have correct coll and debt (2843ms)
    ✓ redistribution: A,B,C,D open. Liq(A). B adds coll. Liq(C). B and D have correct coll and debt (2674ms)
    ✓ redistribution: A,B,C Open. Liq(C). B adds coll. Liq(A). B acquires all coll and debt (1603ms)
    ✓ redistribution: A,B,C Open. Liq(C). B tops up coll. D Opens. Liq(D). Distributes correct rewards. (1779ms)
    ✓ redistribution: Trove with the majority stake tops up. A,B,C, D open. Liq(D). C tops up. E Enters, Liq(E). Distributes correct rewards (1755ms)
    ✓ redistribution: Trove with the majority stake tops up. A,B,C, D open. Liq(D). A, B, C top up. E Enters, Liq(E). Distributes correct rewards (2201ms)
    ✓ redistribution: A,B,C Open. Liq(C). B withdraws coll. Liq(A). B acquires all coll and debt (1514ms)
    ✓ redistribution: A,B,C Open. Liq(C). B withdraws coll. D Opens. Liq(D). Distributes correct rewards. (1605ms)
    ✓ redistribution: Trove with the majority stake withdraws. A,B,C,D open. Liq(D). C withdraws some coll. E Enters, Liq(E). Distributes correct rewards (4311ms)
    ✓ redistribution: Trove with the majority stake withdraws. A,B,C,D open. Liq(D). A, B, C withdraw. E Enters, Liq(E). Distributes correct rewards (2330ms)
    ✓ redistribution, all operations: A,B,C open. Liq(A). D opens. B adds, C withdraws. Liq(B). E & F open. D adds. Liq(F). Distributes correct rewards (2808ms)
    ✓ redistribution, all operations: A,B,C open. Liq(A). D opens. B adds, C withdraws. Liq(B). E & F open. D adds. Liq(F). Varying coll. Distributes correct rewards (2963ms)

  Contract: TroveManager - in Recovery Mode - back to normal mode in 1 tx
    Batch liquidations
      ✓ First trove only doesn’t get out of Recovery Mode (1392ms)
      ✓ Two troves over MCR are liquidated (1441ms)
      ✓ Stability Pool profit matches (1489ms)
      ✓ A trove over TCR is not liquidated (1455ms)
    Sequential liquidations
      ✓ First trove only doesn’t get out of Recovery Mode (1023ms)
      ✓ Two troves over MCR are liquidated (1204ms)

  Contract: TroveManager - in Recovery Mode
    ✓ checkRecoveryMode(): Returns true if TCR falls below CCR (862ms)
    ✓ checkRecoveryMode(): Returns true if TCR stays less than CCR (914ms)
    ✓ checkRecoveryMode(): returns false if TCR stays above CCR (803ms)
    ✓ checkRecoveryMode(): returns false if TCR rises above CCR (759ms)
    ✓ liquidate(), with ICR < 100%: removes stake and updates totalStakes (949ms)
    ✓ liquidate(), with ICR < 100%: updates system snapshots correctly (1335ms)
    ✓ liquidate(), with ICR < 100%: closes the Trove and removes it from the Trove array (1016ms)
    ✓ liquidate(), with ICR < 100%: only redistributes to active Troves - no offset to Stability Pool (1347ms)
    ✓ liquidate(), with 100 < ICR < 110%: removes stake and updates totalStakes (1072ms)
    ✓ liquidate(), with 100% < ICR < 110%: updates system snapshots correctly (1368ms)
    ✓ liquidate(), with 100% < ICR < 110%: closes the Trove and removes it from the Trove array (1039ms)
    ✓ liquidate(), with 100% < ICR < 110%: offsets as much debt as possible with the Stability Pool, then redistributes the remainder coll and debt (1457ms)
    ✓ liquidate(), with ICR > 110%, trove has lowest ICR, and StabilityPool is empty: does nothing (1171ms)
    ✓ liquidate(), with 110% < ICR < TCR, and StabilityPool LUSD > debt to liquidate: offsets the trove entirely with the pool (1334ms)
    ✓ liquidate(), with ICR% = 110 < TCR, and StabilityPool LUSD > debt to liquidate: offsets the trove entirely with the pool, there’s no collateral surplus (1168ms)
    ✓ liquidate(), with  110% < ICR < TCR, and StabilityPool LUSD > debt to liquidate: removes stake and updates totalStakes (1300ms)
    ✓ liquidate(), with  110% < ICR < TCR, and StabilityPool LUSD > debt to liquidate: updates system snapshots (1188ms)
    ✓ liquidate(), with 110% < ICR < TCR, and StabilityPool LUSD > debt to liquidate: closes the Trove (1322ms)
    ✓ liquidate(), with 110% < ICR < TCR, and StabilityPool LUSD > debt to liquidate: can liquidate troves out of order (3054ms)
    ✓ liquidate(), with ICR > 110%, and StabilityPool LUSD < liquidated debt: Trove remains active (1126ms)
    ✓ liquidate(), with ICR > 110%, and StabilityPool LUSD < liquidated debt: Trove remains in TroveOwners array (1119ms)
    ✓ liquidate(), with ICR > 110%, and StabilityPool LUSD < liquidated debt: nothing happens (1111ms)
    ✓ liquidate(), with ICR > 110%, and StabilityPool LUSD < liquidated debt: updates system shapshots (1096ms)
    ✓ liquidate(), with ICR > 110%, and StabilityPool LUSD < liquidated debt: causes correct Pool offset and ETH gain, and doesn't redistribute to active troves (1121ms)
    ✓ liquidate(), with ICR > 110%, and StabilityPool LUSD < liquidated debt: ICR of non liquidated trove does not change (1906ms)
    ✓ liquidate() with ICR > 110%, and StabilityPool LUSD < liquidated debt: total liquidated coll and debt is correct (1842ms)
    ✓ liquidate(): Doesn't liquidate undercollateralized trove if it is the only trove in the system (536ms)
    ✓ liquidate(): Liquidates undercollateralized trove if there are two troves in the system (974ms)
    ✓ liquidate(): does nothing if trove has >= 110% ICR and the Stability Pool is empty (1064ms)
    ✓ liquidate(): does nothing if trove ICR >= TCR, and SP covers trove's debt (1243ms)
    ✓ liquidate(): reverts if trove is non-existent (722ms)
    ✓ liquidate(): reverts if trove has been closed (1056ms)
    ✓ liquidate(): liquidates based on entire/collateral debt (including pending rewards), not raw collateral/debt (1895ms)
    ✓ liquidate(): does not affect the SP deposit or ETH gain when called on an SP depositor's address that has no trove (1058ms)
    ✓ liquidate(): does not alter the liquidated user's token balance (1661ms)
    ✓ liquidate(), with 110% < ICR < TCR, can claim collateral, re-open, be reedemed and claim again (2453ms)
    ✓ liquidate(), with 110% < ICR < TCR, can claim collateral, after another claim from a redemption (2313ms)
    ✓ liquidateTroves(): With all ICRs > 110%, Liquidates Troves until system leaves recovery mode (2667ms)
    ✓ liquidateTroves(): Liquidates Troves until 1) system has left recovery mode AND 2) it reaches a Trove with ICR >= 110% (2234ms)
    ✓ liquidateTroves(): liquidates only up to the requested number of undercollateralized troves (1980ms)
    ✓ liquidateTroves(): does nothing if n = 0 (877ms)
    ✓ liquidateTroves(): closes every Trove with ICR < MCR, when n > number of undercollateralized troves (2062ms)
    ✓ liquidateTroves(): a liquidation sequence containing Pool offsets increases the TCR (2539ms)
    ✓ liquidateTroves(): A liquidation sequence of pure redistributions decreases the TCR, due to gas compensation, but up to 0.5% (2537ms)
    ✓ liquidateTroves(): liquidates based on entire/collateral debt (including pending rewards), not raw collateral/debt (1474ms)
    ✓ liquidateTroves(): does nothing if all troves have ICR > 110% and Stability Pool is empty (3486ms)
    ✓ liquidateTroves(): emits liquidation event with correct values when all troves have ICR > 110% and Stability Pool covers a subset of troves (2617ms)
    ✓ liquidateTroves():  emits liquidation event with correct values when all troves have ICR > 110% and Stability Pool covers a subset of troves, including a partial (2553ms)
    ✓ liquidateTroves(): does not affect the liquidated user's token balances (1595ms)
    ✓ liquidateTroves(): Liquidating troves at 100 < ICR < 110 with SP deposits correctly impacts their SP deposit and ETH gain (1872ms)
    ✓ liquidateTroves(): Liquidating troves at ICR <=100% with SP deposits does not alter their deposit or ETH gain (1594ms)
    ✓ liquidateTroves() with a non fullfilled liquidation: non liquidated trove remains active (2006ms)
    ✓ liquidateTroves() with a non fullfilled liquidation: non liquidated trove remains in TroveOwners Array (1945ms)
gasUsed:  480767
true
    ✓ liquidateTroves() with a non fullfilled liquidation: still can liquidate further troves after the non-liquidated, emptied pool (2033ms)
gasUsed:  480767
    ✓ liquidateTroves() with a non fullfilled liquidation: still can liquidate further troves after the non-liquidated, non emptied pool (1993ms)
    ✓ liquidateTroves() with a non fullfilled liquidation: total liquidated coll and debt is correct (2123ms)
    ✓ liquidateTroves() with a non fullfilled liquidation: emits correct liquidation event values (2096ms)
    ✓ liquidateTroves() with a non fullfilled liquidation: ICR of non liquidated trove does not change (1944ms)
    ✓ batchLiquidateTroves(): Liquidates all troves with ICR < 110%, transitioning Normal -> Recovery Mode (2105ms)
    ✓ batchLiquidateTroves(): Liquidates all troves with ICR < 110%, transitioning Recovery -> Normal Mode (2153ms)
    ✓ batchLiquidateTroves(): Liquidates all troves with ICR < 110%, transitioning Normal -> Recovery Mode (2207ms)
    ✓ batchLiquidateTroves() with a non fullfilled liquidation: non liquidated trove remains active (1728ms)
    ✓ batchLiquidateTroves() with a non fullfilled liquidation: non liquidated trove remains in Trove Owners array (1713ms)
gasUsed:  513308
    ✓ batchLiquidateTroves() with a non fullfilled liquidation: still can liquidate further troves after the non-liquidated, emptied pool (1802ms)
gasUsed:  513308
    ✓ batchLiquidateTroves() with a non fullfilled liquidation: still can liquidate further troves after the non-liquidated, non emptied pool (2018ms)
    ✓ batchLiquidateTroves() with a non fullfilled liquidation: total liquidated coll and debt is correct (1987ms)
    ✓ batchLiquidateTroves() with a non fullfilled liquidation: emits correct liquidation event values (1973ms)
    ✓ batchLiquidateTroves() with a non fullfilled liquidation: ICR of non liquidated trove does not change (1983ms)
    ✓ batchLiquidateTroves(), with 110% < ICR < TCR, and StabilityPool LUSD > debt to liquidate: can liquidate troves out of order (2242ms)
    ✓ batchLiquidateTroves(), with 110% < ICR < TCR, and StabilityPool empty: doesn't liquidate any troves (2034ms)
    ✓ batchLiquidateTroves(): skips liquidation of troves with ICR > TCR, regardless of Stability Pool size (4219ms)
    ✓ batchLiquidateTroves(): emits liquidation event with correct values when all troves have ICR > 110% and Stability Pool covers a subset of troves (2360ms)
    ✓ batchLiquidateTroves(): emits liquidation event with correct values when all troves have ICR > 110% and Stability Pool covers a subset of troves, including a partial (2319ms)

  Contract: TroveManager
    ✓ liquidate(): closes a Trove that has ICR < MCR (1050ms)
    ✓ liquidate(): decreases ActivePool ETH and LUSDDebt by correct amounts (827ms)
    ✓ liquidate(): increases DefaultPool ETH and LUSD debt by correct amounts (792ms)
    ✓ liquidate(): removes the Trove's stake from the total stakes (794ms)
    ✓ liquidate(): Removes the correct trove from the TroveOwners array, and moves the last array element to the new empty slot (1950ms)
    ✓ liquidate(): updates the snapshots of total stakes and total collateral (820ms)
    ✓ liquidate(): updates the L_ETH and L_LUSDDebt reward-per-unit-staked totals (1599ms)
    ✓ liquidate(): Liquidates undercollateralized trove if there are two troves in the system (1044ms)
    ✓ liquidate(): reverts if trove is non-existent (836ms)
    ✓ liquidate(): reverts if trove has been closed (1173ms)
    ✓ liquidate(): does nothing if trove has >= 110% ICR (766ms)
    ✓ liquidate(): Given the same price and no other trove changes, complete Pool offsets restore the TCR to its value prior to the defaulters opening troves (3833ms)
    ✓ liquidate(): Pool offsets increase the TCR (3610ms)
    ✓ liquidate(): a pure redistribution reduces the TCR only as a result of compensation (3300ms)
    ✓ liquidate(): does not affect the SP deposit or ETH gain when called on an SP depositor's address that has no trove (1100ms)
    ✓ liquidate(): does not liquidate a SP depositor's trove with ICR > 110%, and does not affect their SP deposit or ETH gain (1193ms)
    ✓ liquidate(): liquidates a SP depositor's trove with ICR < 110%, and the liquidation correctly impacts their SP deposit and ETH gain (1551ms)
    ✓ liquidate(): does not alter the liquidated user's token balance (1446ms)
    ✓ liquidate(): liquidates based on entire/collateral debt (including pending rewards), not raw collateral/debt (2089ms)
    ✓ liquidate(): when SP > 0, triggers LQTY reward event - increases the sum G (1603ms)
    ✓ liquidate(): when SP is empty, doesn't update G (1848ms)
    ✓ liquidateTroves(): liquidates a Trove that a) was skipped in a previous liquidation and b) has pending rewards (2710ms)
    ✓ liquidateTroves(): closes every Trove with ICR < MCR, when n > number of undercollateralized troves (2991ms)
    ✓ liquidateTroves(): liquidates  up to the requested number of undercollateralized troves (1915ms)
    ✓ liquidateTroves(): does nothing if all troves have ICR > 110% (1297ms)
    ✓ liquidateTroves(): liquidates based on entire/collateral debt (including pending rewards), not raw collateral/debt (1631ms)
    ✓ liquidateTroves(): reverts if n = 0 (1230ms)
    ✓ liquidateTroves():  liquidates troves with ICR < MCR (2356ms)
    ✓ liquidateTroves(): does not affect the liquidated user's token balances (1392ms)
    ✓ liquidateTroves(): A liquidation sequence containing Pool offsets increases the TCR (3165ms)
    ✓ liquidateTroves(): A liquidation sequence of pure redistributions decreases the TCR, due to gas compensation, but up to 0.5% (2767ms)
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
