import pandas as pd
import numpy as np
import xgboost as xgb
import lightgbm as lgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

class BurnoutEnsembleTrainer:
    def __init__(self):
        # Create a directory to store our serialized model binaries
        self.model_dir = "models"
        if not os.path.exists(self.model_dir):
            os.makedirs(self.model_dir)
            
        # Initialize XGBoost (Focuses on depth-wise structural patterns)
        self.xgb_model = xgb.XGBClassifier(
            n_estimators=150, 
            learning_rate=0.05, 
            max_depth=5, 
            random_state=42,
            eval_metric='logloss'
        )
        
        # Initialize LightGBM (Focuses on leaf-wise optimization for speed/accuracy)
        self.lgb_model = lgb.LGBMClassifier(
            n_estimators=150,
            learning_rate=0.05,
            max_depth=5,
            random_state=42,
            verbose=-1
        )

    def synthesize_training_data(self, num_samples=2500):
        """
        Synthesizes a clinical DataFrame mimicking our exact MongoDB telemetry metrics 
        to train the trees before real user data is collected.
        """
        np.random.seed(42)
        
        # Feature 1: NLP Stress Score (0-100) from Journal Processor
        nlp_stress = np.random.uniform(10, 100, num_samples)
        
        # Feature 2: Task Push Count (Procrastination Decay telemetry)
        push_count = np.random.poisson(lam=1.5, size=num_samples)
        
        # Feature 3: Task Velocity Delta (Expected minutes vs Actual minutes)
        # Positive values denote tasks taking longer than estimated
        velocity_delta = np.random.normal(loc=10.0, scale=45.0, size=num_samples)
        
        # Feature 4: Uncompleted Dependency Friction (0-10 volume of blocked tasks)
        dependency_friction = np.random.randint(0, 10, num_samples)

        # Base Mathematical Cutoff Formula for Synthesizing Labels
        burnout_risk_score = (nlp_stress * 0.45) + (push_count * 6.0) + (velocity_delta * 0.25) + (dependency_friction * 4.0)
        
        # Enforce cutoff: Top 25% of scores represent active burnout (1)
        threshold = np.percentile(burnout_risk_score, 75)
        y = (burnout_risk_score > threshold).astype(int)

        df = pd.DataFrame({
            'nlp_stress': nlp_stress,
            'push_count': push_count,
            'velocity_delta': velocity_delta,
            'dependency_friction': dependency_friction,
            'is_burnout': y
        })
        return df

    def train_and_evaluate(self):
        print("⚙️ Synthesizing telemetry DataFrame...")
        df = self.synthesize_training_data()
        
        # Isolate feature matrix (X) and target vector (y)
        X = df.drop('is_burnout', axis=1)
        y = df['is_burnout']
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        print("🌲 Training XGBoost Model...")
        self.xgb_model.fit(X_train, y_train)
        xgb_preds = self.xgb_model.predict(X_test)
        
        print("🍃 Training LightGBM Model...")
        self.lgb_model.fit(X_train, y_train)
        lgb_preds = self.lgb_model.predict(X_test)
        
        # Apply Soft Voting Ensemble Formulation
        xgb_probs = self.xgb_model.predict_proba(X_test)[:, 1]
        lgb_probs = self.lgb_model.predict_proba(X_test)[:, 1]
        
        # 60% XGBoost, 40% LightGBM weighted average
        ensemble_probs = (xgb_probs * 0.6) + (lgb_probs * 0.4)
        ensemble_preds = (ensemble_probs > 0.5).astype(int)
        
        print("\n📊 --- Ensemble Architecture Results ---")
        print(f"XGBoost Accuracy:  {accuracy_score(y_test, xgb_preds):.4f}")
        print(f"LightGBM Accuracy: {accuracy_score(y_test, lgb_preds):.4f}")
        print(f"Ensemble Accuracy: {accuracy_score(y_test, ensemble_preds):.4f}")
        print("\nClassification Report (Ensemble):")
        print(classification_report(y_test, ensemble_preds))
        
        # Serialize the validated models
        joblib.dump(self.xgb_model, os.path.join(self.model_dir, 'xgboost_burnout.pkl'))
        joblib.dump(self.lgb_model, os.path.join(self.model_dir, 'lightgbm_burnout.pkl'))
        print("\n✅ Models serialized and saved to /models directory successfully.")

if __name__ == "__main__":
    trainer = BurnoutEnsembleTrainer()
    trainer.train_and_evaluate()