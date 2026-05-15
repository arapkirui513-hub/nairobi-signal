'use client';

import { useMemo, useState } from 'react';
import type { Article, SectorStat, WeeklyMomentum, IngestionLog } from '@/lib/types';
import TelemetryBar from '@/components/TelemetryBar';
import Nav from '@/components/Nav';
import LeftPanel from '@/components/LeftPanel';
import CenterPanel, { type FeedCategory } from '@/components/CenterPanel';
import RightPanel from '@/components/RightPanel';

interface Props {
  articles: Article[];
  sectors: SectorStat[];
  momentum: WeeklyMomentum[];
  logs: IngestionLog[];
}

export default function DashboardShell({ articles, sectors, momentum, logs }: Props) {
  const [activeTab, setActiveTab] = useState('FEED');
  const [categoryFilter, setCategoryFilter] = useState<FeedCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string | null>(null);
  const [pinnedOnly, setPinnedOnly] = useState(false);

  const latestUpdate = logs[0]?.run_at ?? articles[0]?.created_at ?? null;
  const highSig = useMemo(() => articles.filter((a) => a.signal_score >= 7).length, [articles]);
  const activeSources = useMemo(() => {
    return new Set(
      articles
        .map((a) => {
          try {
            return new URL(a.url).hostname.replace(/^www\./, '');
          } catch {
            return null;
          }
        })
        .filter((v): v is string => Boolean(v)),
    ).size;
  }, [articles]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <TelemetryBar
        lastUpdatedIso={latestUpdate}
        highSig={highSig}
        totalSignals={articles.length}
        activeSources={activeSources}
      />
      <Nav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        totalSignals={articles.length}
        highSig={highSig}
        activeSources={activeSources}
        lastUpdatedIso={latestUpdate}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '272px 1fr 320px',
          flex: 1,
          overflow: 'hidden',
          gap: 'var(--space-2)',
          padding: 'var(--space-2)',
          background: 'var(--s0)',
        }}
      >
        <LeftPanel
          sectors={sectors}
          articles={articles}
          selectedSectorFilter={selectedSectorFilter}
          onSelectSectorFilter={setSelectedSectorFilter}
        />
        <CenterPanel
          articles={articles}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          selectedSectorFilter={selectedSectorFilter}
          onClearSectorFilter={() => setSelectedSectorFilter(null)}
          pinnedOnly={pinnedOnly}
          onPinnedOnlyChange={setPinnedOnly}
        />
        <RightPanel articles={articles} momentum={momentum} logs={logs} />
      </div>
    </div>
  );
}
