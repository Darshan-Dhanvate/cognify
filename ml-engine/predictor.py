import joblib
import os
import pandas as pd

class BurnoutPredictor:
    def __init__(self):
        # Dynamically locate the models directory relative to this file
        base_dir = os.path.dirname(os.path.abspath(__file__))
        model_dir = os.path.join(base_dir, "models")
        
        try:
            # Load the serialized binaries into memory
            self.xgb_model = joblib.load(os.path.join(model_dir, 'xgboost_burnout.pkl'))
            self.lgb_model = joblib.load(os.path.join(model_dir, 'lightgbm_burnout.pkl'))
            print("✅ Ensemble Models loaded into memory successfully.")
        except FileNotFoundError:
            print("⚠️ Models not found. Please ensure model_trainer.py has been executed.")
            self.xgb_model = None
            self.lgb_model = None

    def predict_burnout(self, nlp_stress: float, push_count: int, velocity_delta: float, dependency_friction: int) -> dict:
        """
        Takes real-time telemetry and calculates the burnout probability.
        """
        # Safety fallback if models failed to load
        if not self.xgb_model or not self.lgb_model:
            return {"burnout_risk_percentage": 0.0, "is_at_risk": False}
            
        # 1. Construct the feature matrix exactly as it was formatted during training
        features = pd.DataFrame([{
            'nlp_stress': float(nlp_stress),
            'push_count': float(push_count),
            'velocity_delta': float(velocity_delta),
            'dependency_friction': float(dependency_friction)
        }])
        
        # 2. Extract probability of class 1 (Active Burnout)
        # predict_proba returns [[prob_class_0, prob_class_1]]
        xgb_prob = self.xgb_model.predict_proba(features)[0][1]
        lgb_prob = self.lgb_model.predict_proba(features)[0][1]
        
        # 3. Apply the 60/40 weighted soft voting ensemble architecture
        ensemble_prob = (xgb_prob * 0.6) + (lgb_prob * 0.4)
        
        return {
            "burnout_risk_percentage": round(ensemble_prob * 100, 2),
            "is_at_risk": bool(ensemble_prob > 0.5)
        }