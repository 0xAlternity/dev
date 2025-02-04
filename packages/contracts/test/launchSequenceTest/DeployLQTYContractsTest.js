const deploymentHelper = require("../../utils/deploymentHelpers.js")
const testHelpers = require("../../utils/testHelpers.js")
const CommunityIssuance = artifacts.require("./CommunityIssuance.sol")


const th = testHelpers.TestHelper
const timeValues = testHelpers.TimeValues
const assertRevert = th.assertRevert
const toBN = th.toBN
const dec = th.dec

contract('Deploying the LQTY contracts: LCF, CI, LQTYStaking, and LQTYToken ', async accounts => {
  const [liquityAG, A, B] = accounts;
  const [bountyAddress, lpRewardsAddress, multisig] = accounts.slice(997, 1000)

  let LQTYContracts

  const oneMillion = toBN(1000000)
  const digits = toBN(1e18)
  const fifty = toBN(50)
  const expectedCISupplyCap = fifty.mul(oneMillion).mul(digits)

  beforeEach(async () => {
    // Deploy all contracts from the first account
    LQTYContracts = await deploymentHelper.deployLQTYContracts(bountyAddress, lpRewardsAddress, multisig)
    await deploymentHelper.connectLQTYContracts(LQTYContracts)

    lqtyStaking = LQTYContracts.lqtyStaking
    lqtyToken = LQTYContracts.lqtyToken
    communityIssuance = LQTYContracts.communityIssuance
    lockupContractFactory = LQTYContracts.lockupContractFactory

    //LQTY Staking and CommunityIssuance have not yet had their setters called, so are not yet
    // connected to the rest of the system
  })


  describe('CommunityIssuance deployment', async accounts => {
    it("Stores the deployer's address", async () => {
      const storedDeployerAddress = await communityIssuance.owner()

      assert.equal(liquityAG, storedDeployerAddress)
    })
  })

  describe('LQTYStaking deployment', async accounts => {
    it("Stores the deployer's address", async () => {
      const storedDeployerAddress = await lqtyStaking.owner()

      assert.equal(liquityAG, storedDeployerAddress)
    })
  })

  describe('LQTYToken deployment', async accounts => {
    it("Stores the multisig's address", async () => {
      const storedMultisigAddress = await lqtyToken.multisigAddress()

      assert.equal(multisig, storedMultisigAddress)
    })

    it("Stores the CommunityIssuance address", async () => {
      const storedCIAddress = await lqtyToken.communityIssuanceAddress()

      assert.equal(communityIssuance.address, storedCIAddress)
    })

    it("Stores the LockupContractFactory address", async () => {
      const storedLCFAddress = await lqtyToken.lockupContractFactory()

      assert.equal(lockupContractFactory.address, storedLCFAddress)
    })

    it("Mints the correct LQTY amount to the multisig's address: 25 million", async () => {
      const multisigLQTYEntitlement = await lqtyToken.balanceOf(multisig)
      //(100 - 5 - 50 - 20) million = 25 million
      assert.equal(multisigLQTYEntitlement, dec(25_000_000, 18))
    })

    it("Mints the correct LQTY amount to the CommunityIssuance contract address: 50 million", async () => {
      const communityLQTYEntitlement = await lqtyToken.balanceOf(communityIssuance.address)
      assert.equal(communityLQTYEntitlement, dec(50_000_000, 18))
    })

    it("Mints the correct LQTY amount to the bountyAddress EOA: 5 million", async () => {
      const bountyAddressBal = await lqtyToken.balanceOf(bountyAddress)
      assert.equal(bountyAddressBal, dec(5_000_000, 18))
    })

    it("Mints the correct LQTY amount to the lpRewardsAddress EOA: 20 million", async () => {
      const lpRewardsAddressBal = await lqtyToken.balanceOf(lpRewardsAddress)
      assert.equal(lpRewardsAddressBal, dec(20_000_000, 18))
    })
  })

  describe('Community Issuance deployment', async accounts => {
    it("Stores the deployer's address", async () => {

      const storedDeployerAddress = await communityIssuance.owner()

      assert.equal(storedDeployerAddress, liquityAG)
    })

    it("Has a supply cap of 32 million", async () => {
      const supplyCap = await communityIssuance.LQTYSupplyCap()

      assert.isTrue(expectedCISupplyCap.eq(supplyCap))
    })

    it("Liquity AG can set addresses if CI's LQTY balance is equal or greater than 50 million ", async () => {
      const LQTYBalance = await lqtyToken.balanceOf(communityIssuance.address)
      assert.isTrue(LQTYBalance.eq(expectedCISupplyCap))

      // Deploy core contracts, just to get the Stability Pool address
      const coreContracts = await deploymentHelper.deployLiquityCore()

      const tx = await communityIssuance.setAddresses(
        lqtyToken.address,
        coreContracts.stabilityPool.address,
        { from: liquityAG }
      );
      assert.isTrue(tx.receipt.status)
    })

    it("Liquity AG can't set addresses if CI's LQTY balance is < 50 million ", async () => {
      const newCI = await CommunityIssuance.new()

      const LQTYBalance = await lqtyToken.balanceOf(newCI.address)
      assert.equal(LQTYBalance, '0')

      // Deploy core contracts, just to get the Stability Pool address
      const coreContracts = await deploymentHelper.deployLiquityCore()

      await th.fastForwardTime(timeValues.SECONDS_IN_ONE_YEAR, web3.currentProvider)
      // transfer from lpRewards to multisig as it's not enough tokens for this test in multisig
      await lqtyToken.transfer(multisig, dec(20_000_000, 18), {from: lpRewardsAddress})
      await lqtyToken.transfer(newCI.address, '31999999999999999999999999', {from: multisig}) // 1e-18 less than CI expects (32 million)

      try {
        const tx = await newCI.setAddresses(
          lqtyToken.address,
          coreContracts.stabilityPool.address,
          { from: liquityAG }
        );
      
        // Check it gives the expected error message for a failed Solidity 'assert'
      } catch (err) {
        assert.include(err.message, "invalid opcode")
      }
    })
  })

  describe('Connecting LQTYToken to LCF, CI and LQTYStaking', async accounts => {
    it('sets the correct LQTYToken address in LQTYStaking', async () => {
      // Deploy core contracts and set the LQTYToken address in the CI and LQTYStaking
      const coreContracts = await deploymentHelper.deployLiquityCore()
      await deploymentHelper.connectLQTYContractsToCore(LQTYContracts, coreContracts)

      const lqtyTokenAddress = lqtyToken.address

      const recordedLQTYTokenAddress = await lqtyStaking.lqtyToken()
      assert.equal(lqtyTokenAddress, recordedLQTYTokenAddress)
    })

    it('sets the correct LQTYToken address in LockupContractFactory', async () => {
      const lqtyTokenAddress = lqtyToken.address

      const recordedLQTYTokenAddress = await lockupContractFactory.lqtyTokenAddress()
      assert.equal(lqtyTokenAddress, recordedLQTYTokenAddress)
    })

    it('sets the correct LQTYToken address in CommunityIssuance', async () => {
      // Deploy core contracts and set the LQTYToken address in the CI and LQTYStaking
      const coreContracts = await deploymentHelper.deployLiquityCore()
      await deploymentHelper.connectLQTYContractsToCore(LQTYContracts, coreContracts)

      const lqtyTokenAddress = lqtyToken.address

      const recordedLQTYTokenAddress = await communityIssuance.lqtyToken()
      assert.equal(lqtyTokenAddress, recordedLQTYTokenAddress)
    })
  })
})
