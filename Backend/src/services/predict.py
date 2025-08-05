import sys
import joblib
import pandas as pd
import os

# ✅ Step 1: Get current directory
current_dir = os.path.dirname(os.path.abspath(__file__))

# ✅ Step 2: Path to trained model
model_path = os.path.join(current_dir, "..", "trained_model", "symptomModel", "rf_model.pkl")

# ✅ Step 3: Load model
model = joblib.load(model_path)

# ✅ Step 4: Get input from Node.js
input_data = sys.argv[1]
input_dict = eval(input_data)  # JSON string → dict
input_df = pd.DataFrame([input_dict])

# ✅ Step 5: One-hot encoding
input_df = pd.get_dummies(input_df)

# ✅ Step 6: Add missing columns (optimized to avoid fragmentation warning)
missing_cols = [col for col in model.feature_names_in_ if col not in input_df.columns]
if missing_cols:
    missing_df = pd.DataFrame([[0]*len(missing_cols)], columns=missing_cols)
    input_df = pd.concat([input_df, missing_df], axis=1)

# ✅ Step 7: Ensure same column order as training
input_df = input_df[model.feature_names_in_]

# ✅ Step 8: Predict class & probabilities
probs = model.predict_proba(input_df)[0]
pred = model.predict(input_df)[0]

# ✅ Step 9: Print output (Node.js will read this line)
print(pred, probs[0], probs[1])
