#!/usr/bin/env python3
import os
import re
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

MONEY_PATTERN = r'(?i)(?:KSh|Kes|Sh|\$|US\$)\s?\d+(?:\.\d+)?\s?(?:m|million|b|billion|trillion)?'
PERCENT_PATTERN = r'\d+(?:\.\d+)?\s?percent'

def calculate_score(title, summary):
    text = f"{title} {summary or ''}".lower()
    score = 1.0
    components = []

    policy_map = {
        "number masking": 5.5, "phone masking": 5.5,
        "mtr": 5.5, "termination rate": 5.5,
        "cbr": 5.0, "monetary policy": 5.0, "interest rate": 4.5,
        "regulation": 3.0, "lending": 2.5, "digital lending": 3.5,
        "fine": 4.0, "penalty": 4.0, "slapped": 3.5
    }
    for word, weight in policy_map.items():
        if word in text:
            score += weight
            components.append({"type": "policy_regulatory", "keyword": word, "impact": weight})

    capital_map = {
        "innovation fund": 5.0, "funding": 4.0, "raised": 4.0,
        "acquisition": 4.5, "acquires": 4.5, "ipo": 4.5,
        "investment": 3.0, "stablecoin": 2.5, "equity": 3.0,
        "takeover": 4.5, "acquisition approval": 5.0, "comesa": 4.0,
        "merger": 4.0, "clearance": 3.5, "approved": 3.0
    }
    for word, weight in capital_map.items():
        if word in text:
            score += weight
            components.append({"type": "capital_market", "keyword": word, "impact": weight})

    strategy_map = {
        "cuts": 4.0, "workforce reduction": 4.5, "layoffs": 4.0,
        "satellite": 3.0, "kuiper": 4.0, "expansion": 2.5,
        "kiico": 4.5, "bankable": 4.0
    }
    for word, weight in strategy_map.items():
        if word in text:
            score += weight
            components.append({"type": "strategic_recalibration", "keyword": word, "impact": weight})

    if re.search(MONEY_PATTERN, text) or re.search(PERCENT_PATTERN, text):
        score += 1.5
        components.append({"type": "hard_data_verification", "impact": 1.5})

    if any(word in text for word in ["aviator", "betting", "odds", "meme coin"]):
        return 0.0, [{"type": "hard_noise_filter", "impact": -10.0}]

    return max(0.0, min(10.0, score)), components

def run_scorer():
    print(f"\n🚀 NAIROBISIGNAL | Intelligence Lens v1.7 [COMESA + Merger Keywords]")
    print("-" * 65)
    res = supabase.table("articles").select("*").lte("signal_score", 1.1).execute()
    articles = res.data
    if not articles:
        print("💡 All signals are currently calibrated to v1.7.")
        return
    for art in articles:
        score, meta = calculate_score(art['title'], art['summary'])
        if score > 1.0:
            supabase.table("articles").update({
                "signal_score": score,
                "score_metadata": {"components": meta, "version": "1.7", "ts": "2026-03-08"}
            }).eq("id", art['id']).execute()
            print(f"  ✓ [{score:4.1f}] {art['title'][:55]}...")

if __name__ == "__main__":
    run_scorer()
