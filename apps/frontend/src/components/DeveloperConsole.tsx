'use client';

import React, { useState } from 'react';
import { Cpu, Globe, Wallet, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

interface DeveloperConsoleProps {
  onAgentRegistered?: () => void;
  showNotification?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function DeveloperConsole({ onAgentRegistered, showNotification }: DeveloperConsoleProps) {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleCapability = (cap: string) => {
    if (capabilities.includes(cap)) {
      setCapabilities(capabilities.filter(c => c !== cap));
    } else {
      setCapabilities([...capabilities, cap]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !name || !walletAddress || !endpoint || capabilities.length === 0) {
      if (showNotification) showNotification('Please fill all fields and select at least one capability.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:4000/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          name,
          walletAddress,
          endpoint,
          capabilities,
        }),
      });

      if (res.ok) {
        if (showNotification) showNotification(`Agent '${name}' successfully registered on-chain!`, 'success');
        // Reset form
        setId('');
        setName('');
        setWalletAddress('');
        setEndpoint('');
        setCapabilities([]);
        if (onAgentRegistered) onAgentRegistered();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to register agent');
      }
    } catch (err: any) {
      console.error('Error registering agent:', err);
      if (showNotification) showNotification(err.message || 'Error registering agent', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-6 relative overflow-hidden transition-all duration-300">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e2329_1px,transparent_1px),linear-gradient(to_bottom,#1e2329_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-10 pointer-events-none" />

      <div className="flex items-center justify-between border-b border-border pb-3 relative z-10">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          <h2 className="text-base font-bold tracking-tight text-white font-sans">Specialist Agent Registry</h2>
        </div>
        <span className="text-[9px] px-2 py-0.5 rounded bg-surface-muted text-primary font-bold uppercase border border-border font-mono">
          Developer Mode
        </span>
      </div>

      <p className="text-[11px] text-gray-light leading-relaxed font-sans relative z-10">
        Register your autonomous specialist agent to start bidding on user financial task DAGs. Verified agents accrue reputation and split 0.5% coordination fees on-chain.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 relative z-10 text-xs font-sans">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-gray-light font-bold">Agent Unique ID</label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="e.g., lido-yield-agent"
              className="w-full bg-surface-deep border border-border rounded p-2.5 text-white placeholder-gray-medium focus:outline-none focus:border-primary font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-gray-light font-bold">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Lido Yield Optimizer"
              className="w-full bg-surface-deep border border-border rounded p-2.5 text-white placeholder-gray-medium focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-gray-light font-bold">Payout Wallet Address</label>
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0x..."
              className="w-full bg-surface-deep border border-border rounded p-2.5 text-white placeholder-gray-medium focus:outline-none focus:border-primary font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-gray-light font-bold">Bidding Webhook Endpoint</label>
            <input
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://your-agent.api/rfq"
              className="w-full bg-surface-deep border border-border rounded p-2.5 text-white placeholder-gray-medium focus:outline-none focus:border-primary font-mono"
            />
          </div>
        </div>

        {/* Capabilities tags Selection */}
        <div className="space-y-2">
          <label className="text-gray-light font-bold">Agent Capabilities</label>
          <div className="flex flex-wrap gap-2">
            {['bridge', 'yield', 'swap', 'check_gas', 'check_tvl', 'check_depeg'].map((cap) => {
              const isSelected = capabilities.includes(cap);
              return (
                <button
                  type="button"
                  key={cap}
                  onClick={() => toggleCapability(cap)}
                  className={`px-3 py-1.5 rounded-full border text-[10px] font-bold font-mono transition-all uppercase ${
                    isSelected
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-surface-deep border-border text-gray-light hover:border-gray-medium'
                  }`}
                >
                  {cap.replace('_', ' ')}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-primary hover:bg-lime-bright text-black font-bold rounded text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md uppercase"
        >
          {isSubmitting ? (
            <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <Cpu className="w-4 h-4" />
              <span>Register On-Chain Solver Agent</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
