from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import pandas as pd
from app.features import extract_features

app = FastAPI()

model = joblib.load("models/model.pkl")

class URLRequest(BaseModel):
    url: str

@app.post("/predict")
def predict(data: URLRequest):
    features = extract_features(data.url)
    df = pd.DataFrame([features])
    probability = float(model.predict_proba(df)[0][1])
    return {"mlScore": probability}
