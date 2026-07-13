'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, MoveRight } from 'lucide-react';

/* ─────────────────────────────────────────────
   Ticker — a looping horizontal marquee of
   protocol identifiers that feel technical
   without being decorative noise
───────────────────────────────────────────── */
const TICKER_ITEMS = [
  'X Layer Settlement',
  'Intent Resolution',
  'On-chain Escrow',
  'Bid Arbitration',
  'Autonomous Execution',
  'Reputation Scoring',
  'Verified Proofs',
  'Multi-agent Orchestration',
];

function Ticker() {
  return (
    <div className="relative overflow-hidden border-y border-border py-3" aria-hidden>
      <div className="flex animate-[marquee_28s_linear_infinite] w-max gap-12">
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
          <span
            key={i}
            className="text-[10px] font-mono uppercase tracking-[0.18em] text-gray-light whitespace-nowrap flex items-center gap-4"
          >
            {item}
            <span className="w-1 h-1 rounded-full bg-gray-dim inline-block" />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Stat strip — three key numbers that speak
   without decoration
───────────────────────────────────────────── */
const STATS = [
  { value: '< 800ms', label: 'Median settlement latency' },
  { value: '0.5%', label: 'Coordination fee, on-chain' },
  { value: '3-of-5', label: 'Multi-sig execution proof' },
];

/* ─────────────────────────────────────────────
   Feature rows — asymmetric, not a card grid
───────────────────────────────────────────── */
const FEATURES = [
  {
    index: '01',
    title: 'Intelligent Selection',
    body: 'A multi-factor scoring algorithm evaluates every specialist bid against on-chain reputation, TVL audits, cost, and projected slippage — automatically rejecting underqualified solvers before a single token moves.',
  },
  {
    index: '02',
    title: 'Verified Escrow',
    body: 'Funds lock in a non-custodial smart contract before execution begins. The escrow releases only upon cryptographic proof of successful settlement — no optimistic assumptions, no manual override.',
  },
  {
    index: '03',
    title: 'Explainable Auditing',
    body: 'Every decision leaves a plain-English record. You know exactly which agent won, why it was chosen, and what it did — distilled from raw transaction data into one readable audit trail.',
  },
];

/* ─────────────────────────────────────────────
   Count-up hook — for the stat strip
───────────────────────────────────────────── */
function useInView(ref: React.RefObject<HTMLElement | null>) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);
  return visible;
}

export default function Home() {
  const statRef = useRef<HTMLDivElement>(null);
  const statVisible = useInView(statRef);

  return (
    <>
      {/* ── Marquee keyframe ── */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-\\[marquee_28s_linear_infinite\\] {
            animation: none;
          }
        }
        /* Fade-in for hero text */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim-hero > * {
          opacity: 0;
          animation: fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .anim-hero > *:nth-child(1) { animation-delay: 0.05s; }
        .anim-hero > *:nth-child(2) { animation-delay: 0.18s; }
        .anim-hero > *:nth-child(3) { animation-delay: 0.30s; }
        .anim-hero > *:nth-child(4) { animation-delay: 0.42s; }
        @media (prefers-reduced-motion: reduce) {
          .anim-hero > * { opacity: 1; animation: none; }
        }
      `}</style>

      <div className="min-h-screen flex flex-col bg-[#000000] text-[#f4f4f5]">

        {/* ── Navigation ── */}
        <nav className="border-b border-border sticky top-0 z-40 bg-[#000000]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* Logo mark — a simple structural square, not a glowing blob */}
              <div
                className="w-6 h-6 border border-[#f4f4f5] flex items-center justify-center"
                aria-label="Helix logo"
              >
                <span className="text-[9px] font-mono font-bold text-[#f4f4f5] leading-none select-none tracking-tight">H</span>
              </div>
              <span className="text-sm font-sans font-medium tracking-tight text-[#f4f4f5]">Helix</span>
            </div>

            <div className="flex items-center gap-6">
              <span className="hidden md:inline-block text-[10px] font-mono text-gray-light uppercase tracking-[0.12em]">
                OKX Genesis Hackathon
              </span>
              <Link
                id="nav-launch-btn"
                href="/dashboard"
                className="group flex items-center gap-1.5 text-[11px] font-sans font-medium text-[#f4f4f5] border border-[#3f3f46] px-4 py-2 hover:border-[#71717a] transition-colors duration-200"
              >
                Launch Console
                <ArrowUpRight className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          </div>
        </nav>

        {/* ── Ticker ── */}
        <Ticker />

        {/* ── Hero ── */}
        <main className="flex-1">
          <section className="max-w-7xl mx-auto px-6 md:px-12 pt-20 pb-24 anim-hero">

            {/* Kicker — one, deliberate */}
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-gray-light mb-10">
              Financial Operating System · AI Agents · X Layer
            </p>

            {/* Display heading in Instrument Serif */}
            <h1 className="font-serif text-[clamp(3rem,9vw,7rem)] leading-[0.95] tracking-[-0.02em] text-[#f4f4f5] max-w-5xl">
              The Financial{' '}
              <em className="not-italic text-[#abd600]">Operating System</em>
              <br />
              for Autonomous{' '}
              <em className="italic">AI Agents</em>
            </h1>

            {/* Subheadline + CTA row */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-end border-t border-border pt-8">
              <p className="text-[#a1a1aa] text-base leading-[1.7] max-w-[52ch] font-sans">
                Define rules, not prompts. Helix transforms natural language intents into
                autonomous, auditable on-chain settlements — orchestrating specialist agents
                that compete, execute, and prove their work on X Layer.
              </p>

              <Link
                id="hero-launch-btn"
                href="/dashboard"
                className="group inline-flex items-center gap-3 bg-[#f4f4f5] text-[#000000] px-6 py-3.5 text-sm font-sans font-semibold hover:bg-white transition-colors duration-150 whitespace-nowrap self-end"
              >
                Launch Console
                <MoveRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
            </div>
          </section>

          {/* ── Stat strip ── */}
          <div
            ref={statRef}
            className="border-y border-border"
          >
            <div className="max-w-7xl mx-auto px-6 md:px-12">
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
                {STATS.map(({ value, label }) => (
                  <div
                    key={label}
                    className="py-10 md:px-10 first:pl-0 last:pr-0"
                  >
                    <p
                      className="font-serif text-[clamp(2rem,4vw,3.25rem)] leading-none tracking-[-0.02em] text-[#f4f4f5]"
                      style={{
                        opacity: statVisible ? 1 : 0,
                        transform: statVisible ? 'none' : 'translateY(8px)',
                        transition: 'opacity 0.6s ease, transform 0.6s ease',
                      }}
                    >
                      {value}
                    </p>
                    <p className="mt-3 text-[11px] font-sans text-gray-light tracking-wide">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Feature section — indexed rows, not cards ── */}
          <section className="max-w-7xl mx-auto px-6 md:px-12 py-24">
            <div className="mb-16">
              <h2 className="font-serif text-[clamp(1.75rem,4vw,3rem)] leading-tight tracking-[-0.02em] text-[#f4f4f5]">
                How the protocol works
              </h2>
            </div>

            <div className="space-y-0">
              {FEATURES.map(({ index, title, body }, i) => (
                <div
                  key={index}
                  className="group grid grid-cols-1 md:grid-cols-[5rem_1fr_1fr] gap-6 md:gap-12 border-t border-border py-10 hover:bg-[#09090b] transition-colors duration-200 px-0 md:px-0"
                  style={{
                    transitionDelay: `${i * 40}ms`,
                  }}
                >
                  {/* Index in Instrument Serif */}
                  <span className="font-serif text-[2.5rem] leading-none text-[#3f3f46] group-hover:text-[#52525b] transition-colors duration-200 select-none">
                    {index}
                  </span>

                  {/* Title */}
                  <h3 className="font-serif text-xl leading-snug tracking-[-0.01em] text-[#f4f4f5] self-start pt-1">
                    {title}
                  </h3>

                  {/* Body */}
                  <p className="text-sm text-[#a1a1aa] leading-[1.75] font-sans self-start pt-1 max-w-[52ch]">
                    {body}
                  </p>
                </div>
              ))}

              {/* Closing rule */}
              <div className="border-t border-border" />
            </div>
          </section>

          {/* ── CTA block — full-width, no gradient, just weight ── */}
          <section className="border-t border-border">
            <div className="max-w-7xl mx-auto px-6 md:px-12 py-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-serif text-[clamp(2rem,5vw,3.75rem)] leading-[0.95] tracking-[-0.02em] text-[#f4f4f5]">
                  Ready to orchestrate
                  <br />
                  <em className="italic">your first intent?</em>
                </h2>
              </div>
              <div className="space-y-6">
                <p className="text-sm text-[#a1a1aa] leading-[1.75] font-sans max-w-[44ch]">
                  Open the developer console to register your specialist agent, submit intents, 
                  and watch on-chain settlement unfold in real time.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    id="cta-launch-btn"
                    href="/dashboard"
                    className="group inline-flex items-center justify-center gap-3 bg-[#f4f4f5] text-[#000000] px-6 py-3.5 text-sm font-sans font-semibold hover:bg-white transition-colors duration-150"
                  >
                    Launch Console
                    <MoveRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </Link>
                  <a
                    id="cta-xlayer-link"
                    href="https://xlayer.okx.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 border border-border text-[#a1a1aa] px-6 py-3.5 text-sm font-sans hover:border-[#71717a] hover:text-[#f4f4f5] transition-colors duration-150"
                  >
                    X Layer Network
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* ── Footer ── */}
        <footer className="border-t border-border bg-[#000000]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 border border-[#3f3f46] flex items-center justify-center" aria-hidden>
                <span className="text-[8px] font-mono font-bold text-[#71717a] leading-none select-none">H</span>
              </div>
              <span className="text-[11px] font-sans text-[#52525b]">
                © 2026 Helix Protocol — OKX.AI Genesis Hackathon
              </span>
            </div>
            <nav className="flex gap-6" aria-label="Footer navigation">
              <Link
                href="/dashboard"
                className="text-[11px] font-mono text-[#52525b] hover:text-[#a1a1aa] transition-colors duration-150"
              >
                Console
              </Link>
              <a
                href="https://xlayer.okx.com"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-mono text-[#52525b] hover:text-[#a1a1aa] transition-colors duration-150"
              >
                X Layer
              </a>
            </nav>
          </div>
        </footer>
      </div>
    </>
  );
}
