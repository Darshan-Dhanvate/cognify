from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import uvicorn

# Import our custom ML and NLP engines
from nlp_processor import CognitiveNLPProcessor
from predictor import BurnoutPredictor

app = FastAPI(
    title="Cognify Engine - ML Analytical Service",
    description="Python microservice for NLP and Burnout Prediction",
    version="1.0.0"
)

# Initialize engines globally to prevent memory leaks and reloading on every request
nlp_engine = CognitiveNLPProcessor()
ml_predictor = BurnoutPredictor()

# ---------------------------------------------------------
# Pydantic Models for Data Validation
# ---------------------------------------------------------
class JournalEntry(BaseModel):
    content: str = Field(..., description="The raw text from the user's cognitive journal")
    
    # Optional telemetry fields to accommodate future Express backend updates
    pushCount: int = Field(default=0, description="Procrastination telemetry")
    velocityDelta: float = Field(default=0.0, description="Task velocity telemetry")
    dependencyFriction: int = Field(default=0, description="Volume of blocked tasks")

class PsychologicalAnalysis(BaseModel):
    stressScore: float = Field(..., description="Calculated stress score from 0 to 100")
    detectedDistortions: List[str] = Field(default=[], description="List of cognitive distortions")
    suggestedReframing: str = Field(default="", description="AI generated reframing statement")
    moodState: str = Field(..., description="Enum: Calm, Anxious, Overwhelmed, Focused")
    
    # New Fields for Ensemble Prediction Output
    burnoutRiskPercentage: float = Field(..., description="XGBoost/LightGBM Burnout Probability")
    isAtRisk: bool = Field(..., description="True if probability > 50%")

# ---------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------
@app.post("/analyze", response_model=PsychologicalAnalysis)
async def analyze_journal(entry: JournalEntry):
    try:
        # 1. Run NLP pipeline on raw text
        nlp_results = nlp_engine.analyze_text(entry.content)
        
        # 2. Extract the calculated NLP stress score
        extracted_stress = nlp_results["stressScore"]
        
        # 3. Feed NLP stress + behavioral telemetry into the Ensemble Predictor
        prediction = ml_predictor.predict_burnout(
            nlp_stress=extracted_stress,
            push_count=entry.pushCount,
            velocity_delta=entry.velocityDelta,
            dependency_friction=entry.dependencyFriction
        )
        
        # 4. Merge insights and return exact JSON payload to Express Gateway
        return PsychologicalAnalysis(
            stressScore=extracted_stress,
            detectedDistortions=nlp_results["detectedDistortions"],
            suggestedReframing=nlp_results["suggestedReframing"],
            moodState=nlp_results["moodState"],
            burnoutRiskPercentage=prediction["burnout_risk_percentage"],
            isAtRisk=prediction["is_at_risk"]
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Cognify ML Engine"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)