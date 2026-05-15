'use client';
import type { Article, SectorStat } from '@/lib/types';

const FORCE = [
  { label: 'Capital', pct: 58, color: 'var(--capital)' },
  { label: 'Policy', pct: 32, color: 'var(--policy)' },
  { label: 'Infra', pct: 10, color: 'var(--infra)' },
];

interface Props {
  sectors: SectorStat[];
  articles: Article[];
  selectedSectorFilter: string | null;
  onSelectSectorFilter: (sector: string | null) => void;
}

function sectorKey(v: string): string {
  return v.trim().toLowerCase();
}

export default function LeftPanel({ sectors, articles, selectedSectorFilter, onSelectSectorFilter }: Props) {
  const total = Math.max(articles.length, 1);
  const ringRadius = 52;
  const circumference = 2 * Math.PI * ringRadius;
  const progress = FORCE[0].pct / 100;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="panel">
      <div className="panel-section" style={{ flexShrink: 0 }}>
        <div className="section-head">
          <span>FORCE RATIO</span>
          <span style={{ color: 'var(--capital)' }}>LIVE</span>
        </div>

        <div style={{ display: 'grid', placeItems: 'center', padding: 'var(--space-3) 0 var(--space-2)' }}>
          <svg width="142" height="142" viewBox="0 0 142 142" role="img" aria-label="Force ratio">
            <circle cx="71" cy="71" r={ringRadius} stroke="var(--bd2)" strokeWidth="10" fill="none" />
            <circle
              cx="71"
              cy="71"
              r={ringRadius}
              stroke="var(--capital)"
              strokeWidth="10"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform="rotate(-90 71 71)"
            />
            <text x="71" y="70" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="24" fontWeight="700" fill="var(--capital)">
              {FORCE[0].pct}%
            </text>
            <text x="71" y="86" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="8" fill="var(--text3)" letterSpacing="1">
              CAPITAL FORCE
            </text>
          </svg>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {FORCE.map((f) => (
            <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: f.color, flexShrink: 0 }} />
              <span style={{ fontSize: 8, color: 'var(--text2)', flex: 1 }}>{f.label}</span>
              <span style={{ fontSize: 9, fontWeight: 600, color: f.color }}>{f.pct}%</span>
              <div style={{ width: 56, height: 3, background: 'var(--bd2)' }}>
                <div style={{ width: `${f.pct}%`, height: '100%', background: f.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel-section" style={{ flex: 1, overflowY: 'auto' }}>
        <div className="section-head">
          <span>SECTOR MOMENTUM</span>
          <span>Z-SCORE</span>
        </div>

        {sectors.map((s) => {
          const key = sectorKey(s.name);
          const isActive = selectedSectorFilter === key;
          const zColor = s.z_score > 0.5 ? 'var(--capital)' : s.z_score < -0.3 ? 'var(--sig-low)' : 'var(--text2)';
          const zLabel = `${s.z_score > 0 ? '+' : ''}${s.z_score.toFixed(1)}σ`;
          const barPct = Math.min((Math.abs(s.z_score) / 2) * 100, 100);
          const estCount = Math.round((s.pct / 100) * total);
          const trend = s.z_score > 0 ? 'rising' : s.z_score < 0 ? 'cooling' : 'flat';
          const tooltip = `${s.name}: ${s.pct}% (~${estCount} of ${total}) • Trend ${trend}`;

          return (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--bd)' }} title={tooltip}>
              <div style={{ width: 2, height: 28, background: zColor, borderRadius: 1, flexShrink: 0 }} />
              <span style={{ fontSize: 7.5, letterSpacing: '1.3px', textTransform: 'uppercase', flex: 1 }}>{s.name}</span>
              <span style={{ fontSize: 8, color: 'var(--text2)' }}>{s.pct}%</span>
              <button
                onClick={() => onSelectSectorFilter(isActive ? null : key)}
                style={{
                  fontSize: 8.5,
                  fontWeight: 700,
                  color: zColor,
                  minWidth: 42,
                  textAlign: 'right',
                  border: `1px solid ${isActive ? zColor : 'var(--bd2)'}`,
                  background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                  padding: '2px 5px',
                  cursor: 'pointer',
                  borderRadius: 3,
                  transition: 'background var(--motion-fast) ease, border-color var(--motion-fast) ease',
                }}
              >
                {zLabel}
              </button>
              <div style={{ width: 50, height: 3, background: 'var(--bd2)' }}>
                <div style={{ width: `${barPct}%`, height: '100%', background: zColor }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
