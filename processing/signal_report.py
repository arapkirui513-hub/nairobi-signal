import os
from dotenv import load_dotenv
from supabase import create_client
from collections import Counter

load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

def run_distribution_report():
    print("\n" + "="*50)
    print("📈 NAIROBISIGNAL INTELLIGENCE AUDIT")
    print("="*50)
    
    res = supabase.table("articles").select("signal_score").execute()
    scores = [r['signal_score'] for r in res.data]
    
    if not scores:
        print("Empty database. Run ingestion first.")
        return

    # Statistical Breakdown
    distribution = Counter(scores)
    total = len(scores)
    
    print(f"Total Database Volume: {total} Articles")
    print("-" * 50)
    print(f"{'SCORE':<10} | {'COUNT':<10} | {'PERCENTAGE'}")
    print("-" * 50)
    
    # Sort scores from highest to lowest
    for score in sorted(distribution.keys(), reverse=True):
        count = distribution[score]
        percent = (count / total) * 100
        # Simple text-based bar chart
        bar = "█" * int(percent / 2) 
        print(f"{score:<10} | {count:<10} | {percent:>6.1f}%  {bar}")

    print("-" * 50)
    high_signal_count = sum(1 for s in scores if s >= 5.0)
    high_signal_density = (high_signal_count / total) * 100
    
    print(f"INTELLIGENCE DENSITY (>= 5.0): {high_signal_density:.1f}%")
    
    if high_signal_density > 20:
        print("⚠️  ADVICE: Your lens is too loose. Increase noise penalties.")
    elif high_signal_density < 3:
        print("⚠️  ADVICE: Your lens is too tight. Check for keyword misses (e.g., lowercase issues).")
    else:
        print("✅ LENS CALIBRATED: Healthy ratio of signal to noise.")
    print("="*50 + "\n")

if __name__ == "__main__":
    run_distribution_report()
