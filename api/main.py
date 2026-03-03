import os
from datetime import datetime
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from supabase import create_client, Client
from dotenv import load_dotenv

# 1. Initialization
load_dotenv()
app = FastAPI(title="NairobiSignal API", version="1.5.0")

# 2. CORS Configuration (Allow Vercel and Localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, replace with your specific Vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Supabase Client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

# 4. Global Exception Handler (Anti-404 Detail)
@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "NairobiSignal_API_Error",
            "message": exc.detail,
            "path": request.url.path,
            "timestamp": datetime.utcnow().isoformat()
        },
    )

# 5. Production Endpoints

@app.get("/health")
async def health_check():
    """Verify DB connectivity and system readiness."""
    try:
        # Check DB connection
        response = supabase.table("articles").select("count", count="exact").limit(1).execute()
        
        # Check Heartbeat (Articles in last 48 hours)
        hb_check = supabase.table("articles").select("created_at").order("created_at", desc=True).limit(1).execute()
        last_ingestion = hb_check.data[0]['created_at'] if hb_check.data else "No data"

        return {
            "status": "healthy",
            "database": "connected",
            "last_ingestion": last_ingestion,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database connection failed: {str(e)}")

@app.get("/signal")
async def get_raw_signals(limit: int = 10):
    """Returns the latest N articles with full metadata audit trails."""
    try:
        response = supabase.table("articles").select("*").order("created_at", desc=True).limit(limit).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/momentum")
async def get_momentum_aggregates():
    """Powering the War Room Chart: Capital vs Policy shifts."""
    try:
        response = supabase.table("daily_aggregates").select("*").order("date", desc=False).execute()
        
        # Map DB columns to Frontend expectations
        formatted_data = []
        for row in response.data:
            formatted_data.append({
                "week": row['date'],
                "capital_count": row.get('fintech_count', 0),
                "policy_count": row.get('policy_count', 0),
                "total_count": row.get('total_articles', 0)
            })
        return formatted_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chart data hydration failed: {str(e)}")

# Fallback for undefined routes
@app.api_route("/{path_name:path}", methods=["GET", "POST"])
async def catch_all(path_name: str):
    raise HTTPException(status_code=404, detail=f"The endpoint '/{path_name}' does not exist on NairobiSignal v1.5.")
