'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Activity, RefreshCw, Layers, Database, Wallet, ArrowUpRight, Settings } from 'lucide-react';
import IntentBuilder from '../../components/IntentBuilder';
import ExecutionTimeline from '../../components/ExecutionTimeline';
import AgentMarketplace from '../../components/AgentMarketplace';
import VisualFlowGraph from '../../components/VisualFlowGraph';
import GuardrailsPanel from '../../components/GuardrailsPanel';
import { supabase } from '../../lib/supabase';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import DeveloperConsole from '../../components/DeveloperConsole';
import Link from 'next/link';
import { API_BASE_URL } from '../../lib/api';

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  const wallet = isConnected && address ? address : '0xAbC1234567890123456789012345678901234567';
  const [agents, setAgents] = useState([]);
  const [intentsHistory, setIntentsHistory] = useState([]);
  const [activeResult, setActiveResult] = useState<any>(null);
  const [activeBlueprint, setActiveBlueprint] = useState<any>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [overrideMinRisk, setOverrideMinRisk] = useState<number | null>(null);
  const [overrideMinTvl, setOverrideMinTvl] = useState<number | null>(null);
  const [overrideMaxSlippage, setOverrideMaxSlippage] = useState<number | null>(null);
  const [overrideMaxGas, setOverrideMaxGas] = useState<number | null>(null);

  const [activeTab, setActiveTab] = useState<'investor' | 'developer'>('investor');

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return;
    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession) {
          setSession(currentSession);
        } else {
          const { data } = await supabase.auth.signInAnonymously();
          if (data?.session) setSession(data.session);
        }
      } catch (err) {
        console.error('Error initializing Supabase Auth:', err);
      }
    };
    initAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchAgents();
    fetchIntents();
  }, [wallet, session]);

  useEffect(() => {
    if (activeBlueprint) {
      setOverrideMinRisk(activeBlueprint.policies?.minProtocolRiskScore ?? 75);
      setOverrideMinTvl((activeBlueprint.policies?.minTvlUsd ?? 50000000) / 1000000);
      setOverrideMaxSlippage(activeBlueprint.policies?.maxSlippagePct ?? 0.5);
      setOverrideMaxGas(activeBlueprint.policies?.maxGasPerTxUsd ?? 5);
    } else {
      setOverrideMinRisk(null);
      setOverrideMinTvl(null);
      setOverrideMaxSlippage(null);
      setOverrideMaxGas(null);
    }
  }, [activeBlueprint]);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return;
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        showNotification(`Database updated: ${payload.table} changed`, 'info');
        fetchAgents();
        fetchIntents();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [wallet, session]);

  const getAuthHeaders = () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
    return headers;
  };

  const fetchAgents = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/agents`, { headers: getAuthHeaders() });
      if (res.ok) setAgents(await res.json());
    } catch (err) { console.error('Error fetching agents:', err); }
  };

  const fetchIntents = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/intents?wallet=${wallet}`, { headers: getAuthHeaders() });
      if (res.ok) setIntentsHistory(await res.json());
    } catch (err) { console.error('Error fetching intents:', err); }
  };

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/seed`, { method: 'POST', headers: getAuthHeaders() });
      if (res.ok) { showNotification('Database seeded successfully!', 'success'); fetchAgents(); }
    } catch (err) { console.error('Error seeding database:', err); }
    finally { setIsSeeding(false); }
  };

  const handleOrchestrateIntent = async (prompt: string, policies: any) => {
    setIsLoading(true);
    setActiveResult(null);
    setActiveBlueprint(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/intents`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ walletAddress: wallet, prompt, policies, dryRun: true }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to process intent'); }
      const result = await res.json();
      setActiveBlueprint(result);
      showNotification('Execution blueprint generated. Review below.', 'success');
    } catch (err: any) {
      showNotification(err.message || 'Error processing intent', 'error');
    } finally { setIsLoading(false); }
  };

  const handleConfirmBlueprint = async () => {
    if (!activeBlueprint) return;
    setIsConfirming(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/intents/${activeBlueprint.intentId}/confirm`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ policies: { minProtocolRiskScore: overrideMinRisk, minTvlUsd: overrideMinTvl ? overrideMinTvl * 1000000 : undefined, maxSlippagePct: overrideMaxSlippage, maxGasPerTxUsd: overrideMaxGas } }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to confirm intent'); }
      const result = await res.json();
      if (result.isGuardrail) { showNotification(result.message, 'success'); setActiveBlueprint(null); fetchIntents(); return; }
      const tasksMap = result.plan.tasks.map((task: any) => {
        const completionLog = result.auditTrail.find((log: any) => log.event === 'execution_completed' && log.details?.taskId === task.id);
        const agentLog = result.auditTrail.find((log: any) => log.event === 'agent_selected' && log.details?.taskId === task.id);
        return {
          id: task.id, name: task.name,
          status: completionLog ? 'completed' : 'pending',
          winningAgentId: agentLog?.details?.selectedAgentId || null,
          bidAmount: agentLog?.details?.evaluations?.find((e: any) => e.agentId === agentLog?.details?.selectedAgentId)?.score ? '1.15' : '0.45',
          txHash: completionLog?.details?.txHash || null,
        };
      });
      setActiveResult({ tasks: tasksMap, auditLogs: result.auditTrail, explanation: result.explanation });
      setActiveBlueprint(null);
      fetchIntents(); fetchAgents();
      showNotification('Blueprint approved and signed! Settlement completed.', 'success');
    } catch (err: any) {
      showNotification(err.message || 'Error executing blueprint', 'error');
    } finally { setIsConfirming(false); }
  };

  const handleCancelBlueprint = () => {
    setActiveBlueprint(null);
    showNotification('Blueprint plan declined.', 'info');
  };

  const totalVolume = agents.reduce((acc, agent: any) => acc + parseFloat(agent.totalVolumeUsd || '0'), 0);
  const avgSuccess = agents.length > 0 ? agents.reduce((acc, agent: any) => acc + parseFloat(agent.successRatePct || '0'), 0) / agents.length : 100;
  const activeAgents = agents.filter((agent: any) => agent.active).length;

  return (
    <div className="min-h-screen bg-[#000000] text-[#f4f4f5] font-sans">

      {/* ── Header ── */}
      <header className="border-b border-[#1c1c1e] sticky top-0 z-40 bg-[#000000]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-6 h-6 border border-[#f4f4f5] flex items-center justify-center">
                <span className="text-[9px] font-mono font-bold text-[#f4f4f5] leading-none select-none">H</span>
              </div>
              <span className="text-sm font-medium text-[#f4f4f5]">Helix</span>
            </Link>
            {/* Tab switcher — inline in nav */}
            <div className="hidden md:flex items-center gap-0 border-l border-[#1c1c1e] pl-6">
              <button
                id="tab-investor"
                onClick={() => setActiveTab('investor')}
                className={`text-[11px] font-mono px-4 py-1.5 border-b-2 transition-colors duration-150 ${
                  activeTab === 'investor'
                    ? 'border-[#f4f4f5] text-[#f4f4f5]'
                    : 'border-transparent text-[#71717a] hover:text-[#a1a1aa]'
                }`}
              >
                Investor Terminal
              </button>
              <button
                id="tab-developer"
                onClick={() => setActiveTab('developer')}
                className={`text-[11px] font-mono px-4 py-1.5 border-b-2 transition-colors duration-150 ${
                  activeTab === 'developer'
                    ? 'border-[#f4f4f5] text-[#f4f4f5]'
                    : 'border-transparent text-[#71717a] hover:text-[#a1a1aa]'
                }`}
              >
                Developer Console
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="seed-db-btn"
              onClick={handleSeedDatabase}
              disabled={isSeeding}
              className="hidden md:flex items-center gap-1.5 text-[11px] font-mono text-[#71717a] border border-[#1c1c1e] px-3 py-1.5 hover:border-[#3f3f46] hover:text-[#a1a1aa] transition-colors duration-150 disabled:opacity-40"
            >
              <Database className="w-3 h-3" />
              {isSeeding ? 'Seeding…' : 'Seed DB'}
            </button>

            {isConnected ? (
              <button
                id="wallet-disconnect-btn"
                onClick={() => disconnect()}
                className="flex items-center gap-2 text-[11px] font-mono text-[#71717a] border border-[#1c1c1e] px-3 py-1.5 hover:border-[#3f3f46] hover:text-[#ef4444] transition-colors duration-150"
              >
                <Wallet className="w-3 h-3" />
                <span className="truncate max-w-[120px]">
                  {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : 'Disconnect'}
                </span>
              </button>
            ) : (
              <button
                id="wallet-connect-btn"
                onClick={() => connect({ connector: injected() })}
                className="flex items-center gap-2 text-[11px] font-mono bg-[#f4f4f5] text-[#000000] font-semibold px-4 py-1.5 hover:bg-white transition-colors duration-150"
              >
                <Wallet className="w-3 h-3" />
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile tab switcher */}
      <div className="md:hidden border-b border-[#1c1c1e] flex">
        <button onClick={() => setActiveTab('investor')} className={`flex-1 text-[10px] font-mono py-2.5 border-b-2 transition-colors ${activeTab === 'investor' ? 'border-[#f4f4f5] text-[#f4f4f5]' : 'border-transparent text-[#71717a]'}`}>
          Investor Terminal
        </button>
        <button onClick={() => setActiveTab('developer')} className={`flex-1 text-[10px] font-mono py-2.5 border-b-2 transition-colors ${activeTab === 'developer' ? 'border-[#f4f4f5] text-[#f4f4f5]' : 'border-transparent text-[#71717a]'}`}>
          Developer Console
        </button>
      </div>

      {/* ── Notification Toast ── */}
      {notification && (
        <div className={`fixed top-16 right-6 z-50 flex items-center gap-3 px-4 py-3 border text-[11px] font-mono transition-all duration-200 max-w-xs ${
          notification.type === 'success'
            ? 'bg-[#000000] border-[#abd600] text-[#abd600]'
            : notification.type === 'error'
            ? 'bg-[#000000] border-[#ef4444] text-[#ef4444]'
            : 'bg-[#000000] border-[#3f3f46] text-[#a1a1aa]'
        }`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
          <span className="leading-snug">{notification.message}</span>
        </div>
      )}

      {/* ── Analytics strip ── */}
      <div className="border-b border-[#1c1c1e]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#1c1c1e]">
            {[
              { label: 'Total Volume', value: `$${totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
              { label: 'Avg Success Rate', value: `${avgSuccess.toFixed(2)}%` },
              { label: 'Active Agents', value: `${activeAgents} / ${agents.length}` },
              { label: 'Gas Saved', value: '$1,245.50' },
            ].map(({ label, value }) => (
              <div key={label} className="py-5 px-6 first:pl-0">
                <p className="text-[10px] font-mono text-[#71717a] uppercase tracking-[0.12em] mb-1.5">{label}</p>
                <p className="font-serif text-xl text-[#f4f4f5] leading-none">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-8">

        {activeTab === 'investor' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Left column */}
            <div className="lg:col-span-7 space-y-6">
              <IntentBuilder onSubmit={handleOrchestrateIntent} isLoading={isLoading} />

              {/* Blueprint review panel */}
              {activeBlueprint && (
                <div className="border border-[#1c1c1e] bg-[#09090b]">
                  {/* Panel header */}
                  <div className="flex items-center justify-between border-b border-[#1c1c1e] px-6 py-4">
                    <div>
                      <h3 className="font-serif text-base text-[#f4f4f5]">Confirm Execution Blueprint</h3>
                      <p className="text-[10px] font-mono text-[#71717a] mt-0.5">Review the execution DAG before signing</p>
                    </div>
                    <span className="text-[9px] font-mono uppercase tracking-[0.12em] text-[#a1a1aa] border border-[#3f3f46] px-2 py-1">
                      Awaiting Authorization
                    </span>
                  </div>

                  <div className="p-6 space-y-6">
                    <VisualFlowGraph tasks={activeBlueprint.tasks} />

                    {/* Policies grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-[#1c1c1e] pt-6">
                      <div className="space-y-4">
                        {activeBlueprint.goal?.description && (
                          <div>
                            <p className="text-[10px] font-mono text-[#71717a] uppercase tracking-[0.12em] mb-2">Intent Objective</p>
                            <p className="text-sm text-[#f4f4f5] leading-relaxed">{activeBlueprint.goal.description}</p>
                          </div>
                        )}
                        {activeBlueprint.feeAnalysis && (
                          <div className="border border-[#1c1c1e] p-4 space-y-2">
                            <p className="text-[10px] font-mono text-[#71717a] uppercase tracking-[0.12em]">Projected Yield vs Fees (30d)</p>
                            <div className="grid grid-cols-3 gap-3 font-mono text-xs">
                              <div>
                                <span className="text-[#71717a] block text-[10px]">Fees</span>
                                <span className="text-[#ef4444] font-medium">${activeBlueprint.feeAnalysis.totalEstimatedFeeUsd.toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="text-[#71717a] block text-[10px]">Yield</span>
                                <span className="text-[#22c55e] font-medium">${activeBlueprint.feeAnalysis.projectedYield30d.toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="text-[#71717a] block text-[10px]">Net</span>
                                <span className={`font-medium ${activeBlueprint.feeAnalysis.netYield30d < 0 ? 'text-[#ef4444]' : 'text-[#22c55e]'}`}>
                                  ${activeBlueprint.feeAnalysis.netYield30d.toFixed(2)}
                                </span>
                              </div>
                            </div>
                            {activeBlueprint.feeAnalysis.feeWarning && (
                              <p className="text-[10px] text-[#ef4444] font-mono pt-1">⚠ {activeBlueprint.feeAnalysis.feeWarning}</p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <p className="text-[10px] font-mono text-[#71717a] uppercase tracking-[0.12em]">Adjust Plan Policies</p>
                        <div className="space-y-3 font-mono text-[11px]">
                          {[
                            { label: 'Min Protocol Risk', value: `${overrideMinRisk}/100`, min: 50, max: 95, current: overrideMinRisk ?? 75, setter: setOverrideMinRisk },
                            { label: 'Min TVL', value: `$${overrideMinTvl}M`, min: 10, max: 200, current: overrideMinTvl ?? 50, setter: setOverrideMinTvl },
                            { label: 'Max Slippage', value: `${overrideMaxSlippage}%`, min: 0.1, max: 1.5, step: 0.1, current: overrideMaxSlippage ?? 0.5, setter: setOverrideMaxSlippage },
                            { label: 'Max Gas Cap', value: `$${overrideMaxGas}`, min: 1, max: 20, current: overrideMaxGas ?? 5, setter: setOverrideMaxGas },
                          ].map(({ label, value, min, max, step, current, setter }) => (
                            <div key={label} className="space-y-1">
                              <div className="flex justify-between text-[10px]">
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
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 border-t border-[#1c1c1e] pt-5">
                      <button
                        id="decline-blueprint-btn"
                        onClick={handleCancelBlueprint}
                        disabled={isConfirming}
                        className="flex-1 py-3 text-[11px] font-mono text-[#71717a] border border-[#1c1c1e] hover:border-[#3f3f46] hover:text-[#f4f4f5] transition-colors duration-150 disabled:opacity-40"
                      >
                        Decline Plan
                      </button>
                      <button
                        id="sign-blueprint-btn"
                        onClick={handleConfirmBlueprint}
                        disabled={isConfirming}
                        className="flex-1 py-3 text-[11px] font-mono bg-[#f4f4f5] text-[#000000] font-semibold hover:bg-white transition-colors duration-150 disabled:opacity-40 flex items-center justify-center gap-2"
                      >
                        {isConfirming ? (
                          <>
                            <span className="w-3 h-3 border border-[#000000] border-t-transparent rounded-full animate-spin" />
                            Signing…
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Sign &amp; Execute
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Execution result */}
              {activeResult && (
                <ExecutionTimeline
                  tasks={activeResult.tasks}
                  auditLogs={activeResult.auditLogs}
                  explanation={activeResult.explanation}
                />
              )}

              {/* Intents history */}
              <div className="border border-[#1c1c1e]">
                <div className="border-b border-[#1c1c1e] px-6 py-4">
                  <h3 className="font-serif text-base text-[#f4f4f5]">Intent History</h3>
                </div>
                {intentsHistory.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <p className="text-[11px] font-mono text-[#71717a]">No past intents for this wallet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#1c1c1e] max-h-72 overflow-y-auto">
                    {intentsHistory.map((intent: any) => (
                      <div key={intent.id} className="px-6 py-3 flex items-center justify-between gap-4 hover:bg-[#09090b] transition-colors duration-100">
                        <div className="space-y-0.5 min-w-0">
                          <p className="text-xs text-[#f4f4f5] truncate max-w-[280px] md:max-w-[420px]">
                            {intent.goal?.description || 'Yield Optimization'}
                          </p>
                          <div className="flex gap-3 text-[10px] font-mono text-[#71717a]">
                            <span>{intent.type}</span>
                            <span>{new Date(intent.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                        <span className={`text-[9px] font-mono uppercase tracking-[0.1em] px-2 py-1 border flex-shrink-0 ${
                          intent.status === 'completed' ? 'border-[#22c55e]/30 text-[#22c55e]'
                          : intent.status === 'failed' ? 'border-[#ef4444]/30 text-[#ef4444]'
                          : intent.status === 'draft' ? 'border-[#3b82f6]/30 text-[#3b82f6]'
                          : 'border-[#3f3f46] text-[#71717a]'
                        }`}>
                          {intent.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right column */}
            <div className="lg:col-span-5 space-y-6">
              {agents.length === 0 ? (
                <div className="border border-dashed border-[#1c1c1e] p-10 text-center">
                  <p className="text-[11px] font-mono text-[#71717a] mb-4">No agents registered.</p>
                  <button
                    id="seed-agents-btn"
                    onClick={handleSeedDatabase}
                    className="text-[11px] font-mono bg-[#f4f4f5] text-[#000000] px-5 py-2 hover:bg-white transition-colors duration-150"
                  >
                    Seed Default Agents
                  </button>
                </div>
              ) : (
                <AgentMarketplace agents={agents} />
              )}

              <GuardrailsPanel onTelemetryUpdated={fetchIntents} showNotification={showNotification} />

              {/* Settlement guard info */}
              <div className="border border-[#1c1c1e] p-6">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-4 h-4 text-[#71717a]" />
                  <h4 className="font-serif text-sm text-[#f4f4f5]">X Layer Settlement Guard</h4>
                </div>
                <p className="text-[11px] font-sans text-[#71717a] leading-relaxed">
                  Every deposit, yield rebalance, and transfer is held in isolated escrow smart contracts on the X Layer chain.
                  Rewards are distributed only after cryptographic verification signatures are anchored on-chain.
                </p>
              </div>
            </div>
          </div>

        ) : (
          /* Developer Console layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7">
              <DeveloperConsole onAgentRegistered={fetchAgents} showNotification={showNotification} />
            </div>
            <div className="lg:col-span-5">
              <AgentMarketplace agents={agents} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
