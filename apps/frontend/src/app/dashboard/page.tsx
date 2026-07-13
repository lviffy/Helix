'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, HelpCircle, Activity, Star, RefreshCw, Layers, Database, Wallet, ArrowRight, XCircle, CheckCircle2 } from 'lucide-react';
import IntentBuilder from '../../components/IntentBuilder';
import ExecutionTimeline from '../../components/ExecutionTimeline';
import AgentMarketplace from '../../components/AgentMarketplace';
import VisualFlowGraph from '../../components/VisualFlowGraph';
import GuardrailsPanel from '../../components/GuardrailsPanel';
import { supabase } from '../../lib/supabase';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import DeveloperConsole from '../../components/DeveloperConsole';

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

  // States for interactive visual policy overrides
  const [overrideMinRisk, setOverrideMinRisk] = useState<number | null>(null);
  const [overrideMinTvl, setOverrideMinTvl] = useState<number | null>(null);
  const [overrideMaxSlippage, setOverrideMaxSlippage] = useState<number | null>(null);
  const [overrideMaxGas, setOverrideMaxGas] = useState<number | null>(null);

  const [activeTab, setActiveTab] = useState<'investor' | 'developer'>('investor');

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Initialize Supabase Auth Session (Auto anonymous login for demo)
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('⚠️ Supabase URL/Key missing. Bypassing auth state.');
      return;
    }

    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession) {
          setSession(currentSession);
        } else {
          const { data, error } = await supabase.auth.signInAnonymously();
          if (data?.session) {
            setSession(data.session);
          }
        }
      } catch (err) {
        console.error('Error initializing Supabase Auth:', err);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch agents and intents on mount or wallet/session change
  useEffect(() => {
    fetchAgents();
    fetchIntents();
  }, [wallet, session]);

  // Synchronize blueprint policies with visual sliders state
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

  // Supabase Realtime DB changes subscription
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return;
    }

    // Subscribe to public schema events
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          console.log('🔄 Realtime update received:', payload);
          showNotification(`Database updated: ${payload.table} changed`, 'info');
          fetchAgents();
          fetchIntents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [wallet, session]);

  const getAuthHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    return headers;
  };

  const fetchAgents = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/agents', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setAgents(data);
      }
    } catch (err) {
      console.error('Error fetching agents:', err);
    }
  };

  const fetchIntents = async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/intents?wallet=${wallet}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setIntentsHistory(data);
      }
    } catch (err) {
      console.error('Error fetching intents:', err);
    }
  };

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch('http://localhost:4000/api/seed', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        showNotification('Database seeded successfully!', 'success');
        fetchAgents();
      }
    } catch (err) {
      console.error('Error seeding database:', err);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleOrchestrateIntent = async (prompt: string, policies: any) => {
    setIsLoading(true);
    setActiveResult(null);
    setActiveBlueprint(null);
    try {
      const res = await fetch('http://localhost:4000/api/intents', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ walletAddress: wallet, prompt, policies, dryRun: true }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to process intent');
      }

      const result = await res.json();
      
      // Save parsed blueprint details to state
      setActiveBlueprint(result);
      showNotification('Execution blueprint generated. Please review below.', 'success');
    } catch (err: any) {
      showNotification(err.message || 'Error processing intent', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmBlueprint = async () => {
    if (!activeBlueprint) return;
    setIsConfirming(true);
    try {
      const res = await fetch(`http://localhost:4000/api/intents/${activeBlueprint.intentId}/confirm`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          policies: {
            minProtocolRiskScore: overrideMinRisk,
            minTvlUsd: overrideMinTvl ? overrideMinTvl * 1000000 : undefined,
            maxSlippagePct: overrideMaxSlippage,
            maxGasPerTxUsd: overrideMaxGas,
          }
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to confirm intent');
      }

      const result = await res.json();

      if (result.isGuardrail) {
        showNotification(result.message, 'success');
        setActiveBlueprint(null);
        fetchIntents();
        return;
      }

      // Construct a mock list of tasks to render execution timeline
      const tasksMap = result.plan.tasks.map((task: any) => {
        const completionLog = result.auditTrail.find(
          (log: any) => log.event === 'execution_completed' && log.details?.taskId === task.id
        );
        const agentLog = result.auditTrail.find(
          (log: any) => log.event === 'agent_selected' && log.details?.taskId === task.id
        );
        const status = completionLog ? 'completed' : 'pending';

        return {
          id: task.id,
          name: task.name,
          status,
          winningAgentId: agentLog?.details?.selectedAgentId || null,
          bidAmount: agentLog?.details?.evaluations?.find((e: any) => e.agentId === agentLog?.details?.selectedAgentId)?.score ? '1.15' : '0.45',
          txHash: completionLog?.details?.txHash || null,
        };
      });

      setActiveResult({
        tasks: tasksMap,
        auditLogs: result.auditTrail,
        explanation: result.explanation,
      });

      setActiveBlueprint(null);
      fetchIntents();
      fetchAgents();
      showNotification('Blueprint approved and signed! Settlement completed.', 'success');
    } catch (err: any) {
      showNotification(err.message || 'Error executing blueprint', 'error');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancelBlueprint = () => {
    setActiveBlueprint(null);
    showNotification('Blueprint plan declined.', 'info');
  };

  return (
    <main className="min-h-screen bg-black text-foreground font-sans pb-16">
      {/* Header bar */}
      <header className="border-b border-border bg-card/85 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary text-black font-black flex items-center justify-center rounded-md text-sm select-none">
              H
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>Helix</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface-muted text-primary font-bold uppercase border border-border">
                  v2.0
                </span>
              </h1>
              <p className="text-[9px] text-gray-light font-mono font-medium">Coordinated Agent Finance OS</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleSeedDatabase}
              disabled={isSeeding}
              className="text-xs font-semibold px-3.5 py-2 border border-border bg-surface-muted hover:bg-border text-white rounded-md transition-all flex items-center gap-1.5 disabled:opacity-50 font-mono"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isSeeding ? 'Seeding...' : 'Seed DB'}</span>
            </button>

            {isConnected ? (
              <button
                onClick={() => disconnect()}
                className="flex items-center space-x-2 bg-card border border-border hover:bg-border hover:text-red-400 rounded-md px-3 py-2 text-xs font-mono text-white transition-all cursor-pointer"
                title="Disconnect Wallet"
              >
                <Wallet className="w-4 h-4 text-primary" />
                <span className="truncate max-w-[140px] md:max-w-none">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Disconnect'}
                </span>
              </button>
            ) : (
              <button
                onClick={() => connect({ connector: injected() })}
                className="flex items-center space-x-2 bg-primary hover:bg-lime-bright text-black font-bold rounded-md px-3.5 py-2 text-xs font-mono transition-all cursor-pointer shadow-md"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Notifications Toast */}
      {notification && (
        <div className={`fixed top-20 right-6 z-50 p-4 rounded-lg border shadow-xl flex items-center gap-3 animate-in slide-in-from-right duration-300 font-sans text-xs font-bold ${
          notification.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
            : notification.type === 'error'
            ? 'bg-red-500/10 border-red-500/30 text-red-400'
            : 'bg-primary/10 border-primary/30 text-primary'
        }`}>
          <div className="w-2 h-2 rounded-full bg-current animate-ping" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Analytics Summary */}
      <div className="max-w-7xl mx-auto px-6 mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in duration-300">
        <div className="bg-card border border-border rounded-lg p-4 space-y-1">
          <span className="text-[10px] text-gray-light uppercase tracking-wider font-mono font-bold">Total Volume</span>
          <p className="text-xl font-bold text-white font-mono">
            ${agents.reduce((acc, agent: any) => acc + parseFloat(agent.totalVolumeUsd || '0'), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 space-y-1">
          <span className="text-[10px] text-gray-light uppercase tracking-wider font-mono font-bold">Success Rate</span>
          <p className="text-xl font-bold text-emerald-400 font-mono">
            {(agents.length > 0 ? agents.reduce((acc, agent: any) => acc + parseFloat(agent.successRatePct || '0'), 0) / agents.length : 100).toFixed(2)}%
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 space-y-1">
          <span className="text-[10px] text-gray-light uppercase tracking-wider font-mono font-bold">Active Agents</span>
          <p className="text-xl font-bold text-primary font-mono">
            {agents.filter((agent: any) => agent.active).length} / {agents.length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 space-y-1">
          <span className="text-[10px] text-gray-light uppercase tracking-wider font-mono font-bold">Gas Saved</span>
          <p className="text-xl font-bold text-cyan-400 font-mono">$1,245.50</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="max-w-7xl mx-auto px-6 mt-8 flex border-b border-border text-xs font-mono">
        <button
          onClick={() => setActiveTab('investor')}
          className={`pb-2.5 px-4 font-bold border-b-2 transition-all ${
            activeTab === 'investor' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-gray-light hover:text-white'
          }`}
        >
          INVESTOR TERMINAL
        </button>
        <button
          onClick={() => setActiveTab('developer')}
          className={`pb-2.5 px-4 font-bold border-b-2 transition-all ${
            activeTab === 'developer' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-gray-light hover:text-white'
          }`}
        >
          DEVELOPER CONSOLE
        </button>
      </div>

      {activeTab === 'investor' ? (
        /* Content layout - Investor Terminal */
        <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left column: Intent input, Blueprint Verification, and History */}
          <div className="lg:col-span-7 space-y-8">
            <IntentBuilder onSubmit={handleOrchestrateIntent} isLoading={isLoading} />

          {/* Visual Blueprint Verification Panel */}
          {activeBlueprint && (
            <div className="bg-card border border-border rounded-lg p-6 space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-sans">
                    <Layers className="w-4 h-4 text-primary" />
                    <span>Confirm Financial Execution Blueprint</span>
                  </h3>
                  <p className="text-[10px] text-gray-light font-mono font-medium">Verify execution DAG and policy rules before signing</p>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                  Awaiting Authorization
                </span>
              </div>

              {/* Custom SVG flow graph */}
              <VisualFlowGraph tasks={activeBlueprint.tasks} />

              {/* Policies, Overrides, and Fee Projection display */}
              <div className="p-4 bg-surface-deep border border-border rounded-md grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-sans">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <p className="text-gray-medium font-bold uppercase tracking-wider text-[8px] font-mono">Intent Objective</p>
                    <p className="text-white font-bold leading-normal">{activeBlueprint.goal?.description}</p>
                  </div>

                  {activeBlueprint.feeAnalysis && (
                    <div className="p-3 bg-card border border-border rounded space-y-2">
                      <p className="text-gray-medium font-bold uppercase tracking-wider text-[8px] font-mono">Projected Yield vs Fees (30 Days)</p>
                      <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                        <div>Fees: <span className="text-red-400 font-bold">${activeBlueprint.feeAnalysis.totalEstimatedFeeUsd.toFixed(2)}</span></div>
                        <div>Yield: <span className="text-emerald-400 font-bold">${activeBlueprint.feeAnalysis.projectedYield30d.toFixed(2)}</span></div>
                        <div>Net: <span className={`font-bold ${activeBlueprint.feeAnalysis.netYield30d < 0 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>${activeBlueprint.feeAnalysis.netYield30d.toFixed(2)}</span></div>
                      </div>
                      {activeBlueprint.feeAnalysis.feeWarning && (
                        <p className="text-[9px] text-red-400 font-medium font-mono leading-tight pt-1">
                          ⚠️ {activeBlueprint.feeAnalysis.feeWarning}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <p className="text-gray-medium font-bold uppercase tracking-wider text-[8px] font-mono">Adjust Plan Policies & Guardrails</p>
                  <div className="space-y-2.5 text-[10px] font-mono">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Min Protocol Risk:</span>
                        <span className="text-primary font-bold">{overrideMinRisk}/100</span>
                      </div>
                      <input
                        type="range" min="50" max="95" value={overrideMinRisk ?? 75}
                        onChange={(e) => setOverrideMinRisk(Number(e.target.value))}
                        className="w-full accent-primary bg-border rounded-md appearance-none h-1 cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Min TVL / Liquidity:</span>
                        <span className="text-primary font-bold">${overrideMinTvl}M</span>
                      </div>
                      <input
                        type="range" min="10" max="200" value={overrideMinTvl ?? 50}
                        onChange={(e) => setOverrideMinTvl(Number(e.target.value))}
                        className="w-full accent-primary bg-border rounded-md appearance-none h-1 cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Max Slippage Limit:</span>
                        <span className="text-primary font-bold">{overrideMaxSlippage}%</span>
                      </div>
                      <input
                        type="range" min="0.1" max="1.5" step="0.1" value={overrideMaxSlippage ?? 0.5}
                        onChange={(e) => setOverrideMaxSlippage(Number(e.target.value))}
                        className="w-full accent-primary bg-border rounded-md appearance-none h-1 cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Max Gas Cost cap:</span>
                        <span className="text-primary font-bold">${overrideMaxGas}</span>
                      </div>
                      <input
                        type="range" min="1" max="20" value={overrideMaxGas ?? 5}
                        onChange={(e) => setOverrideMaxGas(Number(e.target.value))}
                        className="w-full accent-primary bg-border rounded-md appearance-none h-1 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Cancel / Approve Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCancelBlueprint}
                  disabled={isConfirming}
                  className="flex-1 py-3 border border-border bg-transparent hover:bg-surface-muted text-white rounded-md text-xs font-bold transition-all disabled:opacity-50"
                >
                  Decline Plan
                </button>
                <button
                  onClick={handleConfirmBlueprint}
                  disabled={isConfirming}
                  className="flex-1 py-3 bg-primary hover:bg-lime-bright text-black rounded-md text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md"
                >
                  {isConfirming ? (
                     <div className="flex items-center gap-2">
                       <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                       <span>Signing Blueprint...</span>
                     </div>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Sign & Execute Blueprint</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Active timeline rendering */}
          {activeResult && (
            <div className="animate-in fade-in slide-in-from-bottom duration-300">
              <ExecutionTimeline
                tasks={activeResult.tasks}
                auditLogs={activeResult.auditLogs}
                explanation={activeResult.explanation}
              />
            </div>
          )}

          {/* User History */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <span>Intents History Log</span>
            </h3>

            {intentsHistory.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-light italic border border-dashed border-border rounded-md bg-surface-deep">
                No past intents found for this wallet. Create one above!
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {intentsHistory.map((intent: any) => (
                  <div
                    key={intent.id}
                    className="p-3 bg-surface-deep border border-border rounded-md flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white truncate max-w-[280px] md:max-w-[400px]">
                        {intent.goal?.description || 'Yield Optimization'}
                      </p>
                      <div className="flex gap-2 text-[9px] text-gray-light font-mono">
                        <span>Type: {intent.type}</span>
                        <span>•</span>
                        <span>{new Date(intent.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono ${
                      intent.status === 'completed' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : intent.status === 'failed'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : intent.status === 'draft'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                    }`}>
                      {intent.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Leaderboards, active telemetry, and safety details */}
        <div className="lg:col-span-5 space-y-8">
          {agents.length === 0 ? (
            <div className="p-8 text-center bg-card border border-dashed border-border rounded-md">
              <p className="text-xs text-gray-light italic mb-4">No marketplace agents registered.</p>
              <button
                onClick={handleSeedDatabase}
                className="text-xs font-semibold px-4 py-2 bg-primary text-black rounded-md hover:bg-lime-bright transition-all shadow-md"
              >
                Seed Default Agents
              </button>
            </div>
          ) : (
            <AgentMarketplace agents={agents} />
          )}

          {/* Active Guardrails telemetry feed simulator */}
          <GuardrailsPanel onTelemetryUpdated={fetchIntents} showNotification={showNotification} />

          {/* Protocol safety info widget */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>X Layer Settlement Guard</span>
            </h4>
            <p className="text-[11px] text-gray-light leading-relaxed">
              Every deposit, yield rebalance, and transfer is held in isolated escrow smart contracts on the X Layer chain. Rewards are paid to winning agents only after verification signatures are successfully anchored on-chain.
            </p>
          </div>
        </div>
      </div>
      ) : (
        /* Content layout - Developer Console */
        <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-300">
          <div className="lg:col-span-7 space-y-8">
            <DeveloperConsole onAgentRegistered={fetchAgents} showNotification={showNotification} />
          </div>
          <div className="lg:col-span-5 space-y-8">
            <AgentMarketplace agents={agents} />
          </div>
        </div>
      )}
    </main>
  );
}
