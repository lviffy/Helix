'use client';

import React from 'react';
import { CheckCircle2, Circle, AlertTriangle, ShieldCheck, HelpCircle, ArrowRight, Server, Receipt, ShieldAlert } from 'lucide-react';

interface Task {
  id: string;
  name: string;
  status: 'pending' | 'bidding' | 'executing' | 'completed' | 'failed';
  winningAgentId?: string | null;
  bidAmount?: string | null;
  txHash?: string | null;
  errorReason?: string | null;
}

interface AuditLog {
  id: string;
  event: string;
  details: any;
  timestamp: string;
}

interface ExecutionTimelineProps {
  tasks: Task[];
  auditLogs: AuditLog[];
  explanation?: {
    title: string;
    summary: string;
    stepsDescription: string[];
  };
}

export default function ExecutionTimeline({ tasks, auditLogs, explanation }: ExecutionTimelineProps) {
  // Find bid event details for rendering bidding logs
  const bidEvents = auditLogs.filter((log) => log.event === 'agent_selected');

  return (
    <div className="space-y-6">
      {/* 1. Plain-English Explainability Alert */}
      {explanation && (
        <div className="p-5 glass-card bg-cyan-500/5 rounded-2xl border-cyan-500/20 glow-effect animate-in slide-in-from-bottom duration-300">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-cyan-400 glow-text">{explanation.title || 'Execution Summary'}</h3>
              <p className="text-xs text-gray-300 leading-relaxed">{explanation.summary}</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Main execution steps list */}
      <div className="glass-card rounded-2xl p-6 relative">
        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Server className="w-5 h-5 text-purple-400" />
          <span>Execution Graph Timeline</span>
        </h2>

        <div className="relative border-l border-gray-800 pl-6 ml-3 space-y-8">
          {tasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const isExecuting = task.status === 'executing' || task.status === 'bidding';
            const isFailed = task.status === 'failed';

            // Find matching selection logs for this task
            const selectionLog = bidEvents.find((log) => log.details?.taskId === task.id);
            const evaluations = selectionLog?.details?.evaluations || [];

            return (
              <div key={task.id} className="relative group">
                {/* Node icon indicators */}
                <div className="absolute -left-[35px] top-0.5">
                  {isCompleted ? (
                    <div className="p-1 bg-gray-950 border border-emerald-500 text-emerald-400 rounded-full">
                      <CheckCircle2 className="w-4 h-4 fill-emerald-500/10" />
                    </div>
                  ) : isFailed ? (
                    <div className="p-1 bg-gray-950 border border-red-500 text-red-400 rounded-full">
                      <AlertTriangle className="w-4 h-4 fill-red-500/10" />
                    </div>
                  ) : isExecuting ? (
                    <div className="p-1 bg-gray-950 border border-cyan-400 text-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                      <Circle className="w-4 h-4 fill-cyan-400/20" />
                    </div>
                  ) : (
                    <div className="p-1 bg-gray-950 border border-gray-800 text-gray-600 rounded-full">
                      <Circle className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Node details */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-bold text-white capitalize">
                      {task.name.replace('_', ' ')}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      isCompleted 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : isFailed 
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                        : isExecuting 
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-400/20 animate-pulse'
                        : 'bg-gray-900 text-gray-500'
                    }`}>
                      {task.status}
                    </span>
                  </div>

                  {/* Task details */}
                  {isCompleted && task.winningAgentId && (
                    <div className="text-xs text-gray-400 space-y-1 bg-gray-950/40 p-3 rounded-xl border border-gray-900/60">
                      <div className="flex items-center justify-between text-gray-500 text-[10px]">
                        <span>Executing Agent:</span>
                        <span className="text-cyan-400 font-medium">{task.winningAgentId}</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-500 text-[10px]">
                        <span>Fee Charged:</span>
                        <span className="text-white font-medium">${task.bidAmount}</span>
                      </div>
                      {task.txHash && (
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-gray-500">Transaction Hash:</span>
                          <span className="text-purple-400 font-mono select-all truncate max-w-[150px]">{task.txHash}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Auction bidding logging */}
                  {evaluations.length > 0 && (
                    <div className="mt-3 p-3.5 bg-gray-950/80 border border-gray-900 rounded-xl space-y-3">
                      <div className="text-[10px] font-bold text-purple-400 tracking-wider uppercase flex items-center justify-between">
                        <span>Agent Bidding Auction results</span>
                        <span className="text-gray-500">Decision scoring</span>
                      </div>
                      
                      <div className="space-y-2">
                        {evaluations.map((bid: any) => (
                          <div key={bid.agentId} className={`flex flex-col p-2.5 rounded-lg border ${
                            bid.agentId === task.winningAgentId 
                              ? 'bg-cyan-950/20 border-cyan-500/30' 
                              : bid.rejected 
                              ? 'bg-red-950/15 border-red-900/20 opacity-60'
                              : 'bg-gray-900/40 border-gray-900/80'
                          }`}>
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-gray-200">{bid.agentId}</span>
                              {bid.rejected ? (
                                <span className="text-[10px] text-red-400 flex items-center gap-1 font-medium bg-red-950/30 px-2 py-0.5 rounded-full border border-red-900/20">
                                  <ShieldAlert className="w-3 h-3" /> Policy Blocked
                                </span>
                              ) : (
                                <span className={`text-[10px] font-bold ${
                                  bid.agentId === task.winningAgentId ? 'text-cyan-400' : 'text-gray-400'
                                }`}>
                                  Score: {bid.score}/100
                                </span>
                              )}
                            </div>

                            {bid.rejected ? (
                              <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">{bid.reason}</p>
                            ) : (
                              <div className="grid grid-cols-5 gap-1 text-[9px] mt-2 pt-2 border-t border-gray-900 text-gray-500">
                                <div>Rep: <span className="text-gray-300 font-medium">{bid.breakdown.reputation}</span></div>
                                <div>Risk: <span className="text-gray-300 font-medium">{bid.breakdown.protocolRisk}</span></div>
                                <div>Liq: <span className="text-gray-300 font-medium">{bid.breakdown.liquidity}</span></div>
                                <div>Slip: <span className="text-gray-300 font-medium">{bid.breakdown.slippage}</span></div>
                                <div>Cost: <span className="text-gray-300 font-medium">{bid.breakdown.cost}</span></div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {selectionLog?.details?.reasoning && (
                        <p className="text-[10px] text-gray-400 leading-relaxed italic mt-1.5 border-l-2 border-cyan-400 pl-2">
                          &quot;{selectionLog.details.reasoning}&quot;
                        </p>
                      )}
                    </div>
                  )}

                  {isFailed && task.errorReason && (
                    <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-400 text-xs rounded-xl flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{task.errorReason}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
