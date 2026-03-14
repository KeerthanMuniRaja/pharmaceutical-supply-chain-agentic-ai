import sys
import os
import pandas as pd

# Add backend directory to path
os.chdir("c:/Users/Hp/OneDrive/Downloads/pharmaceutical-supply-chain-agentic-ai-main/pharmaceutical-supply-chain-agentic-ai-main")
sys.path.append(os.getcwd())

from agents.forecasting_agent import ForecastingAgent


agent = ForecastingAgent()


# Create synthetic data to test the LSTM (needs > 30 points)
df = pd.DataFrame({
    'ds': pd.date_range(start='2025-01-01', periods=40),
    'y': [100 + i + (i%3)*5 for i in range(40)]
})

print("Testing LSTM model prediction...")
try:
    result = agent._forecast_lstm(df, 7)
    print(f"Status: {result['status']}")
    if result['status'] == 'success':
        print(f"Forecast generated! Length: {len(result['forecast'])}")
        print(f"Sample prediction: {result['forecast'][0]['yhat']:.2f}")
    else:
        print(f"Message: {result.get('message', 'Unknown error')}")
except Exception as e:
    print(f"Exception during run: {e}")
