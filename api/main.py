from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

# Add your specific Vercel URL to stop the "Red" CORS errors
origins = [
    "http://localhost:3000",
    "https://nairobi-signal-xynh.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "NairobiSignal API Active"}

@app.get("/momentum")
def get_momentum():
    # This matches the JSON truth you verified earlier
    return [
        {"week": "2026-02-16T00:00:00+00:00", "capital_count": 2, "policy_count": 0, "growth_count": 0, "total_count": 2},
        {"week": "2026-02-23T00:00:00+00:00", "capital_count": 13, "policy_count": 1, "growth_count": 0, "total_count": 14}
    ]

@app.get("/signals")
def get_signals():
    return [] # Placeholder for your signal cards
