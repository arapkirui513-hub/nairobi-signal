import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

res = supabase.table("articles").select("id", count="exact").execute()
count = res.count if hasattr(res, 'count') else len(res.data)

print("-" * 30)
print(f"🚀 SUCCESS: NairobiSignal DB")
print(f"Total Articles Stored: {count}")
print("-" * 30)
