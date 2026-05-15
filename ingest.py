"""
NairobiSignal — Unified Ingestion Pipeline
============================================
Phase IV: Consolidated requests + Playwright fallback
- Requests with rotating User-Agent
- Playwright fallback for 403 errors
- Full scoring, geo-tagging, classification pipeline
"""

import os
import sys
import hashlib
import logging
import feedparser
import requests
import random
import time
import re
from datetime import datetime, timezone
from dataclasses import dataclass, field
from dateutil import parser as dateparser
from dotenv import load_dotenv
from supabase import create_client

from geo_tagger import tag_article, GeoResult
from taxonomy_registry import validate_sector

# ── USER-AGENT ROTATION ───────────────────────────────────────────────────

KENYAN_USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0",
    "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:123.0) Gecko/20100101 Firefox/123.0",
    "Mozilla/5.0 (Linux; Android 14; SM-T870) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (iPad; CPU OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
]

PLAYWRIGHT_FALLBACK_SOURCES = [
    "businessdailyafrica",
    "theeastafrican",
    "bdafrica",
]

# ── LOGGING SETUP ──────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
log = logging.getLogger("nairobi-signal")

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    log.error("Missing Supabase credentials.")
    sys.exit(1)

supabase = create_client(url, key)


# ── SECTOR KEYWORDS ───────────────────────────────────────────────────────

SECTOR_KEYWORDS = {
    "fintech": [
        "mpesa", "m-pesa", "m-shwari", "fuliza", "pesalink", "pesapal",
        "banking", "payments", "lending", "mobile money", "remittance",
        "fintech", "digital credit", "cbk", "central bank", "equity bank",
        "kcb", "ncba", "cooperative bank", "absa kenya", "microfinance",
        "saccos", "sacco", "insurance", "insurtech",
    ],
    "telecom": [
        "safaricom", "airtel kenya", "telkom kenya", "faiba",
        "telecom", "fibre", "fiber", "connectivity", "5g", "4g",
        "satellite", "spectrum", "broadband", "undersea cable",
        "communications authority",
    ],
    "policy": [
        "regulation", "tax", "directive", "gazetted", "parliament",
        "fine", "penalty", "policy", "legislation", "bill", "act",
        "cbk circular", "ca kenya", "cma kenya", "nita", "ministry",
        "cabinet secretary", "merger clearance", "comesa",
        "data protection", "consumer protection",
        "kra", "kenya revenue authority",
        "iebc", "electoral",
        "fatf", "financial action task force",
        "court", "tribunal", "ruling", "judgment",
        "licensing", "shared licensing", "privacy",
    ],
    "ai_ml": [
        "artificial intelligence", "machine learning", "ai ",
        "generative ai", "llm", "large language model", "automation",
        "data science", "predictive", "neural network",
    ],
    "startup": [
        "funding", "raised", "seed round", "series a", "series b",
        "series c", "pre-seed", "pitch", "incubator", "accelerator",
        "venture capital", "vc", "equity", "valuation", "angel investor",
        "startup", "founder",
        "sme", "small business", "entrepreneur",
        "women in tech", "bankable",
        "buupass", "financing program", "smartphone financing",
    ],
    "health": [
        "health", "medical", "hospital", "pharma", "telemedicine",
        "healthtech", "m-tiba", "ilara", "jacaranda", "biomedical",
        "nhif", "sha ", "universal health",
    ],
    "infrastructure": [
        "data centre", "data center", "cloud", "konza", "undersea cable",
        "seacom", "teams cable", "eassy", "isp", "internet exchange",
        "nairobi internet exchange", "nixp",
    ],
    "ecommerce": [
        "ecommerce", "e-commerce", "retail", "logistics", "agritech",
        "agriculture", "marketplace", "wasoko", "copia", "twiga",
        "delivery", "supply chain", "apollo agriculture",
    ],
}


# ── LENS v1.5 ─────────────────────────────────────────────────────────────

CAPITAL_KEYWORDS = [
    "series a", "series b", "series c", "pre-seed", "seed round",
    "$", "million", "funding", "raised", "investment", "acquisition",
    "ipo", "valuation",
]
POLICY_KEYWORDS = [
    "cbk directive", "cbk circular", "regulation", "gazetted",
    "parliament", "act ", "bill ", "penalty", "fine", "merger clearance",
    "comesa", "cabinet",
]
VANITY_KEYWORDS = [
    "award", "nomination", "recognized", "celebrated", "honoured",
    "honored", "winner", "best ", "top ", "ranked",
]
DISTRESS_KEYWORDS = [
    "shutdown", "bankrupt", "liquidat", "layoff", "retrench", "closed",
    "suspended", "receivership", "collapse",
]


def compute_signal_score(title, summary):
    text = f"{title} {summary}".lower()
    score = 5.0
    reasons = []

    capital_hits = [kw for kw in CAPITAL_KEYWORDS if kw in text]
    if capital_hits:
        score += 2.5
        reasons.append({"dimension": "capital", "keywords": capital_hits[:3], "delta": "+2.5"})

    policy_hits = [kw for kw in POLICY_KEYWORDS if kw in text]
    if policy_hits:
        score += 1.5
        reasons.append({"dimension": "policy", "keywords": policy_hits[:3], "delta": "+1.5"})

    distress_hits = [kw for kw in DISTRESS_KEYWORDS if kw in text]
    if distress_hits:
        score += 1.0
        reasons.append({"dimension": "distress", "keywords": distress_hits[:3], "delta": "+1.0"})

    vanity_hits = [kw for kw in VANITY_KEYWORDS if kw in text]
    if vanity_hits:
        score -= 2.0
        reasons.append({"dimension": "vanity", "keywords": vanity_hits[:3], "delta": "-2.0"})

    score = round(max(0.0, min(10.0, score)), 2)
    metadata = {"lens_version": "1.5", "base_score": 5.0, "final_score": score, "reasons": reasons}
    return score, metadata


# ── CLASSIFICATION ────────────────────────────────────────────────────────

def classify_sector(text):
    text_lower = text.lower()
    for sector, keywords in SECTOR_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            canonical, _ = validate_sector(sector)
            return canonical
    return "general"


# ── FETCHING HELPERS ──────────────────────────────────────────────────────

def get_random_ua():
    return random.choice(KENYAN_USER_AGENTS)


def should_use_playwright_fallback(url, source_name):
    url_lower = url.lower()
    name_lower = source_name.lower()
    return any(s in url_lower or s in name_lower for s in PLAYWRIGHT_FALLBACK_SOURCES)


def clean_title(title):
    title = re.sub(r'(?i)PRIME|(\d+\smin\sread)|([A-Z]{3}\s\d+)', '', title)
    return title.strip().replace('\n', ' ').replace('  ', ' ')


def fetch_with_requests(url, source_name):
    headers = {
        'User-Agent': get_random_ua(),
        'Accept': 'application/xml,text/xml,application/rss+xml,text/html',
        'Accept-Language': 'en-KE,en-GB;q=0.9,en;q=0.8',
        'Referer': 'https://www.google.com/',
    }
    session = requests.Session()
    session.headers.update(headers)
    response = session.get(url, timeout=30)
    response.raise_for_status()
    feed = feedparser.parse(response.content)
    if not feed.entries:
        raise ValueError("No entries found in feed")
    return feed


def fetch_with_playwright(url, timeout=45000):
    from playwright.sync_api import sync_playwright
    articles = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent=get_random_ua(),
            viewport={'width': 1280, 'height': 800}
        )
        page = context.new_page()

        page.on("download", lambda download: download.cancel())

        def handle_route(route):
            response = route.fetch()
            headers = response.headers.copy()
            headers["content-disposition"] = "inline"
            headers["content-type"] = "text/xml"
            route.fulfill(response=response, headers=headers)

        page.route("**/*.xml", handle_route)
        page.route("**/feed/**", handle_route)

        try:
            time.sleep(random.uniform(2, 4))
            page.goto(url, wait_until="domcontentloaded", timeout=timeout)

            content = page.content()

            if "<rss" in content.lower() or "<feed" in content.lower():
                feed = feedparser.parse(content)
                articles = [
                    {
                        "title": e.get('title', 'Untitled'),
                        "link": e.get('link', ''),
                        "summary": e.get('summary', e.get('description', ''))
                    }
                    for e in feed.entries[:20]
                ]
            else:
                articles = page.evaluate("""() => {
                    const results = [];
                    document.querySelectorAll('article, .post-item, .entry, .td-block-span12, .article-layout').forEach(el => {
                        const linkEl = el.querySelector('h1 a, h2 a, h3 a, a.title, a.post-link');
                        const summaryEl = el.querySelector('p, .excerpt, .summary, .td-excerpt');

                        if (linkEl && linkEl.innerText.trim().length > 20) {
                            results.push({
                                title: linkEl.innerText.trim(),
                                link: linkEl.href,
                                summary: summaryEl ? summaryEl.innerText.trim() : ''
                            });
                        }
                    });
                    return results.slice(0, 15);
                }""")
        finally:
            browser.close()

    return articles


# ── OTHER HELPERS ─────────────────────────────────────────────────────────

def generate_hash(link):
    return hashlib.md5(link.encode()).hexdigest()


def parse_date(entry):
    try:
        raw = entry.get('published') or entry.get('updated') or ''
        return dateparser.parse(raw).isoformat()
    except Exception:
        return datetime.now(timezone.utc).isoformat()


def parse_entries(feed):
    entries = feed.entries
    try:
        entries = sorted(
            entries,
            key=lambda e: dateparser.parse(
                e.get('published') or e.get('updated') or '2000-01-01'
            ),
            reverse=True,
        )
    except Exception:
        pass
    return entries[:20]


# ── INGEST STATS ──────────────────────────────────────────────────────────

@dataclass
class IngestStats:
    saved: int = 0
    skipped: int = 0
    errors: int = 0
    geo_kenya: int = 0
    geo_pan_africa: int = 0
    geo_global: int = 0
    general_count: int = 0
    start_time: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    end_time: datetime = None

    @property
    def duration_seconds(self):
        if self.end_time:
            return int((self.end_time - self.start_time).total_seconds())
        return 0

    @property
    def classification_rate(self):
        if self.saved == 0:
            return 0.0
        return round((self.saved - self.general_count) / self.saved, 3)

    @property
    def health(self):
        if self.errors > 3:
            return "RED"
        if self.saved == 0 and self.skipped == 0:
            return "RED"
        if self.saved > 0 and self.classification_rate < 0.45:
            return "AMBER"
        return "GREEN"


# ── HEARTBEAT ─────────────────────────────────────────────────────────────

def write_heartbeat(stats):
    try:
        supabase.table("ingest_logs").insert({
            "run_at": stats.start_time.isoformat(),
            "articles_inserted": stats.saved,
            "articles_skipped": stats.skipped,
            "articles_errors": stats.errors,
            "geo_kenya": stats.geo_kenya,
            "geo_pan_africa": stats.geo_pan_africa,
            "geo_global": stats.geo_global,
            "classification_rate": stats.classification_rate,
            "health": stats.health,
            "duration_seconds": stats.duration_seconds,
        }).execute()
        log.info(f"Heartbeat written — health: {stats.health}")
    except Exception as e:
        log.error(f"Heartbeat write failed (non-fatal): {e}")


# ── MAIN RUN ──────────────────────────────────────────────────────────────

def run():
    stats = IngestStats()
    log.info("=" * 52)
    log.info(f"NairobiSignal ingest started — {stats.start_time.strftime('%Y-%m-%d %H:%M UTC')}")
    log.info("=" * 52)

    res = supabase.table("sources").select("*").eq("active", True).execute()
    sources = res.data
    log.info(f"Active sources: {len(sources)}")

    for source in sources:
        log.info(f"\n── {source['name']} ──")

        entries = []
        use_playwright = False

        try:
            feed = fetch_with_requests(source['rss_url'], source['name'])
            entries = parse_entries(feed)
            log.info(f" ✓ Fetched {len(entries)} entries via requests")
        except requests.HTTPError as e:
            if e.response.status_code == 403:
                if should_use_playwright_fallback(source['rss_url'], source['name']):
                    log.warning(f" 403 detected — triggering Playwright fallback")
                    use_playwright = True
                else:
                    log.error(f" ✗ 403 Forbidden (not a protected source)")
                    stats.errors += 1
                    continue
            else:
                log.error(f" ✗ HTTP {e.response.status_code}")
                stats.errors += 1
                continue
        except Exception as e:
            log.error(f" ✗ Request failed: {e}")
            stats.errors += 1
            continue

        if use_playwright:
            try:
                articles = fetch_with_playwright(source['rss_url'])
                log.info(f" ✓ Fetched {len(articles)} articles via Playwright")

                for art in articles:
                    link = art.get('link', '')
                    if not link or "http" not in link:
                        continue

                    title = clean_title(art.get('title', 'Untitled'))
                    summary = art.get('summary', '')
                    published = datetime.now(timezone.utc).isoformat()

                    content_hash = generate_hash(link)

                    exists = supabase.table("articles").select("id").eq("content_hash", content_hash).execute()
                    if exists.data:
                        stats.skipped += 1
                        continue

                    full_text = f"{title} {summary}"

                    sector_v1 = classify_sector(full_text)
                    if sector_v1 == "general":
                        stats.general_count += 1

                    geo = tag_article(title=title, body=summary)

                    signal_score, score_metadata = compute_signal_score(title, summary)

                    article_data = {
                        "title": title,
                        "url": link,
                        "summary": summary[:500],
                        "published_at": published,
                        "content_hash": content_hash,
                        "source_id": source['id'],
                        "signal_score": signal_score,
                        "score_metadata": score_metadata,
                        "classification_v1": sector_v1,
                        "classification_v2": None,
                        "geo_scope": geo.geo_scope,
                        "is_kenya_relevant": geo.is_kenya_relevant,
                        "geo_confidence": geo.confidence,
                        "geo_reasoning": geo.reasoning,
                    }

                    try:
                        supabase.table("articles").insert(article_data).execute()
                        stats.saved += 1

                        if geo.geo_scope == "KENYA":
                            stats.geo_kenya += 1
                        elif geo.geo_scope == "PAN_AFRICA":
                            stats.geo_pan_africa += 1
                        else:
                            stats.geo_global += 1

                        log.info(
                            f" ✓ [PLAYWRIGHT][{sector_v1:<14}] [{geo.geo_scope:<10}] "
                            f"SIG:{signal_score:<4} {title[:50]}"
                        )

                    except Exception as e:
                        err_str = str(e).lower()
                        if "duplicate" in err_str or "unique" in err_str or "23505" in err_str:
                            stats.skipped += 1
                        else:
                            log.error(f" ✗ Insert error: {e}")
                            stats.errors += 1
                            continue

            except Exception as pw_error:
                log.error(f" ✗ Playwright fallback failed: {pw_error}")
                stats.errors += 1
                continue

            continue

        for entry in entries:
            title = entry.get('title', 'Untitled')
            link = entry.get('link', '')
            summary = entry.get('summary', entry.get('description', ''))
            published = parse_date(entry)

            if not link:
                continue

            content_hash = generate_hash(link)
            full_text = f"{title} {summary}"

            sector_v1 = classify_sector(full_text)
            if sector_v1 == "general":
                stats.general_count += 1

            geo = tag_article(title=title, body=summary)

            signal_score, score_metadata = compute_signal_score(title, summary)

            article_data = {
                "title": title,
                "url": link,
                "summary": summary[:500],
                "published_at": published,
                "content_hash": content_hash,
                "source_id": source['id'],
                "signal_score": signal_score,
                "score_metadata": score_metadata,
                "classification_v1": sector_v1,
                "classification_v2": None,
                "geo_scope": geo.geo_scope,
                "is_kenya_relevant": geo.is_kenya_relevant,
                "geo_confidence": geo.confidence,
                "geo_reasoning": geo.reasoning,
            }

            try:
                supabase.table("articles").insert(article_data).execute()
                stats.saved += 1

                if geo.geo_scope == "KENYA":
                    stats.geo_kenya += 1
                elif geo.geo_scope == "PAN_AFRICA":
                    stats.geo_pan_africa += 1
                else:
                    stats.geo_global += 1

                log.info(
                    f" ✓ [{sector_v1:<14}] [{geo.geo_scope:<10}] "
                    f"SIG:{signal_score:<4} {title[:50]}"
                )

            except Exception as e:
                err_str = str(e).lower()
                if "duplicate" in err_str or "unique" in err_str or "23505" in err_str:
                    stats.skipped += 1
                else:
                    log.error(f" ✗ Insert error: {e}")
                    stats.errors += 1

    stats.end_time = datetime.now(timezone.utc)
    write_heartbeat(stats)

    geo_total = stats.geo_kenya + stats.geo_pan_africa + stats.geo_global
    kenya_pct = (stats.geo_kenya / geo_total * 100) if geo_total > 0 else 0

    log.info("\n" + "=" * 52)
    log.info(" NairobiSignal — Run Complete")
    log.info("=" * 52)
    log.info(f" Duration : {stats.duration_seconds}s")
    log.info(f" Saved : {stats.saved}")
    log.info(f" Skipped (dupes) : {stats.skipped}")
    log.info(f" Errors : {stats.errors}")
    log.info(f" ─────────────────────────────────────")
    log.info(f" Geo · Kenya : {stats.geo_kenya} ({kenya_pct:.0f}%)")
    log.info(f" Geo · Pan-Africa : {stats.geo_pan_africa}")
    log.info(f" Geo · Global : {stats.geo_global}")
    log.info(f" ─────────────────────────────────────")
    log.info(f" Classification : {stats.classification_rate:.0%} non-general")
    log.info(f" Health : {stats.health}")
    log.info("=" * 52)

    return stats


if __name__ == "__main__":
    run()
