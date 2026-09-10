# Stage 1 Dataset Setup

The training command intentionally does not download data or invent labels.

## Preferred research data

Start with the StudentLife dataset:

https://studentlife.cs.dartmouth.edu/dataset.html

Review its access terms and place an exported, documented CSV in `data/raw/`.
The CSV must contain a validated burnout or mental-fatigue target. Do not rename a stress column to `burnout` just to satisfy the script.

## Baseline data

The Kaggle Employee Burnout Analysis dataset is useful for a baseline only:

https://www.kaggle.com/datasets/blurredmachine/employee-burnout-analysis

Download it in a browser, extract the CSV, and place exactly one selected CSV in `data/raw/`.

## Train

From the `m` directory:

```powershell
..\ml-engine\venv\Scripts\python.exe -m src.train
```

The existing environment is used only to run the new code. The old `ml-engine` files are not changed.

Outputs:

- `reports/dataset_audit.json`
- `reports/metrics.json`
- `models/*.joblib`

