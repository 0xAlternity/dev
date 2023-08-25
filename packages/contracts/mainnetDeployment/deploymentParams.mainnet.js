const externalAddrs = {
  // https://data.chain.link/ethereum/mainnet/crypto-usd/eth-usd
  CHAINLINK_ETHUSD_PROXY: "0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419",
  // https://data.chain.link/ethereum/mainnet/fiat/cny-usd
  CHAINLINK_CNYUSD_PROXY: "0xef8a4af35cd47424672e3c590abd37fbb7a7759a",
  // https://docs.tellor.io/tellor/the-basics/contracts-reference
  TELLOR_MASTER: "0xD9157453E2668B2fc45b7A803D3FEF3642430cC0"
};

const liquityAddrs = {
  GENERAL_SAFE: "0x31b2Db93aa73375802893efB7a6e96F6AA62aF35", // to be passed to LQTYToken as the lp reserve address
  LQTY_SAFE: "0x7bC4B1F646cA17169C6ec01Ff924abee7a7C458a", // to be passed to LQTYToken as the LQTY multisig address
  COMMUNITY_SAFE: "0xc57AF29B9516CEAfB35d0a9A77d315ad29fbA96E",
  DEPLOYER: "0x519CFcf99d525BA47b472fbC45Fb6e48BE1590Df" // Mainnet REAL deployment address
};

// Beneficiaries for lockup contracts.
const beneficiaries = {
  TEAM_RESERVE_1: "0x7bC4B1F646cA17169C6ec01Ff924abee7a7C458a",
  TEAM_RESERVE_2: "0x7bC4B1F646cA17169C6ec01Ff924abee7a7C458a",
  TEAM_RESERVE_3: "0x7bC4B1F646cA17169C6ec01Ff924abee7a7C458a",
  TEAM_RESERVE_4: "0x7bC4B1F646cA17169C6ec01Ff924abee7a7C458a",
  TEAM_RESERVE_5: "0x7bC4B1F646cA17169C6ec01Ff924abee7a7C458a",
  TEAM_RESERVE_6: "0x7bC4B1F646cA17169C6ec01Ff924abee7a7C458a",
  TEAM_RESERVE_7: "0x7bC4B1F646cA17169C6ec01Ff924abee7a7C458a",
  TEAM_RESERVE_8: "0x7bC4B1F646cA17169C6ec01Ff924abee7a7C458a",
  TEAM_RESERVE_9: "0x7bC4B1F646cA17169C6ec01Ff924abee7a7C458a"
};

const merkleRoot = "0x8af3681f96bb109a6310baefb635252de69cd6b1e4be03fcdd8f5dfae6e3e154";

const OUTPUT_FILE = "./mainnetDeployment/mainnetDeploymentOutput.json";

const delay = ms => new Promise(res => setTimeout(res, ms));
const waitFunction = async () => {
  return delay(90000); // wait 90s
};

const GAS_PRICE = 15_000_000_000;
const TX_CONFIRMATIONS = 1; // for mainnet

const ETHERSCAN_BASE_URL = "https://etherscan.io/address";

module.exports = {
  externalAddrs,
  liquityAddrs,
  merkleRoot,
  beneficiaries,
  OUTPUT_FILE,
  waitFunction,
  GAS_PRICE,
  TX_CONFIRMATIONS,
  ETHERSCAN_BASE_URL
};
