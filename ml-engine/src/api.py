from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from .feature_contract import COGNIFY_FEATURES
from .inference import CognifyPredictor
from .journal_nlp import analyze_journal


app = FastAPI(title="COGNIFY ML Inference", version="0.1.0")
predictor = CognifyPredictor()


class PredictionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    features: dict[str, float] = Field(..., description="Exact Cognify telemetry feature vector")


class JournalRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    content: str = Field(..., min_length=1, max_length=10000)


@app.get("/health")
def health():
    return {"status": "healthy", "modelVersion": predictor.__class__.__name__}


@app.post("/predict")
def predict(request: PredictionRequest):
    try:
        result = predictor.predict(request.features)
    except (TypeError, ValueError) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    result["generatedAt"] = datetime.now(timezone.utc).isoformat()
    return result


@app.post("/journal/analyze")
def analyze(request: JournalRequest):
    return analyze_journal(request.content.strip())


@app.get("/schema")
def schema():
    return {"modelVersion": "cognify-synthetic-0.1.0", "features": COGNIFY_FEATURES, "developmentOnly": True}
