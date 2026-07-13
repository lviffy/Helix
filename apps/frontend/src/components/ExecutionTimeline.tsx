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
  const bidEvents = auditLogs.filter((log) => log.event === 'agent_selected');

  return (
    <div className="space-y-4">
      {/* Explainability summary */}
      {explanation && (
        <div className="border border-[#1c1c1e] p-5">
          <div className="flex items-start gap-4">
            <ShieldCheck className="w-4 h-4 text-[#71717a] mt-0.5 flex-shrink-0" />
            <div className="space-y-1 min-w-0">
              <h3 className="font-serif text-sm text-[#f4f4f5]">{explanation.title || 'Execution Summary'}</h3>
              <p className="text-[11px] font-sans text-[#71717a] leading-relaxed">{explanation.summary}</p>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="border border-[#1c1c1e]">
        <div className="flex items-center gap-2 border-b border-[#1c1c1e] px-6 py-4">
          <Server className="w-3.5 h-3.5 text-[#71717a]" />
          <h2 className="font-serif text-base text-[#f4f4f5]">Execution Graph Timeline</h2>
        </div>

        <div className="relative border-l border-[#1c1c1e] ml-[3.25rem] divide-y divide-[#1c1c1e]">
          {tasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const isExecuting = task.status === 'executing' || task.status === 'bidding';
            const isFailed = task.status === 'failed';
            const selectionLog = bidEvents.find((log) => log.details?.taskId === task.id);
            const evaluations = selectionLog?.details?.evaluations || [];

            return (
              <div key={task.id} className="relative px-6 py-5">
                {/* Node marker */}
                <div className="absolute -left-[1.6rem] top-5 w-[1.2rem] h-[1.2rem] border border-[#1c1c1e] bg-[#000000] flex items-center justify-center">
                  {isCompleted ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                  ) : isFailed ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
                  ) : isExecuting ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#abd600] animate-pulse" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3f3f46]" />
                  )}
                </div>

                {/* Task header */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <span className="text-sm font-sans font-medium text-[#f4f4f5] capitalize">
                    {task.name.replace('_', ' ')}
                  </span>
                  <span className={`text-[9px] font-mono uppercase tracking-[0.1em] ${
                    isCompleted ? 'text-[#22c55e]'
                    : isFailed ? 'text-[#ef4444]'
                    : isExecuting ? 'text-[#abd600]'
                    : 'text-[#52525b]'
                  }`}>
                    {task.status}
                  </span>
                </div>

                {/* Completed details */}
                {isCompleted && task.winningAgentId && (
                  <div className="border border-[#1c1c1e] divide-y divide-[#1c1c1e] text-[10px] font-mono mb-3">
                    <div className="flex justify-between px-3 py-2">
                      <span className="text-[#71717a]">Executing Agent</span>
                      <span className="text-[#abd600]">{task.winningAgentId}</span>
                    </div>
                    <div className="flex justify-between px-3 py-2">
                      <span className="text-[#71717a]">Fee Charged</span>
                      <span className="text-[#f4f4f5]">${task.bidAmount}</span>
                    </div>
                    {task.txHash && (
                      <div className="flex justify-between px-3 py-2">
                        <span className="text-[#71717a]">Tx Hash</span>
                        <span className="text-[#f4f4f5] select-all truncate max-w-[160px]">{task.txHash}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Auction results */}
                {evaluations.length > 0 && (
                  <div className="border border-[#1c1c1e] space-y-0">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-[#1c1c1e]">
                      <span className="text-[9px] font-mono uppercase tracking-[0.12em] text-[#71717a]">Bidding Auction</span>
                      <span className="text-[9px] font-mono text-[#52525b]">Decision scoring</span>
                    </div>
                    <div className="divide-y divide-[#1c1c1e]">
                      {evaluations.map((bid: any) => (
                        <div key={bid.agentId} className={`px-4 py-3 ${bid.agentId === task.winningAgentId ? 'bg-[#abd600]/3' : ''}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-sans font-medium text-[#f4f4f5]">{bid.agentId}</span>
                            {bid.rejected ? (
                              <span className="text-[9px] font-mono text-[#ef4444] flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3" /> Policy Blocked
                              </span>
                            ) : (
                              <span className={`text-[9px] font-mono ${bid.agentId === task.winningAgentId ? 'text-[#abd600]' : 'text-[#71717a]'}`}>
                                {bid.agentId === task.winningAgentId ? '✓ Selected · ' : ''}Score: {bid.score}/100
                              </span>
                            )}
                          </div>
                          {bid.rejected ? (
                            <p className="text-[10px] font-sans text-[#71717a] leading-relaxed">{bid.reason}</p>
                          ) : (
                            <div className="grid grid-cols-5 gap-2 text-[9px] font-mono text-[#52525b]">
                              {['reputation', 'protocolRisk', 'liquidity', 'slippage', 'cost'].map((k) => (
                                <div key={k}>
                                  <span className="block capitalize text-[8px] mb-0.5">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                                  <span className="text-[#a1a1aa]">{bid.breakdown?.[k]}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {selectionLog?.details?.reasoning && (
                      <div className="border-t border-[#1c1c1e] px-4 py-3">
                        <p className="text-[10px] font-sans text-[#71717a] leading-relaxed italic">
                          "{selectionLog.details.reasoning}"
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Failed reason */}
                {isFailed && task.errorReason && (
                  <div className="border border-[#ef4444]/20 bg-[#1a0000] p-3 flex items-start gap-2">
                    <ShieldAlert className="w-3.5 h-3.5 text-[#ef4444] flex-shrink-0 mt-0.5" />
                    <span className="text-[10px] font-sans text-[#ef4444] leading-relaxed">{task.errorReason}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
