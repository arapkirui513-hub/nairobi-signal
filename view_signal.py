import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# Fetch only the good stuff
res = supabase.table("articles") \
    .select("title, signal_score") \
    .gt("signal_score", 1.0) \
    .order("signal_score", desc=True) \
    .execute()

print("\n" + "="*50)
print("🇰🇪  NAIROBI SIGNAL: TOP TECH INTELLIGENCE")
print("="*50)

for a in res.data:
    score = a.get('signal_score')
    title = a.get('title')
    # A little color/formatting for the signal
    print(f"[{score}] {title[:70]}...")

print("="*50 + "\n")
