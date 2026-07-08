'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ShieldCheck, Zap, ArrowRight, Layers } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen cyber-grid relative flex flex-col justify-between overflow-hidden bg-[#030712]">
      {/* Background neon glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 w-full h-20 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-tr from-cyan-400 to-blue-500 rounded-xl glow-effect text-gray-950 font-black">
            H
          </div>
          <span className="text-lg font-bold tracking-wider text-white glow-text">Helix</span>
        </div>
        <Link
          href="/dashboard"
          className="text-xs font-semibold px-4 py-2 bg-gray-900 border border-gray-800 text-cyan-400 rounded-xl hover:border-cyan-400/50 transition-all glow-effect"
        >
          Launch Terminal
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-6 flex flex-col items-center justify-center text-center z-10 my-16 space-y-8">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-505/10 border border-cyan-400/20 text-[10px] font-bold text-cyan-400 uppercase tracking-widest bg-cyan-950/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Genesis Hackathon Entry</span>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
            The Financial Operating System for <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">AI Agents</span>
          </h1>
          <p className="max-w-2xl mx-auto text-sm md:text-base text-gray-400 leading-relaxed">
            Helix transforms natural language prompts into autonomous, explainable on-chain execution. Define rules instead of prompts, orchestrate specialist bidders, and settle securely on X Layer.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Link
            href="/dashboard"
            className="px-8 py-4 bg-gradient-to-r from-cyan-400 to-blue-500 text-gray-950 font-bold rounded-xl hover:from-cyan-300 hover:to-blue-400 shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
          >
            <span>Launch Console Terminal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl pt-16">
          <div className="p-6 glass-card rounded-2xl text-left space-y-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Intelligent Selection</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Multi-factor scoring algorithm evaluates and gates agent bids based on on-chain reputation, TVL audits, cost, and slippage.
            </p>
          </div>

          <div className="p-6 glass-card rounded-2xl text-left space-y-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Verified Escrow</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Locked funds are held securely in smart contracts and only distributed after execution proof verification.
            </p>
          </div>

          <div className="p-6 glass-card rounded-2xl text-left space-y-2">
            <Layers className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Explainable Auditing</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Gemini 3.1 Flash Lite digests transaction trails into plain English summaries so you know exactly why decisions were made.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-900 bg-gray-950/20 py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-[10px] text-gray-600 gap-4">
          <span>&copy; 2026 Helix Protocol. Built for the OKX.AI Genesis Hackathon.</span>
          <div className="flex gap-4">
            <Link href="/dashboard" className="hover:text-cyan-400 transition-colors">Console</Link>
            <span>•</span>
            <a href="https://xlayer.okx.com" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors">X Layer</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
