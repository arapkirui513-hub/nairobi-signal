import os
from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
app = FastAPI(title="NairobiSignal API")

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

@app.get("/")
async def root():
    return {"message": "Welcome to NairobiSignal API", "status": "online"}

@app.get("/signal")
async def get_high_signal(limit: int = 10):
    """Returns the top tech stories ranked by Signal Score"""
    try:
        res = supabase.table("articles") \
            .select("title, url, summary, signal_score, published_at") \
            .gt("signal_score", 1.0) \
            .order("signal_score", desc=True) \
            .limit(limit) \
            .execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/search")
async def search_articles(query: str):
    """Search for articles by keyword in title or summary"""
    try:
        # Search for the query string in the title or summary
        res = supabase.table("articles") \
            .select("title, url, signal_score, published_at") \
            .or_(f"title.ilike.%{query}%,summary.ilike.%{query}%") \
            .order("published_at", desc=True) \
            .execute()
        
        if not res.data:
            return {"message": f"No articles found matching '{query}'"}
            
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
