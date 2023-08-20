const LockupContract = artifacts.require("./LockupContract.sol");

const deploymentHelper = require("../../utils/deploymentHelpers.js");
const testHelpers = require("../../utils/testHelpers.js");

const th = testHelpers.TestHelper;
const timeValues = testHelpers.TimeValues;
const { dec, toBN, assertRevert, logBN } = th;

const _1_month = toBN(timeValues.SECONDS_IN_ONE_MONTH);

contract("Deploying and funding One Year Lockup Contracts", async accounts => {
  const [liquityAG, A, B, C, D, E, F, G, H, I, J] = accounts;

  const [bountyAddress, lpRewardsAddress, multisig] = accounts.slice(997, 1000);

  const SECONDS_IN_ONE_MONTH = timeValues.SECONDS_IN_ONE_MONTH;

  let LQTYContracts;

  // 1e24 = 1 million tokens with 18 decimal digits
  const LQTYEntitlement_A = dec(150_000, 18); // 150k for 15 months, 10k per month
  const LQTYEntitlement_B = dec(300_000, 18); // 300k for 30 months, 10k per month

  let lqtyToken;
  let lockupContractFactory;

  let deploymentTime;
  let _15M;
  let _30M;
  let _1MReward;

  beforeEach(async () => {
    // Deploy all contracts from the first account
    LQTYContracts = await deploymentHelper.deployLQTYContracts(
      bountyAddress,
      lpRewardsAddress,
      multisig
    );
    await deploymentHelper.connectLQTYContracts(LQTYContracts);

    lqtyToken = LQTYContracts.lqtyToken;
    lockupContractFactory = LQTYContracts.lockupContractFactory;

    deploymentTime = await lockupContractFactory.deploymentTime();
    _15M = _1_month.mul(toBN(15));
    _30M = _1_month.mul(toBN(30));
    _1MReward = toBN(dec(10_000, 18));
  });

  // --- LCs ---

  describe("LC: Token release schedule", async accounts => {
    it("15 months vesting schedule", async () => {
      const deployedLCtx = await lockupContractFactory.deployLockupContract(A, _15M, {
        from: liquityAG
      });
      const LC_A = await th.getLCFromDeploymentTx(deployedLCtx);
      await lqtyToken.transfer(LC_A.address, LQTYEntitlement_A, { from: multisig });

      //1st month pass
      th.fastForwardTime(SECONDS_IN_ONE_MONTH, web3.currentProvider);
      await LC_A.release(lqtyToken.address, { from: A });
      let cumReward = await lqtyToken.balanceOf(A);
      th.assertIsApproximatelyEqual(_1MReward, cumReward, Number(dec(1, 17)));

      //2nd month pass
      th.fastForwardTime(SECONDS_IN_ONE_MONTH, web3.currentProvider);
      await LC_A.release(lqtyToken.address, { from: A });
      cumReward = await lqtyToken.balanceOf(A);
      th.assertIsApproximatelyEqual(_1MReward.mul(toBN(2)), cumReward, Number(dec(1, 17)));

      //3rd month pass
      th.fastForwardTime(SECONDS_IN_ONE_MONTH, web3.currentProvider);
      await LC_A.release(lqtyToken.address, { from: A });
      cumReward = await lqtyToken.balanceOf(A);
      th.assertIsApproximatelyEqual(_1MReward.mul(toBN(3)), cumReward, Number(dec(1, 17)));

      //16th month pass
      th.fastForwardTime(SECONDS_IN_ONE_MONTH * 13, web3.currentProvider);
      await LC_A.release(lqtyToken.address, { from: A });
      cumReward = await lqtyToken.balanceOf(A);
      th.assertIsApproximatelyEqual(LQTYEntitlement_A, cumReward);
    });

    it("30 months vesting schedule", async () => {
      const deployedLCtx = await lockupContractFactory.deployLockupContract(A, _30M, {
        from: liquityAG
      });
      const LC_A = await th.getLCFromDeploymentTx(deployedLCtx);

      await lqtyToken.transfer(LC_A.address, LQTYEntitlement_B, { from: multisig });

      //1st month pass
      th.fastForwardTime(SECONDS_IN_ONE_MONTH, web3.currentProvider);
      await LC_A.release(lqtyToken.address, { from: A });
      let cumReward = await lqtyToken.balanceOf(A);
      th.assertIsApproximatelyEqual(_1MReward, cumReward, Number(dec(1, 17)));

      //6nd month pass
      th.fastForwardTime(SECONDS_IN_ONE_MONTH * 5, web3.currentProvider);
      await LC_A.release(lqtyToken.address, { from: A });
      cumReward = await lqtyToken.balanceOf(A);
      th.assertIsApproximatelyEqual(_1MReward.mul(toBN(6)), cumReward, Number(dec(1, 17)));

      //12rd month pass
      th.fastForwardTime(SECONDS_IN_ONE_MONTH * 6, web3.currentProvider);
      await LC_A.release(lqtyToken.address, { from: A });
      cumReward = await lqtyToken.balanceOf(A);
      th.assertIsApproximatelyEqual(_1MReward.mul(toBN(12)), cumReward, Number(dec(1, 17)));

      //31th month pass
      th.fastForwardTime(SECONDS_IN_ONE_MONTH * 19, web3.currentProvider);
      await LC_A.release(lqtyToken.address, { from: A });
      cumReward = await lqtyToken.balanceOf(A);
      th.assertIsApproximatelyEqual(LQTYEntitlement_B, cumReward);
    });
  });

  describe("LC: Benificiary changes", async accounts => {
    it("Owner can change beneficiary", async () => {
      const deployedLCtx = await lockupContractFactory.deployLockupContract(A, _15M, {
        from: liquityAG
      });
      const LC_A = await th.getLCFromDeploymentTx(deployedLCtx);
      await lqtyToken.transfer(LC_A.address, LQTYEntitlement_A, { from: multisig });

      //1st month pass
      th.fastForwardTime(SECONDS_IN_ONE_MONTH, web3.currentProvider);
      await LC_A.release(lqtyToken.address, { from: A });
      let cumReward = await lqtyToken.balanceOf(A);
      th.assertIsApproximatelyEqual(_1MReward, cumReward, Number(dec(1, 17)));

      //change beneficiary to B
      await LC_A.updateBeneficiary(B, { from: liquityAG });
      //renounce ownership
      await LC_A.renounceOwnership({ from: liquityAG });

      //2nd month pass
      th.fastForwardTime(SECONDS_IN_ONE_MONTH, web3.currentProvider);
      await LC_A.release(lqtyToken.address, { from: B });
      cumReward = await lqtyToken.balanceOf(B);
      th.assertIsApproximatelyEqual(_1MReward, cumReward, Number(dec(1, 17)));
    });
  });
});
