"""
NairobiSignal — Retro Tagger
==============================
Backfills geo_scope, is_kenya_relevant, classification_v1,
and signal_score on all articles inserted before Phase III.

Safe to run multiple times — only touches rows where
geo_scope IS NULL (untagged articles).

Run once manually this weekend:
  python3 retro_tag.py

Progress is printed after each batch of 50.
"""

import os
import sys
import logging
from dotenv import load_dotenv
from supabase import create_client
from geo_tagger import tag_article
from ingest import classify_sector, compute_signal_score

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
log = logging.getLogger("retro-tag")

load_dotenv()
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])

BATCH_SIZE = 50

def run():
    stats = {"total": 0, "kenya": 0, "pan_africa": 0, "global": 0, "errors": 0}
    batch_num = 0

    log.info("=" * 52)
    log.info("NairobiSignal — Retro Tagger starting")
    log.info("Targeting: articles WHERE geo_scope IS NULL")
    log.info("=" * 52)

    while True:
        # Fetch next batch of untagged articles
        res = (
            supabase.table("articles")
            .select("id, title, summary")
            .is_("geo_scope", "null")
            .limit(BATCH_SIZE)
            .execute()
        )
        batch = res.data
        if not batch:
            log.info("No more untagged articles — retro-tag complete.")
            break

        batch_num += 1
        log.info(f"\nBatch {batch_num}: {len(batch)} articles")

        for art in batch:
            art_id  = art["id"]
            title   = art.get("title", "")
            summary = art.get("summary", "")

            try:
                geo           = tag_article(title, summary)
                sector_v1     = classify_sector(f"{title} {summary}")
                score, metadata = compute_signal_score(title, summary)

                supabase.table("articles").update({
                    "geo_scope":         geo.geo_scope,
                    "is_kenya_relevant": geo.is_kenya_relevant,
                    "geo_confidence":    geo.confidence,
                    "geo_reasoning":     geo.reasoning,
                    "classification_v1": sector_v1,
                    "signal_score":      score,
                    "score_metadata":    metadata,
                    # classification_v2 stays NULL — retro_classify.py fills it
                }).eq("id", art_id).execute()

                stats["total"] += 1
                scope_key = geo.geo_scope.lower()
                stats[scope_key] = stats.get(scope_key, 0) + 1

                log.info(
                    f"  ✓ [{sector_v1:<14}] [{geo.geo_scope:<10}] "
                    f"SIG:{score:<4} {title[:50]}"
                )

            except Exception as e:
                stats["errors"] += 1
                log.error(f"  ✗ Error on {art_id}: {e}")

    # ── Final report ──────────────────────────────────────────────────
    geo_total = stats["kenya"] + stats["pan_africa"] + stats["global"]
    kenya_pct = (stats["kenya"] / geo_total * 100) if geo_total > 0 else 0

    log.info("\n" + "=" * 52)
    log.info("  Retro Tag — Complete")
    log.info("=" * 52)
    log.info(f"  Articles tagged  : {stats['total']}")
    log.info(f"  Errors           : {stats['errors']}")
    log.info(f"  Geo · Kenya      : {stats['kenya']}  ({kenya_pct:.0f}%)")
    log.info(f"  Geo · Pan-Africa : {stats['pan_africa']}")
    log.info(f"  Geo · Global     : {stats['global']}")
    log.info("=" * 52)
    log.info("\nNext step: verify in Supabase:")
    log.info("  SELECT geo_scope, COUNT(*) FROM articles GROUP BY geo_scope;")

if __name__ == "__main__":
    run()
