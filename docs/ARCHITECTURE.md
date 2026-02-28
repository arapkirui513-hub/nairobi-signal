# NairobiSignal — Architecture Reference

## Project
Kenya tech intelligence layer. RSS aggregation, signal scoring,
company mention tracking, and weekly insight generation.
Not a blog. A signal processing engine.

## Stack
- Frontend: Next.js on Vercel
- Database: Supabase (Postgres)
- Ingestion: Python + feedparser + Trigger.dev cron
- API: FastAPI
- Auth: Clerk (month 3)
- Payments: Stripe (month 3)
- Email: Resend + Buttondown
- Error tracking: Better Stack
- DNS: Cloudflare
- Domain: Namecheap

## Database Schema

### sources
- id (UUID, PK)
- name (text)
- base_url (text)
- rss_url (text)
- active (boolean)
- created_at (timestamp)

### articles
- id (UUID, PK)
- source_id (FK → sources)
- title (text)
- url (text, unique)
- author (text)
- published_at (timestamp)
- summary (text)
- content_hash (text)
- signal_score (float)
- created_at (timestamp)

### categories
- id (text, PK)
- name (text)
- Values: fintech, telecom, ai, startup, policy, healthtech

### article_categories
- article_id (FK → articles)
- category_id (FK → categories)

### companies
- id (UUID, PK)
- name (text)
- normalized_name (text)
- tier (int) — 1, 2, or 3

### article_companies
- article_id (FK → articles)
- company_id (FK → companies)

### daily_aggregates
- id (UUID, PK)
- date (date, unique)
- total_articles (int)
- fintech_count (int)
- telecom_count (int)
- ai_count (int)
- startup_count (int)
- policy_count (int)
- healthtech_count (int)
- top_company (text)
- top_company_count (int)
- avg_signal_score (float)

## Signal Scoring Formula
signal_score = (company_norm x 0.40) + (sector_norm x 0.35) + (recency_norm x 0.25)

- company_norm = raw_company_score / max_company_score_30d (capped at 1.0)
- sector_norm = sector_pct / max_sector_pct_30d
- recency_norm = e^(-0.05 x hours_since_published)

## Company Tiers
- Tier 1 (weight 1.0): Safaricom, M-PESA
- Tier 2 (weight 0.65): Equity Bank, KCB, Twiga Foods, Cellulant
- Tier 3 (weight 0.35): Pezesha, Ilara Health, tracked startups

## Primary Persona
Amara — VC analyst / accelerator associate
Tracks Kenya ecosystem for investment memo research
and sector heat detection.

## Insight Engine
Runs every Sunday 08:00.
Four SQL queries. Four sentence templates.
Output stored in generated_insights table.
Distributed via newsletter and LinkedIn.

## Sources (Phase 1)
- TechWeez: https://techweez.com/feed
- TechMoran: https://techmoran.com/feed
- TechTrendsKE: https://techtrendsKE.com/feed
- Kendesk: https://kendesk.co.ke/feed
- AIpots: https://aipots.co.ke/feed
