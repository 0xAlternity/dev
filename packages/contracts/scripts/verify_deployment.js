const hre = require("hardhat");
const sepolia = require("../../lib-ethers/deployments/sepolia.json");
const mainnet = require("../../lib-ethers/deployments/mainnet.json");

const deployments = {
  ...(sepolia !== null ? { [sepolia.chainId]: sepolia } : {}),
  ...(mainnet !== null ? { [mainnet.chainId]: mainnet } : {})
};

async function main() {
  const { network, run } = hre;

  if (!network.config.chainId) {
    throw new Error("Unsupported network.");
  }

  const chainId = network.config.chainId;

  console.info(`Verification started for network [${chainId}]...`);

  const deployment = deployments[chainId];

  if (!deployment) {
    throw new Error("Unsupported deployment.");
  }

  const contracts = deployment.addresses;

  const lqtyTokenArgs = [
    contracts.communityIssuance,
    contracts.lqtyStaking,
    contracts.lockupContractFactory,
    contracts.merkleDistributor,
    "",
    ""
  ];

  // ActivePool
  try {
    console.info(`Verifing ActivePool [${contracts.activePool}]...`);
    await run("verify:verify", {
      address: contracts.activePool,
      contract: "contracts/ActivePool.sol:ActivePool",
      constructorArguments: [],
      noCompile: true
    });
    console.info("---------------- Done.");
  } catch (err) {
    console.error(err);
  }

  //BorrowerOperations
  try {
    console.info(`Verifing BorrowerOperations at ${contracts.borrowerOperations}`);
    await run("verify:verify", {
      address: contracts.borrowerOperations,
      contract: "contracts/BorrowerOperations.sol:BorrowerOperations",
      constructorArguments: [],
      noCompile: true
    });
    console.info("---------------- Done.");
  } catch (err) {
    console.error(err);
  }

  //TroveManager
  try {
    console.info(`Verifing TroveManager at ${contracts.troveManager}`);
    await run("verify:verify", {
      address: contracts.troveManager,
      contract: "contracts/TroveManager.sol:TroveManager",
      constructorArguments: [],
      noCompile: true
    });
    console.info("---------------- Done.");
  } catch (err) {
    console.error(err);
  }

  //СollSurplusPool
  try {
    console.info(`Verifing СollSurplusPool at ${contracts.collSurplusPool}`);
    await run("verify:verify", {
      address: contracts.collSurplusPool,
      contract: "contracts/СollSurplusPool.sol:СollSurplusPool",
      constructorArguments: [],
      noCompile: true
    });
    console.info("---------------- Done.");
  } catch (err) {
    console.error(err);
  }

  //СommunityIssuance
  try {
    console.info(`Verifing CommunityIssuance at ${contracts.communityIssuance}`);
    await run("verify:verify", {
      address: contracts.communityIssuance,
      contract: "contracts/LQTY/CommunityIssuance.sol:CommunityIssuance",
      constructorArguments: [],
      noCompile: true
    });
    console.info("---------------- Done.");
  } catch (err) {
    console.error(err);
  }

  //DefaultPool
  try {
    console.info(`Verifing DefaultPool at ${contracts.defaultPool}`);
    await run("verify:verify", {
      address: contracts.defaultPool,
      contract: "contracts/DefaultPool.sol:DefaultPool",
      constructorArguments: [],
      noCompile: true
    });
    console.info("---------------- Done.");
  } catch (err) {
    console.error(err);
  }

  //HintHelpers
  try {
    console.info(`Verifing HintHelpers at ${contracts.hintHelpers}`);
    await run("verify:verify", {
      address: contracts.hintHelpers,
      contract: "contracts/HintHelpers.sol:HintHelpers",
      constructorArguments: [],
      noCompile: true
    });
    console.info("---------------- Done.");
  } catch (err) {
    console.error(err);
  }

  //LockupContractFactory
  try {
    console.info(`Verifing LockupContractFactory at ${contracts.lockupContractFactory}`);
    await run("verify:verify", {
      address: contracts.lockupContractFactory,
      contract: "contracts/LQTY/LockupContractFactory.sol:LockupContractFactory",
      constructorArguments: [],
      noCompile: true
    });
    console.info("---------------- Done.");
  } catch (err) {
    console.error(err);
  }

  //LQTYStaking
  try {
    console.info(`Verifing LQTYStaking at ${contracts.lqtyStaking}`);
    await run("verify:verify", {
      address: contracts.lqtyStaking,
      contract: "contracts/LQTY/LQTYStaking.sol:LQTYStaking",
      constructorArguments: [],
      noCompile: true
    });
    console.info("---------------- Done.");
  } catch (err) {
    console.error(err);
  }

  //PriceFeed
  try {
    console.info(`Verifing PriceFeed at ${contracts.priceFeed}`);
    await run("verify:verify", {
      address: contracts.priceFeed,
      contract: deployment._priceFeedIsTestnet
        ? "contracts/TestContracts/PriceFeedTestnet.sol:PriceFeedTestnet"
        : "contracts/PriceFeed.sol:PriceFeed",
      constructorArguments: [],
      noCompile: true
    });
    console.info("---------------- Done.");
  } catch (err) {
    console.error(err);
  }

  //SortedTroves
  try {
    console.info(`Verifing SortedTroves at ${contracts.sortedTroves}`);
    await run("verify:verify", {
      address: contracts.sortedTroves,
      contract: "contracts/SortedTroves.sol:SortedTroves",
      constructorArguments: [],
      noCompile: true
    });
    console.info("---------------- Done.");
  } catch (err) {
    console.error(err);
  }

  //StabilityPool
  try {
    console.info(`Verifing StabilityPool at ${contracts.stabilityPool}`);
    await run("verify:verify", {
      address: contracts.stabilityPool,
      contract: "contracts/StabilityPool.sol:StabilityPool",
      constructorArguments: [],
      noCompile: true
    });
    console.info("---------------- Done.");
  } catch (err) {
    console.error(err);
  }

  //GasPool
  try {
    console.info(`Verifing GasPool at ${contracts.gasPool}`);
    await run("verify:verify", {
      address: contracts.gasPool,
      contract: "contracts/GasPool.sol:GasPool",
      constructorArguments: [],
      noCompile: true
    });
    console.info("---------------- Done.");
  } catch (err) {
    console.error(err);
  }

  //MerkleDistributor
  try {
    console.info(`Verifing MerkleDistributor at ${contracts.merkleDistributor}`);
    await run("verify:verify", {
      address: contracts.merkleDistributor,
      contract: "contracts/Airdrop/MerkleDistributor.sol:MerkleDistributor",
      constructorArguments: [],
      noCompile: true
    });
    console.info("---------------- Done.");
  } catch (err) {
    console.error(err);
  }

  //LUSDToken
  try {
    console.info(`Verifing LUSDToken at ${contracts.lusdToken}`);
    await run("verify:verify", {
      address: contracts.lusdToken,
      contract: "contracts/LUSDToken.sol:LUSDToken",
      constructorArguments: [
        contracts.troveManager,
        contracts.stabilityPool,
        contracts.borrowerOperations
      ],
      noCompile: true
    });
    console.info("---------------- Done.");
  } catch (err) {
    console.error(err);
  }

  //LQTYToken
  try {
    console.info(`Verifing LQTYToken at ${contracts.lqtyToken}`);
    await run("verify:verify", {
      address: contracts.lqtyToken,
      contract: "contracts/LQTY/LQTYToken.sol:LQTYToken",
      constructorArguments: lqtyTokenArgs,
      noCompile: true
    });
    console.info("---------------- Done.");
  } catch (err) {
    console.error(err);
  }

  //MultiTroveGetter
  try {
    console.info(`Verifing MultiTroveGetter at ${contracts.multiTroveGetter}`);
    await run("verify:verify", {
      address: contracts.multiTroveGetter,
      contract: "contracts/MultiTroveGetter.sol:MultiTroveGetter",
      constructorArguments: [contracts.troveManager, contracts.sortedTroves],
      noCompile: true
    });
    console.info("---------------- Done.");
  } catch (err) {
    console.error(err);
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
