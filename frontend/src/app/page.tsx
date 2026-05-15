import { supabase } from '@/lib/supabaseClient';
import type {
  Article, SectorStat, WeeklyMomentum, IngestionLog,
  SectorStatRow, MomentumRow
} from '@/lib/types';
import DashboardShell from '@/components/DashboardShell';

export const dynamic = 'force-dynamic';
const ARTICLE_RECENCY_CUTOFF_ISO = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
const DEFAULT_SECTOR = 'general';

type RawArticle = Article & {
  sector?: string | null;
  classification_v1?: string | null;
  classification_v2?: string | null;
};

const SECTOR_FALLBACK: SectorStat[] = [
  { name: 'FINTECH', pct: 41, z_score:  1.4 },
  { name: 'STARTUP', pct: 28, z_score:  0.8 },
  { name: 'POLICY',  pct: 24, z_score:  0.6 },
  { name: 'TELECOM', pct: 18, z_score:  0.2 },
  { name: 'INFRA',   pct: 12, z_score: -0.3 },
  { name: 'GENERAL', pct:  8, z_score: -0.9 },
];

const MOMENTUM_FALLBACK: WeeklyMomentum[] = [
  { week: 'W06', capital: 2, policy: 1, infra: 1 },
  { week: 'W07', capital: 4, policy: 2, infra: 1 },
  { week: 'W08', capital: 3, policy: 4, infra: 2 },
  { week: 'W09', capital: 5, policy: 3, infra: 2 },
  { week: 'W10', capital: 4, policy: 2, infra: 2 },
  { week: 'W11', capital: 5, policy: 3, infra: 3 },
];

export default async function HomePage() {
  const [
    { data: articles,  error: articlesError  },
    { data: sectors,   error: sectorsError   },
    { data: momentum,  error: momentumError  },
    { data: logs,      error: logsError      },
  ] = await Promise.all([
    supabase
      .from('articles')
      .select('id, title, url, summary, signal_score, sector, classification_v1, classification_v2, published_at, created_at')
      .gte('published_at', ARTICLE_RECENCY_CUTOFF_ISO)
      .order('published_at', { ascending: false })
      .order('signal_score', { ascending: false })
      .limit(250),

    supabase
      .from('sector_stats')
      .select('name, pct, z_score'),

    supabase
      .from('weekly_momentum')
      .select('week, capital, policy, infra')
      .limit(8),

    supabase
      .from('ingestion_logs')
      .select('*')
      .order('run_at', { ascending: false })
      .limit(10),
  ]);

  if (articlesError)  console.error('articles:',  articlesError.message);
  if (sectorsError)   console.error('sectors:',   sectorsError.message);
  if (momentumError)  console.error('momentum:',  momentumError.message);
  if (logsError)      console.error('logs:',      logsError.message);

  const safeArticles: Article[] = ((articles ?? []) as RawArticle[]).map((article) => ({
    ...article,
    sector: article.sector ?? article.classification_v2 ?? article.classification_v1 ?? DEFAULT_SECTOR,
  }));
  const safeLogs: IngestionLog[]     = (logs      ?? []) as IngestionLog[];

  const safeSectors: SectorStat[] = sectors && sectors.length > 0
    ? (sectors as SectorStatRow[]).map((s) => ({
        name:    s.name.toUpperCase(),
        pct:     s.pct,
        z_score: s.z_score,
      }))
    : SECTOR_FALLBACK;

  const safeMomentum: WeeklyMomentum[] = momentum && momentum.length > 0
    ? (momentum as MomentumRow[]).map((m) => ({
        week: m.week,
        capital: m.capital ?? 0,
        policy: m.policy ?? 0,
        infra: m.infra ?? 0,
      }))
    : MOMENTUM_FALLBACK;

  return (
    <DashboardShell
      articles={safeArticles}
      sectors={safeSectors}
      momentum={safeMomentum}
      logs={safeLogs}
    />
  );
}
