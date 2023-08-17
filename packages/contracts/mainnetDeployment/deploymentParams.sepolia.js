const externalAddrs = {
  // https://data.chain.link/ethereum/mainnet/crypto-usd/eth-usd
  CHAINLINK_ETHUSD_PROXY: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
  // https://data.chain.link/ethereum/mainnet/fiat/cny-usd
  CHAINLINK_CNYUSD_PROXY: "0x8A6af2B75F23831ADc973ce6288e5329F63D86c6",
  // https://docs.tellor.io/tellor/the-basics/contracts-reference
  TELLOR_MASTER: "0x199839a4907ABeC8240D119B606C98c405Bb0B33"
};

const liquityAddrs = {
  GENERAL_SAFE: "0x31b2Db93aa73375802893efB7a6e96F6AA62aF35", // to be passed to LQTYToken as the lp reserve address
  LQTY_SAFE: "0x7bC4B1F646cA17169C6ec01Ff924abee7a7C458a", // to be passed to LQTYToken as the LQTY multisig address
  COMMUNITY_SAFE: "0xc57AF29B9516CEAfB35d0a9A77d315ad29fbA96E",
  DEPLOYER: "0x621EE2Bf453Bb75114b1073705430fE125E0d9Bb" // Mainnet REAL deployment address
};

const merkleRoot = "0x8af3681f96bb109a6310baefb635252de69cd6b1e4be03fcdd8f5dfae6e3e154";

// Beneficiaries for lockup contracts.
const beneficiaries = {
  TEAM_RESERVE_1: "0x1d6C57655961C89D403A958A588053BFB3eEEDAb",
  TEAM_RESERVE_2: "0x1d6C57655961C89D403A958A588053BFB3eEEDAb",
  TEAM_RESERVE_3: "0x1d6C57655961C89D403A958A588053BFB3eEEDAb",
  TEAM_RESERVE_4: "0x1d6C57655961C89D403A958A588053BFB3eEEDAb",
  TEAM_RESERVE_5: "0x1d6C57655961C89D403A958A588053BFB3eEEDAb",
  TEAM_RESERVE_6: "0x1d6C57655961C89D403A958A588053BFB3eEEDAb",
  TEAM_RESERVE_7: "0x1d6C57655961C89D403A958A588053BFB3eEEDAb",
  TEAM_RESERVE_8: "0x1d6C57655961C89D403A958A588053BFB3eEEDAb",
  TEAM_RESERVE_9: "0x1d6C57655961C89D403A958A588053BFB3eEEDAb"
};

const OUTPUT_FILE = "./mainnetDeployment/sepoliaDeploymentOutput.json";

const delay = ms => new Promise(res => setTimeout(res, ms));

const waitFunction = async () => {
  return delay(90000); // wait 90s
};

const GAS_PRICE = 1000000000; // 1 gwei
const TX_CONFIRMATIONS = 1; // for mainnet

const ETHERSCAN_BASE_URL = "https://sepolia.etherscan.io/address";

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
