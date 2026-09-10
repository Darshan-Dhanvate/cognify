import json
from datetime import datetime, timezone

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import accuracy_score, brier_score_loss, f1_score, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier

from .data_audit import audit_dataset, find_csv
from .settings import MODELS, RAW_DATA, REPORTS


MBI_COLUMNS = {"mbi_ex", "mbi_cy", "mbi_ea"}
IDENTIFIER_COLUMNS = {"id", "id_nms"}


def make_mbi_target(frame: pd.DataFrame) -> tuple[pd.Series, dict]:
    missing = MBI_COLUMNS.difference(frame.columns)
    if missing:
        raise ValueError(f"The selected dataset is missing MBI outcome columns: {sorted(missing)}")

    mbi = frame[list(MBI_COLUMNS)].apply(pd.to_numeric, errors="coerce")
    if mbi.notna().mean().min() < 0.8:
        raise ValueError("Too many missing values in the MBI outcome columns.")
    if mbi.isna().any().any():
        raise ValueError("Missing MBI outcomes must be removed before target construction.")

    # MBI exhaustion and cynicism increase burnout; academic efficacy decreases it.
    # The result is a transparent screening index, not a clinical diagnosis.
    burnout_index = (
        (mbi["mbi_ex"] / 54.0) * 0.45
        + (mbi["mbi_cy"] / 30.0) * 0.35
        + (1.0 - (mbi["mbi_ea"] / 48.0)) * 0.20
    ).clip(0.0, 1.0)
    cutoff = float(burnout_index.quantile(0.75))
    target = (burnout_index >= cutoff).astype(int)
    metadata = {
        "target": "mbi_high_burnout_screening",
        "formula": "0.45*(mbi_ex/54) + 0.35*(mbi_cy/30) + 0.20*(1-mbi_ea/48)",
        "high_risk_cutoff": cutoff,
        "target_note": "Top quartile of this dataset; not a universal clinical threshold.",
    }
    return target, metadata


def build_pipeline(model, numeric, categorical):
    transformer = ColumnTransformer(
        transformers=[
            ("numeric", Pipeline([
                ("imputer", SimpleImputer(strategy="median")),
                ("scale", StandardScaler()),
            ]), numeric),
            ("categorical", Pipeline([
                ("imputer", SimpleImputer(strategy="most_frequent")),
                ("one_hot", OneHotEncoder(handle_unknown="ignore")),
            ]), categorical),
        ],
        remainder="drop",
    )
    return Pipeline([("features", transformer), ("model", model)])


def score(model, x_test, y_test):
    predictions = model.predict(x_test)
    probabilities = model.predict_proba(x_test)[:, 1]
    return {
        "accuracy": round(float(accuracy_score(y_test, predictions)), 4),
        "precision": round(float(precision_score(y_test, predictions, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, predictions, zero_division=0)), 4),
        "f1": round(float(f1_score(y_test, predictions, zero_division=0)), 4),
        "roc_auc": round(float(roc_auc_score(y_test, probabilities)), 4),
        "brier_score": round(float(brier_score_loss(y_test, probabilities)), 4),
    }


def main():
    csv_path = find_csv(RAW_DATA)
    frame, _, audit = audit_dataset(csv_path)
    frame = frame.drop_duplicates().reset_index(drop=True)
    frame = frame.dropna(subset=list(MBI_COLUMNS)).reset_index(drop=True)
    y, target_metadata = make_mbi_target(frame)
    x = frame.drop(columns=list(MBI_COLUMNS | IDENTIFIER_COLUMNS), errors="ignore")
    x = x.drop(columns=[col for col in x.columns if col.startswith("unnamed")], errors="ignore")
    numeric = x.select_dtypes(include=[np.number]).columns.tolist()
    categorical = [col for col in x.columns if col not in numeric]
    if not numeric and not categorical:
        raise ValueError("Dataset has no usable features.")
    x_train, x_test, y_train, y_test = train_test_split(
        x, y, test_size=0.2, random_state=42, stratify=y
    )
    models = {
        "logistic_regression": LogisticRegression(max_iter=1000, class_weight="balanced"),
        "xgboost": XGBClassifier(
            n_estimators=250, max_depth=4, learning_rate=0.04,
            subsample=0.85, colsample_bytree=0.85, eval_metric="logloss",
            random_state=42, n_jobs=2,
        ),
        "lightgbm": LGBMClassifier(
            n_estimators=250, num_leaves=31, learning_rate=0.04,
            class_weight="balanced", random_state=42, verbosity=-1,
        ),
    }
    MODELS.mkdir(parents=True, exist_ok=True)
    results = {}
    for name, estimator in models.items():
        pipeline = build_pipeline(estimator, numeric, categorical)
        pipeline.fit(x_train, y_train)
        results[name] = score(pipeline, x_test, y_test)
        joblib.dump(pipeline, MODELS / f"{name}.joblib")

    calibrated = build_pipeline(
        CalibratedClassifierCV(
            estimator=LogisticRegression(max_iter=1000, class_weight="balanced"),
            method="isotonic",
            cv=5,
        ),
        numeric,
        categorical,
    )
    calibrated.fit(x_train, y_train)
    results["calibrated_logistic_regression"] = score(calibrated, x_test, y_test)
    joblib.dump(calibrated, MODELS / "burnout_population_calibrated.joblib")

    metadata = {
        "model_version": "burnout-baseline-0.1.0",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "dataset": audit,
        "target_encoding": target_metadata,
        "feature_columns": x.columns.tolist(),
        "metrics": results,
        "warning": "This baseline is not production-ready until the target is validated and evaluation is participant-level.",
        "selected_model": "calibrated_logistic_regression",
    }
    (REPORTS / "metrics.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
