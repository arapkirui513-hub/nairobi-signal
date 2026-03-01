#!/usr/bin/env python3
import os
import resend
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

# Initialize Clients
resend.api_key = os.getenv("RESEND_API_KEY")
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

def send_daily_briefing():
    # 1. Fetch articles from the last 24h with score >= 5.0 (Structural + Tectonic)
    yesterday = (datetime.now() - timedelta(days=1)).isoformat()
    
    res = supabase.table("articles")\
        .select("*, sources(name)")\
        .gte("signal_score", 5.0)\
        .gte("created_at", yesterday)\
        .order("signal_score", desc=True)\
        .execute()
    
    articles = res.data

    if not articles:
        print("💡 No relevant signals in the last 24h. Briefing skipped.")
        return

    # 2. Build HTML Content
    date_str = datetime.now().strftime("%B %d, %Y")
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #333;">
        <h1 style="color: #1a73e8; border-bottom: 2px solid #1a73e8; padding-bottom: 10px;">
            NairobiSignal Intel Brief
        </h1>
        <p style="font-size: 1.1em;"><strong>Date:</strong> {date_str} | <strong>Alerts:</strong> {len(articles)}</p>
    """
    
    for art in articles:
        source = art.get('sources', {}).get('name', 'Intel Source')
        html_content += f"""
        <div style="padding: 15px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 20px;">
            <span style="background: #34a853; color: white; padding: 3px 10px; border-radius: 12px; font-size: 0.8em; font-weight: bold;">
                SIGNAL {art['signal_score']}
            </span>
            <h2 style="margin: 10px 0 5px 0; font-size: 1.3em;">{art['title']}</h2>
            <p style="color: #777; font-size: 0.9em; margin-bottom: 10px;">Source: {source}</p>
            <p style="line-height: 1.6;">{art['summary'][:300]}...</p>
            <a href="{art['url']}" style="display: inline-block; margin-top: 10px; color: #1a73e8; text-decoration: none; font-weight: bold;">
                Open Full Analysis →
            </a>
        </div>
        """
    
    html_content += "</div>"

    # 3. Dispatch via Resend (Using your verified email for both)
    try:
        resend.Emails.send({
            "from": "NairobiSignal <onboarding@resend.dev>",
            "to": ["arapkirui513@gmail.com"],
            "subject": f"📍 Signal Alert: {len(articles)} High-Impact Events",
            "html": html_content
        })
        print(f"📧 Briefing sent to arapkirui513@gmail.com ({len(articles)} articles)")
    except Exception as e:
        print(f"× Email failed: {e}")

if __name__ == "__main__":
    send_daily_briefing()
