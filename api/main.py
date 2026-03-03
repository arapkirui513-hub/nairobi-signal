import os
import math
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Request, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
app = FastAPI(title="NairobiSignal API", version="2.2.0")

# 1. Environment-Aware CORS
IS_DEV = os.getenv("ENV") == "development"
ALLOWED_ORIGINS = [
    "https://nairobi-signal-xynh.vercel.app",
    "https://nairobi-signal.vercel.app"
]
if IS_DEV:
    ALLOWED_ORIGINS.append("http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# 2. Standardized Error Response with Dev Details
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_data = {
        "error": "system_error",
        "message": "An unexpected error occurred.",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    if IS_DEV:
        error_data["debug_details"] = str(exc)
    
    status_code = exc.status_code if hasattr(exc, "status_code") else 500
    return JSONResponse(status_code=status_code, content=error_data)

# 3. Refined Endpoints

@app.get("/health")
async def health_check():
    """V2.2: Comprehensive snapshot with statuses: healthy, stale, empty, or error."""
    try:
        # Table snapshots
        counts = {
            "articles": supabase.table("articles").select("id", count="exact").limit(1).execute().count,
            "aggregates": supabase.table("daily_aggregates").select("id", count="exact").limit(1).execute().count,
            "sources": 12 # Hardcoded based on current source list
        }
        
        # Ingestion Heartbeat
        latest = supabase.table("articles").select("created_at").order("created_at", desc=True).limit(1).execute()
        
        if not latest.data:
            return {"status": "empty", "counts": counts, "timestamp": datetime.now(timezone.utc).isoformat()}

        last_ingestion = datetime.fromisoformat(latest.data[0]['created_at'].replace('Z', '+00:00'))
        delta_hours = (datetime.now(timezone.utc) - last_ingestion).total_seconds() / 3600
        
        system_status = "healthy" if delta_hours < 48 else "stale"
        
        response = {
            "status": system_status,
            "last_ingestion_at": last_ingestion.isoformat(),
            "hours_since_last_run": round(delta_hours, 1),
            "counts": counts,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        return JSONResponse(status_code=503 if system_status == "stale" else 200, content=response)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Health check failed")

@app.get("/signal")
async def get_signals(
    category: Optional[str] = None,
    limit: int = Query(20, le=100),
    page: int = Query(1, ge=1)
):
    """V2.2: Paginated feed with explicit audit trail and metadata."""
    try:
        offset = (page - 1) * limit
        query = supabase.table("articles").select("*", count="exact").order("created_at", desc=True)
        
        if category:
            # Broad but efficient JSONB casting search
            query = query.filter("score_metadata::text", "ilike", f"%{category}%")

        res = query.range(offset, offset + limit - 1).execute()
        total_pages = math.ceil(res.count / limit) if res.count else 0
        
        return {
            "metadata": {
                "page": page,
                "total_pages": total_pages,
                "total_results": res.count,
                "limit": limit
            },
            "data": res.data # Metadata audit trail included in select(*)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Signal retrieval failed")

@app.get("/momentum")
async def get_momentum(start: Optional[str] = None, end: Optional[str] = None):
    """V2.2: Timezone-aware momentum data for frontend visualization."""
    try:
        query = supabase.table("daily_aggregates").select("*").order("date", desc=False)
        if start: query = query.gte("date", start)
        if end: query = query.lte("date", end)
        
        res = query.execute()
        
        return [{
            "week": r['date'], # Ensure frontend handles ISO date strings
            "capital_count": r.get('fintech_count', 0),
            "policy_count": r.get('policy_count', 0),
            "growth_count": 0, # Reserved for v2.2 Narrative Velocity
            "total_count": r.get('total_articles', 0)
        } for r in res.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail="Momentum data hydration failed")
