import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client

app = FastAPI(title="NairobiSignal_API_v2.2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://nairobi-signal-xynh.vercel.app",
        "http://localhost:3000"
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

@app.get("/")
def read_root():
    return {"status": "OBSERVATORY_ONLINE", "version": "2.2.0"}

@app.get("/health")
def health():
    return {"status": "NairobiSignal API is live"}

@app.get("/signal")
def get_signal():
    try:
        result = supabase.table("articles")\
            .select("*, sources(name)")\
            .gte("signal_score", 2.0)\
            .order("signal_score", desc=True)\
            .limit(20)\
            .execute()
        return result.data
    except Exception as e:
        return {"error": str(e), "data": []}

@app.get("/momentum")
def get_momentum():
    try:
        result = supabase.rpc("get_momentum_by_week").execute()
        return result.data
    except Exception as e:
        return {"error": str(e), "data": []}
