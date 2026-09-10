from pathlib import Path

import joblib
import pandas as pd
import xgboost as xgb

from .feature_contract import COGNIFY_FEATURES, validate_features
from .settings import MODELS


MODEL_VERSION = "cognify-synthetic-0.1.0"
CLASSIFIER_PATH = MODELS / "cognify_synthetic_classifier.joblib"
REGRESSOR_PATH = MODELS / "cognify_synthetic_regressor.joblib"

FRIENDLY_NAMES = {
    "nlpStress": "recent journal stress",
    "tasksOverdue": "overdue tasks",
    "tasksRescheduled7d": "task postponements this week",
    "completionRate7d": "weekly completion rate",
    "velocityDelta7d": "time taken above estimates",
    "activeTaskCount": "active task load",
    "sentimentPolarity": "journal sentiment",
    "detectedDistortionCount": "thinking-pattern flags",
    "journalFrequency7d": "check-ins this week",
    "tasksCreated7d": "tasks created this week",
    "tasksCompleted7d": "tasks completed this week",
    "averagePushCount7d": "average postponements",
    "averageEstimatedMinutes7d": "average estimated time",
    "averageActualMinutes7d": "average actual time",
    "highPriorityTaskCount": "high-priority tasks",
    "blockedTaskCount": "blocked tasks",
    "dependencyFriction": "dependency friction",
    "todayScheduledMinutes": "today's scheduled workload",
    "deadlinePressure": "deadline pressure",
}


class CognifyPredictor:
    def __init__(self):
        if not CLASSIFIER_PATH.exists() or not REGRESSOR_PATH.exists():
            raise FileNotFoundError("Synthetic Cognify models are missing. Run train_synthetic first.")
        self.classifier = joblib.load(CLASSIFIER_PATH)
        self.regressor = joblib.load(REGRESSOR_PATH)
        self.feature_names = list(COGNIFY_FEATURES)

    def predict(self, features: dict) -> dict:
        validate_features(features)
        frame = pd.DataFrame([{name: features[name] for name in self.feature_names}])
        probability = float(self.classifier.predict_proba(frame)[0, 1])
        regression_score = float(self.regressor.predict(frame)[0])
        # The regressor is trained on the continuous burnoutRiskScore target.
        # The classifier probability is only a high-risk likelihood and can be
        # close to zero for ordinary users even when their continuous score is
        # meaningful. Use the regressor for the user-facing percentage.
        risk_score = max(0.0, min(100.0, regression_score))
        if risk_score >= 85:
            risk_level = "critical"
        elif risk_score >= 75:
            risk_level = "high"
        elif risk_score >= 60:
            risk_level = "elevated"
        elif risk_score >= 40:
            risk_level = "moderate"
        else:
            risk_level = "stable"

        # Explain this prediction using the regressor's per-row contributions,
        # rather than showing the same global feature ranking for every user.
        contributions = None
        try:
            matrix = xgb.DMatrix(frame, feature_names=self.feature_names)
            contributions = self.regressor.get_booster().predict(matrix, pred_contribs=True)[0][:-1]
        except Exception:
            contributions = None
        factors = []
        if contributions is not None:
            ranked = sorted(zip(self.feature_names, contributions), key=lambda item: abs(float(item[1])), reverse=True)
            for name, contribution in ranked[:5]:
                if contribution == 0:
                    continue
                factors.append({
                    "feature": name,
                    "label": FRIENDLY_NAMES.get(name, name),
                    "value": features[name],
                    "contribution": round(float(contribution), 4),
                })

        return {
            "modelVersion": MODEL_VERSION,
            "predictionStatus": "development_only",
            "developmentOnly": True,
            "riskScore": round(risk_score, 2),
            "riskLevel": risk_level,
            "modelRegressionScore": round(regression_score, 2),
            "topFactors": factors,
        }
