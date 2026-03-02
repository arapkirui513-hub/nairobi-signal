# 🚀 NairobiSignal
**Automated Tech & Investment Intelligence for the Silicon Savannah.**

NairobiSignal is a production-grade "Reflective Instrument" designed to capture, score, and disseminate high-stakes technical and financial shifts within the Kenyan ecosystem. It moves beyond simple news aggregation by applying a deterministic **Intelligence Lens** to raw data.

---

## 🧠 The Intelligence Lens (v1.5)
The core of this project is a weighted scoring engine that prioritizes structural shifts over market noise.

### **Priority 1: March 2026 Regulatory Blitz (+5.5)**
Detects tectonic policy shifts including:
* **CBK M-Pesa Number Masking:** Privacy-first fintech mandates.
* **CA Rate Cuts (MTR):** Reduction of call charges to **Sh0.37**, altering telco competition.

### **Priority 2: KIICO 2026 Deal Flow (+4.5)**
Monitors the **$2 Billion (KES 258B)** bankable deal target and the **$75 Trillion** market access narrative.

### **Priority 3: Capital & Funding (+4.0)**
Identifies hard cash signals ($10M+ raises, M&A, and VC activity).

### **Noise Suppression (-10.0)**
Strictly filters "Soft News" including betting (Aviator), gossip, and speculative meme coins.

---

## 🛠️ Tech Stack
* **Ingestion:** Python + Playwright v1.5 (Deep Reach Browser Automation).
* **Intelligence:** Custom Regex & Pattern Matching Engine.
* **Storage:** Supabase (PostgreSQL) with JSONB metadata explainability.
* **Dissemination:** Resend API for automated HTML briefings.
* **Automation:** Linux Crontab (Scheduled at 08:00 EAT).

---

## ⚡ Quick Start

### **1. Setup Environment**
```bash
# Clone and enter
git clone <your-repo-url>
cd nairobi-signal

# Rebuild the environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Install Playwright browsers
playwright install firefox
