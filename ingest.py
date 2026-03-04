import os
import sys
import hashlib
import logging
import feedparser
from datetime import datetime
from dateutil import parser as dateparser
from dotenv import load_dotenv
from supabase import create_client

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

SECTORS = {
    "fintech": ["mpesa", "m-pesa", "banking", "payments", "lending", "cbr", "fintech", "remittance", "mobile money"],
    "telecom": ["safaricom", "airtel", "telecom", "mtr", "fibre", "fiber", "connectivity", "5g", "satellite"],
    "policy": ["regulation", "cbk", "tax", "directive", "gazetted", "parliament", "fine", "penalty"],
    "ai_data": ["artificial intelligence", "data protection", "machine learning", "automation", "privacy"],
    "startup": ["funding", "raised", "pitch", "incubator", "venture", "equity", "series a", "series b"],
    "healthtech": ["health", "medical", "hospital", "pharma", "biomedical"]
}

def classify_sector(text):
    text = text.lower()
    for sector, keywords in SECTORS.items():
        if any(word in text for word in keywords):
            return sector
    return "general"

def generate_hash(link):
    return hashlib.md5(link.encode()).hexdigest()

def parse_date(entry):
    try:
        raw = entry.get('published') or entry.get('updated') or ''
        return dateparser.parse(raw).isoformat()
    except Exception:
        return datetime.utcnow().isoformat()

def parse_entries(feed):
    entries = feed.entries
    try:
        entries = sorted(
            entries,
            key=lambda e: dateparser.parse(
                e.get('published') or e.get('updated') or '2000-01-01'
            ),
            reverse=True
        )
    except Exception:
        pass
    return entries[:20]

def run():
    start = datetime.now()
    log.info(f"Ingestion started at {start.isoformat()}")

    res = supabase.table("sources").select("*").eq("active", True).execute()
    sources = res.data
    log.info(f"Found {len(sources)} active source(s)")

    total_saved = 0
    total_skipped = 0
    total_errors = 0

    for source in sources:
        log.info(f"Fetching: {source['name']}")

        try:
            feed = feedparser.parse(source['rss_url'])
            log.info(f"  Entries found: {len(feed.entries)}")
        except Exception as e:
            log.error(f"  Feed fetch failed: {e}")
            total_errors += 1
            continue

        entries = parse_entries(feed)

        for entry in entries:
            title = entry.get('title', 'Untitled')
            link = entry.get('link', '')
            summary = entry.get('summary', entry.get('description', ''))
            published = parse_date(entry)

            if not link:
                continue

            content_hash = generate_hash(link)
            sector = classify_sector(f"{title} {summary}")

            try:
                article_data = {
                    "title": title,
                    "url": link,
                    "summary": summary[:500],
                    "published_at": published,
                    "content_hash": content_hash,
                    "source_id": source['id'],
                    "signal_score": 1.0,
                    "sector": sector
                }

                supabase.table("articles").insert(article_data).execute()
                total_saved += 1
                log.info(f"  Saved: {title[:60]} [{sector}]")

            except Exception as e:
                err_str = str(e).lower()
                if "duplicate" in err_str or "unique" in err_str or "23505" in err_str:
                    total_skipped += 1
                else:
                    log.error(f"  Error: {e}")
                    total_errors += 1
                continue

    end = datetime.now()
    duration = (end - start).seconds

    log.info("=" * 50)
    log.info(f"Ingestion complete in {duration}s")
    log.info(f"Saved    : {total_saved}")
    log.info(f"Skipped  : {total_skipped}")
    log.info(f"Errors   : {total_errors}")
    log.info("=" * 50)

if __name__ == "__main__":
    run()
