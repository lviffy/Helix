'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, Circle, AlertTriangle, Play, HelpCircle, Activity, ShieldCheck, Flame, Cpu, ArrowDown } from 'lucide-react';

interface TaskNode {
  id: string;
  name: string;
  dependencies: string[];
  params?: any;
  status?: 'pending' | 'bidding' | 'executing' | 'completed' | 'failed';
  winningAgentId?: string | null;
}

interface VisualFlowGraphProps {
  tasks: TaskNode[];
}

export default function VisualFlowGraph({ tasks }: VisualFlowGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [connections, setConnections] = useState<Array<{ from: string; to: string; path: string }>>([]);
  const [layers, setLayers] = useState<TaskNode[][]>([]);

  // 1. Layer the DAG nodes
  useEffect(() => {
    if (!tasks || tasks.length === 0) return;

    const layersList: TaskNode[][] = [];
    const processed = new Set<string>();
    let remaining = [...tasks];

    // Safety counter to prevent infinite loops in cyclic dependencies (should not happen in DAG)
    let iter = 0;
    while (remaining.length > 0 && iter < 10) {
      iter++;
      // Find tasks whose dependencies are already processed
      const currentLayer = remaining.filter(task => 
        task.dependencies.length === 0 || 
        task.dependencies.every(dep => processed.has(dep))
      );

      if (currentLayer.length === 0) {
        // Fallback for isolated loops or remaining nodes
        layersList.push(remaining);
        break;
      }

      layersList.push(currentLayer);
      currentLayer.forEach(task => processed.add(task.id));
      remaining = remaining.filter(task => !processed.has(task.id));
    }

    setLayers(layersList);
  }, [tasks]);

  // 2. Measure coordinates and build connection lines
  const updateConnections = () => {
    if (!containerRef.current || layers.length === 0) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newConnections: Array<{ from: string; to: string; path: string }> = [];

    tasks.forEach(task => {
      task.dependencies.forEach(depId => {
        const fromEl = containerRef.current?.querySelector(`[data-node-id="${depId}"]`);
        const toEl = containerRef.current?.querySelector(`[data-node-id="${task.id}"]`);

        if (fromEl && toEl) {
          const fromRect = fromEl.getBoundingClientRect();
          const toRect = toEl.getBoundingClientRect();

          // Coordinates relative to the parent container
          const x1 = fromRect.left + fromRect.width / 2 - containerRect.left;
          const y1 = fromRect.bottom - containerRect.top;
          const x2 = toRect.left + toRect.width / 2 - containerRect.left;
          const y2 = toRect.top - containerRect.top;

          // Draw an elegant S-curve path
          const cpY1 = y1 + Math.max(15, (y2 - y1) / 3);
          const cpY2 = y2 - Math.max(15, (y2 - y1) / 3);
          const path = `M ${x1} ${y1} C ${x1} ${cpY1}, ${x2} ${cpY2}, ${x2} ${y2}`;

          newConnections.push({
            from: depId,
            to: task.id,
            path
          });
        }
      });
    });

    setConnections(newConnections);
  };

  useEffect(() => {
    // Run after paint to let elements settle
    const timer = setTimeout(() => {
      updateConnections();
    }, 100);

    window.addEventListener('resize', updateConnections);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateConnections);
    };
  }, [layers, tasks]);

  // Re-run connection update when tasks state changes (some tasks expand or status changes class name height)
  useEffect(() => {
    updateConnections();
  }, [tasks]);

  const getTaskIcon = (name: string, status?: string) => {
    const isCompleted = status === 'completed';
    const isFailed = status === 'failed';
    const isExecuting = status === 'executing' || status === 'bidding';

    let color = 'text-gray-light';
    if (isCompleted) color = 'text-emerald-400';
    else if (isFailed) color = 'text-red-400';
    else if (isExecuting) color = 'text-primary animate-pulse';

    if (name.startsWith('check_')) {
      if (name.includes('tvl') || name.includes('depeg') || name.includes('gas')) {
        return <Activity className={`w-4 h-4 ${color}`} />;
      }
      return <ShieldCheck className={`w-4 h-4 ${color}`} />;
    }

    switch (name) {
      case 'withdraw':
        return <ArrowDown className={`w-4 h-4 ${color}`} />;
      case 'swap':
        return <Cpu className={`w-4 h-4 ${color}`} />;
      case 'bridge':
        return <ArrowRight className={`w-4 h-4 ${color}`} />;
      case 'deposit':
        return <ShieldCheck className={`w-4 h-4 ${color}`} />;
      default:
        return <Cpu className={`w-4 h-4 ${color}`} />;
    }
  };

  return (
    <div className="relative w-full border border-border bg-surface-deep/30 rounded-lg p-6 overflow-hidden min-h-[320px] flex flex-col justify-center select-none" ref={containerRef}>
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e2329_1px,transparent_1px),linear-gradient(to_bottom,#1e2329_1px,transparent_1px)] bg-[size:16px_16px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      {/* Connection paths SVG overlay */}
      <svg className="absolute inset-0 pointer-events-none w-full h-full z-0">
        <defs>
          <linearGradient id="neonGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#abd600" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#abd600" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {connections.map((conn, idx) => {
          const toNode = tasks.find(t => t.id === conn.to);
          const isActive = toNode?.status === 'completed' || toNode?.status === 'executing';
          
          return (
            <g key={idx}>
              <path
                d={conn.path}
                fill="none"
                stroke={isActive ? '#abd600' : '#1e2329'}
                strokeWidth={isActive ? 2 : 1.5}
                className={isActive ? 'animate-[dash_2s_linear_infinite]' : ''}
                strokeDasharray={isActive ? '4,4' : 'none'}
                opacity={isActive ? 0.9 : 0.4}
              />
            </g>
          );
        })}
      </svg>

      {/* Render DAG Layer columns */}
      <div className="relative flex flex-col gap-12 z-10 w-full items-center">
        {layers.map((layer, layerIdx) => (
          <div key={layerIdx} className="flex flex-row flex-wrap justify-center gap-6 md:gap-12 w-full max-w-2xl">
            {layer.map(task => {
              const isCompleted = task.status === 'completed';
              const isExecuting = task.status === 'executing' || task.status === 'bidding';
              const isFailed = task.status === 'failed';

              let borderColor = 'border-border';
              let bgColor = 'bg-card/90';
              let badgeColor = 'bg-surface-muted text-gray-light';

              if (isCompleted) {
                borderColor = 'border-emerald-500/30';
                bgColor = 'bg-emerald-950/10';
                badgeColor = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
              } else if (isFailed) {
                borderColor = 'border-red-500/30';
                bgColor = 'bg-red-950/10';
                badgeColor = 'bg-red-500/10 text-red-400 border border-red-500/20';
              } else if (isExecuting) {
                borderColor = 'border-primary/50';
                bgColor = 'bg-primary/5';
                badgeColor = 'bg-primary/10 text-primary border border-primary/20 animate-pulse';
              }

              return (
                <div
                  key={task.id}
                  data-node-id={task.id}
                  className={`flex flex-col p-3 rounded-md border w-[150px] sm:w-[170px] backdrop-blur-sm shadow-sm transition-all duration-300 hover:scale-102 ${borderColor} ${bgColor}`}
                >
                  <div className="flex items-center justify-between gap-1.5 mb-2">
                    <span className="text-[10px] font-bold text-white tracking-tight uppercase truncate">
                      {task.name.replace('_', ' ')}
                    </span>
                    {getTaskIcon(task.name, task.status)}
                  </div>

                  <div className="text-[9px] text-gray-light font-mono truncate mb-1">
                    {task.params?.asset && <span>Asset: {task.params.asset}</span>}
                    {task.params?.protocol && <span className="block">Proto: {task.params.protocol}</span>}
                    {task.params?.token && <span className="block">Token: {task.params.token}</span>}
                    {task.params?.sourceChain && !task.params.targetChain && <span className="block">Chain: {task.params.sourceChain}</span>}
                    {task.params?.sourceChain && task.params.targetChain && (
                      <span className="block">
                        {task.params.sourceChain} &rarr; {task.params.targetChain}
                      </span>
                    )}
                    {task.params?.gasLimitGwei && <span className="block">Gas Limit: {task.params.gasLimitGwei}g</span>}
                    {task.params?.thresholdPct && <span className="block">Drop: {task.params.thresholdPct}%</span>}
                    {task.name === 'check_exit_liquidity' && <span className="block text-primary font-bold">🛡️ Exit Guard Gated</span>}
                  </div>

                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[8px] font-mono text-gray-medium">{task.id}</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider font-mono ${badgeColor}`}>
                      {task.status || 'pending'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
