# COGNIFY ML Engine

This is the replacement ML workspace for COGNIFY. The original `ml-engine` folder is kept unchanged for reference.

## Stage 1

Stage 1 builds a reproducible training and evaluation pipeline. It does not claim clinical burnout prediction until a dataset with a documented, validated burnout target is supplied.

Expected workflow:

1. Put an approved CSV dataset in `data/raw/`.
2. Run `python -m src.train`.
3. Inspect `reports/metrics.json` and `reports/dataset_audit.json`.
4. Only promote a model after participant-level evaluation and calibration review.

Run the local ML checks with `python -m unittest discover -s tests`.

The public Employee Burnout dataset can be used for a baseline. StudentLife remains the preferred research source, but its download and usage terms must be checked manually.
