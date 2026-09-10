"""Names and validation rules for the future Cognify inference payload.

The current survey model does not consume these fields. This contract exists
so backend integration cannot silently invent or omit task telemetry.
"""

COGNIFY_FEATURES = {
    "nlpStress": (0.0, 100.0),
    "sentimentPolarity": (-1.0, 1.0),
    "detectedDistortionCount": (0.0, None),
    "journalFrequency7d": (0.0, None),
    "tasksCreated7d": (0.0, None),
    "tasksCompleted7d": (0.0, None),
    "tasksOverdue": (0.0, None),
    "tasksRescheduled7d": (0.0, None),
    "averagePushCount7d": (0.0, None),
    "completionRate7d": (0.0, 100.0),
    "averageEstimatedMinutes7d": (0.0, None),
    "averageActualMinutes7d": (0.0, None),
    "velocityDelta7d": (None, None),
    "activeTaskCount": (0.0, None),
    "highPriorityTaskCount": (0.0, None),
    "criticalTaskCount": (0.0, None),
    "blockedTaskCount": (0.0, None),
    "dependencyFriction": (0.0, None),
    "todayScheduledMinutes": (0.0, None),
    "todayCompletedMinutes": (0.0, None),
    "deadlinePressure": (0.0, 1.0),
}


def validate_features(features: dict) -> None:
    missing = sorted(set(COGNIFY_FEATURES) - set(features))
    if missing:
        raise ValueError(f"Missing Cognify features: {', '.join(missing)}")
    for name, (lower, upper) in COGNIFY_FEATURES.items():
        value = features[name]
        if not isinstance(value, (int, float)):
            raise ValueError(f"Feature {name} must be numeric")
        if lower is not None and value < lower:
            raise ValueError(f"Feature {name} is below its allowed range")
        if upper is not None and value > upper:
            raise ValueError(f"Feature {name} is above its allowed range")

