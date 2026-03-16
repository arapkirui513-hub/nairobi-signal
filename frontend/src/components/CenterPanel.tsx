'use client';
import { useState } from 'react';
import type { Article, SectorTag } from '@/lib/types';

const FILTERS: { label: string; value: SectorTag | 'ALL' }[] = [
  { label: 'ALL',     value: 'ALL'     },
  { label: 'FINTECH', value: 'fintech' },
  { label: 'POLICY',  value: 'policy'  },
  { label: 'STARTUP', value: 'startup' },
  { label: 'TELECOM', value: 'telecom' },
  { label: 'INFRA',   value: 'infra'   },
  { label: 'GENERAL', value: 'general' },
];

function scoreColor(s: number) {
  if (s >= 7) return 'var(--capital)';
  if (s >= 5) return 'rgba(0,255,136,.55)';
  if (s >= 3) return 'var(--policy)';
  return 'var(--text3)';
}

function scoreTag(s: number): { label: string; color: string; border: string } {
  if (s >= 7) return { label: 'CAPITAL',  color: 'var(--capital)', border: 'rgba(0,255,136,.3)'  };
  if (s >= 5) return { label: 'SIGNAL',   color: 'var(--policy)',  border: 'rgba(255,140,50,.3)' };
  if (s >= 3) return { label: 'WATCH',    color: 'var(--infra)',   border: 'rgba(34,207,255,.3)' };
  return              { label: 'NOISE',   color: 'var(--text3)',   border: 'var(--bd2)'          };
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function CenterPanel({ articles }: { articles: Article[] }) {
  const [filter, setFilter] = useState<SectorTag | 'ALL'>('ALL');
  const visible = filter === 'ALL' ? articles : articles.filter(a => a.sector === filter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--bd)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <span style={{ fontSize: 8, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text2)' }}>SIGNAL FEED</span>
        <span style={{ fontSize: 7.5, color: 'var(--text3)', marginLeft: 'auto' }}>{visible.length} signals</span>
      </div>

      {/* Filters */}
      <div style={{ padding: '7px 14px', borderBottom: '1px solid var(--bd)', display: 'flex', gap: 5, flexShrink: 0, overflowX: 'auto' }}>
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)} style={{
            fontSize: 6.5, letterSpacing: '1.5px', textTransform: 'uppercase',
            padding: '3px 8px',
            border:      `1px solid ${filter === f.value ? 'rgba(0,255,136,.3)' : 'var(--bd2)'}`,
            background:  filter === f.value ? 'rgba(0,255,136,.04)' : 'transparent',
            color:       filter === f.value ? 'var(--capital)' : 'var(--text3)',
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}>{f.label}</button>
        ))}
      </div>

      {/* Feed */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {visible.length === 0 && (
          <div style={{ padding: 24, fontSize: 11, color: 'var(--text3)', textAlign: 'center' }}>
            No signals ingested yet. Run the ingestion script.
          </div>
        )}
        {visible.map(a => {
          const tag = scoreTag(a.signal_score);
          return (
            <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer"
              style={{
                display: 'grid', gridTemplateColumns: '3px 46px 1fr',
                padding: '9px 14px 9px 10px', borderBottom: '1px solid var(--bd)',
                textDecoration: 'none', opacity: a.signal_score <= 2 ? 0.5 : 1,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.025)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {/* Heat bar */}
              <div style={{
                borderRadius: 1.5, alignSelf: 'stretch', minHeight: 36, marginRight: 10,
                background: scoreColor(a.signal_score),
                opacity: a.signal_score >= 7 ? 1 : a.signal_score >= 5 ? 0.5 : 0.2,
              }} />

              {/* Score */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 1, paddingRight: 10 }}>
                <span style={{ fontSize: 17, fontWeight: 700, lineHeight: 1, letterSpacing: -1, color: scoreColor(a.signal_score) }}>
                  {a.signal_score}
                </span>
                <span style={{ fontSize: 5.5, letterSpacing: '1px', color: 'var(--text3)', marginTop: 2 }}>SIG</span>
              </div>

              {/* Body */}
              <div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 12, color: 'var(--text)', lineHeight: 1.3, marginBottom: 4 }}>
                  {a.title}
                </div>
                {a.summary && (
                  <div style={{ fontSize: 10, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 5 }}>
                    {a.summary.replace(/<[^>]*>/g, '').slice(0, 120)}
                    {a.summary.replace(/<[^>]*>/g, '').length > 120 ? '…' : ''}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 6.5, letterSpacing: '0.8px', textTransform: 'uppercase', padding: '1px 5px', border: `1px solid ${tag.border}`, fontWeight: 600, color: tag.color }}>
                    {tag.label}
                  </span>
                  <span style={{ fontSize: 6.5, textTransform: 'uppercase', padding: '1px 5px', border: '1px solid var(--bd2)', color: 'rgba(255,255,255,.25)' }}>
                    {a.sector}
                  </span>
                  <span style={{ fontSize: 7, color: 'var(--text3)', marginLeft: 'auto' }}>
                    {timeAgo(a.published_at)}
                  </span>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

