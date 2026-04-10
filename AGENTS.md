# AGENTS.md - AI Assistant Configuration

## Project Overview

NairobiSignal is a real-time economic intelligence platform for the Kenyan tech ecosystem. It captures, scores, and visualizes capital and policy movements in Nairobi through RSS feeds and data pipelines.

## Project Structure

```
nairobi-signal/
├── api/                 # FastAPI backend
│   ├── main.py         # FastAPI app entry point
│   └── routes.py       # API endpoints
├── frontend/           # Next.js 16 dashboard
│   ├── app/           # App Router pages
│   └── components/    # React components
├── ingestion/          # RSS feed ingestion
│   ├── fetch_feeds.py
│   └── playwright_fetch.py
├── processing/         # Signal scoring & analysis
│   ├── score_signal.py
│   ├── score_articles.py
│   └── send_briefing.py
├── ingest.py           # Main ingestion script
├── requirements.txt    # Python dependencies
└── run_pipeline.sh     # Pipeline execution script
```

## Tech Stack

- **Backend**: Python 3.12, FastAPI, Uvicorn
- **Database**: Supabase (PostgreSQL)
- **Frontend**: Next.js 16 (App Router), TypeScript
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **Email**: Resend API

## Common Commands

### Backend
```bash
# Start development server
uvicorn api.main:app --reload --port 8000

# Install dependencies
pip install -r requirements.txt

# Run ingestion pipeline
./run_pipeline.sh
```

### Frontend
```bash
cd frontend

# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint
```

## Code Conventions

### Python
- Use type hints for function signatures
- Async/await for API endpoints
- Pydantic models for data validation
- Environment variables via python-dotenv

### TypeScript/React
- App Router (Next.js 16)
- Functional components with hooks
- Server Components by default
- Client Components with 'use client' directive
- Tailwind CSS for styling

## Environment Variables

Required in `.env`:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase anon key
- `RESEND_API_KEY` - Resend email API key
- `ENVIRONMENT` - development/production

## Database Schema

Main tables in Supabase:
- `signals` - Scored articles with metadata
- `momentum` - Weekly aggregated metrics

## Signal Scoring

- Tectonic ($10M+): +10.0
- Policy (CBK directive): +6.5
- Growth (expansion): +2.5
- Noise (gambling): -10.0

## Testing

No test suite configured. When adding tests:
- Backend: Use pytest
- Frontend: Use Jest with React Testing Library

## Notes

- RSS ingestion runs 4x daily via cron
- Noise suppression targets gambling/gossip content
- Email briefings sent for signals scoring >5.0
