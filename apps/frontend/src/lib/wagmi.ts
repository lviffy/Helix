import { http, createConfig } from 'wagmi';
import { mainnet, localhost } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

// Define X Layer Testnet Chain (OKX's Chain)
export const xLayerTestnet = {
  id: 1952,
  name: 'X Layer Testnet',
  nativeCurrency: { name: 'OKB', symbol: 'OKB', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://xlayertestrpc.okx.com'] },
  },
  blockExplorers: {
    default: { name: 'OKLink', url: 'https://www.oklink.com/xlayer-test' },
  },
} as const;

export const config = createConfig({
  chains: [localhost, xLayerTestnet],
  connectors: [
    injected(),
  ],
  transports: {
    [localhost.id]: http(),
    [xLayerTestnet.id]: http(),
  },
});
