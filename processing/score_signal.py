#!/usr/bin/env python3
import os
import re
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# Regex for Currency Detection (KSh, Kes, $, Trillion, Billion)
MONEY_PATTERN = r'(?i)(?:KSh|Kes|Sh|\$|US\$)\s?\d+(?:\.\d+)?\s?(?:m|million|b|billion|trillion)?'

def calculate_score(title, summary):
    text = f"{title} {summary or ''}".lower()
    score = 1.0
    components = []

    # --- 1. MARCH 2026 REGULATORY & POLICY (+5.5) ---
    # High-impact news: CBK M-Pesa Masking & CA Call Rate Cuts
    policy_triggers = [
        "number masking", "phone masking", "mtr", "termination rate", 
        "call charges", "interconnect", "slashed", "lowered", "sh0.37"
    ]
    if any(word in text for word in policy_triggers):
        score += 5.5
        components.append({"type": "march_regulatory_shift", "impact": 5.5})

    # --- 2. KIICO 2026 DEAL TRACKER (+4.5) ---
    # Tracking the $2B bankable deal target and $75T access narrative
    kiico_triggers = ["kiico", "investment deals", "bankable", "fdi target", "2 billion", "75 trillion"]
    if any(word in text for word in kiico_triggers):
        score += 4.5
        components.append({"type": "kiico_deal_signal", "impact": 4.5})

    # --- 3. CAPITAL & FUNDING (+4.0) ---
    if any(word in text for word in ["raised", "funding", "million", "billion", "equity"]):
        if re.search(MONEY_PATTERN, text):
            score += 4.0
            components.append({"type": "capital_signal_with_value", "impact": 4.0})
        else:
            score += 2.0
            components.append({"type": "capital_keyword_only", "impact": 2.0})

    # --- 4. NOISE FILTERS (Hard Zero) ---
    if any(word in text for word in ["aviator", "betting", "odds", "meme coin", "altcoin"]):
        return 0.0, [{"type": "hard_noise_filter", "impact": -10.0}]

    return max(0.0, min(10.0, score)), components

def run_scorer():
    print(f"\n🚀 NAIROBISIGNAL | Intelligence Lens v1.5 [Final Calibration]")
    print("-" * 60)
    
    # Process only baseline articles (1.0)
    res = supabase.table("articles").select("*").eq("signal_score", 1.0).execute()
    articles = res.data

    if not articles:
        print("💡 All articles are currently calibrated.")
        return

    for art in articles:
        score, meta = calculate_score(art['title'], art['summary'])
        supabase.table("articles").update({
            "signal_score": score,
            "score_metadata": {"components": meta, "version": "1.5", "ts": "2026-03-02"}
        }).eq("id", art['id']).execute()
        print(f"  ✓ [{score:4.1f}] {art['title'][:55]}...")

if __name__ == "__main__":
    run_scorer()
