const deploymentHelper = require("../utils/deploymentHelpers.js");
const testHelpers = require("../utils/testHelpers.js");
const { dec, toBN, logBN, assertRevert } = testHelpers.TestHelper;

const TroveManagerTester = artifacts.require("TroveManagerTester");
const LUSDToken = artifacts.require("LUSDToken");

// Generated merkle root for input:
/*
{
  "decimals": 18,
  "airdrop": {
    "0x1b1e98f4912ae9014064a70537025ef338e6ad67": 100,
    "0x1b1e98f4912ae9014064a70537025ef338e6ad68": 100
  }
}
*/

const MERKLE_ROOT = "0xd7b614454443e16f1e76ffc060d8ddbad30c0ce42f73aefee6cef80646e7da58";
const ALICE_VALID_PROOF = ["0xacb535b4322d98e720f80e3d4a11c5ce0e40883a4f2efe722dbfc46296cfcb87"];
const ALICE_INVALID_PROOF = ["0xacb535b4322d98e720f80e3d4a11c5ce0e40883a4f2efe722dbfc46296cfcb88"];
const ALICE_AMOUNT = dec(100, 18);

contract("MerkleDistributor", async accounts => {
  const [owner, alice, bob] = accounts;

  const [lpRewardsAddress, multisig] = accounts.slice(998, 1000);

  let contracts;
  let lqtyToken;
  let merkleDistributor;
  let gasPriceInWei;

  describe("MerkleDistributor", async () => {
    before(async () => {
      gasPriceInWei = await web3.eth.getGasPrice();
    });

    beforeEach(async () => {
      contracts = await deploymentHelper.deployLiquityCore();
      contracts.troveManager = await TroveManagerTester.new();
      contracts.lusdToken = await LUSDToken.new(
        contracts.troveManager.address,
        contracts.stabilityPool.address,
        contracts.borrowerOperations.address
      );

      hre.tracer.nameTags[contracts.merkleDistributor.address] = "Airdrop";
      hre.tracer.nameTags[lpRewardsAddress] = "LPRewards";
      hre.tracer.nameTags[multisig] = "Multisig";
      hre.tracer.nameTags[alice] = "Alice";
      hre.tracer.nameTags[bob] = "Bob";

      const LQTYContracts = await deploymentHelper.deployLQTYContracts(
        contracts.merkleDistributor.address,
        lpRewardsAddress,
        multisig
      );

      lqtyToken = LQTYContracts.lqtyToken;
      merkleDistributor = contracts.merkleDistributor;

      await deploymentHelper.connectLQTYContracts(LQTYContracts);
      await deploymentHelper.connectCoreContracts(contracts, LQTYContracts);
      await deploymentHelper.connectLQTYContractsToCore(LQTYContracts, contracts);
      await deploymentHelper.connectMerkleDistributor(
        merkleDistributor,
        lqtyToken.address,
        MERKLE_ROOT
      );
    });

    it("Allow Alice to claim 100e18 tokens", async () => {
      let aliceBalance = await lqtyToken.balanceOf(alice);
      assert.equal(aliceBalance, 0);
      await merkleDistributor.claim(alice, ALICE_AMOUNT, ALICE_VALID_PROOF, { from: alice });
      aliceBalance = await lqtyToken.balanceOf(alice);
      assert.equal(aliceBalance, ALICE_AMOUNT);
    });

    it("Prevent Alice from claiming twice", async () => {
      await merkleDistributor.claim(alice, ALICE_AMOUNT, ALICE_VALID_PROOF, { from: alice });
      const claimPromise = merkleDistributor.claim(alice, ALICE_AMOUNT, ALICE_VALID_PROOF, {
        from: alice
      });
      await assertRevert(claimPromise, "MerkleDistributor: Already claimed");
    });

    it("Prevent Alice from claiming with invalid proof", async () => {
      const claimPromise = merkleDistributor.claim(alice, ALICE_AMOUNT, ALICE_INVALID_PROOF, {
        from: alice
      });
      await assertRevert(claimPromise, "MerkleDistributor: Invalid proof");
    });

    it("Prevent Alice from claiming with invalid amount", async () => {
      const claimPromise = merkleDistributor.claim(alice, dec(1000, 18), ALICE_VALID_PROOF, {
        from: alice
      });
      await assertRevert(claimPromise, "MerkleDistributor: Invalid proof");
    });

    it("Prevent Bob from claiming", async () => {
      const claimPromise = merkleDistributor.claim(bob, ALICE_AMOUNT, ALICE_VALID_PROOF, {
        from: bob
      });
      await assertRevert(claimPromise, "MerkleDistributor: Invalid proof");
    });

    it("Let Bob claim on behalf of Alice", async () => {
      await merkleDistributor.claim(alice, ALICE_AMOUNT, ALICE_VALID_PROOF, {
        from: bob
      });
      assert.equal(await lqtyToken.balanceOf(alice), ALICE_AMOUNT);
      assert.equal(await lqtyToken.balanceOf(bob), 0);
    });
  });
});

contract("Reset chain state", async accounts => {});
