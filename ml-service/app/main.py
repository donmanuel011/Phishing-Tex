from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import pandas as pd
from pathlib import Path

from app.features import extract_features

app = FastAPI()

# ✅ Robust absolute path to model.pkl
BASE_DIR = Path(__file__).resolve().parent.parent  # -> ml-service/
MODEL_PATH = BASE_DIR / "models" / "model.pkl"

model = joblib.load(MODEL_PATH)

class URLRequest(BaseModel):
    url: str

@app.get("/")
def root():
    return {"status": "ok", "service": "ml-service"}

@app.post("/predict")
def predict(data: URLRequest):
    features = extract_features(data.url)
    df = pd.DataFrame([features])
    probability = float(model.predict_proba(df)[0][1])
    return {"mlScore": probability}
