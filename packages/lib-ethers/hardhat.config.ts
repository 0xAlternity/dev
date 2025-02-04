import assert from "assert";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import "colors";

import { JsonFragment } from "@ethersproject/abi";
import { Signer, Overrides, Wallet } from "ethers";

import { task, HardhatUserConfig, types, extendEnvironment } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { deployAndSetupContracts, deployTellorCaller, setSilent } from "./utils/deploy";
import { _connectToContracts, _LiquityDeploymentJSON, _priceFeedIsTestnet } from "./src/contracts";

import accounts from "./accounts.json";
import { formatEther, parseUnits } from "ethers/lib/utils";

dotenv.config();

import "@nomiclabs/hardhat-ethers";

const numAccounts = 100;

const useLiveVersionEnv = (process.env.USE_LIVE_VERSION ?? "false").toLowerCase();
const useLiveVersion = !["false", "no", "0"].includes(useLiveVersionEnv);

const contractsDir = path.join("..", "contracts");
const artifacts = path.join(contractsDir, "artifacts");
const cache = path.join(contractsDir, "cache");

const contractsVersion = fs
  .readFileSync(path.join(useLiveVersion ? "live" : artifacts, "version"))
  .toString()
  .trim();

if (useLiveVersion) {
  console.log(`Using live version of contracts (${contractsVersion}).`.cyan);
}

const generateRandomAccounts = (numberOfAccounts: number) => {
  const accounts = new Array<string>(numberOfAccounts);

  for (let i = 0; i < numberOfAccounts; ++i) {
    accounts[i] = Wallet.createRandom().privateKey;
  }

  return accounts;
};

const deployerAccount = process.env.DEPLOYER_PRIVATE_KEY || Wallet.createRandom().privateKey;
const devChainRichAccount = "0x4d5db4107d237df6a3d58ee5f70ae63d73d7658d4026f2eefd2f204c81682cb7";

const alchemyApiKey = process.env.ALCHEMY_API_KEY || "";
const infuraApiKey = process.env.INFURA_API_KEY || "";

// ALTR Token distribution
const LP_REWARD_ADDRESS = process.env.LP_REWARD_ADDRESS || Wallet.createRandom().address;
const MULTISIG_ADDRESS = process.env.MULTISIG_ADDRESS || Wallet.createRandom().address;

// https://docs.chain.link/docs/ethereum-addresses
// https://docs.tellor.io/tellor/integration/reference-page

export type OracleConfig = {
  chainlinkEth: string;
  chainlinkCny: string;
  tellor: string;
};

export type OracleNetworkConfig = { [name: string]: OracleConfig };

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

const merkleRoot: { [name: string]: string } = {
  hardhat: "0xd0aa6a4e5b4e13462921d7518eebdb7b297a7877d6cfe078b0c318827392fb55",
  sepolia: "0x8af3681f96bb109a6310baefb635252de69cd6b1e4be03fcdd8f5dfae6e3e154",
  mainnet: "0x8af3681f96bb109a6310baefb635252de69cd6b1e4be03fcdd8f5dfae6e3e154"
};

const hasOracles = (network: string): boolean => network in oracleAddresses;

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      accounts: accounts.slice(0, 5),

      //gas: 12e6, // tx gas limit
      //blockGasLimit: 12e6,

      // Let Ethers throw instead of Buidler EVM
      // This is closer to what will happen in production
      throwOnCallFailures: false,
      throwOnTransactionFailures: false,
      forking: {
        url: `https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey}`,
        blockNumber: process.env.BLOCK_NUMBER ? parseInt(process.env.BLOCK_NUMBER) : 17712550
      }
    },
    dev: {
      url: "http://localhost:8545",
      accounts: [devChainRichAccount, ...generateRandomAccounts(numAccounts - 2)]
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${infuraApiKey}`,
      accounts: [deployerAccount]
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${infuraApiKey}`,
      accounts: [deployerAccount]
    }
  },

  paths: {
    artifacts,
    cache
  }
};

declare module "hardhat/types/runtime" {
  interface HardhatRuntimeEnvironment {
    deployLiquity: (
      deployer: Signer,
      distribution: [string, string],
      merkleRoot: string,
      useRealPriceFeed?: boolean,
      overrides?: Overrides
    ) => Promise<_LiquityDeploymentJSON>;
  }
}

const getLiveArtifact = (name: string): { abi: JsonFragment[]; bytecode: string } =>
  require(`./live/${name}.json`);

// const getContractFactory: (
//   env: HardhatRuntimeEnvironment
// ) => (name: string, signer?: Signer | FactoryOptions) => Promise<ContractFactory> = useLiveVersion
//   ? env => (name, signer) => {
//       const { abi, bytecode } = getLiveArtifact(name);
//       return env.ethers.getContractFactory(abi, bytecode, signer);
//     }
//   : env => env.ethers.getContractFactory;

const getContractFactory = (env: HardhatRuntimeEnvironment) => {
  return env.ethers.getContractFactory;
};

extendEnvironment(env => {
  env.deployLiquity = async (
    deployer,
    distribution,
    merkleRoot,
    useRealPriceFeed = false,
    overrides?: Overrides
  ) => {
    const deployment = await deployAndSetupContracts(
      deployer,
      distribution,
      merkleRoot,
      getContractFactory(env),
      !useRealPriceFeed,
      env.network.name === "dev",
      overrides
    );

    return { ...deployment, version: contractsVersion };
  };
});

type DeployParams = {
  channel: string;
  gas?: string;
};

const defaultChannel = process.env.CHANNEL || "default";

task("deploy", "Deploys the contracts to the network")
  .addOptionalParam("channel", "Deployment channel to deploy into", defaultChannel, types.string)
  .addOptionalParam("gas", "Price to pay for gas [Gwei]", undefined, types.string)
  .setAction(async ({ channel, gas }: DeployParams, env) => {
    const overrides = { gasPrice: gas ? parseUnits(gas, "gwei") : parseUnits("20", "gwei") };
    const [deployer] = await env.ethers.getSigners();

    const startBal = await deployer.getBalance();

    const real = env.network.name === "mainnet" || env.network.name === "hardhat";

    if (real && !hasOracles(env.network.name)) {
      throw new Error(`PriceFeed not supported on ${env.network.name}`);
    }

    setSilent(false);

    const deployment = await env.deployLiquity(
      deployer,
      [LP_REWARD_ADDRESS, MULTISIG_ADDRESS],
      merkleRoot[env.network.name],
      real,
      overrides
    );

    if (real) {
      const contracts = _connectToContracts(deployer, deployment);

      assert(!_priceFeedIsTestnet(contracts.priceFeed));

      const tellorCallerAddress = await deployTellorCaller(
        deployer,
        getContractFactory(env),
        oracleAddresses[env.network.name].tellor,
        overrides
      );

      console.log(`Hooking up PriceFeed with oracles ...`);

      const tx = await contracts.priceFeed.setAddresses(
        oracleAddresses[env.network.name].chainlinkEth,
        oracleAddresses[env.network.name].chainlinkCny,
        tellorCallerAddress,
        overrides
      );

      await tx.wait();
    }

    fs.mkdirSync(path.join("deployments", channel), { recursive: true });

    fs.writeFileSync(
      path.join("deployments", channel, `${env.network.name}.json`),
      JSON.stringify(deployment, undefined, 2)
    );

    console.log(deployment);
    const endBal = await deployer.getBalance();
    console.log("ETH to deploy: ", formatEther(startBal.sub(endBal)));
  });

export default config;
