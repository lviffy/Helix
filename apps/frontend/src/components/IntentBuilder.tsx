'use client';

import React, { useState } from 'react';
import { Sparkles, Shield, AlertCircle, Settings, Play } from 'lucide-react';

interface IntentBuilderProps {
  onSubmit: (prompt: string, policies: any) => void;
  isLoading: boolean;
}

const TEMPLATES = [
  {
    title: 'Maximize Stablecoin Yield',
    prompt: 'Keep my USDC earning the best safe yield across Ethereum and Base. Rebalance monthly. Avoid protocols with safety score under 80.',
  },
  {
    title: 'Defensive TVL & Peg Monitor',
    prompt: 'If the TVL of my deposit pool in Aave falls by more than 10% in 12 hours, or if USDC depegs below $0.985, immediately withdraw my assets and move them to my safe wallet on X Layer.',
  },
  {
    title: 'Cross-Chain Yield Rebalance',
    prompt: 'Bridge 5000 USDT from Ethereum to Base and deposit it into Aave if the APY is above 6%. Protect against high gas costs.',
  },
];

export default function IntentBuilder({ onSubmit, isLoading }: IntentBuilderProps) {
  const [prompt, setPrompt] = useState('');
  const [minProtocolRiskScore, setMinProtocolRiskScore] = useState(75);
  const [minTvlUsd, setMinTvlUsd] = useState(50000000);
  const [maxSlippagePct, setMaxSlippagePct] = useState(0.5);
  const [maxGasPerTxUsd, setMaxGasPerTxUsd] = useState(5);
  const [preference, setPreference] = useState<'safety' | 'yield' | 'cost'>('safety');
  const [showConfig, setShowConfig] = useState(false);

  const handleSelectTemplate = (templatePrompt: string) => {
    setPrompt(templatePrompt);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const policies = {
      minProtocolRiskScore,
      minTvlUsd,
      maxSlippagePct,
      maxGasPerTxUsd,
      preferenceOrder: preference === 'safety' 
        ? ['safety', 'yield', 'cost'] 
        : preference === 'yield' 
        ? ['yield', 'safety', 'cost'] 
        : ['cost', 'safety', 'yield'],
    };

    onSubmit(prompt, policies);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 relative overflow-hidden transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-base font-bold tracking-tight text-white font-sans">Define Financial Intent</h2>
        </div>
        <button
          type="button"
          onClick={() => setShowConfig(!showConfig)}
          className="text-gray-light hover:text-primary transition-colors p-2 hover:bg-muted rounded-md"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type your financial intent in plain English... e.g., 'Earn the highest safe yield on my 5000 USDC across Ethereum and Base.'"
            className="w-full h-32 bg-surface-deep border border-border rounded-md p-4 text-sm text-white placeholder-gray-light focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none transition-all font-sans"
          />
        </div>

        {/* Custom Policy Config Panel */}
        {showConfig && (
          <div className="p-4 bg-surface-deep border border-border rounded-md space-y-4 animate-in fade-in duration-200">
            <h3 className="text-xs font-bold text-primary flex items-center gap-2 uppercase tracking-wider font-mono">
              <Shield className="w-3.5 h-3.5" /> Guardrail Policies
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
              <div className="space-y-2">
                <label className="text-gray-light flex justify-between">
                  <span>Min Protocol Risk Score</span>
                  <span className="text-primary font-bold font-mono">{minProtocolRiskScore}/100</span>
                </label>
                <input
                  type="range"
                  min="50"
                  max="95"
                  value={minProtocolRiskScore}
                  onChange={(e) => setMinProtocolRiskScore(Number(e.target.value))}
                  className="w-full accent-primary bg-border rounded-md appearance-none h-1 cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <label className="text-gray-light flex justify-between">
                  <span>Min Liquidity / TVL</span>
                  <span className="text-primary font-bold font-mono">${(minTvlUsd / 1000000).toFixed(0)}M</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="200"
                  value={minTvlUsd / 1000000}
                  onChange={(e) => setMinTvlUsd(Number(e.target.value) * 1000000)}
                  className="w-full accent-primary bg-border rounded-md appearance-none h-1 cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <label className="text-gray-light flex justify-between">
                  <span>Max Allowable Slippage</span>
                  <span className="text-primary font-bold font-mono">{maxSlippagePct}%</span>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1.5"
                  step="0.1"
                  value={maxSlippagePct}
                  onChange={(e) => setMaxSlippagePct(Number(e.target.value))}
                  className="w-full accent-primary bg-border rounded-md appearance-none h-1 cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <label className="text-gray-light flex justify-between">
                  <span>Max Gas Per Tx (USD)</span>
                  <span className="text-primary font-bold font-mono">${maxGasPerTxUsd}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={maxGasPerTxUsd}
                  onChange={(e) => setMaxGasPerTxUsd(Number(e.target.value))}
                  className="w-full accent-primary bg-border rounded-md appearance-none h-1 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-border flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
              <span className="text-gray-light">Optimization Priority:</span>
              <div className="flex gap-2">
                {(['safety', 'yield', 'cost'] as const).map((pref) => (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => setPreference(pref)}
                    className={`px-3 py-1.5 rounded-md capitalize border font-bold font-mono text-[10px] tracking-wider transition-all ${
                      preference === pref
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-transparent border-border text-gray-light hover:border-border hover:bg-muted'
                    }`}
                  >
                    {pref}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Templates list */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-gray-light uppercase tracking-wider block font-mono">Templates</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.title}
                type="button"
                onClick={() => handleSelectTemplate(tmpl.prompt)}
                className="text-left p-3 rounded-md border border-border bg-surface-deep hover:bg-muted hover:border-border transition-all group"
              >
                <span className="text-xs font-bold text-white group-hover:text-primary transition-colors block mb-1">
                  {tmpl.title}
                </span>
                <span className="text-[10px] text-gray-light line-clamp-2 block leading-relaxed">
                  {tmpl.prompt}
                </span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className="w-full py-3.5 bg-primary hover:bg-lime-bright text-black font-bold rounded-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed select-none font-sans"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Orchestrate Intent</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
