import { supabase } from '@/lib/supabaseClient';
import type {
  Article, SectorStat, WeeklyMomentum, IngestionLog,
  SectorStatRow, MomentumRow
} from '@/lib/types';
import TelemetryBar from '@/components/TelemetryBar';
import NavWrapper   from '@/components/NavWrapper';
import LeftPanel    from '@/components/LeftPanel';
import CenterPanel  from '@/components/CenterPanel';
import RightPanel   from '@/components/RightPanel';

// Fallbacks used only if views return empty
const SECTOR_FALLBACK: SectorStat[] = [
  { name: 'FINTECH', pct: 41, z_score:  1.4 },
  { name: 'STARTUP', pct: 28, z_score:  0.8 },
  { name: 'POLICY',  pct: 24, z_score:  0.6 },
  { name: 'TELECOM', pct: 18, z_score:  0.2 },
  { name: 'INFRA',   pct: 12, z_score: -0.3 },
  { name: 'GENERAL', pct:  8, z_score: -0.9 },
];

const MOMENTUM_FALLBACK: WeeklyMomentum[] = [
  { week: 'W06', capital: 2, policy: 1 },
  { week: 'W07', capital: 4, policy: 2 },
  { week: 'W08', capital: 3, policy: 4 },
  { week: 'W09', capital: 5, policy: 3 },
  { week: 'W10', capital: 4, policy: 2 },
  { week: 'W11', capital: 5, policy: 3 },
];

export default async function HomePage() {
  // ── Parallel fetches ────────────────────────────────────────────────────
  const [
    { data: articles,  error: articlesError  },
    { data: sectors,   error: sectorsError   },
    { data: momentum,  error: momentumError  },
    { data: logs,      error: logsError      },
  ] = await Promise.all([
    supabase
      .from('articles')
      .select('id, title, url, summary, signal_score, sector, published_at, created_at')
      .order('signal_score', { ascending: false })
      .limit(100),

    supabase
      .from('sector_stats')
      .select('name, pct, z_score'),

    supabase
      .from('weekly_momentum')
      .select('week, capital, policy')
      .limit(8),

    supabase
      .from('ingestion_logs')
      .select('*')
      .order('run_at', { ascending: false })
      .limit(10),
  ]);

  // Log any errors server-side without crashing the page
  if (articlesError)  console.error('articles:',  articlesError.message);
  if (sectorsError)   console.error('sectors:',   sectorsError.message);
  if (momentumError)  console.error('momentum:',  momentumError.message);
  if (logsError)      console.error('logs:',      logsError.message);

  // ── Shape the data ──────────────────────────────────────────────────────
  const safeArticles: Article[]        = (articles  ?? []) as Article[];
  const safeLogs:     IngestionLog[]   = (logs       ?? []) as IngestionLog[];

  const safeSectors: SectorStat[] = sectors && sectors.length > 0
    ? (sectors as SectorStatRow[]).map(s => ({
        name:    s.name.toUpperCase(),
        pct:     s.pct,
        z_score: s.z_score,
      }))
    : SECTOR_FALLBACK;

  const safeMomentum: WeeklyMomentum[] = momentum && momentum.length > 0
    ? (momentum as MomentumRow[])
    : MOMENTUM_FALLBACK;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <TelemetryBar />
      <NavWrapper />
      <div style={{ display: 'grid', gridTemplateColumns: '248px 1fr 268px', flex: 1, overflow: 'hidden' }}>
        <LeftPanel   sectors={safeSectors} />
        <CenterPanel articles={safeArticles} />
        <RightPanel  articles={safeArticles} momentum={safeMomentum} logs={safeLogs} />
      </div>
    </div>
  );
}
