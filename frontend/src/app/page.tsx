
import React from 'react';
import MomentumChart from '../components/MomentumChart';
import SignalFeed from '../components/SignalFeed';

/**
 * NairobiSignal v2.2 Dashboard
 * Refactored for modularity and defensive UX.
 * Integrates hardened components for metadata-aware data fetching.
 */
export default function Dashboard() {
  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Section: The Observatory Branding */}
        <header className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Live Intelligence Terminal
            </span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            NairobiSignal
          </h1>
        </header>

        {/* Top Section: Momentum Analytics (Z-Score & Velocity) */}
        <section className="mb-12">
          <MomentumChart />
        </section>

        {/* Bottom Section: The Hardened Signal Feed (v2.2 API) */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight">
              Verified Signals
            </h2>
            <span className="text-[10px] px-2 py-0.5 bg-slate-200 text-slate-500 rounded font-mono">
              STREAM_ACTIVE
            </span>
          </div>
          
          {/* SignalFeed handles its own fetching, loading, and error states */}
          <SignalFeed />
        </section>

        {/* System Footer: The Technical Moat */}
        <footer className="mt-20 pt-8 border-t border-slate-200 text-center">
          <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">
            NairobiSignal v2.2 // Reflective Observatory Active // 2026
          </p>
        </footer>

      </div>
    </main>
  );
}
