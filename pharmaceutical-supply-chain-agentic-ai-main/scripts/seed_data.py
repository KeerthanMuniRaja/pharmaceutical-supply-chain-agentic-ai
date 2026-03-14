import os
import sys
import random
from datetime import datetime, timedelta
from pymongo import MongoClient

def seed_database():
    print("Connecting to MongoDB...")
    uri = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.getenv("DATABASE_NAME", "pharma_supply_chain")
    
    try:
        client = MongoClient(uri)
        db = client[db_name]
        
        print(f"Connected to Database: '{db_name}'")
        
        # Collections
        sales_collection = db["sales"]
        
        # Clear existing data for fresh seed (optional, but good for testing)
        if sales_collection.count_documents({}) > 0:
            print("Clearing old mock sales data...")
            sales_collection.delete_many({})
        
        # Drugs catalog
        drugs = [
            {"id": "DRUG_A", "name": "Aspirin 500mg"},
            {"id": "DRUG_B", "name": "Amoxicillin 250mg"},
            {"id": "DRUG_C", "name": "Lisinopril 10mg"}
        ]
        
        branches = ["MAIN_BRANCH", "NORTH_BRANCH", "SOUTH_BRANCH", "EAST_BRANCH", "WEST_BRANCH"]
        
        print("Generating 365 days of mock sales data for demand forecasting...")
        mock_data = []
        
        today = datetime.utcnow()
        
        for i in range(365):
            current_date = today - timedelta(days=365 - i)
            
            for drug in drugs:
                # Add a seasonal and random trend
                base_demand = 50
                if drug["id"] == "DRUG_A":
                    base_demand = int(100 + 40 * (current_date.month / 12)) + random.randint(-20, 30)
                elif drug["id"] == "DRUG_B":
                    # Winter spike for antibiotics
                    season_multiplier = 1.5 if current_date.month in [11, 12, 1, 2] else 1.0
                    base_demand = int(40 * season_multiplier) + random.randint(-10, 20)
                
                # Distribute demand amongst branches
                for branch in branches:
                    branch_qty = max(0, int(base_demand * random.uniform(0.1, 0.4)))
                    
                    mock_data.append({
                        "date": current_date,
                        "drug_id": drug["id"].lower(),
                        "drug_name": drug["name"],
                        "branch_id": branch,
                        "quantity": branch_qty,
                        "revenue": branch_qty * random.uniform(5.0, 15.0)
                    })
        
        print(f"Inserting {len(mock_data)} records...")
        sales_collection.insert_many(mock_data)
        
        print("Seeding operations completed successfully!")
        print("You can now test the Forecasting Agent with drug IDs: 'DRUG_A', 'DRUG_B', 'DRUG_C'")
        
    except Exception as e:
        print(f"Failed to seed database: {e}")
        print("Please make sure MongoDB is running on localhost:27017")

if __name__ == "__main__":
    seed_database()
