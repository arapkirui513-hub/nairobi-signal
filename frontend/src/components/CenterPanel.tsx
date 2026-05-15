'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Article } from '@/lib/types';

export type FeedCategory = 'ALL' | 'FINTECH' | 'POLICY' | 'INFRA' | 'STARTUP' | 'CAPITAL';

const FILTERS: { label: string; value: FeedCategory }[] = [
  { label: 'ALL', value: 'ALL' },
  { label: 'FINTECH', value: 'FINTECH' },
  { label: 'POLICY', value: 'POLICY' },
  { label: 'INFRA', value: 'INFRA' },
  { label: 'STARTUP', value: 'STARTUP' },
  { label: 'CAPITAL', value: 'CAPITAL' },
];

interface Props {
  articles: Article[];
  categoryFilter: FeedCategory;
  onCategoryFilterChange: (value: FeedCategory) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  selectedSectorFilter: string | null;
  onClearSectorFilter: () => void;
  pinnedOnly: boolean;
  onPinnedOnlyChange: (value: boolean) => void;
}

function scoreColor(score: number): string {
  if (score >= 9) return 'var(--sig-elite)';
  if (score >= 7) return 'var(--sig-strong)';
  if (score >= 5) return 'var(--sig-watch)';
  return 'var(--sig-low)';
}

function scoreBand(score: number): string {
  if (score >= 9) return 'TECTONIC';
  if (score >= 7) return 'HIGH';
  if (score >= 5) return 'WATCH';
  return 'NOISE';
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function summaryText(raw?: string): string {
  const source = raw?.trim() ?? '';
  if (!source) return '';
  if (typeof window === 'undefined') return source;
  const parser = new DOMParser();
  return parser.parseFromString(source, 'text/html').body.textContent?.trim() ?? '';
}

function sourceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}

function categoryMatch(article: Article, category: FeedCategory): boolean {
  const sector = String(article.sector ?? '').toLowerCase();
  if (category === 'ALL') return true;
  if (category === 'CAPITAL') return article.signal_score >= 7;
  return sector.includes(category.toLowerCase());
}

function dateBucket(iso: string): string {
  const target = new Date(iso);
  const now = new Date();
  const msDay = 24 * 60 * 60 * 1000;
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diffDays = Math.floor((startToday - new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime()) / msDay);

  if (diffDays <= 0) return 'Today';
  if (diffDays <= 7) return 'This Week';
  return target.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

type FeedRow =
  | { type: 'header'; key: string; label: string; count: number }
  | { type: 'card'; key: string; article: Article };

const HEADER_HEIGHT = 30;
const CARD_HEIGHT = 158;
const BATCH_SIZE = 40;
const PRELOAD_BUFFER_PX = 900;
const LOAD_MORE_THRESHOLD_PX = 600;

export default function CenterPanel({
  articles,
  categoryFilter,
  onCategoryFilterChange,
  searchQuery,
  onSearchQueryChange,
  selectedSectorFilter,
  onClearSectorFilter,
  pinnedOnly,
  onPinnedOnlyChange,
}: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [pinned, setPinned] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem('nairobi-signal:pins');
      if (!raw) return {};
      return JSON.parse(raw) as Record<string, boolean>;
    } catch {
      return {};
    }
  });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(700);

  const scrollerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    localStorage.setItem('nairobi-signal:pins', JSON.stringify(pinned));
  }, [pinned]);


  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      const sector = String(a.sector ?? '').toLowerCase();
      if (!categoryMatch(a, categoryFilter)) return false;
      if (selectedSectorFilter && sector !== selectedSectorFilter) return false;
      if (pinnedOnly && !pinned[a.id]) return false;
      if (!normalizedQuery) return true;

      const dateText = new Date(a.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).toLowerCase();
      const haystack = [
        a.title,
        a.summary,
        a.sector,
        sourceHost(a.url),
        dateText,
        a.url,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [articles, categoryFilter, selectedSectorFilter, pinnedOnly, pinned, normalizedQuery]);

  const loaded = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  const rows = useMemo<FeedRow[]>(() => {
    const grouped = new Map<string, Article[]>();
    for (const article of loaded) {
      const key = dateBucket(article.published_at || article.created_at);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)?.push(article);
    }

    const out: FeedRow[] = [];
    for (const [label, list] of grouped.entries()) {
      out.push({ type: 'header', key: `header-${label}`, label, count: list.length });
      for (const article of list) {
        out.push({ type: 'card', key: `card-${article.id}`, article });
      }
    }
    return out;
  }, [loaded]);

  const offsets = useMemo(() => {
    const result: number[] = new Array(rows.length);
    let cursor = 0;
    for (let i = 0; i < rows.length; i += 1) {
      result[i] = cursor;
      cursor += rows[i].type === 'header' ? HEADER_HEIGHT : CARD_HEIGHT;
    }
    return { positions: result, total: cursor };
  }, [rows]);

  const [start, end] = useMemo(() => {
    // Keep rows just outside viewport rendered to avoid visible pop-in during fast scroll.
    const top = Math.max(scrollTop - PRELOAD_BUFFER_PX, 0);
    const bottom = scrollTop + viewportHeight + PRELOAD_BUFFER_PX;
    let s = 0;
    while (s < rows.length) {
      const rowBottom = offsets.positions[s] + (rows[s].type === 'header' ? HEADER_HEIGHT : CARD_HEIGHT);
      if (rowBottom >= top) break;
      s += 1;
    }

    let e = s;
    while (e < rows.length && offsets.positions[e] <= bottom) e += 1;
    return [s, Math.min(e + 1, rows.length)];
  }, [rows, offsets, scrollTop, viewportHeight]);

  return (
    <div className="panel" style={{ overflow: 'hidden' }}>
      <div className="panel-section" style={{ borderBottom: '1px solid var(--bd)', flexShrink: 0 }}>
        <div className="section-head" style={{ marginBottom: 'var(--space-2)' }}>
          <span>SIGNAL FEED</span>
          <span>{filtered.length} signals</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
          <input
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search company, keyword, sector, source, date"
            aria-label="Search signals"
            style={{
              height: 28,
              background: 'var(--s3)',
              border: '1px solid var(--bd2)',
              color: 'var(--text)',
              padding: '0 10px',
              fontFamily: 'var(--mono)',
              fontSize: 9,
              borderRadius: 4,
              outline: 'none',
            }}
          />
          <button
            onClick={() => onPinnedOnlyChange(!pinnedOnly)}
            style={{
              height: 28,
              padding: '0 10px',
              border: `1px solid ${pinnedOnly ? 'var(--capital)' : 'var(--bd2)'}`,
              background: pinnedOnly ? 'rgba(0,255,136,.09)' : 'var(--s2)',
              color: pinnedOnly ? 'var(--capital)' : 'var(--text2)',
              fontSize: 7,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              borderRadius: 4,
            }}
          >
            Pinned
          </button>
          {selectedSectorFilter && (
            <button
              onClick={onClearSectorFilter}
              style={{
                height: 28,
                padding: '0 10px',
                border: '1px solid var(--bd2)',
                background: 'var(--s2)',
                color: 'var(--text2)',
                fontSize: 7,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                borderRadius: 4,
              }}
            >
              Clear {selectedSectorFilter}
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => onCategoryFilterChange(f.value)}
              style={{
                fontSize: 7,
                letterSpacing: '1.3px',
                textTransform: 'uppercase',
                padding: '5px 10px',
                border: `1px solid ${categoryFilter === f.value ? 'var(--capital)' : 'var(--bd2)'}`,
                background: categoryFilter === f.value ? 'rgba(0,255,136,.08)' : 'var(--s2)',
                color: categoryFilter === f.value ? 'var(--text)' : 'var(--text2)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                borderRadius: 4,
                transition: 'all var(--motion-fast) ease',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={scrollerRef}
        style={{ flex: 1, overflowY: 'auto', position: 'relative' }}
        onScroll={(e) => {
          const el = e.currentTarget;
          setScrollTop(el.scrollTop);
          setViewportHeight(el.clientHeight);
          if (el.scrollTop + el.clientHeight >= el.scrollHeight - LOAD_MORE_THRESHOLD_PX && visibleCount < filtered.length) {
            setVisibleCount((c) => Math.min(c + BATCH_SIZE, filtered.length));
          }
        }}
      >
        {filtered.length === 0 ? (
          <div style={{ padding: 24, fontSize: 11, color: 'var(--text3)', textAlign: 'center' }}>
            No signals found for current filter constraints.
          </div>
        ) : (
          <div style={{ height: offsets.total, position: 'relative' }}>
            {rows.slice(start, end).map((row, index) => {
              const rowIndex = start + index;
              const top = offsets.positions[rowIndex];

              if (row.type === 'header') {
                return (
                  <div
                    key={row.key}
                    style={{
                      position: 'absolute',
                      top,
                      left: 0,
                      right: 0,
                      height: HEADER_HEIGHT,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0 12px',
                      background: 'var(--s2)',
                      borderBottom: '1px solid var(--bd)',
                      borderTop: '1px solid var(--bd)',
                      fontSize: 7,
                      letterSpacing: '1.4px',
                      color: 'var(--text3)',
                      textTransform: 'uppercase',
                    }}
                  >
                    <span>{row.label}</span>
                    <span>{row.count}</span>
                  </div>
                );
              }

              const a = row.article;
              const isHovered = hoveredId === a.id;
              const isExpanded = Boolean(expanded[a.id]);
              const summary = summaryText(a.summary);
              const color = scoreColor(a.signal_score);
              const pinnedState = Boolean(pinned[a.id]);

              return (
                <article
                  key={row.key}
                  onMouseEnter={() => setHoveredId(a.id)}
                  onMouseLeave={() => setHoveredId((v) => (v === a.id ? null : v))}
                  style={{
                    position: 'absolute',
                    top,
                    left: 0,
                    right: 0,
                    height: CARD_HEIGHT,
                    borderBottom: '1px solid var(--bd)',
                    display: 'grid',
                    gridTemplateColumns: '3px 54px 1fr',
                    padding: '10px 12px 10px 10px',
                    background: isHovered ? 'var(--s3)' : 'transparent',
                    boxShadow: isHovered ? 'var(--elev-1)' : 'none',
                    transition: 'background var(--motion-fast) ease, box-shadow var(--motion-fast) ease',
                  }}
                >
                  <div style={{ borderRadius: 2, alignSelf: 'stretch', minHeight: 42, marginRight: 10, background: color, opacity: a.signal_score >= 7 ? 0.95 : 0.7 }} />

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 1, paddingRight: 8 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, lineHeight: 1, letterSpacing: -1, color }}>{a.signal_score.toFixed(1)}</span>
                    <span style={{ fontSize: 6, letterSpacing: '1px', color: 'var(--text3)', marginTop: 2 }}>SIG</span>
                  </div>

                  <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 6.5, letterSpacing: '1px', textTransform: 'uppercase', color }}>{scoreBand(a.signal_score)}</span>
                      <span style={{ fontSize: 6.5, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text3)' }}>{String(a.sector)}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 6.5, color: 'var(--text3)' }} title={new Date(a.published_at).toUTCString()}>
                        {isHovered ? new Date(a.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : timeAgo(a.published_at)}
                      </span>
                    </div>

                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontFamily: 'var(--serif)',
                        fontSize: 13,
                        fontWeight: isHovered ? 700 : 600,
                        color: 'var(--text)',
                        lineHeight: 1.32,
                        marginBottom: 6,
                        textDecoration: 'none',
                        display: '-webkit-box',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: isHovered ? 'unset' : 2,
                        overflow: 'hidden',
                      }}
                    >
                      {a.title}
                    </a>

                    {summary && (
                      <div style={{ fontSize: 9.5, color: 'var(--text2)', lineHeight: 1.45, marginBottom: 8 }}>
                        <span
                          style={{
                            display: '-webkit-box',
                            WebkitBoxOrient: 'vertical',
                            WebkitLineClamp: isExpanded ? 'unset' : 3,
                            overflow: 'hidden',
                            fontWeight: 400,
                          }}
                        >
                          {summary}
                        </span>{' '}
                        {summary.length > 140 && (
                          <button
                            onClick={() => setExpanded((prev) => ({ ...prev, [a.id]: !prev[a.id] }))}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--capital)',
                              fontSize: 9,
                              cursor: 'pointer',
                              padding: 0,
                            }}
                          >
                            {isExpanded ? 'Show less' : 'Read more'}
                          </button>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto' }}>
                      <span style={{ fontSize: 6.5, color: 'var(--text3)' }}>{sourceHost(a.url)}</span>
                      <button
                        onClick={() => setPinned((prev) => ({ ...prev, [a.id]: !prev[a.id] }))}
                        style={{
                          fontSize: 7,
                          padding: '2px 6px',
                          borderRadius: 3,
                          border: `1px solid ${pinnedState ? 'var(--capital)' : 'var(--bd2)'}`,
                          color: pinnedState ? 'var(--capital)' : 'var(--text3)',
                          background: pinnedState ? 'rgba(0,255,136,.08)' : 'transparent',
                          cursor: 'pointer',
                          marginLeft: 'auto',
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
                        }}
                      >
                        {pinnedState ? 'Pinned' : 'Pin'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
