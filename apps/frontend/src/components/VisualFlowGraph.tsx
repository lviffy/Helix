'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Activity, ShieldCheck, Cpu, ArrowDown } from 'lucide-react';

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

  useEffect(() => {
    if (!tasks || tasks.length === 0) return;
    const layersList: TaskNode[][] = [];
    const processed = new Set<string>();
    let remaining = [...tasks];
    let iter = 0;
    while (remaining.length > 0 && iter < 10) {
      iter++;
      const currentLayer = remaining.filter(
        (task) => task.dependencies.length === 0 || task.dependencies.every((dep) => processed.has(dep))
      );
      if (currentLayer.length === 0) { layersList.push(remaining); break; }
      layersList.push(currentLayer);
      currentLayer.forEach((task) => processed.add(task.id));
      remaining = remaining.filter((task) => !processed.has(task.id));
    }
    setLayers(layersList);
  }, [tasks]);

  const updateConnections = () => {
    if (!containerRef.current || layers.length === 0) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newConnections: Array<{ from: string; to: string; path: string }> = [];
    tasks.forEach((task) => {
      task.dependencies.forEach((depId) => {
        const fromEl = containerRef.current?.querySelector(`[data-node-id="${depId}"]`);
        const toEl = containerRef.current?.querySelector(`[data-node-id="${task.id}"]`);
        if (fromEl && toEl) {
          const fromRect = fromEl.getBoundingClientRect();
          const toRect = toEl.getBoundingClientRect();
          const x1 = fromRect.left + fromRect.width / 2 - containerRect.left;
          const y1 = fromRect.bottom - containerRect.top;
          const x2 = toRect.left + toRect.width / 2 - containerRect.left;
          const y2 = toRect.top - containerRect.top;
          const cpY = (y1 + y2) / 2;
          newConnections.push({ from: depId, to: task.id, path: `M ${x1} ${y1} C ${x1} ${cpY}, ${x2} ${cpY}, ${x2} ${y2}` });
        }
      });
    });
    setConnections(newConnections);
  };

  useEffect(() => {
    const t = setTimeout(updateConnections, 100);
    window.addEventListener('resize', updateConnections);
    return () => { clearTimeout(t); window.removeEventListener('resize', updateConnections); };
  }, [layers, tasks]);

  useEffect(() => { updateConnections(); }, [tasks]);

  const getIcon = (name: string, status?: string) => {
    const color = status === 'completed' ? 'text-[#22c55e]'
      : status === 'failed' ? 'text-[#ef4444]'
      : (status === 'executing' || status === 'bidding') ? 'text-[#abd600]'
      : 'text-[#52525b]';
    if (name.startsWith('check_')) return <Activity className={`w-3 h-3 ${color}`} />;
    if (name === 'withdraw') return <ArrowDown className={`w-3 h-3 ${color}`} />;
    if (name === 'bridge') return <ArrowRight className={`w-3 h-3 ${color}`} />;
    if (name === 'deposit') return <ShieldCheck className={`w-3 h-3 ${color}`} />;
    return <Cpu className={`w-3 h-3 ${color}`} />;
  };

  return (
    <div className="relative w-full border border-[#1c1c1e] bg-[#09090b] p-6 min-h-72 flex flex-col justify-center select-none" ref={containerRef}>

      {/* Connection SVG — clean gray lines, no neon gradient */}
      <svg className="absolute inset-0 pointer-events-none w-full h-full z-0">
        {connections.map((conn, idx) => {
          const toNode = tasks.find((t) => t.id === conn.to);
          const active = toNode?.status === 'completed' || toNode?.status === 'executing';
          return (
            <path
              key={idx}
              d={conn.path}
              fill="none"
              stroke={active ? '#abd600' : '#1c1c1e'}
              strokeWidth={active ? 1.5 : 1}
              strokeDasharray={active ? '3 3' : undefined}
              opacity={active ? 0.7 : 1}
            />
          );
        })}
      </svg>

      {/* Layers */}
      <div className="relative flex flex-col gap-10 z-10 w-full items-center">
        {layers.map((layer, layerIdx) => (
          <div key={layerIdx} className="flex flex-row flex-wrap justify-center gap-4 md:gap-8 w-full max-w-2xl">
            {layer.map((task) => {
              const isCompleted = task.status === 'completed';
              const isExecuting = task.status === 'executing' || task.status === 'bidding';
              const isFailed = task.status === 'failed';

              let borderClass = 'border-[#1c1c1e]';
              if (isCompleted) borderClass = 'border-[#22c55e]/30';
              else if (isFailed) borderClass = 'border-[#ef4444]/30';
              else if (isExecuting) borderClass = 'border-[#abd600]/40';

              return (
                <div
                  key={task.id}
                  data-node-id={task.id}
                  className={`flex flex-col p-3 border w-[148px] bg-[#000000] transition-colors duration-200 ${borderClass}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono text-[#a1a1aa] uppercase truncate leading-tight">
                      {task.name.replace('_', ' ')}
                    </span>
                    {getIcon(task.name, task.status)}
                  </div>

                  <div className="text-[9px] font-mono text-[#52525b] space-y-0.5">
                    {task.params?.asset && <span className="block">Asset: {task.params.asset}</span>}
                    {task.params?.protocol && <span className="block">Proto: {task.params.protocol}</span>}
                    {task.params?.token && <span className="block">Token: {task.params.token}</span>}
                    {task.params?.sourceChain && !task.params.targetChain && <span className="block">Chain: {task.params.sourceChain}</span>}
                    {task.params?.sourceChain && task.params.targetChain && (
                      <span className="block">{task.params.sourceChain} → {task.params.targetChain}</span>
                    )}
                    {task.name === 'check_exit_liquidity' && <span className="block text-[#abd600]">ExitGuard gated</span>}
                  </div>

                  <div className="mt-2 pt-2 border-t border-[#1c1c1e] flex items-center justify-between">
                    <span className="text-[8px] font-mono text-[#3f3f46] truncate max-w-[80px]">{task.id}</span>
                    <span className={`text-[8px] font-mono uppercase ${
                      isCompleted ? 'text-[#22c55e]'
                      : isFailed ? 'text-[#ef4444]'
                      : isExecuting ? 'text-[#abd600]'
                      : 'text-[#3f3f46]'
                    }`}>
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
