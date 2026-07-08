'use client';

import React from 'react';
import { Award, Zap, Activity, Users, Star } from 'lucide-react';

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
    <div className="bg-card border border-border rounded-lg p-6 relative overflow-hidden">
      <div className="flex items-center space-x-2 mb-6">
        <Users className="w-5 h-5 text-primary" />
        <h2 className="text-base font-bold tracking-tight text-white">Agent Marketplace Leaderboard</h2>
      </div>

      <div className="space-y-4">
        {agents.map((agent, index) => {
          const repScore = parseFloat(agent.reputationScore);
          const successRate = parseFloat(agent.successRatePct);
          const rank = index + 1;

          return (
            <div
              key={agent.id}
              className="p-4 bg-surface-deep border border-border rounded-md flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
            >
              {/* Left Rank & Agent Identity */}
              <div className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-sm select-none ${
                  rank === 1 
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono' 
                    : rank === 2 
                    ? 'bg-slate-300/10 text-slate-300 border border-slate-300/20 font-mono'
                    : 'bg-surface-muted text-gray-light border border-border font-mono'
                }`}>
                  #{rank}
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white font-sans">{agent.name}</span>
                    <span className="text-[9px] font-mono text-gray-light">({agent.id})</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {agent.capabilities.map((cap) => (
                      <span
                        key={cap}
                        className="text-[9px] px-2 py-0.5 rounded border border-border font-bold uppercase bg-surface-muted text-primary font-mono"
                      >
                        {cap}
                      </span>
                    ))}
                    <span className="text-[9px] font-mono text-gray-light truncate max-w-[100px] md:max-w-none">
                      {agent.walletAddress}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Performance Stats */}
              <div className="grid grid-cols-3 gap-6 text-right">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-gray-light uppercase block tracking-wider font-mono">Reputation</span>
                  <div className="flex items-center justify-end gap-1">
                    <Star className="w-3 h-3 text-primary fill-primary/10" />
                    <span className="text-xs font-bold text-primary font-mono">{(repScore).toFixed(1)}%</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-gray-light uppercase block tracking-wider font-mono">Success</span>
                  <div className="flex items-center justify-end gap-1">
                    <Zap className="w-3 h-3 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400 font-mono">{(successRate).toFixed(1)}%</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-gray-light uppercase block tracking-wider font-mono">Volume</span>
                  <div className="flex items-center justify-end gap-1">
                    <Activity className="w-3 h-3 text-white" />
                    <span className="text-xs font-bold text-white font-mono">
                      ${(parseFloat(agent.totalVolumeUsd) / 1000000).toFixed(1)}M
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
