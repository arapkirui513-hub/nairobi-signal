'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Article, WeeklyMomentum, IngestionLog } from '@/lib/types';

interface Props {
  articles: Article[];
  momentum: WeeklyMomentum[];
  logs: IngestionLog[];
}

export default function RightPanel({ articles, momentum, logs }: Props) {
  const highSig = articles.filter((a) => a.signal_score >= 7).length;
  const lowSig = articles.filter((a) => a.signal_score < 5).length;
  const avgScore = articles.length
    ? (articles.reduce((s, a) => s + a.signal_score, 0) / articles.length).toFixed(1)
    : '—';

  return (
    <div className="panel" style={{ overflow: 'hidden' }}>
      <div className="panel-section" style={{ paddingBottom: 'var(--space-2)', flexShrink: 0 }}>
        <div className="section-head" style={{ marginBottom: 'var(--space-2)' }}>
          <span>METRICS PANEL</span>
          <span>W11</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
          {[
            { label: 'SIGNALS', val: articles.length, color: 'var(--text)' },
            { label: 'AVG SIG', val: avgScore, color: 'var(--sig-strong)' },
            { label: 'HIGH ≥7', val: highSig, color: 'var(--capital)' },
            { label: 'LOW <5', val: lowSig, color: 'var(--sig-low)' },
          ].map((b) => (
            <div key={b.label} className="terminal-surface" style={{ padding: '10px 10px', border: '1px solid var(--bd)' }}>
              <div style={{ fontSize: 6.5, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 4 }}>{b.label}</div>
              <div style={{ fontSize: 19, fontWeight: 700, lineHeight: 1, letterSpacing: -0.7, color: b.color }}>{b.val}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel-section" style={{ borderTop: '1px solid var(--bd)', flexShrink: 0 }}>
        <div className="section-head" style={{ marginBottom: 'var(--space-2)' }}>
          <span>MOMENTUM TRENDS</span>
          <span>CAP / POL / INFRA</span>
        </div>
        <div style={{ width: '100%', height: 186 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={momentum} margin={{ top: 6, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="capFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--capital)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--capital)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="polFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--policy)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--policy)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="infraFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--infra)" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="var(--infra)" stopOpacity={0.03} />
                </linearGradient>
              </defs>

              <CartesianGrid stroke="var(--bd)" strokeDasharray="2 2" vertical={false} />
              <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#8d98a4', fontSize: 8 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8d98a4', fontSize: 8 }} width={24} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(11,15,18,0.96)',
                  border: '1px solid #2a333c',
                  borderRadius: 6,
                  fontSize: 10,
                  color: '#dce4ec',
                }}
                labelStyle={{ color: '#9cabba' }}
                cursor={{ stroke: 'var(--bd2)', strokeWidth: 1 }}
              />

              <Area type="monotone" dataKey="capital" stroke="var(--capital)" strokeWidth={1.5} fill="url(#capFill)" />
              <Area type="monotone" dataKey="policy" stroke="var(--policy)" strokeWidth={1.4} fill="url(#polFill)" />
              <Area type="monotone" dataKey="infra" stroke="var(--infra)" strokeWidth={1.3} fill="url(#infraFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', borderTop: '1px solid var(--bd)' }}>
        <div
          style={{
            padding: '10px 12px',
            borderBottom: '1px solid var(--bd)',
            fontSize: 7,
            letterSpacing: '1.8px',
            textTransform: 'uppercase',
            color: 'var(--text3)',
            display: 'flex',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            background: 'var(--s2)',
            zIndex: 4,
          }}
        >
          <span>INGESTION LOG</span>
          <span>DEEP-REACH</span>
        </div>

        {logs.map((l) => (
          <div key={l.id} style={{ padding: '8px 12px', borderBottom: '1px solid var(--bd)', fontSize: 7.5, lineHeight: 1.55 }}>
            <div style={{ color: 'var(--text3)', marginBottom: 2 }}>{new Date(l.run_at).toUTCString().replace(' GMT', ' UTC')}</div>
            <div style={{ color: 'var(--text2)' }}>
              Ingested <span style={{ color: 'var(--text)' }}>{l.articles_ingested}</span> · High SIG <span style={{ color: 'var(--text)' }}>{l.high_signal_count}</span> · Cap <span style={{ color: 'var(--text)' }}>{l.capital_count}</span> · Pol <span style={{ color: 'var(--text)' }}>{l.policy_count}</span>
            </div>
            <span
              style={{
                display: 'inline-block',
                fontSize: 6,
                letterSpacing: '1px',
                padding: '1px 5px',
                marginTop: 3,
                fontWeight: 700,
                color: l.health === 'CLEAN' ? 'var(--capital)' : 'var(--policy)',
                border: `1px solid ${l.health === 'CLEAN' ? 'rgba(0,255,136,.2)' : 'rgba(255,140,50,.2)'}`,
                background: l.health === 'CLEAN' ? 'rgba(0,255,136,.04)' : 'rgba(255,140,50,.04)',
              }}
            >
              {l.health}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
