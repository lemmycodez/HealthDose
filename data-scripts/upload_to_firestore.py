"""
upload_to_firestore.py
Complete script to upload medication data to Firestore
Run this after you have your medication data in medications_clean.json
"""

import json
import time
import os
from datetime import datetime

# Try to import Firebase - if not installed, show helpful message
try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    print("❌ Firebase Admin SDK not installed!")
    print("Run: pip install firebase-admin")
    exit(1)

print("=" * 60)
print("📤 FIREBASE UPLOAD SCRIPT - HealthDose Medications")
print("=" * 60)

# Step 1: Check if service account key exists
SERVICE_ACCOUNT_FILE = "service-account-key.json"

if not os.path.exists(SERVICE_ACCOUNT_FILE):
    print("\n❌ ERROR: service-account-key.json not found!")
    print("\n📋 HOW TO GET YOUR SERVICE ACCOUNT KEY:")
    print("1. Go to https://console.firebase.google.com")
    print("2. Click on your project: med-assist-9edf0")
    print("3. Click the gear icon ⚙️ (top-left) → Project Settings")
    print("4. Click the 'Service Accounts' tab")
    print("5. Click 'Generate New Private Key' button")
    print("6. Save the file as: service-account-key.json")
    print("7. Move it to this folder: C:\\Users\\Chosen.DESKTOP-PO3JMN8\\Desktop\\projects\\HealthDose\\data-scripts\\")
    exit(1)

print(f"\n✅ Found service account key: {SERVICE_ACCOUNT_FILE}")

# Step 2: Check if medication data exists
DATA_FILE = "medications_clean.json"

if not os.path.exists(DATA_FILE):
    print(f"\n❌ ERROR: {DATA_FILE} not found!")
    print("\n📋 You need to create medication data first.")
    print("Run your transform script or create a sample file.")
    exit(1)

print(f"✅ Found medication data: {DATA_FILE}")

# Step 3: Load the medication data
print("\n📂 Loading medication data...")
with open(DATA_FILE, 'r', encoding='utf-8') as f:
    medications = json.load(f)

print(f"✅ Loaded {len(medications)} medications from file")

# Step 4: Initialize Firebase
print("\n🔌 Connecting to Firebase...")
try:
    cred = credentials.Certificate(SERVICE_ACCOUNT_FILE)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("✅ Connected to Firebase successfully!")
except Exception as e:
    print(f"❌ Failed to connect to Firebase: {e}")
    exit(1)

# Step 5: Upload to Firestore
print("\n📤 Uploading medications to Firestore...")
print("This may take a few minutes...\n")

# Use batches for efficiency (max 500 per batch)
batch = db.batch()
batch_count = 0
uploaded = 0
failed = 0

# Keep track of collection name
collection_name = "medications"
print(f"📁 Target collection: {collection_name}")

# Loop through each medication
for idx, med in enumerate(medications, 1):
    try:
        # Create a new document with auto-generated ID
        doc_ref = db.collection(collection_name).document()
        
        # Ensure all required fields exist with defaults if missing
        med_data = {
            # Core fields (required)
            "genericName": med.get("genericName", "Unknown"),
            "brandNames": med.get("brandNames", []),
            "drugClass": med.get("drugClass", "Unknown"),
            "mechanismOfAction": med.get("mechanismOfAction", "Information not available"),
            "indications": med.get("indications", []),
            "contraindications": med.get("contraindications", []),
            "dosageGuidelines": med.get("dosageGuidelines", "Consult healthcare provider"),
            "sideEffects": med.get("sideEffects", []),
            "pharmacokinetics": med.get("pharmacokinetics", "Information not available"),
            
            # Timestamps (use server timestamp for consistency)
            "createdAt": firestore.SERVER_TIMESTAMP,
            "updatedAt": firestore.SERVER_TIMESTAMP,
            
            # Optional metadata
            "source": med.get("source", "FDA API")
        }
        
        # Make sure arrays are actually lists
        if not isinstance(med_data["brandNames"], list):
            med_data["brandNames"] = [med_data["brandNames"]] if med_data["brandNames"] else []
        
        if not isinstance(med_data["indications"], list):
            med_data["indications"] = [med_data["indications"]] if med_data["indications"] else []
        
        if not isinstance(med_data["contraindications"], list):
            med_data["contraindications"] = [med_data["contraindications"]] if med_data["contraindications"] else []
        
        if not isinstance(med_data["sideEffects"], list):
            med_data["sideEffects"] = [med_data["sideEffects"]] if med_data["sideEffects"] else []
        
        # Add to batch
        batch.set(doc_ref, med_data)
        batch_count += 1
        uploaded += 1
        
        # Show progress every 10 items
        if idx % 10 == 0:
            print(f"  Progress: {idx}/{len(medications)} medications processed")
        
        # Firestore can only handle 500 operations per batch
        if batch_count >= 500:
            print(f"  ⏳ Committing batch of {batch_count} medications...")
            batch.commit()
            batch = db.batch()
            batch_count = 0
            print(f"  ✅ Batch committed. Total uploaded so far: {uploaded}")
            
            # Small pause to avoid rate limits
            time.sleep(1)
            
    except Exception as e:
        failed += 1
        print(f"  ❌ Error uploading medication #{idx}: {e}")
        print(f"     Drug: {med.get('genericName', 'Unknown')}")

# Commit any remaining medications in the final batch
if batch_count > 0:
    print(f"\n⏳ Committing final batch of {batch_count} medications...")
    try:
        batch.commit()
        print("✅ Final batch committed successfully!")
    except Exception as e:
        print(f"❌ Error committing final batch: {e}")
        failed += batch_count

# Final summary
print("\n" + "=" * 60)
print("📊 UPLOAD SUMMARY")
print("=" * 60)
print(f"✅ Successfully uploaded: {uploaded} medications")
if failed > 0:
    print(f"❌ Failed to upload: {failed} medications")
print(f"📁 Collection: {collection_name}")
print("=" * 60)

# Step 6: Verify by reading back a few documents
print("\n🔍 Verifying upload by reading first 3 documents...")
try:
    docs = db.collection(collection_name).limit(3).get()
    if len(docs) > 0:
        print(f"✅ Successfully read {len(docs)} documents from Firestore")
        for i, doc in enumerate(docs, 1):
            data = doc.to_dict()
            print(f"\n  Document {i}:")
            print(f"    ID: {doc.id}")
            print(f"    Generic Name: {data.get('genericName', 'N/A')}")
            print(f"    Brand Names: {', '.join(data.get('brandNames', ['N/A']))}")
    else:
        print("⚠️ No documents found in collection")
except Exception as e:
    print(f"❌ Error verifying upload: {e}")

print("\n✨ Upload process complete!")
print("You can now check your Firebase Console to see the data.")
print("Go to: https://console.firebase.google.com")
print("Select your project → Firestore Database → medications collection")