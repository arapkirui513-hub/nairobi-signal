import os
import sys
import hashlib
import logging
import feedparser
from datetime import datetime
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

def generate_hash(link):
    return hashlib.md5(link.encode()).hexdigest()

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

        for entry in feed.entries[:20]:
            title = entry.get('title', 'Untitled')
            link = entry.get('link', '')
            summary = entry.get('summary', entry.get('description', ''))
            published = entry.get('published', datetime.now().isoformat())

            if not link:
                continue

            content_hash = generate_hash(link)

            try:
                existing = supabase.table("articles")\
                    .select("id")\
                    .eq("content_hash", content_hash)\
                    .execute()

                if len(existing.data) > 0:
                    total_skipped += 1
                    continue

                article_data = {
                    "title": title,
                    "url": link,
                    "summary": summary[:500],
                    "published_at": published,
                    "content_hash": content_hash,
                    "source_id": source['id'],
                    "signal_score": 1.0
                }

                supabase.table("articles").insert(article_data).execute()
                total_saved += 1
                log.info(f"  Saved: {title[:60]}")

            except Exception as e:
                log.error(f"  Error on article: {e}")
                total_errors += 1
                continue

    end = datetime.now()
    duration = (end - start).seconds

    log.info("=" * 50)
    log.info(f"Ingestion complete in {duration}s")
    log.info(f"Inserted/Updated : {total_saved}")
    log.info(f"Skipped          : {total_skipped}")
    log.info(f"Errors           : {total_errors}")
    log.info("=" * 50)

if __name__ == "__main__":
    run()
