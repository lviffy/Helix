'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw, Activity } from 'lucide-react';

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
      if (res.ok) setTelemetry(await res.json());
    } catch { /* backend offline — silent */ }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulate = async (action: string, target: string, value: number) => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, target, value }),
      });
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data.telemetry);
        const labels: Record<string, string> = {
          tvl: `TVL crash simulated for ${target}`,
          peg: `Depeg simulated for ${target} → $${value}`,
          gas: `Gas spiked for ${target} → ${value} gwei`,
          depth: `Pool depth changed for ${target}`,
          reset: 'Oracle feeds reset to defaults',
        };
        if (showNotification) showNotification(labels[action] || 'Telemetry updated', action === 'reset' ? 'success' : 'info');
        if (onTelemetryUpdated) onTelemetryUpdated();
      }
    } catch {
      if (showNotification) showNotification('Failed to update telemetry', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Offline state ── */
  if (!telemetry) {
    return (
      <div className="border border-[#1c1c1e]">
        <div className="flex items-center justify-between border-b border-[#1c1c1e] px-6 py-4">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-[#71717a]" />
            <span className="font-serif text-sm text-[#f4f4f5]">Telemetry Monitor</span>
          </div>
          <span className="text-[9px] font-mono text-[#52525b]">Awaiting backend…</span>
        </div>
        <div className="px-6 py-10 flex flex-col items-center gap-3">
          <span className="w-4 h-4 border border-[#3f3f46] border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-mono text-[#52525b]">Connecting to telemetry node</p>
        </div>
      </div>
    );
  }

  const usdc = telemetry.tokens?.find((t: any) => t.symbol === 'USDC');
  const aave = telemetry.protocols?.find((p: any) => p.id === 'aave');
  const ethChain = telemetry.chains?.find((c: any) => c.name === 'ethereum');

  const isUsdcDepegged = usdc ? !usdc.isPegged : false;
  const isAaveTvlDropped = aave ? aave.tvlUsd <= 135000000 : false;
  const isGasSpiked = ethChain ? ethChain.gasPriceGwei > 20 : false;
  const aaveExitDepth = aave?.exitDepthUsd ?? 500000;
  const isAaveDepthLow = aaveExitDepth < 100000;
  const estimatedSlippage = 0.1 + (5000 / aaveExitDepth) * 10.0;

  type MonitorRow = {
    label: string;
    value: string;
    status: string;
    alert: boolean;
  };

  const monitorRows: MonitorRow[] = [
    {
      label: 'USDC Price',
      value: `$${usdc ? usdc.priceUsd.toFixed(4) : '1.0000'}`,
      status: isUsdcDepegged ? 'DEPEG' : 'Stable',
      alert: isUsdcDepegged,
    },
    {
      label: 'Aave TVL',
      value: `$${aave ? (aave.tvlUsd / 1000000).toFixed(1) : '150.0'}M`,
      status: isAaveTvlDropped ? 'DRAINED' : 'Healthy',
      alert: isAaveTvlDropped,
    },
    {
      label: 'Mainnet Gas',
      value: `${ethChain ? ethChain.gasPriceGwei : '15'} gwei`,
      status: isGasSpiked ? 'HIGH GAS' : 'Low Gas',
      alert: isGasSpiked,
    },
  ];

  const simControls = [
    {
      label: isAaveTvlDropped ? 'Reset Aave TVL' : 'Crash Aave TVL',
      sub: isAaveTvlDropped ? 'Set to $150M' : 'Drop TVL by 15%',
      action: () => handleSimulate('tvl', 'aave', isAaveTvlDropped ? 150000000 : 127500000),
      active: isAaveTvlDropped,
    },
    {
      label: isUsdcDepegged ? 'Reset USDC Peg' : 'Depeg USDC',
      sub: isUsdcDepegged ? 'Set to $1.0000' : 'Depeg to $0.9600',
      action: () => handleSimulate('peg', 'usdc', isUsdcDepegged ? 1.00 : 0.96),
      active: isUsdcDepegged,
    },
    {
      label: isGasSpiked ? 'Reset Gas Rate' : 'Spike Gas Rate',
      sub: isGasSpiked ? 'Set to 15 gwei' : 'Spike to 45 gwei',
      action: () => handleSimulate('gas', 'ethereum', isGasSpiked ? 15 : 45),
      active: isGasSpiked,
    },
    {
      label: isAaveDepthLow ? 'Reset Pool Depth' : 'Crash Pool Depth',
      sub: isAaveDepthLow ? 'Set to $500k' : 'Drop depth to $40k',
      action: () => handleSimulate('depth', 'aave', isAaveDepthLow ? 500000 : 40000),
      active: isAaveDepthLow,
    },
  ];

  return (
    <div className="border border-[#1c1c1e]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1c1c1e] px-6 py-4">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-[#71717a]" />
          <span className="font-serif text-sm text-[#f4f4f5]">Telemetry Monitor</span>
        </div>
        <button
          id="refresh-telemetry-btn"
          onClick={fetchTelemetry}
          className="text-[#52525b] hover:text-[#a1a1aa] transition-colors duration-150 p-1"
          title="Refresh"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      {/* Monitor table */}
      <div className="divide-y divide-[#1c1c1e]">
        {monitorRows.map(({ label, value, status, alert }) => (
          <div key={label} className={`grid grid-cols-[1fr_auto_auto] gap-6 items-center px-6 py-3 transition-colors duration-150 ${alert ? 'bg-[#1a0000]' : ''}`}>
            <span className="text-[10px] font-mono text-[#71717a] uppercase tracking-[0.1em]">{label}</span>
            <span className="font-mono text-xs text-[#f4f4f5]">{value}</span>
            <span className={`text-[9px] font-mono uppercase tracking-[0.1em] ${alert ? 'text-[#ef4444]' : 'text-[#22c55e]'}`}>
              {alert ? '⚠ ' : ''}{status}
            </span>
          </div>
        ))}

        {/* ExitGuard row */}
        <div className={`grid grid-cols-[1fr_auto_auto] gap-6 items-center px-6 py-3 transition-colors duration-150 ${isAaveDepthLow ? 'bg-[#1a0000]' : ''}`}>
          <span className="text-[10px] font-mono text-[#71717a] uppercase tracking-[0.1em]">Exit Guard Depth</span>
          <span className="font-mono text-xs text-[#f4f4f5]">${(aaveExitDepth / 1000).toFixed(0)}k</span>
          <span className={`text-[9px] font-mono uppercase tracking-[0.1em] ${isAaveDepthLow ? 'text-[#ef4444]' : 'text-[#22c55e]'}`}>
            {isAaveDepthLow ? '⚠ THIN' : 'Healthy'}
          </span>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-6 items-center px-6 py-3">
          <span className="text-[10px] font-mono text-[#71717a] uppercase tracking-[0.1em]">Est. Slippage ($5k)</span>
          <span className={`font-mono text-xs ${isAaveDepthLow ? 'text-[#ef4444]' : 'text-[#f4f4f5]'}`}>{estimatedSlippage.toFixed(2)}%</span>
        </div>
      </div>

      {/* Simulator */}
      <div className="border-t border-[#1c1c1e] px-6 py-5 space-y-3">
        <p className="text-[9px] font-mono uppercase tracking-[0.12em] text-[#52525b]">Dev Simulator Controls</p>
        <div className="grid grid-cols-2 gap-2">
          {simControls.map(({ label, sub, action, active }) => (
            <button
              key={label}
              onClick={action}
              disabled={isLoading}
              className={`text-left p-3 border text-[10px] font-mono transition-colors duration-150 disabled:opacity-40 ${
                active
                  ? 'border-[#22c55e]/30 text-[#22c55e] hover:bg-[#22c55e]/5'
                  : 'border-[#1c1c1e] text-[#a1a1aa] hover:border-[#3f3f46]'
              }`}
            >
              <span className="block font-medium">{label}</span>
              <span className="block text-[9px] text-[#52525b] mt-0.5">{sub}</span>
            </button>
          ))}
        </div>
        <button
          id="reset-oracle-btn"
          onClick={() => handleSimulate('reset', 'all', 0)}
          disabled={isLoading}
          className="w-full p-2.5 border border-[#1c1c1e] text-[10px] font-mono text-[#71717a] hover:border-[#3f3f46] hover:text-[#a1a1aa] transition-colors duration-150 disabled:opacity-40"
        >
          Reset Oracle Feeds
        </button>
      </div>
    </div>
  );
}
