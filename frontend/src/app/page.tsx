'use client';
import { useEffect, useState } from 'react';
import MomentumChart from '../components/MomentumChart';

export default function Home() {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/signals')
      .then(r => r.json())
      .then(data => setArticles(data))
      .catch(err => console.error("Feed Error:", err));
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-emerald-500 w-3 h-3 rounded-full animate-pulse"></span>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Live Intelligence</p>
          </div>
          <h1 className="text-4xl font-black text-slate-900">NairobiSignal</h1>
        </header>
        <MomentumChart />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.map((art: any) => (
            <div key={art.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 uppercase">
                  {art.sources?.name || 'News'}
                </span>
                <span className="text-sm font-black text-emerald-600">SIG {art.signal_score.toFixed(1)}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 leading-snug mb-3">
                <a href={art.url} target="_blank" className="hover:text-emerald-600 underline decoration-emerald-200">{art.title}</a>
              </h3>
              <p className="text-slate-500 text-sm line-clamp-3">{art.summary}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
