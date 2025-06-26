import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 2000,
      },
    },
  },
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "YOUR_SEPOLIA_NODE" /* only Sepolia, never mainnet */,
      accounts: process.env.SEPOLIA_PRIVATE_KEY ? [process.env.SEPOLIA_PRIVATE_KEY] : [],
    },
    // polygon_mumbai: { ...optional testnet },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

// CCIP Routers, see: https://docs.chain.link/ccip/supported-networks/
// Example: CCIP_ROUTER_SEPOLIA = "0xF76e945904b9d205b8a869c12c742b06baa1c215"
// Set exact addresses at deploy step from chainlink docs

export default config;
