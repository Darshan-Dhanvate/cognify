import unittest

from src.feature_contract import COGNIFY_FEATURES, validate_features
from src.journal_nlp import analyze_journal


def complete_features():
    values = {}
    for name, (lower, upper) in COGNIFY_FEATURES.items():
        values[name] = lower if lower is not None else 0.0
        if name == "completionRate7d": values[name] = 50.0
        if name == "deadlinePressure": values[name] = 0.5
        if name == "sentimentPolarity": values[name] = 0.0
    return values


class FeatureContractTests(unittest.TestCase):
    def test_complete_payload_is_valid(self):
        validate_features(complete_features())

    def test_missing_feature_is_rejected(self):
        values = complete_features()
        values.pop("tasksOverdue")
        with self.assertRaises(ValueError):
            validate_features(values)

    def test_out_of_range_feature_is_rejected(self):
        values = complete_features()
        values["nlpStress"] = 101
        with self.assertRaises(ValueError):
            validate_features(values)


class JournalNlpTests(unittest.TestCase):
    def test_stressed_text_has_signal(self):
        result = analyze_journal("Everything is terrible and I feel hopeless.")
        self.assertGreater(result["stressScore"], 55)
        self.assertIn("Catastrophizing", result["detectedDistortions"])

    def test_neutral_text_is_valid(self):
        result = analyze_journal("I finished my reading and will continue tomorrow.")
        self.assertIn(result["moodState"], {"Calm", "Focused", "Anxious", "Overwhelmed"})
        self.assertGreaterEqual(result["stressScore"], 0)
        self.assertLessEqual(result["stressScore"], 100)


if __name__ == "__main__":
    unittest.main()

