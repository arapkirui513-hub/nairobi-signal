"use client";

import React, { useState, useEffect } from 'react';
import { SignalContainer } from './SignalUI';

/**
 * NAIROBI_SIGNAL_v2.2_FEED
 * Logic: Fetch from singular /signal, extract data array, handle UI states.
 */

// 1. THE CONTRACT: Typed interfaces for the v2.2 Schema
interface Signal {
  id: string;
  title: string;
  source: string;
  url: string;
  created_at: string;
  score: number;
}

interface SignalResponse {
  metadata: {
    page: number;
    limit: number;
    total_results: number;
    total_pages: number;
    timestamp: string;
  };
  data: Signal[];
}

export default function SignalFeed() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSignals = async () => {
    setLoading(true);
    setError(null);
    try {
      // Aligned to v2.2 singular /signal endpoint
      const response = await fetch('https://nairobi-signal-api.onrender.com/signal');
      
      if (!response.ok) {
        throw new Error(`OBSERVATORY_OFFLINE: ${response.status}`);
      }

      const result: SignalResponse = await response.json();

      // V2.2 SCHEMA ALIGNMENT: 
      // Extracting the data array safely from the {metadata, data} object
      if (result && result.data && Array.isArray(result.data)) {
        setSignals(result.data);
        setMetadata(result.metadata);
      } else {
        throw new Error("INVALID_PAYLOAD_FORMAT_EXPECTED_V2.2_OBJECT");
      }
    } catch (err: any) {
      console.error("Pipeline Failure:", err);
      setError(err.message || "UNEXPECTED_PIPELINE_FAILURE");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4 bg-black min-h-screen text-green-500 font-mono">
      {/* Terminal Header */}
      <header className="mb-8 border-b border-green-900 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tighter text-green-400">NAIROBI_SIGNAL_v2.2</h1>
          <p className="text-xs text-gray-500 uppercase">Reflective Observatory Terminal</p>
        </div>
        {metadata && (
          <div className="text-right text-[10px] text-gray-400">
            TOTAL_SIGNALS: {metadata.total_results} | UTC: {new Date(metadata.timestamp).toLocaleTimeString()}
          </div>
        )}
      </header>

      {/* 2. THE DEFENSIVE WRAPPER: Managed Loading, Error, and Empty states */}
      <SignalContainer loading={loading} error={error} data={signals}>
        <div className="space-y-6">
          {signals.map((signal) => (
            <article 
              key={signal.id} 
              className="group p-4 border border-green-900/50 bg-green-950/5 hover:border-green-500/50 hover:bg-green-900/10 transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-3">
                <time className="text-[10px] text-gray-500 uppercase">
                  {new Date(signal.created_at).toLocaleDateString(undefined, { 
                    year: 'numeric', month: 'short', day: 'numeric' 
                  })}
                </time>
                <div className="flex items-center space-x-2">
                   <span className="text-[10px] px-2 py-0.5 border border-green-800 text-green-700 font-bold">
                    SIG_{signal.score?.toFixed(1) || "0.0"}
                  </span>
                </div>
              </div>

              <h2 className="text-lg font-semibold leading-tight mb-3 text-gray-100 group-hover:text-green-400 transition-colors">
                <a href={signal.url} target="_blank" rel="noopener noreferrer">
                  {signal.title}
                </a>
              </h2>

              <footer className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500 tracking-widest uppercase italic">
                  SOURCE: {signal.source}
                </span>
                <span className="text-[9px] text-green-900 group-hover:text-green-700 transition-colors">
                  READ_FULL_INTELLIGENCE_REPORT →
                </span>
              </footer>
            </article>
          ))}
        </div>
      </SignalContainer>

      {/* 3. SYSTEM STATUS FOOTER */}
      <footer className="mt-12 pt-4 border-t border-green-900/30 flex justify-between items-center text-[9px] text-gray-600">
        <div className="flex space-x-4">
          <span>STATUS: ONLINE</span>
          <span>ENVIRONMENT: PRODUCTION</span>
          <span>LATENCY: ~120MS</span>
        </div>
        <div className="uppercase">
          &copy; 2026 NairobiSignal // Early Warning System Phase
        </div>
      </footer>
    </div>
  );
}
