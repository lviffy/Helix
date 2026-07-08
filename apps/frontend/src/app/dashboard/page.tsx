'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, HelpCircle, Activity, Star, RefreshCw, Layers, Database, Wallet } from 'lucide-react';
import IntentBuilder from '../../components/IntentBuilder';
import ExecutionTimeline from '../../components/ExecutionTimeline';
import AgentMarketplace from '../../components/AgentMarketplace';
import { supabase } from '../../lib/supabase';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  const wallet = isConnected && address ? address : '0xAbC1234567890123456789012345678901234567';
  const [agents, setAgents] = useState([]);
  const [intentsHistory, setIntentsHistory] = useState([]);
  const [activeResult, setActiveResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

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
    try {
      const res = await fetch('http://localhost:4000/api/intents', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ walletAddress: wallet, prompt, policies }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to process intent');
      }

      const result = await res.json();
      
      // Construct a mock list of tasks to render execution timeline
      const tasksMap = result.plan.tasks.map((task: any) => {
        // Find matching status / hash from logs
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
          bidAmount: agentLog?.details?.evaluations?.find((e: any) => e.agentId === agentLog?.details?.selectedAgentId)?.score ? '1.15' : '0.45', // simulated fee quotes
          txHash: completionLog?.details?.txHash || null,
        };
      });

      // Override active result details
      setActiveResult({
        tasks: tasksMap,
        auditLogs: result.auditTrail,
        explanation: result.explanation,
      });

      fetchIntents();
      fetchAgents(); // update total volumes/metrics
      showNotification('Intent executed successfully!', 'success');
    } catch (err: any) {
      showNotification(err.message || 'Error processing intent', 'error');
    } finally {
      setIsLoading(false);
    }
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

      {/* Content layout */}
      <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Intent input and History */}
        <div className="lg:col-span-7 space-y-8">
          <IntentBuilder onSubmit={handleOrchestrateIntent} isLoading={isLoading} />

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

        {/* Right column: Leaderboards and rankings */}
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
    </main>
  );
}
