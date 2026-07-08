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
    <div className="glass-card rounded-2xl p-6 glow-effect relative overflow-hidden">
      <div className="flex items-center space-x-2 mb-6">
        <Users className="w-5 h-5 text-cyan-400" />
        <h2 className="text-xl font-bold tracking-tight text-white glow-text">Agent Marketplace Leaderboard</h2>
      </div>

      <div className="space-y-4">
        {agents.map((agent, index) => {
          const repScore = parseFloat(agent.reputationScore);
          const successRate = parseFloat(agent.successRatePct);
          const rank = index + 1;

          return (
            <div
              key={agent.id}
              className="p-4 bg-gray-950/60 border border-gray-900 hover:border-gray-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
            >
              {/* Left Rank & Agent Identity */}
              <div className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                  rank === 1 
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                    : rank === 2 
                    ? 'bg-slate-300/10 text-slate-300 border border-slate-300/20'
                    : 'bg-gray-900 text-gray-500'
                }`}>
                  #{rank}
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{agent.name}</span>
                    <span className="text-[9px] font-mono text-gray-500">({agent.id})</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {agent.capabilities.map((cap) => (
                      <span
                        key={cap}
                        className="text-[9px] px-2 py-0.5 rounded-md font-bold uppercase bg-cyan-950/20 text-cyan-400 border border-cyan-500/20"
                      >
                        {cap}
                      </span>
                    ))}
                    <span className="text-[9px] font-mono text-gray-600 truncate max-w-[100px] md:max-w-none">
                      {agent.walletAddress}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Performance Stats */}
              <div className="grid grid-cols-3 gap-6 text-right">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-gray-500 uppercase block tracking-wider">Reputation</span>
                  <div className="flex items-center justify-end gap-1">
                    <Star className="w-3 h-3 text-cyan-400 fill-cyan-400/20" />
                    <span className="text-xs font-bold text-cyan-400">{(repScore).toFixed(1)}%</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-gray-500 uppercase block tracking-wider">Success</span>
                  <div className="flex items-center justify-end gap-1">
                    <Zap className="w-3 h-3 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400">{(successRate).toFixed(1)}%</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-gray-500 uppercase block tracking-wider">Volume</span>
                  <div className="flex items-center justify-end gap-1">
                    <Activity className="w-3 h-3 text-purple-400" />
                    <span className="text-xs font-bold text-purple-400">
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
