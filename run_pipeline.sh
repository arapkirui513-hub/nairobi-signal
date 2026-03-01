#!/bin/bash
# 1. Define Absolute Paths
PROJECT_DIR="/home/shannel/Projects/nairobi-signal"
VENV_PATH="$PROJECT_DIR/venv/bin/activate"

# 2. Navigate to Project
cd $PROJECT_DIR

# 3. Load Environment & Run Pipeline
source $VENV_PATH

echo "--- PIPELINE START: $(date) ---"
python3 ingestion/playwright_fetch.py
python3 processing/score_signal.py
python3 processing/send_briefing.py
echo "--- PIPELINE END ---"
