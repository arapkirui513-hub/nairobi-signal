# 🇰🇪 NairobiSignal
**Live Economic Intelligence for the Kenyan Tech Ecosystem.**

NairobiSignal is a proprietary intelligence terminal that captures, scores, and visualizes the movement of capital and policy in Nairobi in real-time.
## 🏗️ System Architecture

The project follows a **Decoupled Data Pipeline** architecture, separating high-frequency ingestion from the presentation layer.

```mermaid
graph TD
    subgraph "Data Ingestion (Python/FastAPI)"
        A[12 RSS Sources] -->|Scrape| B(Ingestion Engine)
        B -->|v1.5 Scoring| C{Signal Scorer}
        C -->|High Signal| D[(Supabase DB)]
    end

    subgraph "Intelligence Bridge"
        D -->|SQL Aggregation| E[FastAPI REST API]
        E -->|JSON| F[Momentum Endpoint]
    end

    subgraph "War Room (Next.js)"
        F -->|Fetch| G[Momentum Chart]
        G --> H[NairobiSignal Dashboard]
        D -->|Fetch| I[Signal Cards]
        I --> H
    end
    
    ---

### **Step 5: Paste the "Parts List" (Tech Stack)**
Copy and paste this table so people know what tools you used:

```markdown
## 🛠️ Tech Stack

| Component | Technology |
| :--- | :--- |
| **Backend** | Python 3.12, FastAPI, Uvicorn |
| **Database** | Supabase (PostgreSQL) |
| **Frontend** | Next.js 16 (App Router), TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Charts** | Recharts |

## 🚀 Quick Start

### 1. Start the Backend Engine
```bash
cd nairobi-signal
source venv/bin/activate
uvicorn api.main:app --reload --port 8000
