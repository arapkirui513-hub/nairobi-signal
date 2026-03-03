import os
import math
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Request, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from supabase import create_client, Client
from dotenv import load_dotenv

# 1. Initialization & Config
load_dotenv()
app = FastAPI(
    title="NairobiSignal API",
    version="2.2.0",
    description="Institutional-grade intelligence terminal for the Kenyan tech ecosystem."
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
        "message": str(exc.detail) if hasattr(exc, "detail") else "An unexpected error occurred.",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "path": request.url.path
    }
    if IS_DEV:
        error_data["debug_info"] = str(exc)
        
    return JSONResponse(status_code=status_code, content=error_data)

# 5. Hardened Endpoints

@app.get("/health")
async def health_check():
    """V2.2: Comprehensive snapshot with status, counts, and freshness logic."""
    try:
        # Table counts for observability
        counts = {
            "articles": supabase.table("articles").select("id", count="exact").limit(1).execute().count,
            "aggregates": supabase.table("daily_aggregates").select("id", count="exact").limit(1).execute().count
        }
        
        # Ingestion Heartbeat check
        latest = supabase.table("articles").select("created_at").order("created_at", desc=True).limit(1).execute()
        
        if not latest.data:
            return {"status": "empty", "counts": counts, "timestamp": datetime.now(timezone.utc).isoformat()}

        last_ingestion = datetime.fromisoformat(latest.data[0]['created_at'].replace('Z', '+00:00'))
        delta_hours = (datetime.now(timezone.utc) - last_ingestion).total_seconds() / 3600
        
        # Determine status
        is_stale = delta_hours > 48
        system_status = "healthy" if not is_stale else "stale"
        
        response_payload = {
            "status": system_status,
            "last_ingestion_at": last_ingestion.isoformat(),
            "hours_since_last_run": round(delta_hours, 1),
            "counts": counts,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        return JSONResponse(
            status_code=503 if is_stale else 200, 
            content=response_payload
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

@app.get("/signal")
async def get_signals(
    category: Optional[str] = None,
    limit: int = Query(20, le=100),
    page: int = Query(1, ge=1)
):
    """V2.2: Refined Signal Feed with Metadata, Audit, and Pagination."""
    try:
        offset = (page - 1) * limit
        
        # Base query with exact count for total_pages calculation
        query = supabase.table("articles").select("*", count="exact").order("created_at", desc=True)
        
        # Broad JSONB metadata search
        if category:
            query = query.filter("score_metadata::text", "ilike", f"%{category}%")

        res = query.range(offset, offset + limit - 1).execute()
        
        total_results = res.count if res.count else 0
        total_pages = math.ceil(total_results / limit) if total_results > 0 else 0

        return {
            "metadata": {
                "page": page,
                "limit": limit,
                "total_results": total_results,
                "total_pages": total_pages,
                "timestamp": datetime.now(timezone.utc).isoformat()
            },
            "data": res.data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Signal retrieval failed: {str(e)}")

@app.get("/momentum")
async def get_momentum(start: Optional[str] = None, end: Optional[str] = None):
    """V2.2: Timezone-aware momentum data with aligned field names."""
    try:
        query = supabase.table("daily_aggregates").select("*").order("date", desc=False)
        if start: query = query.gte("date", start)
        if end: query = query.lte("date", end)
        
        res = query.execute()
        
        return [{
            "week": r['date'],
            "capital_count": r.get('fintech_count', 0),
            "policy_count": r.get('policy_count', 0),
            "growth_count": 0, # Placeholder for v2.2 velocity
            "total_count": r.get('total_articles', 0)
        } for r in res.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Momentum data hydration failed: {str(e)}")

# 6. Documentation-Aware Catch-All
@app.api_route("/{path_name:path}", methods=["GET", "POST"])
async def catch_all(request: Request, path_name: str):
    # Allow internal FastAPI documentation routes
    if path_name in ["docs", "openapi.json", "redoc"]:
        return 
    raise HTTPException(status_code=404, detail=f"The endpoint '/{path_name}' does not exist on NairobiSignal v2.2.")
