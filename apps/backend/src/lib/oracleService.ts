export interface ProtocolTelemetry {
  id: string;
  name: string;
  tvlUsd: number;
  apyPct: number;
  safetyScore: number;
  exitDepthUsd: number;
}

export interface TokenTelemetry {
  symbol: string;
  priceUsd: number;
  isPegged: boolean;
}

export interface ChainTelemetry {
  name: string;
  gasPriceGwei: number;
}

export interface TelemetryData {
  protocols: ProtocolTelemetry[];
  tokens: TokenTelemetry[];
  chains: ChainTelemetry[];
}

const DEFAULT_TELEMETRY: TelemetryData = {
  protocols: [
    { id: 'aave', name: 'Aave V3', tvlUsd: 150000000, apyPct: 4.8, safetyScore: 92, exitDepthUsd: 500000 },
    { id: 'compound', name: 'Compound V3', tvlUsd: 85000000, apyPct: 5.2, safetyScore: 88, exitDepthUsd: 300000 }
  ],
  tokens: [
    { symbol: 'USDC', priceUsd: 1.00, isPegged: true },
    { symbol: 'USDT', priceUsd: 1.00, isPegged: true },
    { symbol: 'ETH', priceUsd: 3200, isPegged: false }
  ],
  chains: [
    { name: 'ethereum', gasPriceGwei: 15 },
    { name: 'base', gasPriceGwei: 0.1 },
    { name: 'xlayer', gasPriceGwei: 0.05 }
  ]
};

// Global telemetry state in memory
let telemetryState: TelemetryData = JSON.parse(JSON.stringify(DEFAULT_TELEMETRY));

export const oracleService = {
  getTelemetry(): TelemetryData {
    return telemetryState;
  },

  updateProtocolTvl(id: string, tvlUsd: number) {
    const proto = telemetryState.protocols.find(p => p.id === id.toLowerCase());
    if (proto) {
      proto.tvlUsd = tvlUsd;
      console.log(`📡 Telemetry updated: ${proto.name} TVL set to $${(tvlUsd / 1000000).toFixed(2)}M`);
    }
  },

  updateProtocolExitDepth(id: string, exitDepthUsd: number) {
    const proto = telemetryState.protocols.find(p => p.id === id.toLowerCase());
    if (proto) {
      proto.exitDepthUsd = exitDepthUsd;
      console.log(`📡 Telemetry updated: ${proto.name} Exit Depth set to $${(exitDepthUsd / 1000).toFixed(1)}k`);
    }
  },

  updateTokenPeg(symbol: string, priceUsd: number) {
    const tok = telemetryState.tokens.find(t => t.symbol.toUpperCase() === symbol.toUpperCase());
    if (tok) {
      tok.priceUsd = priceUsd;
      tok.isPegged = Math.abs(1.0 - priceUsd) <= 0.02; // depegs if deviates by > 2%
      console.log(`📡 Telemetry updated: ${tok.symbol} price set to $${priceUsd.toFixed(4)} (Pegged: ${tok.isPegged})`);
    }
  },

  updateGasPrice(chainName: string, gasPriceGwei: number) {
    const ch = telemetryState.chains.find(c => c.name.toLowerCase() === chainName.toLowerCase());
    if (ch) {
      ch.gasPriceGwei = gasPriceGwei;
      console.log(`📡 Telemetry updated: ${ch.name} gas price set to ${gasPriceGwei} gwei`);
    }
  },

  getExitSlippage(protocolId: string, amountUsd: number): { slippagePct: number; exitDepthUsd: number } {
    const proto = telemetryState.protocols.find(p => p.id === protocolId.toLowerCase()) || telemetryState.protocols[0];
    const depth = proto.exitDepthUsd;
    
    // Slippage grows quadratically/hyperbolically as size approaches depth
    const slippagePct = 0.1 + (amountUsd / depth) * 10.0;
    
    return {
      slippagePct: parseFloat(slippagePct.toFixed(3)),
      exitDepthUsd: depth,
    };
  },

  reset() {
    telemetryState = JSON.parse(JSON.stringify(DEFAULT_TELEMETRY));
    console.log('📡 Telemetry reset to default settings.');
  }
};

async function pollTelemetry() {
  try {
    console.log('📡 OracleService: Fetching live telemetry from DefiLlama...');
    
    // 1. Fetch coin prices
    const pricesRes = await fetch('https://coins.llama.fi/prices/current/ethereum:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48,ethereum:0xdac17f958d2ee523a2206206994597c13d831ec7,coingecko:ethereum');
    if (pricesRes.ok) {
      const pricesData = await pricesRes.json();
      const usdcPrice = pricesData.coins['ethereum:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48']?.price;
      const usdtPrice = pricesData.coins['ethereum:0xdac17f958d2ee523a2206206994597c13d831ec7']?.price;
      const ethPrice = pricesData.coins['coingecko:ethereum']?.price;

      if (usdcPrice !== undefined) {
        oracleService.updateTokenPeg('USDC', usdcPrice);
      }
      if (usdtPrice !== undefined) {
        oracleService.updateTokenPeg('USDT', usdtPrice);
      }
      if (ethPrice !== undefined) {
        const ethToken = telemetryState.tokens.find(t => t.symbol === 'ETH');
        if (ethToken) {
          ethToken.priceUsd = ethPrice;
          console.log(`📡 Telemetry updated: ETH price set to $${ethPrice.toFixed(2)}`);
        }
      }
    }

    // 2. Fetch protocol yields and TVL
    const yieldsRes = await fetch('https://yields.llama.fi/pools');
    if (yieldsRes.ok) {
      const yieldsData = await yieldsRes.json();
      
      // Aave V3 USDC Ethereum main pool
      const aavePool = yieldsData.data?.find((p: any) => 
        p.project === 'aave-v3' && 
        p.symbol === 'USDC' && 
        p.chain === 'Ethereum' && 
        p.poolMeta === null
      );
      if (aavePool) {
        const aaveProto = telemetryState.protocols.find(p => p.id === 'aave');
        if (aaveProto) {
          aaveProto.apyPct = parseFloat(aavePool.apy.toFixed(2));
          aaveProto.tvlUsd = aavePool.tvlUsd;
          console.log(`📡 Telemetry updated: Aave V3 yield set to ${aaveProto.apyPct}% (TVL: $${(aaveProto.tvlUsd/1000000).toFixed(2)}M)`);
        }
      }

      // Compound V3 USDC Ethereum main pool
      const compoundPool = yieldsData.data?.find((p: any) => 
        p.project === 'compound-v3' && 
        p.symbol === 'USDC' && 
        p.chain === 'Ethereum' && 
        p.poolMeta === null
      );
      if (compoundPool) {
        const compProto = telemetryState.protocols.find(p => p.id === 'compound');
        if (compProto) {
          compProto.apyPct = parseFloat(compoundPool.apy.toFixed(2));
          compProto.tvlUsd = compoundPool.tvlUsd;
          console.log(`📡 Telemetry updated: Compound V3 yield set to ${compProto.apyPct}% (TVL: $${(compProto.tvlUsd/1000000).toFixed(2)}M)`);
        }
      }
    }
  } catch (error) {
    console.error('⚠️ OracleService: Failed to fetch live telemetry, using simulated fallback:', error);
  }
}

// Poll on load, and every 60 seconds
pollTelemetry();
setInterval(pollTelemetry, 60000);
