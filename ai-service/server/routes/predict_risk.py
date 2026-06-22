import os
import numpy as np
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sklearn.linear_model import LogisticRegression
from loguru import logger

router = APIRouter()

# 1. Train Scikit-Learn Models on Module Load on Synthetic Data
np.random.seed(42)
num_samples = 1000
# Features: [age, bmi, systolic_bp, glucose, family_history]
X_train = np.random.rand(num_samples, 5)
X_train[:, 0] = X_train[:, 0] * 62 + 18                      # age: 18 to 80
X_train[:, 1] = X_train[:, 1] * 25 + 15                      # bmi: 15 to 40
X_train[:, 2] = X_train[:, 2] * 90 + 90                      # systolic_bp: 90 to 180
X_train[:, 3] = X_train[:, 3] * 180 + 70                     # glucose: 70 to 250
X_train[:, 4] = np.random.choice([0, 1], size=num_samples, p=[0.7, 0.3]) # family_history: 0 or 1

# Generate synthetic binary labels based on realistic medical rules
y_diabetes = (0.04 * X_train[:, 0] + 0.12 * X_train[:, 1] + 0.035 * X_train[:, 3] + 1.8 * X_train[:, 4] + np.random.randn(num_samples) * 2 > 9.5).astype(int)
y_hypertension = (0.035 * X_train[:, 0] + 0.09 * X_train[:, 1] + 0.065 * X_train[:, 2] + 1.5 * X_train[:, 4] + np.random.randn(num_samples) * 2 > 11.5).astype(int)
y_heart = (0.05 * X_train[:, 0] + 0.08 * X_train[:, 1] + 0.045 * X_train[:, 2] + 0.015 * X_train[:, 3] + 2.2 * X_train[:, 4] + np.random.randn(num_samples) * 2.5 > 13.0).astype(int)
y_stroke = (0.07 * X_train[:, 0] + 0.05 * X_train[:, 1] + 0.055 * X_train[:, 2] + 2.0 * X_train[:, 4] + np.random.randn(num_samples) * 3.0 > 12.0).astype(int)

# Train the LogisticRegression models
model_diabetes = LogisticRegression().fit(X_train, y_diabetes)
model_hypertension = LogisticRegression().fit(X_train, y_hypertension)
model_heart = LogisticRegression().fit(X_train, y_heart)
model_stroke = LogisticRegression().fit(X_train, y_stroke)

logger.info("Scikit-learn Disease Risk Models successfully trained and loaded in-memory.")

class FamilyHistory(BaseModel):
    diabetes: bool
    hypertension: bool
    heartDisease: bool
    stroke: bool

class RiskRequest(BaseModel):
    age: float
    bmi: float
    systolicBp: float
    glucose: float
    familyHistory: FamilyHistory

@router.post("/predict-risk")
async def predict_risk(payload: RiskRequest):
    try:
        # Convert inputs to model feature vector format
        # Features: [age, bmi, systolic_bp, glucose, family_history]
        
        # 1. Diabetes Prediction (uses familyHistory.diabetes)
        feat_diabetes = np.array([[payload.age, payload.bmi, payload.systolicBp, payload.glucose, 1 if payload.familyHistory.diabetes else 0]])
        prob_diabetes = model_diabetes.predict_proba(feat_diabetes)[0][1]
        
        # 2. Hypertension Prediction (uses familyHistory.hypertension)
        feat_hypertension = np.array([[payload.age, payload.bmi, payload.systolicBp, payload.glucose, 1 if payload.familyHistory.hypertension else 0]])
        prob_hypertension = model_hypertension.predict_proba(feat_hypertension)[0][1]
        
        # 3. Heart Disease Prediction (uses familyHistory.heartDisease)
        feat_heart = np.array([[payload.age, payload.bmi, payload.systolicBp, payload.glucose, 1 if payload.familyHistory.heartDisease else 0]])
        prob_heart = model_heart.predict_proba(feat_heart)[0][1]
        
        # 4. Stroke Prediction (uses familyHistory.stroke)
        feat_stroke = np.array([[payload.age, payload.bmi, payload.systolicBp, payload.glucose, 1 if payload.familyHistory.stroke else 0]])
        prob_stroke = model_stroke.predict_proba(feat_stroke)[0][1]
        
        # Compile contributing factors based on clinical rules
        factors = {
            "diabetes": [],
            "hypertension": [],
            "heartDisease": [],
            "stroke": []
        }
        
        # Age factors
        if payload.age > 60:
            factors["diabetes"].append("Age over 60 years (elevated risk factor)")
            factors["hypertension"].append("Age over 60 years (elevated risk factor)")
            factors["heartDisease"].append("Age over 60 years (elevated risk factor)")
            factors["stroke"].append("Age over 60 years (elevated risk factor)")
        elif payload.age > 45:
            factors["diabetes"].append("Age over 45 years (moderate risk factor)")
            factors["heartDisease"].append("Age over 45 years (moderate risk factor)")
            factors["stroke"].append("Age over 45 years (moderate risk factor)")
            
        # BMI factors
        if payload.bmi >= 30.0:
            factors["diabetes"].append(f"Obese BMI ({payload.bmi:.1f} >= 30.0)")
            factors["hypertension"].append(f"Obese BMI ({payload.bmi:.1f} >= 30.0)")
            factors["heartDisease"].append(f"Obese BMI ({payload.bmi:.1f} >= 30.0)")
            factors["stroke"].append(f"Obese BMI ({payload.bmi:.1f} >= 30.0)")
        elif payload.bmi >= 25.0:
            factors["diabetes"].append(f"Overweight BMI ({payload.bmi:.1f} >= 25.0)")
            factors["hypertension"].append(f"Overweight BMI ({payload.bmi:.1f} >= 25.0)")
            factors["heartDisease"].append(f"Overweight BMI ({payload.bmi:.1f} >= 25.0)")
            
        # Blood Pressure factors
        if payload.systolicBp >= 140.0:
            factors["hypertension"].append(f"Stage 2 Hypertension BP ({payload.systolicBp:.0f} mmHg)")
            factors["heartDisease"].append(f"Stage 2 Hypertension BP ({payload.systolicBp:.0f} mmHg)")
            factors["stroke"].append(f"Stage 2 Hypertension BP ({payload.systolicBp:.0f} mmHg)")
        elif payload.systolicBp >= 130.0:
            factors["hypertension"].append(f"Stage 1 Hypertension BP ({payload.systolicBp:.0f} mmHg)")
            factors["heartDisease"].append(f"Stage 1 Hypertension BP ({payload.systolicBp:.0f} mmHg)")
            
        # Glucose factors
        if payload.glucose >= 126.0:
            factors["diabetes"].append(f"Diabetic fasting blood glucose level ({payload.glucose:.0f} mg/dL)")
            factors["heartDisease"].append(f"Diabetic fasting blood glucose level ({payload.glucose:.0f} mg/dL)")
        elif payload.glucose >= 100.0:
            factors["diabetes"].append(f"Pre-diabetic fasting blood glucose level ({payload.glucose:.0f} mg/dL)")
            
        # Family History factors
        if payload.familyHistory.diabetes:
            factors["diabetes"].append("Immediate family history of diabetes")
        if payload.familyHistory.hypertension:
            factors["hypertension"].append("Immediate family history of hypertension")
        if payload.familyHistory.heartDisease:
            factors["heartDisease"].append("Immediate family history of coronary artery disease")
        if payload.familyHistory.stroke:
            factors["stroke"].append("Immediate family history of stroke")
            
        # Add default if no factors compiled
        for key in factors:
            if not factors[key]:
                factors[key].append("No abnormal risk factors detected in vital chart.")
                
        return JSONResponse(content={
            "diabetesRisk": round(float(prob_diabetes), 3),
            "hypertensionRisk": round(float(prob_hypertension), 3),
            "heartDiseaseRisk": round(float(prob_heart), 3),
            "strokeRisk": round(float(prob_stroke), 3),
            "contributingFactors": factors
        })
        
    except Exception as e:
        logger.error(f"Error in predict_risk: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)
