'use client';
import type { SectorStat } from '@/lib/types';

const FORCE = [
  { label: 'Capital', pct: 58, color: 'var(--capital)' },
  { label: 'Policy',  pct: 32, color: 'var(--policy)'  },
  { label: 'Infra',   pct: 10, color: 'var(--infra)'   },
];

export default function LeftPanel({ sectors }: { sectors: SectorStat[] }) {
  return (
    <div style={{ borderRight: '1px solid var(--bd)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Force Ratio */}
      <div style={{ padding: 14, borderBottom: '1px solid var(--bd)', flexShrink: 0 }}>
        <div style={{ fontSize: 6.5, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text3)', display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span>FORCE RATIO</span><span style={{ color: 'var(--capital)' }}>LIVE</span>
        </div>
        <svg width="160" height="90" viewBox="0 0 160 90" style={{ display: 'block', margin: '0 auto' }}>
          <path d="M20 80 A60 60 0 0 1 140 80" fill="none" stroke="#1a2128" strokeWidth="8" strokeLinecap="round" />
          <path d="M20 80 A60 60 0 0 1 140 80" fill="none" stroke="var(--capital)" strokeWidth="8" strokeLinecap="round" strokeDasharray="188" strokeDashoffset="80" opacity={0.9} />
          <path d="M20 80 A60 60 0 0 1 140 80" fill="none" stroke="var(--policy)"  strokeWidth="8" strokeLinecap="round" strokeDasharray="188" strokeDashoffset="130" opacity={0.7} />
          <text x="80" y="66" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="20" fontWeight="700" fill="var(--capital)">58%</text>
          <text x="80" y="78" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="7"  fill="rgba(255,255,255,.2)" letterSpacing="1">CAPITAL</text>
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 10 }}>
          {FORCE.map(f => (
            <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: f.color, flexShrink: 0 }} />
              <span style={{ fontSize: 7.5, color: 'var(--text2)', flex: 1 }}>{f.label}</span>
              <span style={{ fontSize: 8.5, fontWeight: 600, color: f.color }}>{f.pct}%</span>
              <div style={{ width: 52, height: 2, background: 'var(--bd2)' }}>
                <div style={{ width: `${f.pct}%`, height: '100%', background: f.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Sector Momentum */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        <div style={{ fontSize: 6.5, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text3)', display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span>SECTOR MOMENTUM</span><span>Z-SCORE</span>
        </div>
        {sectors.map(s => {
          const zColor = s.z_score > 0.5 ? 'var(--capital)' : s.z_score < -0.3 ? 'var(--policy)' : 'var(--text2)';
          const zLabel = `${s.z_score > 0 ? '+' : ''}${s.z_score.toFixed(1)}σ`;
          const barPct = Math.min(Math.abs(s.z_score) / 2 * 100, 100);
          return (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--bd)' }}>
              <div style={{ width: 2, height: 28, background: zColor, marginRight: 8, borderRadius: 1, flexShrink: 0 }} />
              <span style={{ fontSize: 7.5, letterSpacing: '1.5px', textTransform: 'uppercase', flex: 1 }}>{s.name}</span>
              <span style={{ fontSize: 8, color: 'var(--text2)', marginRight: 8 }}>{s.pct}%</span>
              <span style={{ fontSize: 8.5, fontWeight: 600, color: zColor, minWidth: 38, textAlign: 'right' }}>{zLabel}</span>
              <div style={{ width: 44, height: 2, background: 'var(--bd2)', marginLeft: 7 }}>
                <div style={{ width: `${barPct}%`, height: '100%', background: zColor }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
