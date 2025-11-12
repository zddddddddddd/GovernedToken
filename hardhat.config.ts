import { defineConfig } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import * as dotenv from "dotenv";

// 加载 .env 文件
dotenv.config();

export default defineConfig({
  plugins: [hardhatToolboxMochaEthers],
  paths: {
    tests: "./test"
  },
  test: {
    mocha: {
      timeout: 40000
    }
  },
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.SEPOLIA_PRIVATE_KEY ? [process.env.SEPOLIA_PRIVATE_KEY] : [],
    },
    etherscan: {
      type: "http",
      chainType: "l1",
      url: process.env.ETHERSCAN_RPC_URL || "",
      accounts: process.env.ETHERSCAN_PRIVATE_KEY ? [process.env.ETHERSCAN_PRIVATE_KEY] : [],
    }
  },
  // etherscan: {
  //   apiKey: {
  //     sepolia: process.env.ETHERSCAN_API_KEY || "",
  //   },
  //   customChains: [
  //     {
  //       network: "sepolia",
  //       chainId: 11155111,
  //       urls: {
  //         apiURL: "https://api-sepolia.etherscan.io/api",
  //         browserURL: "https://sepolia.etherscan.io"
  //       }
  //     }
  //   ]
  // },
});
