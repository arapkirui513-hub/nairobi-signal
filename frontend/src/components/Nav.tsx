'use client';

const TABS = ['FEED', 'TOPOLOGY', 'ESD MODEL', 'SOURCES'];

interface NavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  totalSignals: number;
  highSig: number;
  activeSources: number;
  lastUpdatedIso: string | null;
}

export default function Nav({ activeTab, onTabChange, totalSignals, highSig, activeSources, lastUpdatedIso }: NavProps) {
  return (
    <div className="terminal-surface" style={{ height: 40, borderBottom: '1px solid var(--bd)', display: 'flex', alignItems: 'center', padding: '0 var(--space-4)', gap: 'var(--space-2)' }}>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, marginRight: 20, flexShrink: 0 }}>
        <div className="status-dot" style={{ width: 6, height: 6 }} />
        NairobiSignal
      </div>

      {TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          style={{
            fontSize: 7.5,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: activeTab === tab ? 'var(--text)' : 'var(--text3)',
            padding: '0 12px',
            height: 40,
            display: 'flex',
            alignItems: 'center',
            border: 'none',
            borderBottom: `1.5px solid ${activeTab === tab ? 'var(--capital)' : 'transparent'}`,
            background: 'transparent',
            cursor: 'pointer',
            transition: 'color var(--motion-fast) ease, border-color var(--motion-fast) ease',
          }}
        >
          {tab}
        </button>
      ))}

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span className="metric-chip">{totalSignals} Signals</span>
        <span className="metric-chip">{highSig} High SIG</span>
        <span className="metric-chip">{activeSources} Sources</span>
        <span className="metric-chip" title={lastUpdatedIso ? new Date(lastUpdatedIso).toUTCString() : 'No refresh timestamp'}>
          Refresh {lastUpdatedIso ? 'synced' : 'pending'}
        </span>
      </div>
    </div>
  );
}
