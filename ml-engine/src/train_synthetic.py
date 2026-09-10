import json
from datetime import datetime, timezone

import joblib
import pandas as pd
from sklearn.metrics import accuracy_score, average_precision_score, f1_score, mean_absolute_error, roc_auc_score
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier, XGBRegressor

from .settings import MODELS, REPORTS, ROOT


def main():
    source = ROOT / "data" / "synthetic" / "cognify_v0.csv"
    if not source.exists():
        raise FileNotFoundError("Generate data first: python src/generate_cognify_data.py")
    data = pd.read_csv(source)
    features = [col for col in data.columns if col not in {"burnoutRiskScore", "burnoutHighRisk"}]
    x_train, x_test, y_train, y_test = train_test_split(
        data[features], data[["burnoutRiskScore", "burnoutHighRisk"]],
        test_size=0.2, random_state=42, stratify=data["burnoutHighRisk"],
    )
    classifier = XGBClassifier(n_estimators=300, max_depth=5, learning_rate=0.04,
                               subsample=0.85, colsample_bytree=0.85,
                               eval_metric="logloss", random_state=42, n_jobs=2)
    regressor = XGBRegressor(n_estimators=300, max_depth=5, learning_rate=0.04,
                             subsample=0.85, colsample_bytree=0.85,
                             objective="reg:squarederror", random_state=42, n_jobs=2)
    classifier.fit(x_train, y_train["burnoutHighRisk"])
    regressor.fit(x_train, y_train["burnoutRiskScore"])
    class_prob = classifier.predict_proba(x_test)[:, 1]
    class_pred = (class_prob >= 0.5).astype(int)
    score_pred = regressor.predict(x_test)
    metrics = {
        "dataset": "cognify_v0_synthetic",
        "rows": int(len(data)),
        "feature_count": len(features),
        "metrics_are_development_only": True,
        "classification": {
            "accuracy": round(float(accuracy_score(y_test["burnoutHighRisk"], class_pred)), 4),
            "f1": round(float(f1_score(y_test["burnoutHighRisk"], class_pred)), 4),
            "roc_auc": round(float(roc_auc_score(y_test["burnoutHighRisk"], class_prob)), 4),
            "average_precision": round(float(average_precision_score(y_test["burnoutHighRisk"], class_prob)), 4),
        },
        "regression": {"mae": round(float(mean_absolute_error(y_test["burnoutRiskScore"], score_pred)), 4)},
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "warning": "Synthetic labels encode the generator equations and are not real-world evidence.",
    }
    MODELS.mkdir(parents=True, exist_ok=True)
    REPORTS.mkdir(parents=True, exist_ok=True)
    joblib.dump(classifier, MODELS / "cognify_synthetic_classifier.joblib")
    joblib.dump(regressor, MODELS / "cognify_synthetic_regressor.joblib")
    (REPORTS / "synthetic_metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()

