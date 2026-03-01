import os
from dotenv import load_dotenv
from supabase import create_client

# Why: We need a clear, un-biased count of our data density
load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_KEY not found in .env")
else:
    supabase = create_client(url, key)
    # Perform an exact count query
    res = supabase.table("articles").select("id", count="exact").execute()
    print("\n--- DATABASE AUDIT ---")
    print(f"📈 Total Articles: {res.count}")
    print("----------------------\n")
