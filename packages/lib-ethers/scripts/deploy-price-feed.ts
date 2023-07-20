import hre from "hardhat";
import { OracleNetworkConfig } from "../src/types";

const oracleAddresses: OracleNetworkConfig = {
  hardhat: {
    chainlinkEth: "0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419",
    chainlinkCny: "0xef8a4af35cd47424672e3c590abd37fbb7a7759a",
    tellor: "0xD9157453E2668B2fc45b7A803D3FEF3642430cC0"
  },
  mainnet: {
    chainlinkEth: "0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419",
    chainlinkCny: "0xef8a4af35cd47424672e3c590abd37fbb7a7759a",
    tellor: "0xD9157453E2668B2fc45b7A803D3FEF3642430cC0"
  },
  polygon: {
    chainlinkEth: "0xf9680d99d6c9589e2a93a78a04a279e509205945",
    chainlinkCny: "0x04bb437aa63e098236fa47365f0268547f6eab32",
    tellor: "0xD9157453E2668B2fc45b7A803D3FEF3642430cC0" // Core
  }
};

async function main() {
  const { ethers, network } = hre;
  console.log("Deploy started...");

  const feeData = await ethers.provider.getFeeData();
  const maxPriorityFeePerGas = ethers.utils.parseUnits("50", "gwei");
  let maxFeePerGas = feeData.lastBaseFeePerGas || ethers.utils.parseUnits("100", "gwei");
  maxFeePerGas = maxFeePerGas.add(ethers.utils.parseUnits("30", "gwei"));
  maxFeePerGas = maxFeePerGas.add(maxPriorityFeePerGas);

  console.log("FeeData [maxFeePerGas]", maxFeePerGas.toString());
  console.log("FeeData [maxPriorityFeePerGas]", maxPriorityFeePerGas.toString());

  const overrides = {
    maxFeePerGas,
    maxPriorityFeePerGas,
    type: 2
  };

  const TellorCaller = await ethers.getContractFactory("TellorCaller");
  const PriceFeed = await ethers.getContractFactory("PriceFeed");
  const oracleConfig = oracleAddresses[network.name];

  const callerInstance = await TellorCaller.deploy(oracleConfig.tellor, overrides);
  const priceFeedInstance = await PriceFeed.deploy(overrides);

  await callerInstance.deployed();
  console.log("Tellor Called deployed", callerInstance.address);
  await priceFeedInstance.deployed();
  console.log("PriceFeed deployed", priceFeedInstance.address);

  const connectTx = await priceFeedInstance.setAddresses(
    oracleConfig.chainlinkEth,
    oracleConfig.chainlinkCny,
    callerInstance.address,
    overrides
  );
  console.log("PriceFeed connected", connectTx.hash);

  // Fetch last price from oracles
  await priceFeedInstance.fetchPrice(overrides);
  const lastGoodPrice = await priceFeedInstance.lastGoodPrice();
  const status = await priceFeedInstance.status();
  console.log("Price =", ethers.utils.formatEther(lastGoodPrice));
  console.log("Status =", status.toString());

  const ethQueryId = await priceFeedInstance.ETHUSD_TELLOR_REQ_ID();
  const cnyQueryId = await priceFeedInstance.CNYUSD_TELLOR_REQ_ID();
  console.log("Tellor ETH/USD requestId =", ethQueryId.toString());
  console.log("Tellor CNY/USD requestId =", cnyQueryId.toString());

  const currentEthValue = await callerInstance.getTellorCurrentValue(ethQueryId);
  const currentCnyValue = await callerInstance.getTellorCurrentValue(cnyQueryId);

  console.log(
    "Current Tellor ETH/USD value",
    currentEthValue[0],
    ethers.utils.formatEther(currentEthValue[1]),
    new Date(parseInt(currentEthValue[2].toString()) * 1000)
  );
  console.log(
    "Current Tellor CNY/USD value",
    currentCnyValue[0],
    ethers.utils.formatEther(currentCnyValue[1]),
    new Date(parseInt(currentCnyValue[2].toString()) * 1000)
  );
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
