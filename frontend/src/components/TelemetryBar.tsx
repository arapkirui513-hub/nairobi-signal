'use client';

import { useEffect, useMemo, useState } from 'react';

const TICKER_PLACEHOLDER_ITEMS = [
  { label: 'CBK SANDBOX DIRECTIVE — SIG 6.5', cls: 'po' },
  { label: 'MPESA MASKED NUMBERS — SIG 7.5', cls: 'ok' },
  { label: 'CLOUD REGION EXPANSION — INFRA 5.8', cls: 'infra' },
  { label: 'KENYA ISP BLOCK MANDATE — SIG 6.5', cls: 'po' },
  { label: 'SAFARICOM × INDOSAT — FINTECH 7.5', cls: 'ok' },
  { label: 'FIBER BACKBONE DEPLOYMENT — INFRA 6.1', cls: 'infra' },
];

const COLOR: Record<string, string> = {
  ok: 'var(--capital)',
  po: 'var(--policy)',
  infra: 'var(--infra)',
};

interface Props {
  totalSignals: number;
  highSig: number;
  activeSources: number;
  lastUpdatedIso: string | null;
}

function formatRelative(iso: string | null): string {
  if (!iso) return '—';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(Math.floor(diffMs / 60000), 0);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function TelemetryBar({ totalSignals, highSig, activeSources, lastUpdatedIso }: Props) {
  const [clock, setClock] = useState('--:--:-- UTC');

  useEffect(() => {
    const updateClock = () => {
      const n = new Date();
      const p = (x: number) => x.toString().padStart(2, '0');
      setClock(`${p(n.getUTCHours())}:${p(n.getUTCMinutes())}:${p(n.getUTCSeconds())} UTC`);
    };

    updateClock();
    const id = setInterval(updateClock, 1000);
    return () => clearInterval(id);
  }, []);

  const doubled = useMemo(() => [...TICKER_PLACEHOLDER_ITEMS, ...TICKER_PLACEHOLDER_ITEMS], []);
  const relative = formatRelative(lastUpdatedIso);

  return (
    <div className="terminal-bar" style={{ height: 30, display: 'flex', alignItems: 'center', padding: '0 var(--space-4)', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 268 }}>
        <span className="status-dot" aria-hidden />
        <span className="mono-label">LIVE</span>
        <span className="mono-muted">INGESTION ACTIVE</span>
        <span className="mono-muted" title={lastUpdatedIso ? new Date(lastUpdatedIso).toUTCString() : 'No refresh timestamp'}>
          Last updated {relative}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', whiteSpace: 'nowrap' }}>
        <span className="metric-chip">{totalSignals} Signals</span>
        <span className="metric-chip">{highSig} High SIG</span>
        <span className="metric-chip">{activeSources} Active Sources</span>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', height: 30, display: 'flex', alignItems: 'center', WebkitMaskImage: 'linear-gradient(90deg, transparent, black 6%, black 92%, transparent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', animation: 'ticker 80s linear infinite' }}>
          {doubled.map((item, i) => (
            <span key={`${i < TICKER_PLACEHOLDER_ITEMS.length ? 'first' : 'second'}-${item.label}`} style={{ color: COLOR[item.cls], padding: '0 16px', fontSize: 8.5 }}>
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <span className="mono-muted" style={{ flexShrink: 0 }}>{clock}</span>
    </div>
  );
}
