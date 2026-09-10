# Cognify Synthetic Data Notice

`data/synthetic/cognify_v0.csv` contains 50,000 simulated telemetry windows
with the exact feature names planned for Cognify. The generator uses explicit,
noisy relationships between workload and burnout risk so the API, feature
validation, intervention rules, and model training can be developed now.

These rows are not real people and the labels are not clinical measurements.
Their accuracy, ROC-AUC, or risk percentages must not be reported as evidence
that Cognify predicts burnout in the real world. Once pilot users provide
validated burnout check-ins, this file must be replaced for final training.

