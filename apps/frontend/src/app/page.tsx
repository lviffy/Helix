'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ShieldCheck, Zap, ArrowRight, Layers } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen relative flex flex-col justify-between overflow-hidden bg-black text-foreground font-sans">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 w-full z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary text-black font-black flex items-center justify-center rounded-md text-sm select-none">
              H
            </div>
            <span className="text-base font-bold tracking-tight text-white font-sans">Helix</span>
          </div>
          <Link
            href="/dashboard"
            className="text-xs font-semibold px-4 py-2 border border-border bg-surface-muted hover:bg-border text-white rounded-md transition-all font-mono"
          >
            Launch Terminal
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-6 flex flex-col items-center justify-center text-center z-10 my-16 space-y-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-surface-muted border border-border text-[10px] font-bold text-primary font-mono uppercase tracking-wider">
          <Sparkles className="w-3 h-3" />
          <span>Genesis Hackathon Entry</span>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-[-0.03em] text-white leading-none">
            The Financial Operating System for <span className="text-primary">AI Agents</span>
          </h1>
          <p className="max-w-2xl mx-auto text-sm md:text-base text-gray-light leading-relaxed font-sans">
            Helix transforms natural language prompts into autonomous, explainable on-chain execution. Define rules instead of prompts, orchestrate specialist bidders, and settle securely on X Layer.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Link
            href="/dashboard"
            className="px-6 py-3.5 bg-primary hover:bg-lime-bright text-black font-bold rounded-md transition-all flex items-center justify-center space-x-2 font-sans"
          >
            <span>Launch Console Terminal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl pt-16">
          <div className="p-6 bg-card border border-border rounded-lg text-left space-y-3">
            <div className="w-8 h-8 rounded-md bg-surface-muted flex items-center justify-center border border-border">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-bold text-white font-sans">Intelligent Selection</h3>
            <p className="text-xs text-gray-light leading-relaxed">
              Multi-factor scoring algorithm evaluates and gates agent bids based on on-chain reputation, TVL audits, cost, and slippage.
            </p>
          </div>

          <div className="p-6 bg-card border border-border rounded-lg text-left space-y-3">
            <div className="w-8 h-8 rounded-md bg-surface-muted flex items-center justify-center border border-border">
              <ShieldCheck className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-bold text-white font-sans">Verified Escrow</h3>
            <p className="text-xs text-gray-light leading-relaxed">
              Locked funds are held securely in smart contracts and only distributed after execution proof verification.
            </p>
          </div>

          <div className="p-6 bg-card border border-border rounded-lg text-left space-y-3">
            <div className="w-8 h-8 rounded-md bg-surface-muted flex items-center justify-center border border-border">
              <Layers className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-bold text-white font-sans">Explainable Auditing</h3>
            <p className="text-xs text-gray-light leading-relaxed">
              Gemini 3.1 Flash Lite digests transaction trails into plain English summaries so you know exactly why decisions were made.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-[10px] text-gray-light gap-4">
          <span>&copy; 2026 Helix Protocol. Built for the OKX.AI Genesis Hackathon.</span>
          <div className="flex gap-4 font-mono">
            <Link href="/dashboard" className="hover:text-primary transition-colors">Console</Link>
            <span>•</span>
            <a href="https://xlayer.okx.com" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">X Layer</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
