import MerkleTree from "merkletreejs";
import { solidityKeccak256, keccak256 } from "ethers/lib/utils";

import hardhatOrNull from "../airdrop/hardhat.json";
import sepoliaOrNull from "../airdrop/sepolia.json";
import mainnetOrNull from "../airdrop/mainnet.json";

export interface _LiquityAirdropJSON {
  readonly chainId: number;
  readonly recipients: Record<string, string>;
}

const hardhat = hardhatOrNull as _LiquityAirdropJSON | null;
const sepolia = sepoliaOrNull as _LiquityAirdropJSON | null;
const mainnet = mainnetOrNull as _LiquityAirdropJSON | null;

export const airdrops: {
  [chainId: number]: _LiquityAirdropJSON | undefined;
} = {
  ...(hardhat !== null ? { [hardhat.chainId]: hardhat } : {}),
  ...(sepolia !== null ? { [sepolia.chainId]: sepolia } : {}),
  ...(mainnet !== null ? { [mainnet.chainId]: mainnet } : {})
};

/** @internal */
const _generateLeaf = (account: string, amount: string): Buffer => {
  return Buffer.from(solidityKeccak256(["address", "uint256"], [account, amount]).slice(2), "hex");
};

/** @internal */
export const _generateTree = (recipiens: Record<string, string>): MerkleTree => {
  return new MerkleTree(
    Object.entries(recipiens).map(([address, value]) => _generateLeaf(address, value)),
    keccak256,
    { sortPairs: true }
  );
};

/** @internal */
export const _getAmountAndProofs = (
  recipiens: Record<string, string>,
  account: string
): { amount: string; proofs: string[] } => {
  const merkleTree = _generateTree(recipiens);
  const amount = recipiens[account] || "0";
  const leaf = _generateLeaf(account, amount);
  console.log("Amount", amount);
  console.log("Leaf", leaf);
  return {
    amount,
    proofs: merkleTree.getHexProof(leaf)
  };
};
