import "@nomiclabs/hardhat-etherscan";
import "@typechain/hardhat";
import "@xyrusworx/hardhat-solidity-json";
import * as dotenv from "dotenv";
import { parseUnits } from "ethers";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import "hardhat-gas-reporter";
import { HardhatUserConfig } from "hardhat/types";
import { getEnvironment, mapLazy } from "./utils";

dotenv.config();

const DEPLOYER_PRIVATE_KEY = getEnvironment("DEPLOYER_PRIVATE_KEY");
const accounts = [DEPLOYER_PRIVATE_KEY].map(mapLazy);

if (process.env.VERIFY_CONTRACTS === "1") {
  console.log("VERIFY_CONTRACTS=1. Will verify contracts.");
}

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  namedAccounts: {
    deployer: 0,
  },
  networks: {
    hardhat: {
      blockGasLimit: 30_000_000,
    },
    "mode-testnet": {
      url: "https://sepolia.mode.network",
      accounts,
      blockGasLimit: 30_000_000,
      gasPrice: Number(parseUnits("1.51", "gwei")),
      live: true, // is production?
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.10",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  etherscan: {
    apiKey: {
      "mode-testnet": "abc",
    },
    customChains: [
      {
        network: "mode-testnet",
        chainId: 919,
        urls: {
          apiURL: "https://sepolia.explorer.mode.network/api",
          browserURL: "https://sepolia.explorer.mode.network",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  typechain: {
    alwaysGenerateOverloads: true,
    discriminateTypes: true,
    target: "ethers-v6",
    outDir: "./typechain",
  },
};
3;

export default config;
