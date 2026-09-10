from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RAW_DATA = ROOT / "data" / "raw"
PROCESSED_DATA = ROOT / "data" / "processed"
MODELS = ROOT / "models"
REPORTS = ROOT / "reports"

TARGET_CANDIDATES = (
    "mbi_ex",
    "burn_rate",
    "burnout",
    "burnout_score",
    "burnout_risk",
    "mental_fatigue_score",
)
