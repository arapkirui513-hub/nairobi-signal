import os
import math
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Request, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from supabase import create_client, Client
from dotenv import load_dotenv

# 1. Initialization
load_dotenv()
app = FastAPI(
    title="NairobiSignal API",
    version="2.2.0",
    description="Refined data terminal for the Kenyan investment ecosystem."
)

# 2. Environment-Aware CORS
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

# 3. Clients
supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# 4. Standardized Global Error Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    status_code = exc.status_code if hasattr(exc, "status_code") else 500
    error_data = {
        "error": "endpoint_error",
        "message": str(exc.detail) if hasattr(exc, "detail") else "Internal Server Error",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "path": request.url.path
    }
    if IS_DEV:
        error_data["debug_info"] = str(exc)
    return JSONResponse(status_code=status_code, content=error_data)

# 5. Production Endpoints

@app.get("/health")
async def health_check():
    """V2.2: Hardened health check with explicit 503 for stale data."""
    try:
        counts = {
            "articles": supabase.table("articles").select("id", count="exact").limit(1).execute().count,
            "aggregates": supabase.table("daily_aggregates").select("id", count="exact").limit(1).execute().count
        }
        latest = supabase.table("articles").select("created_at").order("created_at", desc=True).limit(1).execute()
        
        if not latest.data:
            return {"status": "empty", "counts": counts, "timestamp": datetime.now(timezone.utc).isoformat()}

        last_ts = datetime.fromisoformat(latest.data[0]['created_at'].replace('Z', '+00:00'))
        delta_hours = round((datetime.now(timezone.utc) - last_ts).total_seconds() / 3600, 1)
        
        is_stale = delta_hours > 48
        return JSONResponse(
            status_code=503 if is_stale else 200,
            content={
                "status": "healthy" if not is_stale else "stale",
                "last_ingestion_at": last_ts.isoformat(),
                "hours_since_last_run": delta_hours,
                "counts": counts,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

@app.get("/signal")
async def get_signals(
    category: Optional[str] = None,
    limit: int = Query(20, le=100),
    page: int = Query(1, ge=1)
):
    """V2.2: Paginated Signal Feed with Audit Metadata."""
    try:
        offset = (page - 1) * limit
        query = supabase.table("articles").select("*", count="exact").order("created_at", desc=True)
        if category:
            query = query.filter("score_metadata::text", "ilike", f"%{category}%")

        res = query.range(offset, offset + limit - 1).execute()
        total_results = res.count or 0
        
        return {
            "metadata": {
                "page": page,
                "limit": limit,
                "total_results": total_results,
                "total_pages": math.ceil(total_results / limit) if total_results > 0 else 0,
                "timestamp": datetime.now(timezone.utc).isoformat()
            },
            "data": res.data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Signal retrieval failed: {str(e)}")

@app.get("/momentum")
async def get_momentum(start: Optional[str] = None, end: Optional[str] = None):
    """V2.2: Refined Momentum Schema with aligned counts and metadata."""
    try:
        query = supabase.table("daily_aggregates").select("*").order("date", desc=False)
        if start: query = query.gte("date", start)
        if end: query = query.lte("date", end)
        
        res = query.execute()
        
        return {
            "metadata": {
                "start": start,
                "end": end,
                "total_weeks": len(res.data),
                "timestamp": datetime.now(timezone.utc).isoformat()
            },
            "data": [
                {
                    "week": r['date'],
                    "capital_count": r.get('fintech_count', 0),
                    "policy_count": r.get('policy_count', 0),
                    "growth_count": 0,
                    "total_count": r.get('total_articles', 0)
                } for r in res.data
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Momentum data failed: {str(e)}")

# 6. Documentation-Friendly Catch-All
@app.api_route("/{path_name:path}", methods=["GET", "POST"])
async def catch_all(request: Request, path_name: str):
    if path_name in ["docs", "openapi.json", "redoc"]:
        return 
    raise HTTPException(status_code=404, detail=f"Endpoint '/{path_name}' not found.")
