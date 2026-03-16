'use client';
import { useEffect, useState } from 'react';

const TICKER_ITEMS = [
  { label: '▲ SAFARICOM +3.2%',               cls: 'ok'    },
  { label: 'CBK SANDBOX DIRECTIVE — SIG 6.5',  cls: 'po'    },
  { label: 'MPESA MASKED NUMBERS — SIG 7.5',   cls: 'ok'    },
  { label: 'OATS × CLOUDWAYS — INFRA PARTNER', cls: 'infra' },
  { label: 'KENYA ISP BLOCK MANDATE — SIG 6.5',cls: 'po'    },
  { label: 'SAFARICOM × INDOSAT — FINTECH 7.5',cls: 'ok'    },
  { label: 'SAFARI RALLY CONNECTIVITY — DEPLOY',cls:'infra'  },
  { label: 'SADC ONE NETWORK — ROAMING DROP',  cls: 'po'    },
];

const COLOR: Record<string, string> = {
  ok:    'var(--capital)',
  po:    'var(--policy)',
  infra: 'var(--infra)',
};

export default function TelemetryBar() {
  const [clock, setClock] = useState('--:--:-- UTC');

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      const p = (x: number) => x.toString().padStart(2, '0');
      setClock(`${p(n.getUTCHours())}:${p(n.getUTCMinutes())}:${p(n.getUTCSeconds())} UTC`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div style={{
      height: 26, background: 'var(--s1)', borderBottom: '1px solid var(--bd)',
      display: 'flex', alignItems: 'center', padding: '0 14px', overflow: 'hidden',
    }}>
      <div style={{ width: 180, height: 3, background: 'var(--bd2)', position: 'relative', marginRight: 14, flexShrink: 0 }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '58%', background: 'var(--capital)' }} />
        <div style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: '32%', background: 'var(--policy)' }} />
      </div>
      <span style={{ fontSize: 7, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text3)', flexShrink: 0 }}>
        capital/policy
      </span>
      <span style={{ color: 'var(--bd2)', margin: '0 10px' }}>|</span>
      <div style={{
        flex: 1, overflow: 'hidden', height: 26, display: 'flex', alignItems: 'center',
        WebkitMaskImage: 'linear-gradient(90deg, transparent, black 6%, black 92%, transparent)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', animation: 'ticker 80s linear infinite' }}>
          {doubled.map((item, i) => (
            <span key={i} style={{ color: COLOR[item.cls], padding: '0 18px', fontSize: 8 }}>
              {item.label}
            </span>
          ))}
        </div>
      </div>
      <span style={{ fontSize: 7.5, color: 'var(--text3)', letterSpacing: '0.8px', flexShrink: 0, marginLeft: 12 }}>
        {clock}
      </span>
    </div>
  );
}
