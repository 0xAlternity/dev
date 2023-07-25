const externalAddrs = {
  // https://data.chain.link/ethereum/mainnet/crypto-usd/eth-usd
  CHAINLINK_ETHUSD_PROXY: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
  // https://data.chain.link/ethereum/mainnet/fiat/cny-usd
  CHAINLINK_CNYUSD_PROXY: "0x8A6af2B75F23831ADc973ce6288e5329F63D86c6",
  // https://docs.tellor.io/tellor/the-basics/contracts-reference
  TELLOR_MASTER: "0x199839a4907ABeC8240D119B606C98c405Bb0B33"
};

const liquityAddrs = {
  GENERAL_SAFE: "0x51379bb4f1F146004Dd2D7099c7638260Fc7521e", // to be passed to LQTYToken as the bounties/hackathons address
  LQTY_SAFE: "0x1d6C57655961C89D403A958A588053BFB3eEEDAb", // to be passed to LQTYToken as the LQTY multisig address
  DEPLOYER: "0x621EE2Bf453Bb75114b1073705430fE125E0d9Bb" // Mainnet REAL deployment address
};

const merkleRoot = "0x06adb08ff15350a67439b5c7bee129ee60c38c3c9be715599b9e1a308731b259";

// Beneficiaries for lockup contracts.
const beneficiaries = {
  COMMUNITY_RESERVE: "0x51379bb4f1F146004Dd2D7099c7638260Fc7521e",
  TEAM_RESERVE: "0x1d6C57655961C89D403A958A588053BFB3eEEDAb"
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
