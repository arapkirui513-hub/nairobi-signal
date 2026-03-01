#!/usr/bin/env python3
import os
import hashlib
import requests
import feedparser
import time
import random
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client

# 1. Setup & Credentials
load_dotenv()
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

def generate_hash(url):
    return hashlib.md5(url.encode()).hexdigest()

def fetch_articles():
    # Get active sources from Supabase
    res = supabase.table("sources").select("*").eq("active", True).execute()
    sources = res.data
    print(f"📡 Found {len(sources)} active source(s)")

    # 2. Hardened Browser Session (The "Anti-403" Shield)
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,webp,*/*;q=0.8',
        'Accept-Language': 'en-KE,en-GB;q=0.9,en;q=0.8',
        'Referer': 'https://www.google.com/', # Makes it look like a search result click
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
    })

    for source in sources:
        print(f"--- Fetching: {source['name']} ---")
        
        try:
            # Human-like delay (2-5 seconds) to avoid triggerring bot-defense
            time.sleep(random.uniform(2, 5))
            
            # Fetch the raw content
            response = session.get(source['rss_url'], timeout=25)
            
            if response.status_code != 200:
                print(f"  × Error {response.status_code} for {source['name']}")
                continue
            
            # Parse content with feedparser
            feed = feedparser.parse(response.content)
            
            if not feed.entries:
                print(f"  ! No entries found for {source['name']}. Likely a JavaScript block.")
                continue

            for entry in feed.entries:
                title = entry.get('title', 'Untitled Intelligence')
                link = entry.get('link', '')
                summary = entry.get('summary', entry.get('description', 'No summary provided.'))
                published = entry.get('published', datetime.now().isoformat())
                content_hash = generate_hash(link)

                if not link:
                    continue

                # Deduplication: Don't save the same article twice
                exists = supabase.table("articles").select("id").eq("content_hash", content_hash).execute()
                if len(exists.data) > 0:
                    continue

                # Map the data for Supabase
                article_data = {
                    "title": title,
                    "url": link,
                    "summary": summary[:1000], # Store enough text for the scorer to read
                    "published_at": published,
                    "content_hash": content_hash,
                    "source_id": source['id'],
                    "signal_score": 1.0 
                }

                supabase.table("articles").insert(article_data).execute()
                print(f"  ✓ Saved: {title[:55]}...")

        except Exception as e:
            print(f"  × Connection failed for {source['name']}: {str(e)[:100]}")

if __name__ == "__main__":
    fetch_articles()
