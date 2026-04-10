#!/usr/bin/env python3
import os
import hashlib
import time
import re
import random
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client
from playwright.sync_api import sync_playwright
import feedparser

# 1. Initialization
load_dotenv()
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

def generate_hash(url):
    return hashlib.md5(url.encode()).hexdigest()

def clean_title(title):
    # Removes "PRIME", "3 min read", and dates like "MAR 02"
    title = re.sub(r'(?i)PRIME|(\d+\smin\sread)|([A-Z]{3}\s\d+)', '', title)
    return title.strip().replace('\n', ' ').replace('  ', ' ')

def fetch_with_playwright():
    res = supabase.table("sources").select("*").eq("active", True).execute()
    sources = res.data
    print(f"🚀 NAIROBISIGNAL | Deep Reach Ingestion Layer v1.5")
    print(f"📡 Found {len(sources)} active source(s)")

    with sync_playwright() as p:
        browser = p.firefox.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
            viewport={'width': 1280, 'height': 800}
        )
        page = context.new_page()

        # --- THE DOWNLOAD SHIELD ---
        # Prevents 'Download is starting' error by cancelling the browser's save-file prompt
        page.on("download", lambda download: download.cancel())
        
        # --- MIME-TYPE OVERRIDER ---
        # Intercepts XML/Feed requests and forces them to render as text for feedparser
        def handle_route(route):
            response = route.fetch()
            headers = response.headers.copy()
            headers["content-disposition"] = "inline"
            headers["content-type"] = "text/xml"
            route.fulfill(response=response, headers=headers)
        
        # Apply the route handler to XML and Feed URLs
        page.route("**/*.xml", handle_route)
        page.route("**/feed/**", handle_route)

        for source in sources:
            print(f"--- Processing: {source['name']} ---")
            
            try:
                # Add jitter to avoid bot detection
                time.sleep(random.uniform(2, 4))
                page.goto(source['rss_url'], wait_until="domcontentloaded", timeout=45000)
                
                content = page.content()
                
                # Logic: Is it XML (RSS) or HTML (Webpage)?
                if "<rss" in content.lower() or "<feed" in content.lower():
                    feed = feedparser.parse(content)
                    articles = [{"title": e.get('title'), "link": e.get('link'), "summary": e.get('summary', e.get('description', ''))} for e in feed.entries]
                else:
                    # Deep DOM Scraper for sites like Business Daily or TechCabal
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

                for art in articles:
                    link = art['link']
                    if not link or "http" not in link: continue
                    
                    cleaned_title = clean_title(art['title'])
                    if not cleaned_title: continue

                    content_hash = generate_hash(link)
                    exists = supabase.table("articles").select("id").eq("content_hash", content_hash).execute()
                    if len(exists.data) > 0: continue

                    supabase.table("articles").insert({
                        "title": cleaned_title,
                        "url": link,
                        "summary": art['summary'][:1200],
                        "published_at": datetime.now().isoformat(),
                        "content_hash": content_hash,
                        "source_id": source['id'],
                        "signal_score": 1.0 
                    }).execute()
                    print(f"  ✓ Captured: {cleaned_title[:55]}...")

            except Exception as e:
                print(f"  × Skipping {source['name']}: {str(e)[:60]}")

        browser.close()
        print("\n✅ Deep Intelligence cycle complete.")

if __name__ == "__main__":
    fetch_with_playwright()
