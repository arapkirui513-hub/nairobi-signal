#!/usr/bin/env python3
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from supabase import create_client

# 1. Initialization
load_dotenv()
app = FastAPI(title="NairobiSignal API", version="1.5")

# 2. CORS Configuration (Allows your Next.js frontend to talk to this API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Supabase Client
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

@app.get("/")
def read_root():
    return {"status": "NairobiSignal API v1.5 Online", "ecosystem": "Nairobi, Kenya"}

@app.get("/signals")
def get_signals(limit: int = 20):
    """Fetches high-signal articles for the main feed"""
    res = supabase.table("articles")\
        .select("*, sources(name)")\
        .order("published_at", desc=True)\
        .limit(limit)\
        .execute()
    return res.data

@app.get("/momentum")
def get_momentum():
    """Calls the Supabase RPC function for weekly signal trends"""
    try:
        # This calls the 'get_momentum_by_week' SQL function we created
        result = supabase.rpc("get_momentum_by_week").execute()
        return result.data
    except Exception as e:
        return {"error": str(e), "data": []}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
