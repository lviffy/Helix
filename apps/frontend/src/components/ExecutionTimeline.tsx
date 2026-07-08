'use client';

import React from 'react';
import { CheckCircle2, Circle, AlertTriangle, ShieldCheck, Server, ShieldAlert } from 'lucide-react';

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
        <div className="p-5 bg-surface-deep border border-border rounded-lg animate-in slide-in-from-bottom duration-300">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-surface-muted text-primary rounded-md border border-border">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-primary">{explanation.title || 'Execution Summary'}</h3>
              <p className="text-xs text-gray-light leading-relaxed">{explanation.summary}</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Main execution steps list */}
      <div className="bg-card border border-border rounded-lg p-6 relative">
        <h2 className="text-base font-bold text-white mb-6 flex items-center gap-2">
          <Server className="w-5 h-5 text-primary" />
          <span>Execution Graph Timeline</span>
        </h2>

        <div className="relative border-l border-border pl-6 ml-3 space-y-8">
          {tasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const isExecuting = task.status === 'executing' || task.status === 'bidding';
            const isFailed = task.status === 'failed';

            // Find matching selection logs for this task
            const selectionLog = bidEvents.find((log) => log.details?.taskId === task.id);
            const evaluations = selectionLog?.details?.evaluations || [];

            return (
              <div key={task.id} className="relative group animate-in fade-in duration-300">
                {/* Node icon indicators */}
                <div className="absolute -left-[35px] top-0.5">
                  {isCompleted ? (
                    <div className="p-1 bg-black border border-emerald-500 text-emerald-400 rounded-full">
                      <CheckCircle2 className="w-4 h-4 fill-emerald-500/10" />
                    </div>
                  ) : isFailed ? (
                    <div className="p-1 bg-black border border-red-500 text-red-400 rounded-full">
                      <AlertTriangle className="w-4 h-4 fill-red-500/10" />
                    </div>
                  ) : isExecuting ? (
                    <div className="p-1 bg-black border border-primary text-primary rounded-full animate-pulse">
                      <Circle className="w-4 h-4 fill-primary/10" />
                    </div>
                  ) : (
                    <div className="p-1 bg-black border border-border text-gray-light rounded-full">
                      <Circle className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Node details */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-bold text-white capitalize font-sans">
                      {task.name.replace('_', ' ')}
                    </span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono ${
                      isCompleted 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : isFailed 
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                        : isExecuting 
                        ? 'bg-primary/10 text-primary border border-primary/20 animate-pulse'
                        : 'bg-surface-muted border border-border text-gray-light'
                    }`}>
                      {task.status}
                    </span>
                  </div>

                  {/* Task details */}
                  {isCompleted && task.winningAgentId && (
                    <div className="text-xs text-gray-light space-y-1 bg-surface-deep p-3 rounded-md border border-border font-sans">
                      <div className="flex items-center justify-between text-gray-light text-[10px]">
                        <span>Executing Agent:</span>
                        <span className="text-primary font-bold font-mono">{task.winningAgentId}</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-light text-[10px]">
                        <span>Fee Charged:</span>
                        <span className="text-white font-bold font-mono">${task.bidAmount}</span>
                      </div>
                      {task.txHash && (
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-gray-light">Transaction Hash:</span>
                          <span className="text-white font-mono select-all truncate max-w-[150px]">{task.txHash}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Auction bidding logging */}
                  {evaluations.length > 0 && (
                    <div className="mt-3 p-3.5 bg-surface-deep border border-border rounded-md space-y-3">
                      <div className="text-[9px] font-bold text-primary tracking-wider uppercase font-mono flex items-center justify-between">
                        <span>Agent Bidding Auction results</span>
                        <span className="text-gray-light font-normal">Decision scoring</span>
                      </div>
                      
                      <div className="space-y-2">
                        {evaluations.map((bid: any) => (
                          <div key={bid.agentId} className={`flex flex-col p-2.5 rounded border ${
                            bid.agentId === task.winningAgentId 
                              ? 'bg-primary/5 border-primary/20' 
                              : bid.rejected 
                              ? 'bg-destructive/5 border-destructive/20 opacity-70'
                              : 'bg-surface-muted/50 border-border'
                          }`}>
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-white font-sans">{bid.agentId}</span>
                              {bid.rejected ? (
                                <span className="text-[9px] text-destructive flex items-center gap-1 font-bold bg-destructive/10 px-2 py-0.5 rounded border border-destructive/20 font-mono">
                                  <ShieldAlert className="w-3 h-3" /> Policy Blocked
                                </span>
                              ) : (
                                <span className={`text-[9px] font-mono font-bold ${
                                  bid.agentId === task.winningAgentId ? 'text-primary' : 'text-gray-light'
                                }`}>
                                  Score: {bid.score}/100
                                </span>
                              )}
                            </div>

                            {bid.rejected ? (
                              <p className="text-[10px] text-gray-light mt-1 leading-relaxed font-sans">{bid.reason}</p>
                            ) : (
                              <div className="grid grid-cols-5 gap-1 text-[9px] mt-2 pt-2 border-t border-border text-gray-light font-mono">
                                <div>Rep: <span className="text-white font-bold">{bid.breakdown.reputation}</span></div>
                                <div>Risk: <span className="text-white font-bold">{bid.breakdown.protocolRisk}</span></div>
                                <div>Liq: <span className="text-white font-bold">{bid.breakdown.liquidity}</span></div>
                                <div>Slip: <span className="text-white font-bold">{bid.breakdown.slippage}</span></div>
                                <div>Cost: <span className="text-white font-bold">{bid.breakdown.cost}</span></div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {selectionLog?.details?.reasoning && (
                        <p className="text-[10px] text-gray-light leading-relaxed italic mt-1.5 border-l-2 border-primary pl-2 font-sans">
                          &quot;{selectionLog.details.reasoning}&quot;
                        </p>
                      )}
                    </div>
                  )}

                  {isFailed && task.errorReason && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-md flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="font-sans">{task.errorReason}</span>
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
