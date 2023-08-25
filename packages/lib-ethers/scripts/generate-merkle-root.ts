import { parseUnits } from "ethers/lib/utils";
import { getAddress } from "@ethersproject/address";
import hre from "hardhat";

import fs from "fs";
import path from "path";
import { _LiquityAirdropJSON, _generateTree } from "../src/_Airdrop";

function throwErrorAndExit(error: string): void {
  console.error(error);
  process.exit(1);
}
type RawAirdropConfig = Record<string, string>[];

type KeySelector<T> = (item: T) => string;

function arrayToObject<T, K>(array: Iterable<T>, keySelector: KeySelector<T>): Record<string, T> {
  return Array.from(array).reduce(
    (acc, item) => Object.assign(acc, { [keySelector(item)]: item }),
    {}
  );
}

async function main() {
  const { network } = hre;

  const airdropRawConfigPath: string = path.join(
    __dirname,
    "..",
    "airdrop",
    `${network.name}.raw.json`
  );

  if (!fs.existsSync(airdropRawConfigPath)) {
    throwErrorAndExit(`Missing airdrop raw config: ${network.name}.json`);
  }

  // Read raw config
  const rawConfigFile: Buffer = await fs.readFileSync(airdropRawConfigPath);
  const rawConfigData = JSON.parse(rawConfigFile.toString()) as RawAirdropConfig;

  if (!rawConfigData.length) {
    throwErrorAndExit("Empty config");
  }

  // read data, uniq address and sum amount + convert to wei
  const data = rawConfigData.reduce((result: Record<string, number>, cur) => {
    const address = cur[0];
    const value = parseFloat(cur[1]);
    if (!result[address]) {
      // console.log(`Address not found, adding ${address}:${value}`);
      result = { ...result, [address]: value };
    } else {
      result = { ...result, [address]: result[address] + value };
      // console.log(`+++ Address found, summing ${address}:${result[address] + value}`);
    }

    return result;
  }, {} as Record<string, number>);

  // console.log(data);

  const recipients = Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .reduce(
      (acc: Record<string, string>, [account, amount]) => ({
        ...acc,
        [getAddress(account)]: parseUnits(amount.toString(), 18).toString()
      }),
      {} as Record<string, string>
    );

  // const sum = Object.entries(data).reduce((acc, [address, amount]) => {
  //   return acc + parseFloat(amount as string);
  // }, 0.0);

  // console.log(sum);

  const airdropConfigPath: string = path.join(__dirname, "..", "airdrop", `${network.name}.json`);

  if (!fs.existsSync(airdropConfigPath)) {
    throwErrorAndExit(`Missing airdrop config: ${network.name}.json`);
  }

  // Read config
  const configFile: Buffer = await fs.readFileSync(airdropConfigPath);
  const configData = JSON.parse(configFile.toString());
  configData.recipients = recipients;

  const merkleTree = _generateTree(recipients);
  const merkleRoot: string = merkleTree.getHexRoot();
  configData.merkleRoot = merkleRoot;
  console.info(`Generated Merkle root: [${merkleRoot}]`);

  await fs.writeFileSync(airdropConfigPath, JSON.stringify(configData, undefined, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
