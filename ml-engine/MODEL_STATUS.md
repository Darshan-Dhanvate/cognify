# Model Status

`burnout_population_calibrated.joblib` is a survey-based population baseline.
It is trained from MBI outcomes and survey predictors. It is not yet the
Cognify realtime task model because the source data has no task-event history.

The final Cognify model requires a pilot dataset where each time window has:

- the feature contract in `src/feature_contract.py`;
- a later validated burnout measurement;
- a participant identifier and timestamp;
- no future information in the input window.

Until that data exists, the population model must not be presented as if it
learned from task completion or rescheduling behavior.

