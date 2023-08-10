import hre from "hardhat";

import fs from "fs";
import path from "path";
import { _generateTree } from "../src/_Airdrop";

function throwErrorAndExit(error: string): void {
  console.error(error);
  process.exit(1);
}

async function main() {
  const { network } = hre;

  const airdropConfigPath: string = path.join(__dirname, "..", "airdrop", `${network.name}.json`);

  if (!fs.existsSync(airdropConfigPath)) {
    throwErrorAndExit(`Missing airdrop config: ${network.name}.json`);
  }

  // Read config
  const configFile: Buffer = await fs.readFileSync(airdropConfigPath);
  const configData = JSON.parse(configFile.toString());

  if (configData["recipients"] === undefined) {
    throwErrorAndExit("Missing recipients param in config");
  }

  if (configData["merkleRoot"] !== undefined) {
    throwErrorAndExit("MerkleRoot already generated");
  }

  const merkleTree = _generateTree(configData["recipients"]);
  const merkleRoot: string = merkleTree.getHexRoot();
  configData.merkleRoot = merkleRoot;
  console.info(`Generated Merkle root: [${merkleRoot}]`);

  await fs.writeFileSync(airdropConfigPath, JSON.stringify(configData, undefined, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
