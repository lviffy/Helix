'use client';

import React, { useState } from 'react';
import { Sparkles, Shield, AlertCircle, Settings, Play, Check } from 'lucide-react';

interface IntentBuilderProps {
  onSubmit: (prompt: string, policies: any) => void;
  isLoading: boolean;
}

const TEMPLATES = [
  {
    title: 'Maximize Stablecoin Yield',
    prompt: 'Keep my USDC earning the best safe yield across Ethereum and Base. Rebalance monthly. Avoid protocols with safety score under 80.',
    icon: Sparkles,
  },
  {
    title: 'Cross-Chain Yield Rebalance',
    prompt: 'Bridge 5000 USDT from Ethereum to Base and deposit it into Aave if the APY is above 6%. Protect against high gas costs.',
    icon: Shield,
  },
  {
    title: 'Conservative Safety Guard',
    prompt: 'Allocate 10000 USDC only into highly-audited yield protocols with TVL greater than 100M. Prioritize safety over cost.',
    icon: Shield,
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
    <div className="glass-card rounded-2xl p-6 glow-effect relative overflow-hidden transition-all duration-300">
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <h2 className="text-xl font-bold tracking-tight text-white glow-text">Define Financial Intent</h2>
        </div>
        <button
          type="button"
          onClick={() => setShowConfig(!showConfig)}
          className="text-gray-400 hover:text-cyan-400 transition-colors p-2 hover:bg-gray-800/40 rounded-xl"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type your financial intent in plain English... e.g., 'Earn the highest safe yield on my 5000 USDC across Ethereum and Base.'"
            className="w-full h-32 bg-gray-950/80 border border-gray-800 rounded-xl p-4 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 resize-none transition-all"
          />
        </div>

        {/* Custom Policy Config Panel */}
        {showConfig && (
          <div className="p-4 bg-gray-950/90 border border-gray-800/80 rounded-xl space-y-4 animate-in fade-in duration-200">
            <h3 className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Guardrail Policies
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <label className="text-gray-400 flex justify-between">
                  <span>Min Protocol Risk Score</span>
                  <span className="text-cyan-400 font-bold">{minProtocolRiskScore}/100</span>
                </label>
                <input
                  type="range"
                  min="50"
                  max="95"
                  value={minProtocolRiskScore}
                  onChange={(e) => setMinProtocolRiskScore(Number(e.target.value))}
                  className="w-full accent-cyan-400 bg-gray-800 rounded-lg appearance-none h-1"
                />
              </div>

              <div className="space-y-2">
                <label className="text-gray-400 flex justify-between">
                  <span>Min Liquidity / TVL</span>
                  <span className="text-cyan-400 font-bold">${(minTvlUsd / 1000000).toFixed(0)}M</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="200"
                  value={minTvlUsd / 1000000}
                  onChange={(e) => setMinTvlUsd(Number(e.target.value) * 1000000)}
                  className="w-full accent-cyan-400 bg-gray-800 rounded-lg appearance-none h-1"
                />
              </div>

              <div className="space-y-2">
                <label className="text-gray-400 flex justify-between">
                  <span>Max Allowable Slippage</span>
                  <span className="text-cyan-400 font-bold">{maxSlippagePct}%</span>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1.5"
                  step="0.1"
                  value={maxSlippagePct}
                  onChange={(e) => setMaxSlippagePct(Number(e.target.value))}
                  className="w-full accent-cyan-400 bg-gray-800 rounded-lg appearance-none h-1"
                />
              </div>

              <div className="space-y-2">
                <label className="text-gray-400 flex justify-between">
                  <span>Max Gas Per Tx (USD)</span>
                  <span className="text-cyan-400 font-bold">${maxGasPerTxUsd}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={maxGasPerTxUsd}
                  onChange={(e) => setMaxGasPerTxUsd(Number(e.target.value))}
                  className="w-full accent-cyan-400 bg-gray-800 rounded-lg appearance-none h-1"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-gray-900 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
              <span className="text-gray-400">Optimization Priority:</span>
              <div className="flex gap-2">
                {(['safety', 'yield', 'cost'] as const).map((pref) => (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => setPreference(pref)}
                    className={`px-3 py-1.5 rounded-lg capitalize border font-medium transition-all ${
                      preference === pref
                        ? 'bg-cyan-500/10 border-cyan-400 text-cyan-400'
                        : 'bg-transparent border-gray-800 text-gray-400 hover:border-gray-700'
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
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Templates</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.title}
                type="button"
                onClick={() => handleSelectTemplate(tmpl.prompt)}
                className="text-left p-3 rounded-xl border border-gray-900 bg-gray-950/40 hover:bg-gray-900/60 hover:border-gray-800 transition-all group"
              >
                <span className="text-xs font-bold text-gray-300 group-hover:text-cyan-400 transition-colors block mb-1">
                  {tmpl.title}
                </span>
                <span className="text-[10px] text-gray-500 line-clamp-2 block leading-relaxed">
                  {tmpl.prompt}
                </span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className="w-full py-3.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-gray-950 font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-gray-950 border-t-transparent rounded-full animate-spin"></div>
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
