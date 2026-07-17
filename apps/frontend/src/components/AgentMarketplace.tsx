'use client';

import React from 'react';
import { Activity, Zap, Star } from 'lucide-react';

interface Agent {
  id: string;
  walletAddress: string;
  name: string;
  capabilities: string[];
  endpoint: string;
  reputationScore: string;
  successRatePct: string;
  totalVolumeUsd: string;
  active: boolean;
}

interface AgentMarketplaceProps {
  agents: Agent[];
}

export default function AgentMarketplace({ agents }: AgentMarketplaceProps) {
  return (
    <div className="border border-[#1c1c1e]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1c1c1e] px-6 py-4">
        <div>
          <h2 className="font-serif text-base text-[#f4f4f5]">Agent Leaderboard</h2>
          <p className="text-[10px] font-mono text-[#71717a] mt-0.5">{agents.length} registered solvers</p>
        </div>
        <span className="text-[9px] font-mono uppercase tracking-[0.12em] text-[#71717a]">Ranked by reputation</span>
      </div>

      {/* Column headings */}
      <div className="grid grid-cols-[1.5rem_1fr_4rem_4rem_4.5rem] gap-4 px-6 py-2 border-b border-[#1c1c1e]">
        {['#', 'Agent', 'Rep', 'Success', 'Volume'].map((col) => (
          <span key={col} className="text-[9px] font-mono uppercase tracking-[0.12em] text-[#52525b]">{col}</span>
        ))}
      </div>

      {/* Rows */}
      <div className="divide-y divide-[#1c1c1e]">
        {agents.map((agent, index) => {
          const rank = index + 1;
          // Normalize capabilities: Supabase REST may return JSONB as a string
          const caps: string[] = Array.isArray(agent.capabilities)
            ? agent.capabilities
            : typeof agent.capabilities === 'string'
            ? JSON.parse(agent.capabilities)
            : [];
          return (
            <div
              key={agent.id}
              className="grid grid-cols-[1.5rem_1fr_4rem_4rem_4.5rem] gap-4 items-center px-6 py-4 hover:bg-[#09090b] transition-colors duration-100"
            >
              {/* Rank */}
              <span className={`font-serif text-sm leading-none ${
                rank === 1 ? 'text-[#f4f4f5]' : 'text-[#52525b]'
              }`}>
                {rank}
              </span>

              {/* Identity */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-sans font-medium text-[#f4f4f5] truncate">{agent.name}</span>
                  {agent.active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] flex-shrink-0" title="Active" />
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {caps.slice(0, 3).map((cap) => (
                    <span key={cap} className="text-[8px] font-mono px-1.5 py-0.5 border border-[#1c1c1e] text-[#71717a] uppercase">
                      {cap}
                    </span>
                  ))}
                  {caps.length > 3 && (
                    <span className="text-[8px] font-mono text-[#52525b]">+{caps.length - 3}</span>
                  )}
                </div>
              </div>

              {/* Reputation */}
              <div className="text-right">
                <span className="font-mono text-xs text-[#abd600]">{parseFloat(agent.reputationScore).toFixed(0)}%</span>
              </div>

              {/* Success */}
              <div className="text-right">
                <span className="font-mono text-xs text-[#22c55e]">{parseFloat(agent.successRatePct).toFixed(0)}%</span>
              </div>

              {/* Volume */}
              <div className="text-right">
                <span className="font-mono text-xs text-[#f4f4f5]">
                  ${(parseFloat(agent.totalVolumeUsd) / 1000000).toFixed(1)}M
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
