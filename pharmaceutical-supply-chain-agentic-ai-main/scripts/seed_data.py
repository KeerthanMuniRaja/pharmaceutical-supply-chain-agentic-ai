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
        sales_collection = db["sales_history"]
        inventory_collection = db["inventory"]
        
        # Clear existing data for fresh seed
        if sales_collection.count_documents({}) > 0:
            print("Clearing old mock sales data...")
            sales_collection.delete_many({})
            
        if inventory_collection.count_documents({}) > 0:
            print("Clearing old mock inventory data...")
            inventory_collection.delete_many({})
        
        # Drugs catalog matching the frontend
        drugs = [
            {"id": "Metformin", "name": "Metformin 500mg"},
            {"id": "Aspirin", "name": "Aspirin"},
            {"id": "Insulin", "name": "Insulin Glargine"},
            {"id": "Amoxicillin", "name": "Amoxicillin 250mg"},
            {"id": "Omeprazole", "name": "Omeprazole 20mg"},
            {"id": "Losartan", "name": "Losartan 50mg"},
            {"id": "Simvastatin", "name": "Simvastatin 20mg"},
            {"id": "Albuterol", "name": "Albuterol Inhaler"},
            {"id": "Warfarin", "name": "Warfarin 5mg"},
            {"id": "Furosemide", "name": "Furosemide 40mg"}
        ]
        
        branches = ["MAIN_BRANCH", "NORTH_BRANCH", "SOUTH_BRANCH", "EAST_BRANCH", "WEST_BRANCH"]
        
        print("Generating 365 days of mock sales data for demand forecasting...")
        mock_sales_data = []
        
        today = datetime.utcnow()
        
        for i in range(365):
            current_date = today - timedelta(days=365 - i)
            
            for drug in drugs:
                # Add a seasonal and random trend
                base_demand = 50
                if drug["id"] in ["Aspirin", "Omeprazole"]:
                    base_demand = int(100 + 40 * (current_date.month / 12)) + random.randint(-20, 30)
                elif drug["id"] in ["Amoxicillin", "Albuterol"]:
                    # Winter spike for antibiotics and inhalers
                    season_multiplier = 1.5 if current_date.month in [11, 12, 1, 2] else 1.0
                    base_demand = int(40 * season_multiplier) + random.randint(-10, 20)
                
                # Distribute demand amongst branches
                for branch in branches:
                    branch_qty = max(0, int(base_demand * random.uniform(0.1, 0.4)))
                    
                    mock_sales_data.append({
                        "date": current_date,
                        "drug_id": drug["id"].lower(),
                        "drug_name": drug["name"],
                        "branch_id": branch,
                        "quantity": branch_qty,
                        "revenue": branch_qty * random.uniform(5.0, 15.0)
                    })
        
        print(f"Inserting {len(mock_sales_data)} sales records...")
        sales_collection.insert_many(mock_sales_data)
        
        print("Generating mock inventory data...")
        mock_inventory_data = []
        
        for drug in drugs:
            for branch in branches:
                # Calculate an optimal stock based on a rough 30-day demand estimate
                avg_daily_demand = random.randint(10, 50)
                optimal_stock = avg_daily_demand * 30
                safe_stock = avg_daily_demand * 10
                
                # Randomize current stock to trigger different alert types
                scenario = random.choice(["normal", "low", "critical", "overstock"])
                
                if scenario == "critical":
                    current_stock = int(safe_stock * random.uniform(0.1, 0.3))
                elif scenario == "low":
                    current_stock = int(safe_stock * random.uniform(0.4, 0.9))
                elif scenario == "overstock":
                    current_stock = int(optimal_stock * random.uniform(1.6, 2.5))
                else:
                    current_stock = int(optimal_stock * random.uniform(0.6, 1.2))
                    
                mock_inventory_data.append({
                    "branch_id": branch,
                    "drug_id": drug["id"].lower(),
                    "current_stock": current_stock,
                    "optimal_stock": optimal_stock,
                    "safe_stock": safe_stock,
                    "demand_forecast": optimal_stock,
                    "last_updated": datetime.utcnow()
                })
        
        print(f"Inserting {len(mock_inventory_data)} inventory records...")
        inventory_collection.insert_many(mock_inventory_data)
        
        print("Seeding operations completed successfully!")
        print("You can now test the Forecasting Agent and Monitoring Agent with drug IDs: 'drug_a', 'drug_b', 'drug_c'")
        
    except Exception as e:
        print(f"Failed to seed database: {e}")
        print("Please make sure MongoDB is running on localhost:27017")

if __name__ == "__main__":
    seed_database()
