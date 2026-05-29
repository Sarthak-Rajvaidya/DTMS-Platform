import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score
import pickle

# Load dataset
data = pd.read_csv("india_disaster_dataset.csv")

# Convert Disaster_Type (text → number)
le = LabelEncoder()
data['Disaster_Type_Encoded'] = le.fit_transform(data['Disaster_Type'])

# Features (input)
X = data[['Rainfall', 'Temperature', 'Humidity']]

# Target (output)
y = data['Occurred']

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Model
model = RandomForestClassifier(n_estimators=100)

# Train model
model.fit(X_train, y_train)

# Predictions
y_pred = model.predict(X_test)

# Accuracy
accuracy = accuracy_score(y_test, y_pred)
print("Model Accuracy:", accuracy)

# Save model
pickle.dump(model, open("disaster_model.pkl", "wb"))

print("Model saved successfully!")