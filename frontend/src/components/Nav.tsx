'use client';

const TABS = ['FEED', 'TOPOLOGY', 'ESD MODEL', 'SOURCES'];

interface NavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Nav({ activeTab, onTabChange }: NavProps) {
  return (
    <div style={{
      height: 36, background: 'var(--s2)', borderBottom: '1px solid var(--bd)',
      display: 'flex', alignItems: 'center', padding: '0 14px',
    }}>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 7, marginRight: 24, flexShrink: 0 }}>
        <div style={{
          width: 5, height: 5, borderRadius: '50%', background: 'var(--capital)',
          boxShadow: '0 0 7px var(--capital)', animation: 'blink 1.4s step-start infinite',
        }} />
        NairobiSignal
      </div>
      {TABS.map(tab => (
        <button key={tab} onClick={() => onTabChange(tab)} style={{
          fontSize: 7.5, letterSpacing: '1.5px', textTransform: 'uppercase',
          color: activeTab === tab ? 'var(--capital)' : 'var(--text3)',
          padding: '0 13px', height: 36, display: 'flex', alignItems: 'center',
          border: 'none', borderBottom: `1.5px solid ${activeTab === tab ? 'var(--capital)' : 'transparent'}`,
          background: 'transparent', cursor: 'pointer',
        }}>
          {tab}
        </button>
      ))}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
        {[
          { label: 'LENS v1.5',  color: 'var(--capital)', bc: 'rgba(0,255,136,.2)',  bg: 'rgba(0,255,136,.04)'  },
          { label: 'WEEK 11',    color: 'var(--policy)',  bc: 'rgba(255,140,50,.2)', bg: 'rgba(255,140,50,.04)' },
          { label: 'POSTGRES ●', color: 'var(--infra)',   bc: 'rgba(34,207,255,.2)', bg: 'rgba(34,207,255,.04)' },
        ].map(p => (
          <span key={p.label} style={{
            fontSize: 6.5, letterSpacing: '1.5px', textTransform: 'uppercase',
            padding: '3px 8px', border: `1px solid ${p.bc}`, background: p.bg, color: p.color,
          }}>{p.label}</span>
        ))}
      </div>
    </div>
  );
}
