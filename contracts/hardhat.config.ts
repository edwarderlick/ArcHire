import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import * as dotenv from 'dotenv';

dotenv.config();

const deployerKey = process.env.DEPLOYER_PRIVATE_KEY;

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    arcTestnet: {
      url: process.env.ARC_RPC_URL || 'https://rpc.testnet.arc.network',
      chainId: 5042002,
      accounts: deployerKey ? [`0x${deployerKey}`] : [],
    },
  },
};

export default config;
