import fs from "fs";
import path from "path";
import MerkleTree from "merkletreejs";
import { getAddress, parseUnits, solidityKeccak256, keccak256 } from "ethers/lib/utils";

const outputPath: string = path.join(__dirname, "./merkle.json");

type AirdropRecipient = {
  address: string;
  value: string;
};

export default class Generator {
  recipients: AirdropRecipient[] = [];

  constructor(decimals: number, airdrop: Record<string, number>) {
    for (const [address, tokens] of Object.entries(airdrop)) {
      this.recipients.push({
        address: getAddress(address),
        value: parseUnits(tokens.toString(), decimals).toString()
      });
    }
  }

  generateLeaf(address: string, value: string): Buffer {
    return Buffer.from(solidityKeccak256(["address", "uint256"], [address, value]).slice(2), "hex");
  }

  async process(): Promise<void> {
    console.info("Generating Merkle tree.");

    const merkleTree = new MerkleTree(
      this.recipients.map(({ address, value }) => this.generateLeaf(address, value)),
      keccak256,
      { sortPairs: true }
    );

    const merkleRoot: string = merkleTree.getHexRoot();
    console.info(`Generated Merkle root: ${merkleRoot}`);

    await fs.writeFileSync(
      outputPath,
      JSON.stringify({
        root: merkleRoot,
        tree: merkleTree
      })
    );
    console.info("Generated merkle tree and root saved to Merkle.json.");

    console.info("Generating proof for the first recipient.");
    const aliceLeaf = this.generateLeaf(this.recipients[0].address, this.recipients[0].value);
    const aliceProof = merkleTree.getHexProof(aliceLeaf);
    console.info("Alice Proof", aliceProof);
  }
}
