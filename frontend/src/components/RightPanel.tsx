'use client';
import type { Article, WeeklyMomentum, IngestionLog } from '@/lib/types';

interface Props {
  articles: Article[];
  momentum: WeeklyMomentum[];
  logs: IngestionLog[];
}

export default function RightPanel({ articles, momentum, logs }: Props) {
  const highSig    = articles.filter(a => a.signal_score >= 7).length;
  const suppressed = articles.filter(a => a.signal_score <= 2).length;
  const avgScore   = articles.length
    ? (articles.reduce((s, a) => s + a.signal_score, 0) / articles.length).toFixed(1)
    : '—';
  const maxMom = Math.max(...momentum.map(w => w.capital + w.policy), 1);

  return (
    <div style={{ borderLeft: '1px solid var(--bd)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Bento */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--bd)', borderBottom: '1px solid var(--bd)', flexShrink: 0 }}>
        {[
          { label: 'SIGNALS W11',   val: articles.length, color: 'var(--capital)', sub: '↑ live count'   },
          { label: 'AVG SIG SCORE', val: avgScore,         color: 'var(--text)',    sub: '▶ baseline'     },
          { label: 'HIGH SIG ≥7',   val: highSig,          color: 'var(--capital)', sub: `${Math.round(highSig / Math.max(articles.length, 1) * 100)}% of feed` },
          { label: 'SUPPRESSED ≤2', val: suppressed,       color: 'var(--text3)',   sub: 'vanity/noise'   },
        ].map(b => (
          <div key={b.label} style={{ background: 'var(--s1)', padding: '11px 13px' }}>
            <div style={{ fontSize: 6, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 5 }}>{b.label}</div>
            <div style={{ fontSize: 21, fontWeight: 700, lineHeight: 1, letterSpacing: -1, color: b.color }}>{b.val}</div>
            <div style={{ fontSize: 7, marginTop: 3, color: 'rgba(0,255,136,.5)' }}>{b.sub}</div>
          </div>
        ))}
      </div>
      {/* Momentum Chart */}
      <div style={{ padding: 14, borderBottom: '1px solid var(--bd)', flexShrink: 0 }}>
        <div style={{ fontSize: 6.5, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text3)', display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span>MOMENTUM CHART</span><span>CAP / POL</span>
        </div>
        <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 52 }}>
          {momentum.map(w => {
            const capH = Math.round((w.capital / maxMom) * 46);
            const polH = Math.round((w.policy  / maxMom) * 46);
            return (
              <div key={w.week} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 1, height: 46 }}>
                  <div style={{ height: capH, background: 'rgba(0,255,136,.5)', borderRadius: '1px 1px 0 0' }} />
                  <div style={{ height: polH, background: 'rgba(255,140,50,.45)' }} />
                </div>
                <div style={{ fontSize: 5.5, color: 'var(--text3)', textAlign: 'center', marginTop: 2 }}>{w.week}</div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <span style={{ fontSize: 6, color: 'var(--capital)', letterSpacing: '1px' }}>■ CAPITAL</span>
          <span style={{ fontSize: 6, color: 'var(--policy)',  letterSpacing: '1px' }}>■ POLICY</span>
        </div>
      </div>
      {/* Ingestion Log */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '9px 13px', borderBottom: '1px solid var(--bd)', fontSize: 6.5, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text3)', display: 'flex', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'var(--s2)', zIndex: 5 }}>
          <span>INGESTION LOG</span><span>DEEP-REACH</span>
        </div>
        {logs.map(l => (
          <div key={l.id} style={{ padding: '7px 13px', borderBottom: '1px solid var(--bd)', fontSize: 7.5, lineHeight: 1.6 }}>
            <div style={{ color: 'var(--text3)', marginBottom: 2 }}>{new Date(l.run_at).toUTCString().replace(' GMT', ' UTC')}</div>
            <div style={{ color: 'var(--text2)' }}>
              Ingested <span style={{ color: 'var(--text)' }}>{l.articles_ingested}</span> · High SIG <span style={{ color: 'var(--text)' }}>{l.high_signal_count}</span> · Cap <span style={{ color: 'var(--text)' }}>{l.capital_count}</span> · Pol <span style={{ color: 'var(--text)' }}>{l.policy_count}</span>
            </div>
            <span style={{
              display: 'inline-block', fontSize: 6, letterSpacing: '1px', padding: '1px 5px', marginTop: 3, fontWeight: 700,
              color:      l.health === 'CLEAN' ? 'var(--capital)' : 'var(--policy)',
              border:     `1px solid ${l.health === 'CLEAN' ? 'rgba(0,255,136,.2)' : 'rgba(255,140,50,.2)'}`,
              background: l.health === 'CLEAN' ? 'rgba(0,255,136,.04)' : 'rgba(255,140,50,.04)',
            }}>{l.health}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
