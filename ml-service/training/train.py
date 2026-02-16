import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.features import extract_features

DATA_PATH = "training/urls.csv"

def main():
    df = pd.read_csv(DATA_PATH)

    df["features"] = df["url"].apply(extract_features)
    X = pd.DataFrame(df["features"].tolist())
    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = LogisticRegression(max_iter=1000)
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    print(classification_report(y_test, preds))

    joblib.dump(model, "models/model.pkl")
    print("Model saved successfully!")

if __name__ == "__main__":
    main()
