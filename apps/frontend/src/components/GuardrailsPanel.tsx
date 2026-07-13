'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, HelpCircle, Activity, Star, RefreshCw, Layers, Database, Wallet, ShieldAlert, Zap, Flame, Thermometer } from 'lucide-react';

interface GuardrailsPanelProps {
  onTelemetryUpdated?: () => void;
  showNotification?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function GuardrailsPanel({ onTelemetryUpdated, showNotification }: GuardrailsPanelProps) {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTelemetry = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/telemetry');
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data);
      }
    } catch (err) {
      console.error('Error fetching telemetry:', err);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const handleSimulate = async (action: string, target: string, value: number) => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/telemetry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, target, value }),
      });

      if (res.ok) {
        const data = await res.json();
        setTelemetry(data.telemetry);
        
        let label = '';
        if (action === 'tvl') label = `Simulated TVL crash for ${target}! TVL set to $${(value / 1000000).toFixed(0)}M`;
        else if (action === 'peg') label = `Simulated depeg for ${target}! Price set to $${value}`;
        else if (action === 'gas') label = `Simulated gas price change for ${target}! Gas set to ${value} gwei`;
        else if (action === 'reset') label = 'Telemetry reset to default values.';

        if (showNotification) {
          showNotification(label, action === 'reset' ? 'success' : 'info');
        }
        if (onTelemetryUpdated) {
          onTelemetryUpdated();
        }
      }
    } catch (err) {
      console.error('Error setting telemetry simulator:', err);
      if (showNotification) showNotification('Failed to update telemetry', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!telemetry) {
    return (
      <div className="bg-card border border-border rounded-lg p-5 flex flex-col justify-center items-center h-[200px]">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-gray-light font-mono mt-3">Loading telemetry node...</p>
      </div>
    );
  }

  const usdc = telemetry.tokens.find((t: any) => t.symbol === 'USDC');
  const aave = telemetry.protocols.find((p: any) => p.id === 'aave');
  const ethChain = telemetry.chains.find((c: any) => c.name === 'ethereum');

  const isUsdcDepegged = usdc ? !usdc.isPegged : false;
  const isAaveTvlDropped = aave ? aave.tvlUsd <= 135000000 : false; // dropped past 10%
  const isGasSpiked = ethChain ? ethChain.gasPriceGwei > 20 : false;

  const aaveExitDepth = aave ? aave.exitDepthUsd : 500000;
  const isAaveDepthLow = aaveExitDepth < 100000;
  const estimatedSlippage = 0.1 + (5000 / aaveExitDepth) * 10.0; // slippage for $5,000 swap

  return (
    <div className="bg-card border border-border rounded-lg p-5 space-y-6">
      {/* Telemetry Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-sans">
          <Activity className="w-4 h-4 text-primary" />
          <span>Active Telemetry Monitor</span>
        </h4>
        <button
          onClick={fetchTelemetry}
          className="text-gray-light hover:text-primary transition-colors p-1"
          title="Refresh feeds"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid of monitored variables */}
      <div className="grid grid-cols-3 gap-3">
        {/* Token Peg */}
        <div className={`p-3 rounded-md border flex flex-col justify-between h-[90px] transition-colors duration-300 ${
          isUsdcDepegged 
            ? 'bg-red-950/10 border-red-500/30' 
            : 'bg-surface-deep border-border'
        }`}>
          <span className="text-[9px] text-gray-light uppercase font-mono font-medium">USDC Price</span>
          <div>
            <p className={`text-sm font-bold font-mono ${isUsdcDepegged ? 'text-red-400' : 'text-white'}`}>
              ${usdc ? usdc.priceUsd.toFixed(4) : '1.0000'}
            </p>
            <span className={`text-[8px] font-mono font-bold uppercase tracking-wider block mt-1 ${
              isUsdcDepegged ? 'text-red-400' : 'text-emerald-400'
            }`}>
              {isUsdcDepegged ? '⚠️ DEPEG' : 'Stable'}
            </span>
          </div>
        </div>

        {/* Aave TVL */}
        <div className={`p-3 rounded-md border flex flex-col justify-between h-[90px] transition-colors duration-300 ${
          isAaveTvlDropped 
            ? 'bg-red-950/10 border-red-500/30' 
            : 'bg-surface-deep border-border'
        }`}>
          <span className="text-[9px] text-gray-light uppercase font-mono font-medium">Aave TVL</span>
          <div>
            <p className={`text-sm font-bold font-mono ${isAaveTvlDropped ? 'text-red-400' : 'text-white'}`}>
              ${aave ? (aave.tvlUsd / 1000000).toFixed(1) : '150.0'}M
            </p>
            <span className={`text-[8px] font-mono font-bold uppercase tracking-wider block mt-1 ${
              isAaveTvlDropped ? 'text-red-400' : 'text-emerald-400'
            }`}>
              {isAaveTvlDropped ? '⚠️ DRAINED (-15%)' : 'Healthy'}
            </span>
          </div>
        </div>

        {/* Ethereum Gas */}
        <div className={`p-3 rounded-md border flex flex-col justify-between h-[90px] transition-colors duration-300 ${
          isGasSpiked 
            ? 'bg-yellow-950/10 border-yellow-500/30' 
            : 'bg-surface-deep border-border'
        }`}>
          <span className="text-[9px] text-gray-light uppercase font-mono font-medium">Mainnet Gas</span>
          <div>
            <p className={`text-sm font-bold font-mono ${isGasSpiked ? 'text-yellow-400' : 'text-white'}`}>
              {ethChain ? ethChain.gasPriceGwei : '15'} gwei
            </p>
            <span className={`text-[8px] font-mono font-bold uppercase tracking-wider block mt-1 ${
              isGasSpiked ? 'text-yellow-400' : 'text-primary'
            }`}>
              {isGasSpiked ? '⚠️ HIGH GAS' : 'Low Gas'}
            </span>
          </div>
        </div>
      </div>

      {/* ExitGuard Pre-Trade Depth Section */}
      <div className={`p-4 rounded-md border space-y-2 transition-colors duration-300 ${
        isAaveDepthLow 
          ? 'bg-red-950/10 border-red-500/30' 
          : 'bg-surface-deep border-border'
      }`}>
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-gray-light uppercase font-bold">🛡️ ExitGuard Liquidity Pool Depth</span>
          <span className={isAaveDepthLow ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
            {isAaveDepthLow ? '⚠️ THIN DEPTH' : 'Healthy Depth'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs font-sans">
          <div>
            <p className="text-[10px] text-gray-medium font-mono uppercase">Pool Liquidity Depth</p>
            <p className="text-sm font-bold text-white font-mono">${aaveExitDepth ? (aaveExitDepth / 1000).toFixed(0) : '500'}k</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-medium font-mono uppercase">Est. Slippage ($5k Swap)</p>
            <p className={`text-sm font-bold font-mono ${isAaveDepthLow ? 'text-red-400' : 'text-white'}`}>
              {estimatedSlippage.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      {/* Developers Simulation overrides */}
      <div className="space-y-3 pt-3 border-t border-border">
        <span className="text-[10px] font-bold text-gray-light uppercase tracking-wider block font-mono">
          Hackathon Dev Simulator Controls
        </span>

        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
          {/* TVL Control */}
          <button
            onClick={() => handleSimulate('tvl', 'aave', isAaveTvlDropped ? 150000000 : 127500000)}
            disabled={isLoading}
            className={`p-2 rounded border text-left flex flex-col gap-0.5 justify-center transition-all ${
              isAaveTvlDropped
                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                : 'bg-surface-muted hover:bg-border border-border text-white'
            }`}
          >
            <span className="font-bold">{isAaveTvlDropped ? 'Reset Aave TVL' : 'Crash Aave TVL'}</span>
            <span className="text-[8px] text-gray-light">{isAaveTvlDropped ? 'Set to $150M' : 'Drop TVL by 15%'}</span>
          </button>

          {/* Peg Control */}
          <button
            onClick={() => handleSimulate('peg', 'usdc', isUsdcDepegged ? 1.00 : 0.96)}
            disabled={isLoading}
            className={`p-2 rounded border text-left flex flex-col gap-0.5 justify-center transition-all ${
              isUsdcDepegged
                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                : 'bg-surface-muted hover:bg-border border-border text-white'
            }`}
          >
            <span className="font-bold">{isUsdcDepegged ? 'Reset USDC Peg' : 'Depeg USDC'}</span>
            <span className="text-[8px] text-gray-light">{isUsdcDepegged ? 'Set to $1.0000' : 'Depeg to $0.9600'}</span>
          </button>

          {/* Gas Control */}
          <button
            onClick={() => handleSimulate('gas', 'ethereum', isGasSpiked ? 15 : 45)}
            disabled={isLoading}
            className={`p-2 rounded border text-left flex flex-col gap-0.5 justify-center transition-all ${
              isGasSpiked
                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                : 'bg-surface-muted hover:bg-border border-border text-white'
            }`}
          >
            <span className="font-bold">{isGasSpiked ? 'Reset Gas Rate' : 'Spike Gas Rate'}</span>
            <span className="text-[8px] text-gray-light">{isGasSpiked ? 'Set to 15 gwei' : 'Spike to 45 gwei'}</span>
          </button>

          {/* Exit Depth Control */}
          <button
            onClick={() => handleSimulate('depth', 'aave', isAaveDepthLow ? 500000 : 40000)}
            disabled={isLoading}
            className={`p-2 rounded border text-left flex flex-col gap-0.5 justify-center transition-all ${
              isAaveDepthLow
                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                : 'bg-surface-muted hover:bg-border border-border text-white'
            }`}
          >
            <span className="font-bold">{isAaveDepthLow ? 'Reset Pool Depth' : 'Crash Pool Depth'}</span>
            <span className="text-[8px] text-gray-light">{isAaveDepthLow ? 'Set to $500k' : 'Drop depth to $40k'}</span>
          </button>

          {/* Reset All */}
          <button
            onClick={() => handleSimulate('reset', 'all', 0)}
            disabled={isLoading}
            className="p-2 rounded border text-left bg-primary/10 hover:bg-primary/20 border-primary/30 text-primary flex flex-col gap-0.5 justify-center transition-all col-span-2"
          >
            <span className="font-bold">Reset Oracle Feeds</span>
            <span className="text-[8px] text-primary/70">Clear all mock overrides</span>
          </button>
        </div>
      </div>
    </div>
  );
}
