"""
NairobiSignal — Geographic Scope Tagger
========================================
Assigns geo_scope to each article: KENYA | PAN_AFRICA | GLOBAL
"""

from __future__ import annotations
import re
from dataclasses import dataclass
from typing import Optional

KENYA_ENTITIES: set[str] = {
    "safaricom", "airtel kenya", "telkom kenya", "faiba",
    "m-pesa", "mpesa", "m-shwari", "fuliza", "kcb mpesa",
    "equity bank", "equity group", "kcb", "kcb group",
    "cooperative bank", "ncba", "absa kenya", "i&m bank",
    "cbk", "central bank of kenya",
    "ca kenya", "communications authority of kenya",
    "cma kenya", "capital markets authority",
    "competition authority of kenya",
    "national treasury kenya",
    "twiga", "twiga foods", "copia kenya", "wasoko kenya",
    "pezesha", "pesalink", "pesapal",
    "m-tiba", "jacaranda health", "ilara health",
    "kenya airways", "jkia", "jomo kenyatta",
    "nairobi securities exchange", "nse kenya",
    "konza technopolis", "konza city",
    "ihub", "nairobi garage", "pivot east",
    "cellulant kenya", "sendy kenya",
    "nita kenya",
    "peter ndegwa", "james mwangi",
}

KENYA_PLACES: set[str] = {
    "kenya", "nairobi", "mombasa", "kisumu", "nakuru",
    "eldoret", "thika", "nyeri", "machakos", "malindi",
    "kenyan", "nairobians",
}

KENYA_REGULATORY: set[str] = {
    "cbk directive", "cbk circular", "cbk regulation",
    "cma kenya", "ca kenya", "nita kenya",
    "digital services tax kenya", "dst kenya",
    "kenya finance bill", "kenya budget",
    "finance act kenya",
}

PAN_AFRICA_ENTITIES: set[str] = {
    "mtn", "airtel africa", "orange africa",
    "flutterwave", "paystack", "chipper cash", "wave",
    "andela", "interswitch", "opay",
    "jumia", "konga",
    "africa50", "development bank of southern africa",
    "african development bank", "afdb",
    "disrupt africa", "techcabal", "techpoint africa",
    "vc4a", "partech africa", "pan-african",
}

PAN_AFRICA_PLACES: set[str] = {
    "nigeria", "lagos", "ghana", "accra", "south africa",
    "johannesburg", "egypt", "cairo", "ethiopia", "addis ababa",
    "rwanda", "kigali", "senegal", "dakar", "ivory coast",
    "tanzania", "dar es salaam", "uganda", "kampala",
    "zimbabwe", "zambia", "mozambique",
    "african continent", "sub-saharan africa", "west africa",
    "east africa", "horn of africa",
}

EAST_AFRICA_KENYA_OVERRIDE = {"kenya", "nairobi", "kenyan"}


@dataclass
class GeoResult:
    geo_scope: str
    is_kenya_relevant: bool
    confidence: float
    kenya_signals: list
    africa_signals: list
    reasoning: str

    def to_dict(self):
        return {
            "geo_scope": self.geo_scope,
            "is_kenya_relevant": self.is_kenya_relevant,
            "geo_confidence": round(self.confidence, 3),
            "geo_reasoning": self.reasoning,
        }


def _norm(text):
    return text.lower().strip()


def tag_article(title, body="", known_entities=None):
    full = _norm(f"{title} {body}")
    title_norm = _norm(title)
    kenya_hits = []
    africa_hits = []

    for ent in KENYA_ENTITIES:
        if ent in full:
            weight = 2 if ent in title_norm else 1
            kenya_hits.extend([ent] * weight)
    for ent in PAN_AFRICA_ENTITIES:
        if ent in full:
            weight = 2 if ent in title_norm else 1
            africa_hits.extend([ent] * weight)

    if known_entities:
        for ent in known_entities:
            if _norm(ent) in KENYA_ENTITIES:
                kenya_hits.append(ent)

    for place in KENYA_PLACES:
        if re.search(r'\b' + re.escape(place) + r'\b', full):
            weight = 3 if place in title_norm else 1
            kenya_hits.extend([place] * weight)

    for place in PAN_AFRICA_PLACES:
        if re.search(r'\b' + re.escape(place) + r'\b', full):
            if place == "east africa":
                if any(k in full for k in EAST_AFRICA_KENYA_OVERRIDE):
                    kenya_hits.append("east africa+kenya")
                    continue
            africa_hits.append(place)

    for kw in KENYA_REGULATORY:
        if kw in full:
            kenya_hits.append(kw)

    k = len(kenya_hits)
    a = len(africa_hits)
    total = k + a

    if total == 0:
        return GeoResult("GLOBAL", False, 0.5, [], [], "No geographic signals detected")

    kenya_ratio = k / total

    if k >= 2 or kenya_ratio >= 0.65:
        confidence = min(1.0, 0.6 + (kenya_ratio * 0.4))
        return GeoResult("KENYA", True, confidence,
            list(dict.fromkeys(kenya_hits))[:6],
            list(dict.fromkeys(africa_hits))[:3],
            f"Kenya signals ({k}) outweigh Africa ({a}): {kenya_hits[0] if kenya_hits else '—'}")

    if a >= 2 and k == 0:
        confidence = min(1.0, 0.6 + ((1 - kenya_ratio) * 0.4))
        return GeoResult("PAN_AFRICA", False, confidence, [],
            list(dict.fromkeys(africa_hits))[:6],
            f"Pan-Africa signals ({a}) with no Kenya anchor")

    if k >= 1:
        return GeoResult("KENYA", True, 0.55,
            list(dict.fromkeys(kenya_hits))[:4],
            list(dict.fromkeys(africa_hits))[:3],
            f"Mixed signals; Kenya anchor present: {kenya_hits[0] if kenya_hits else '—'}")

    return GeoResult("PAN_AFRICA", False, 0.55, [],
        list(dict.fromkeys(africa_hits))[:4],
        "Pan-Africa signals without Kenya anchor")


def retro_tag_all(supabase_client, batch_size=50):
    stats = {"total": 0, "kenya": 0, "pan_africa": 0, "global": 0, "errors": 0}
    try:
        response = (
            supabase_client.table("articles")
            .select("id, title, summary")
            .is_("geo_scope", "null")
            .limit(batch_size)
            .execute()
        )
        articles = response.data
        stats["total"] = len(articles)
        for art in articles:
            try:
                geo = tag_article(art.get("title", ""), art.get("summary", ""))
                supabase_client.table("articles").update({
                    "geo_scope":         geo.geo_scope,
                    "is_kenya_relevant": geo.is_kenya_relevant,
                    "geo_confidence":    geo.confidence,
                    "geo_reasoning":     geo.reasoning,
                }).eq("id", art["id"]).execute()
                stats[geo.geo_scope.lower()] = stats.get(geo.geo_scope.lower(), 0) + 1
            except Exception as e:
                stats["errors"] += 1
                print(f"[GEO] Error on article {art.get('id')}: {e}")
    except Exception as e:
        print(f"[GEO] Batch fetch failed: {e}")
    return stats
