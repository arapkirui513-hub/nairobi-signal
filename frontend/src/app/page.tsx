'use client';

import React, { useEffect, useState } from 'react';
import MomentumChart from '../components/MomentumChart';

export default function Dashboard() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Correct plural URL to singular /signal
    fetch('https://nairobi-signal-api.onrender.com/signal')
      .then(r => r.json())
      .then(result => {
        /**
         * V2.2 SCHEMA ALIGNMENT:
         * We extract the 'data' array and handle missing/empty states
         */
        if (result && result.data && Array.isArray(result.data)) {
          setSignals(result.data);
        } else {
          setSignals([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Signals Feed Error:", err);
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Intelligence Terminal</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">NairobiSignal</h1>
        </header>

        <section className="mb-10">
          <MomentumChart />
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {loading ? (
            <p className="text-slate-400 text-sm">Loading intelligence feed...</p>
          ) : signals.length > 0 ? (
            signals.map((sig: any) => (
              <article key={sig.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-200 transition-all">
                <div className="flex justify-between items-center mb-4">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded">
                    {sig.source || 'Intelligence Signal'}
                  </span>
                  <span className={`text-[10px] font-black ${sig.score >= 5 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    SCORE {sig.score ? sig.score.toFixed(1) : '0.0'}
                  </span>
                </div>
                <h4 className="font-bold text-slate-800 leading-tight">
                  <a href={sig.url} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600">
                    {sig.title}
                  </a>
                </h4>
              </article>
            ))
          ) : (
            <p className="text-slate-400 text-sm">No signals found in the current window.</p>
          )}
        </div>
      </div>
    </main>
  );
}
