"""
NairobiSignal — Telegram Heartbeat Monitor
===========================================
Checks Supabase for the last ingest run.
If no heartbeat within 75 minutes of the 08:00 EAT run, fires Telegram alert.

Deploy as a separate Render cron job:
  Schedule: 0 5 * * 1   (08:15 EAT = 05:15 UTC, Mondays)
  Command:  python3 telegram_heartbeat.py
"""

import os
import sys
import json
import re
import urllib.request
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

load_dotenv()

ALERT_WINDOW_MINUTES  = 75
MIN_ARTICLES_EXPECTED = 5


def send_telegram(message):
    token   = os.environ.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID")

    if not token or not chat_id:
        print("[HEARTBEAT] Telegram not configured in .env")
        return False

    url  = f"https://api.telegram.org/bot{token}/sendMessage"
    data = json.dumps({
        "chat_id":    chat_id,
        "text":       message,
        "parse_mode": "HTML",
    }).encode("utf-8")

    req = urllib.request.Request(
        url, data=data,
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            result = json.loads(resp.read())
            if result.get("ok"):
                print("[HEARTBEAT] Telegram alert sent.")
                return True
            print(f"[HEARTBEAT] Telegram API error: {result}")
            return False
    except Exception as e:
        print(f"[HEARTBEAT] Failed to send Telegram: {e}")
        return False


def get_last_heartbeat():
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_KEY")

    url = f"{supabase_url}/rest/v1/ingest_logs?select=*&order=run_at.desc&limit=1"
    req = urllib.request.Request(
        url,
        headers={
            "apikey":        supabase_key,
            "Authorization": f"Bearer {supabase_key}",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            rows = json.loads(resp.read())
            return rows[0] if rows else None
    except Exception as e:
        print(f"[HEARTBEAT] Supabase fetch failed: {e}")
        return None


def run():
    now_utc = datetime.now(timezone.utc)
    print(f"[HEARTBEAT] Check at {now_utc.strftime('%Y-%m-%d %H:%M')} UTC")

    last = get_last_heartbeat()

    if last is None:
        send_telegram(
            "⚠ <b>NairobiSignal — No Heartbeat Found</b>\n\n"
            "No ingest log found in database.\n"
            "Pipeline may never have run or Supabase connection failed.\n\n"
            "<code>Action: Check Render cron + Supabase connection</code>"
        )
        sys.exit(1)

    run_at_str = last.get("run_at", "")
    try:
        run_at = datetime.fromisoformat(run_at_str[:19]).replace(tzinfo=__import__("datetime").timezone.utc)
    except ValueError:
        send_telegram(
            f"⚠ <b>NairobiSignal — Log Parse Error</b>\n\n"
            f"Cannot parse last run timestamp: <code>{run_at_str}</code>"
        )
        sys.exit(1)

    elapsed_mins = int((now_utc - run_at).total_seconds() / 60)

    # Check 1: Recency
    if elapsed_mins > ALERT_WINDOW_MINUTES:
        send_telegram(
            "⚠ <b>NairobiSignal — Tape Break Detected</b>\n\n"
            f"Last ingest: <code>{run_at.strftime('%Y-%m-%d %H:%M')} UTC</code>\n"
            f"Elapsed: <b>{elapsed_mins} minutes</b> (limit: {ALERT_WINDOW_MINUTES})\n\n"
            "The 90-day baseline clock is at risk.\n"
            "<code>Action: Check Render logs immediately</code>\n"
            "https://dashboard.render.com"
        )
        sys.exit(1)

    # Check 2: Empty run
    articles_inserted = last.get("articles_inserted", 0)
    if articles_inserted < MIN_ARTICLES_EXPECTED and last.get("articles_skipped", 0) == 0:
        health = last.get("health", "UNKNOWN")
        if health == "RED" and last.get("articles_inserted", 0) == 0 and last.get("articles_skipped", 0) > 0:
            health = "GREEN"
        send_telegram(
            "⚠ <b>NairobiSignal — Empty Ingest Run</b>\n\n"
            f"Pipeline ran at <code>{run_at.strftime('%H:%M')} UTC</code> "
            f"but inserted only <b>{articles_inserted} articles</b>.\n"
            f"Health: <code>{health}</code>\n\n"
            "Sources may be down or RSS feeds returning empty.\n"
            "<code>Action: Check source status in dashboard</code>"
        )
        sys.exit(1)

    # Check 3: Classification rate
    class_rate = last.get("classification_rate", 1.0)
    if class_rate is not None and class_rate < 0.45 and articles_inserted > 0:
        send_telegram(
            "⚠ <b>NairobiSignal — Low Classification Rate</b>\n\n"
            f"Classification rate: <b>{class_rate:.0%}</b>\n"
            f"Articles inserted: {articles_inserted}\n\n"
            "More than 55% landed in general.\n"
            "<code>Action: Review classifier keywords</code>"
        )

    # All clear
    print(
        f"[HEARTBEAT] OK — last run {elapsed_mins}m ago · "
        f"{articles_inserted} articles · "
        f"health {last.get('health', '?')}"
    )


if __name__ == "__main__":
    run()
