import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { defineChain } from 'viem';

export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: {
    // Native gas is USDC. The EVM uses 18 decimals at the native level;
    // the ERC-20 USDC contract at 0x3600...0000 uses 6 decimals — always read decimals().
    name: 'USDC',
    symbol: 'USDC',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [(import.meta.env.VITE_ARC_RPC_URL as string) || 'https://rpc.testnet.arc.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'ArcScan',
      url: 'https://testnet.arcscan.app',
    },
  },
  testnet: true,
});

const projectId = (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string) || '';
const rpcUrl = (import.meta.env.VITE_ARC_RPC_URL as string) || 'https://rpc.testnet.arc.network';

// Use getDefaultConfig (full RainbowKit + WalletConnect) only when a project ID is present.
// Without one, fall back to injected-only (MetaMask) so the app doesn't crash during local dev.
export const wagmiConfig = projectId
  ? getDefaultConfig({
      appName: 'ArcHire',
      projectId,
      chains: [arcTestnet],
      ssr: false,
    })
  : createConfig({
      chains: [arcTestnet],
      connectors: [injected()],
      transports: { [arcTestnet.id]: http(rpcUrl) },
    });
