"""
NairobiSignal — Sector Taxonomy Registry v1
FROZEN: 2026-03-23  |  NEXT REVIEW: 2026-06-15
"""

from dataclasses import dataclass

@dataclass(frozen=True)
class Sector:
    canonical_name: str
    aliases: tuple
    esd_weight: float
    signal_floor: int
    notes: str
    color: str

SECTORS = {
    "fintech": Sector("fintech",
        ("financial_technology","payments","lending","insurtech","digital_finance","mobile_money","neobank"),
        1.00, 4, "Highest-density sector. M-Pesa ecosystem, digital lending, insurance. Do NOT split until June.", "#00ff41"),
    "policy": Sector("policy",
        ("regulation","regulatory","legislation","government","cbk","ca_kenya","cma_kenya","nita"),
        0.85, 3, "Cross-cutting lens. CBK directives, CA licensing, CMA advisories. Anomalous silence more significant than spike.", "#ff8c00"),
    "telecom": Sector("telecom",
        ("telecommunications","telco","connectivity","broadband","5g","spectrum"),
        0.70, 2, "Safaricom dominates. Telecom shifts precede fintech shifts ~6-8 weeks (hypothesis).", "#00d4ff"),
    "ai_ml": Sector("ai_ml",
        ("artificial_intelligence","machine_learning","ai","generative_ai","llm","data_science"),
        0.55, 2, "Emerging. Currently +1.8 sigma W09. Low baseline — treat first 30-day mean with caution.", "#7c6af7"),
    "startup": Sector("startup",
        ("venture","funding","seed","series_a","series_b","early_stage","growth_stage","startup_ecosystem"),
        0.65, 3, "Funding not attributable to single sector. Twiga, Copia, Sendy. Do NOT split until June.", "#f7d76a"),
    "health": Sector("health",
        ("healthtech","digital_health","medtech","telemedicine","health_insurance"),
        0.35, 1, "Low-density. M-Tiba, Ilara Health, Jacaranda. Single week silence is not anomalous.", "#ff6b9d"),
    "infrastructure": Sector("infrastructure",
        ("data_centre","data_center","cloud","undersea_cable","konza","isp","internet_exchange"),
        0.30, 1, "Physical and digital infrastructure. Konza, SEACOM, TEAMS. Key leading indicator.", "#4ecdc4"),
    "ecommerce": Sector("ecommerce",
        ("e-commerce","retail_tech","logistics_tech","agritech","marketplace"),
        0.40, 1, "Retail, logistics, agritech. Wasoko, Twiga supply side, Copia.", "#95e06c"),
}

GENERAL_CATEGORY = "general"
GENERAL_TARGET_PCT = 0.20

TAXONOMY_BACKLOG = [
    {"change":"SPLIT","target":"fintech","rationale":"M-Pesa/Pesalink signals cluster separately from lending.","apply_on":"2026-06-15"},
    {"change":"SPLIT","target":"startup","rationale":"Seed rounds behave differently from Series B+.","apply_on":"2026-06-15"},
    {"change":"ADD","target":"climatech","rationale":"Sun King, d.light generating consistent signal.","apply_on":"2026-06-15"},
    {"change":"ADD","target":"agritech","rationale":"Apollo Agriculture, Twiga supply side needs separation.","apply_on":"2026-06-15"},
    {"change":"KEYWORD","target":"policy","rationale":"Add MERGER_CLEARANCE category. COMESA blind spot W01.","apply_on":"IMMEDIATE"},
]

def validate_sector(label):
    label_norm = label.lower().strip()
    if label_norm in SECTORS:
        return label_norm, 1.0
    for name, sector in SECTORS.items():
        if label_norm in sector.aliases:
            return name, 0.85
    for name in SECTORS:
        if name in label_norm or label_norm in name:
            return name, 0.60
    return "general", 0.0
