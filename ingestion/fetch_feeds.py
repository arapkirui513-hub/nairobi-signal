import os
import hashlib
import feedparser
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

def fetch_articles():
    sources = supabase.table("sources").select("*").eq("active", True).execute()
    print(f"Found {len(sources.data)} active source(s)")

    for source in sources.data:
        print(f"\nFetching: {source['name']}")
        # Adding a browser-like User-Agent to prevent being blocked
        feed = feedparser.parse(source['rss_url'], agent='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
        print(f"  Entries found: {len(feed.entries)}")

        for entry in feed.entries[:10]:
            url = entry.get('link', '')
            content_hash = hashlib.md5(url.encode()).hexdigest()

            existing = supabase.table("articles").select("id").eq("content_hash", content_hash).execute()

            if existing.data:
                print(f"  Skip (exists): {entry.get('title', '')[:50]}")
                continue

            article = {
                "title": entry.get('title', 'No title'),
                "url": url,
                "summary": entry.get('summary', ''),
                "published_at": entry.get('published', datetime.now().isoformat()),
                "content_hash": content_hash,
                "signal_score": 0.0,
                "source_id": source['id']
            }

            try:
                supabase.table("articles").insert(article).execute()
                print(f"  Inserted: {article['title'][:50]}")
            except Exception as e:
                print(f"  Error inserting: {e}")

if __name__ == "__main__":
    fetch_articles()
