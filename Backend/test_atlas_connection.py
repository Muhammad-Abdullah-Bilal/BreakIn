# test_atlas_connection.py
import sys
import certifi
from pymongo import MongoClient

URI = "mongodb+srv://abdullahbilal332333_db_user:sN36fAs1pqW3Te7n@cluster0.ytkvk44.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

print("==================================================")
print("     MONGODB ATLAS CONNECTIVITY HEALTH CHECK      ")
print("==================================================")

try:
    print("[1/2] Connecting to MongoDB Atlas...")
    client = MongoClient(URI, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=5000)
    client.admin.command("ping")
    print("[2/2] Ping successful! Connection established.")
    print("==================================================")
    print("SUCCESS: Your MongoDB Atlas database is online and reachable!")
    print("Collections:", client["breakin"].list_collection_names())
    print("==================================================")
except Exception as e:
    print("[FAILED] Could not connect to MongoDB Atlas.")
    print("Reason:", e)
    print("==================================================")
    print("SOLUTION:")
    print("1. Open MongoDB Atlas (https://cloud.mongodb.com)")
    print("2. In the left sidebar under 'Security', click 'Network Access'")
    print("3. Click '+ ADD IP ADDRESS'")
    print("4. Click 'ALLOW ACCESS FROM ANYWHERE' (0.0.0.0/0) and click 'Confirm'")
    print("5. Wait ~30 seconds for Atlas to apply changes, then re-run your backend!")
    print("==================================================")
