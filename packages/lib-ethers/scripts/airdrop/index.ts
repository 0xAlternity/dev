import fs from "fs";
import path from "path";
import Generator from "./generator";

// Config file path
const configPath: string = path.join(__dirname, "/config.json");

function throwErrorAndExit(error: string): void {
  console.error(error);
  process.exit(1);
}

(async () => {
  // Check if config exists
  if (!fs.existsSync(configPath)) {
    throwErrorAndExit("Missing config.json. Please add.");
  }

  // Read config
  const configFile: Buffer = await fs.readFileSync(configPath);
  const configData = JSON.parse(configFile.toString());

  // Check if config contains airdrop key
  if (configData["airdrop"] === undefined) {
    throwErrorAndExit("Missing airdrop param in config. Please add.");
  }

  // Collect config
  const decimals: number = configData.decimals ?? 18;
  const airdrop: Record<string, number> = configData.airdrop;

  // Initialize and call generator
  const generator = new Generator(decimals, airdrop);
  await generator.process();
})();
