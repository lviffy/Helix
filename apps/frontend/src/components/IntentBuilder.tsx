'use client';

import React, { useState } from 'react';
import { Shield, Settings, Play, MoveRight } from 'lucide-react';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onSubmit(prompt, {
      minProtocolRiskScore, minTvlUsd, maxSlippagePct, maxGasPerTxUsd,
      preferenceOrder: preference === 'safety' ? ['safety', 'yield', 'cost']
        : preference === 'yield' ? ['yield', 'safety', 'cost']
        : ['cost', 'safety', 'yield'],
    });
  };

  return (
    <div className="border border-[#1c1c1e] bg-[#09090b]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1c1c1e] px-6 py-4">
        <div>
          <h2 className="font-serif text-base text-[#f4f4f5]">Define Financial Intent</h2>
          <p className="text-[10px] font-mono text-[#71717a] mt-0.5">Natural language → autonomous on-chain execution</p>
        </div>
        <button
          type="button"
          id="toggle-guardrails-btn"
          onClick={() => setShowConfig(!showConfig)}
          className={`flex items-center gap-1.5 text-[10px] font-mono border px-3 py-1.5 transition-colors duration-150 ${
            showConfig
              ? 'border-[#abd600]/40 text-[#abd600]'
              : 'border-[#1c1c1e] text-[#71717a] hover:border-[#3f3f46] hover:text-[#a1a1aa]'
          }`}
        >
          <Settings className="w-3 h-3" />
          Guardrails
        </button>
      </div>

      <div className="p-6 space-y-5">
        <form onSubmit={handleSubmit} className="space-y-5">
          <textarea
            id="intent-textarea"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type your financial intent in plain English…
e.g. 'Earn the highest safe yield on my 5000 USDC across Ethereum and Base.'"
            className="w-full h-28 bg-[#000000] border border-[#1c1c1e] p-4 text-sm text-[#f4f4f5] placeholder-[#3f3f46] focus:outline-none focus:border-[#3f3f46] resize-none font-sans leading-relaxed transition-colors duration-150"
          />

          {/* Guardrail config */}
          {showConfig && (
            <div className="border border-[#1c1c1e] p-5 space-y-5">
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-[#71717a]" />
                <span className="text-[10px] font-mono text-[#71717a] uppercase tracking-[0.12em]">Guardrail Policies</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  { label: 'Min Protocol Risk Score', value: `${minProtocolRiskScore}/100`, min: 50, max: 95, current: minProtocolRiskScore, setter: setMinProtocolRiskScore },
                  { label: 'Min Liquidity / TVL', value: `$${(minTvlUsd / 1000000).toFixed(0)}M`, min: 10, max: 200, current: minTvlUsd / 1000000, setter: (v: number) => setMinTvlUsd(v * 1000000) },
                  { label: 'Max Allowable Slippage', value: `${maxSlippagePct}%`, min: 0.1, max: 1.5, step: 0.1, current: maxSlippagePct, setter: setMaxSlippagePct },
                  { label: 'Max Gas Per Tx', value: `$${maxGasPerTxUsd}`, min: 1, max: 20, current: maxGasPerTxUsd, setter: setMaxGasPerTxUsd },
                ].map(({ label, value, min, max, step, current, setter }) => (
                  <div key={label} className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-[#71717a]">{label}</span>
                      <span className="text-[#abd600]">{value}</span>
                    </div>
                    <input
                      type="range" min={min} max={max} step={step} value={current}
                      onChange={(e) => setter(Number(e.target.value))}
                      className="w-full h-px bg-[#1c1c1e] accent-[#abd600] cursor-pointer appearance-none"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-[#1c1c1e] pt-4">
                <span className="text-[10px] font-mono text-[#71717a]">Optimization Priority</span>
                <div className="flex gap-1">
                  {(['safety', 'yield', 'cost'] as const).map((pref) => (
                    <button
                      key={pref}
                      type="button"
                      onClick={() => setPreference(pref)}
                      className={`px-3 py-1.5 text-[10px] font-mono capitalize border transition-colors duration-150 ${
                        preference === pref
                          ? 'border-[#abd600]/50 text-[#abd600] bg-[#abd600]/5'
                          : 'border-[#1c1c1e] text-[#71717a] hover:border-[#3f3f46]'
                      }`}
                    >
                      {pref}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Templates */}
          <div className="space-y-2">
            <p className="text-[10px] font-mono text-[#71717a] uppercase tracking-[0.12em]">Templates</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.title}
                  type="button"
                  onClick={() => setPrompt(tmpl.prompt)}
                  className="text-left p-3 border border-[#1c1c1e] hover:border-[#3f3f46] hover:bg-[#000000] transition-colors duration-150 group"
                >
                  <span className="text-[11px] font-sans font-medium text-[#f4f4f5] group-hover:text-white block mb-1">
                    {tmpl.title}
                  </span>
                  <span className="text-[10px] font-mono text-[#71717a] line-clamp-2 block leading-relaxed">
                    {tmpl.prompt}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            id="orchestrate-btn"
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="w-full py-3.5 bg-[#f4f4f5] text-[#000000] font-sans font-semibold text-sm hover:bg-white transition-colors duration-150 flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border border-[#000000] border-t-transparent rounded-full animate-spin" />
                Orchestrating…
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                Orchestrate Intent
                <MoveRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
