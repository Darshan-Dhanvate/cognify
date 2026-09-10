"""Generate a labelled Cognify telemetry fixture for pipeline development.

This is a simulator, not evidence of real-world model accuracy. Its equations
are explicit so they can be replaced when pilot labels become available.
"""
from pathlib import Path

import numpy as np
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "synthetic" / "cognify_v0.csv"


def generate(rows: int = 50000, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    workload = rng.beta(2.2, 3.0, rows)
    stress = np.clip(18 + 62 * workload + rng.normal(0, 10, rows), 0, 100)
    created = rng.poisson(5 + 12 * workload)
    completion = np.clip(rng.beta(5 - 2.5 * workload, 2.2 + 4 * workload), 0, 1)
    completed = np.minimum(created, np.round(created * completion).astype(int))
    overdue = rng.poisson(np.clip(0.4 + 4.5 * workload, 0.1, None))
    rescheduled = rng.poisson(np.clip(0.3 + 3.8 * workload, 0.1, None))
    active = np.maximum(0, created - completed + rng.poisson(1.5, rows))
    high = rng.binomial(active, np.clip(0.12 + 0.2 * workload, 0, 0.8))
    critical = rng.binomial(high, 0.18)
    blocked = rng.poisson(np.clip(0.2 + 2.0 * workload, 0.05, None))
    estimated = np.clip(rng.normal(35 + 55 * workload, 12, rows), 5, 240)
    velocity = np.clip(rng.normal(4 + 44 * workload, 22, rows), -60, 180)
    actual = np.clip(estimated + velocity, 1, 300)
    scheduled = np.clip(rng.normal(120 + 420 * workload, 80, rows), 0, 900)
    completed_minutes = np.clip(scheduled * completion + rng.normal(0, 20, rows), 0, 900)
    pressure = np.clip((overdue / 8) * 0.55 + (scheduled / 900) * 0.45, 0, 1)
    sentiment = np.clip(0.35 - stress / 140 + rng.normal(0, 0.08, rows), -1, 1)
    distortions = rng.poisson(np.clip(stress / 35, 0, 4))
    journals = rng.poisson(np.clip(1 + 4 * workload, 0, 10))
    friction = np.minimum(blocked, rng.poisson(np.clip(1 + 2 * workload, 0.1, None)))

    # Development-only label: a noisy latent relationship, deliberately documented.
    latent = (0.34 * stress + 3.2 * overdue + 3.8 * rescheduled +
              0.22 * velocity + 4.2 * friction + 18 * pressure -
              16 * completion + rng.normal(0, 8, rows))
    risk = np.clip(latent, 0, 100)
    return pd.DataFrame({
        "nlpStress": np.round(stress, 3), "sentimentPolarity": np.round(sentiment, 4),
        "detectedDistortionCount": distortions, "journalFrequency7d": journals,
        "tasksCreated7d": created, "tasksCompleted7d": completed, "tasksOverdue": overdue,
        "tasksRescheduled7d": rescheduled, "averagePushCount7d": np.round(rescheduled / np.maximum(created, 1), 3),
        "completionRate7d": np.round(completed / np.maximum(created, 1) * 100, 3),
        "averageEstimatedMinutes7d": np.round(estimated, 3), "averageActualMinutes7d": np.round(actual, 3),
        "velocityDelta7d": np.round(velocity, 3), "activeTaskCount": active,
        "highPriorityTaskCount": high, "criticalTaskCount": critical, "blockedTaskCount": blocked,
        "dependencyFriction": friction, "todayScheduledMinutes": np.round(scheduled, 3),
        "todayCompletedMinutes": np.round(completed_minutes, 3), "deadlinePressure": np.round(pressure, 4),
        "burnoutRiskScore": np.round(risk, 3), "burnoutHighRisk": (risk >= 65).astype(int),
    })


if __name__ == "__main__":
    OUT.parent.mkdir(parents=True, exist_ok=True)
    generate().to_csv(OUT, index=False)
    print(f"Wrote {OUT}")

