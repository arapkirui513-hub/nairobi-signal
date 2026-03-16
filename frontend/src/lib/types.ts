export type CategoryTag = 'CAPITAL' | 'POLICY' | 'INFRA' | 'NOISE' | 'OTHER';
export type SectorTag = 'fintech' | 'policy' | 'startup' | 'telecom' | 'infra' | 'general' | string;

export interface Article {
  id: string;
  title: string;
  url: string;
  summary: string;
  signal_score: number;
  sector: SectorTag;
  published_at: string;
  created_at: string;
}

export interface SectorStat {
  name: string;
  pct: number;
  z_score: number;
}

export interface WeeklyMomentum {
  week: string;
  capital: number;
  policy: number;
}

export interface IngestionLog {
  id: string;
  run_at: string;
  articles_ingested: number;
  high_signal_count: number;
  capital_count: number;
  policy_count: number;
  health: 'CLEAN' | 'WARN' | 'ERROR';
}

// View row types returned directly from Supabase
export interface SectorStatRow {
  name: string;
  pct: number;
  z_score: number;
}

export interface MomentumRow {
  week: string;
  capital: number;
  policy: number;
}
