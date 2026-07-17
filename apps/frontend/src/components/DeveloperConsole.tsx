'use client';

import React, { useState } from 'react';
import { Cpu, Wallet, Globe } from 'lucide-react';
import { API_BASE_URL } from '../lib/api';

interface DeveloperConsoleProps {
  onAgentRegistered?: () => void;
  showNotification?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const CAPABILITIES = ['bridge', 'yield', 'swap', 'check_gas', 'check_tvl', 'check_depeg'];

export default function DeveloperConsole({ onAgentRegistered, showNotification }: DeveloperConsoleProps) {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleCapability = (cap: string) => {
    setCapabilities((prev) =>
      prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !name || !walletAddress || !endpoint || capabilities.length === 0) {
      if (showNotification) showNotification('Please fill all fields and select at least one capability.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name, walletAddress, endpoint, capabilities }),
      });
      if (res.ok) {
        if (showNotification) showNotification(`Agent '${name}' successfully registered on-chain!`, 'success');
        setId(''); setName(''); setWalletAddress(''); setEndpoint(''); setCapabilities([]);
        if (onAgentRegistered) onAgentRegistered();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to register agent');
      }
    } catch (err: any) {
      if (showNotification) showNotification(err.message || 'Error registering agent', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full bg-[#000000] border border-[#1c1c1e] px-4 py-2.5 text-[11px] text-[#f4f4f5] placeholder-[#3f3f46] focus:outline-none focus:border-[#3f3f46] transition-colors duration-150";

  return (
    <div className="border border-[#1c1c1e]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1c1c1e] px-6 py-4">
        <div>
          <h2 className="font-serif text-base text-[#f4f4f5]">Specialist Agent Registry</h2>
          <p className="text-[10px] font-mono text-[#71717a] mt-0.5">
            Register your solver to start bidding on intent DAGs
          </p>
        </div>
        <span className="text-[9px] font-mono uppercase tracking-[0.12em] text-[#abd600] border border-[#abd600]/30 px-2 py-1">
          Developer Mode
        </span>
      </div>

      <div className="p-6">
        <p className="text-[11px] font-sans text-[#71717a] leading-relaxed mb-6">
          Verified agents accrue on-chain reputation and receive a 0.5% coordination fee split
          upon successful settlement proof verification.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Fields grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-[#71717a] uppercase tracking-[0.1em]">Agent Unique ID</label>
              <input
                id="agent-id-input"
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="e.g. lido-yield-agent"
                className={`${inputClass} font-mono`}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-[#71717a] uppercase tracking-[0.1em]">Display Name</label>
              <input
                id="agent-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Lido Yield Optimizer"
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-[#71717a] uppercase tracking-[0.1em] flex items-center gap-1.5">
                <Wallet className="w-3 h-3" /> Payout Wallet
              </label>
              <input
                id="agent-wallet-input"
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x…"
                className={`${inputClass} font-mono`}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-[#71717a] uppercase tracking-[0.1em] flex items-center gap-1.5">
                <Globe className="w-3 h-3" /> Webhook Endpoint
              </label>
              <input
                id="agent-endpoint-input"
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="https://your-agent.api/rfq"
                className={`${inputClass} font-mono`}
              />
            </div>
          </div>

          {/* Capabilities */}
          <div className="space-y-2.5">
            <label className="text-[10px] font-mono text-[#71717a] uppercase tracking-[0.1em]">Agent Capabilities</label>
            <div className="flex flex-wrap gap-2">
              {CAPABILITIES.map((cap) => {
                const selected = capabilities.includes(cap);
                return (
                  <button
                    key={cap}
                    type="button"
                    id={`cap-${cap}`}
                    onClick={() => toggleCapability(cap)}
                    className={`px-3 py-1.5 text-[10px] font-mono uppercase border transition-colors duration-150 ${
                      selected
                        ? 'border-[#abd600]/50 text-[#abd600] bg-[#abd600]/5'
                        : 'border-[#1c1c1e] text-[#71717a] hover:border-[#3f3f46] hover:text-[#a1a1aa]'
                    }`}
                  >
                    {selected ? '✓ ' : ''}{cap.replace('_', ' ')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <button
            id="register-agent-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-[#f4f4f5] text-[#000000] font-sans font-semibold text-sm hover:bg-white transition-colors duration-150 flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border border-[#000000] border-t-transparent rounded-full animate-spin" />
                Registering…
              </>
            ) : (
              <>
                <Cpu className="w-4 h-4" />
                Register On-Chain Solver Agent
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
