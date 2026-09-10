import json
from pathlib import Path

import pandas as pd

from .settings import REPORTS, TARGET_CANDIDATES


def find_csv(raw_dir: Path) -> Path:
    files = sorted(raw_dir.glob("*.csv"))
    if not files:
        raise FileNotFoundError(
            "No CSV found in m/data/raw. Download an approved dataset first."
        )
    if len(files) > 1:
        raise RuntimeError("Keep one selected training CSV in m/data/raw.")
    return files[0]


def audit_dataset(csv_path: Path) -> tuple[pd.DataFrame, str, dict]:
    frame = pd.read_csv(csv_path)
    frame.columns = [str(col).strip().lower().replace(" ", "_") for col in frame.columns]
    target = next((name for name in TARGET_CANDIDATES if name in frame.columns), None)
    if target is None:
        raise ValueError(
            "No documented burnout target found. Expected one of: "
            + ", ".join(TARGET_CANDIDATES)
        )

    report = {
        "file": csv_path.name,
        "rows": int(len(frame)),
        "columns": int(len(frame.columns)),
        "target": target,
        "duplicate_rows": int(frame.duplicated().sum()),
        "missing_percent": frame.isna().mean().round(4).to_dict(),
        "target_distribution": frame[target].value_counts(dropna=False).to_dict(),
    }
    REPORTS.mkdir(parents=True, exist_ok=True)
    (REPORTS / "dataset_audit.json").write_text(
        json.dumps(report, indent=2, default=str), encoding="utf-8"
    )
    return frame, target, report

