"""
upload_to_firestore_simple.py
Uses your logged-in credentials instead of a service account key
"""

import json
import os
from datetime import datetime

# Try to import Firebase
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
print("📤 FIREBASE UPLOAD - Using Application Default Credentials")
print("=" * 60)

# Step 1: Check if medication data exists
DATA_FILE = "medications_clean.json"

if not os.path.exists(DATA_FILE):
    print(f"\n❌ ERROR: {DATA_FILE} not found!")
    print("Run transform_raw_data.py first to create this file.")
    exit(1)

print(f"✅ Found medication data: {DATA_FILE}")

# Step 2: Load the medication data
print("\n📂 Loading medication data...")
with open(DATA_FILE, 'r', encoding='utf-8') as f:
    medications = json.load(f)

print(f"✅ Loaded {len(medications)} medications from file")

# Step 3: Initialize Firebase WITHOUT a service account key
print("\n🔌 Connecting to Firebase using your login credentials...")
try:
    # IMPORTANT: No service account key file needed!
    firebase_admin.initialize_app()
    db = firestore.client()
    print("✅ Connected to Firebase successfully using your login!")
    print("   (Using credentials from: gcloud auth application-default login)")
except Exception as e:
    print(f"❌ Failed to connect to Firebase: {e}")
    print("\n💡 TROUBLESHOOTING:")
    print("1. Run: gcloud auth application-default login")
    print("2. Make sure you're logged into the correct account")
    exit(1)

# Step 4: Upload to Firestore
print("\n📤 Uploading medications to Firestore...")
print("This may take a few minutes...\n")

# Use batches for efficiency
batch = db.batch()
batch_count = 0
uploaded = 0
failed = 0

collection_name = "medications"
print(f"📁 Target collection: {collection_name}")

for idx, med in enumerate(medications, 1):
    try:
        # Create a new document with auto-generated ID
        doc_ref = db.collection(collection_name).document()
        
        # Prepare the data
        med_data = {
            "genericName": med.get("genericName", "Unknown"),
            "brandNames": med.get("brandNames", []),
            "drugClass": med.get("drugClass", "Unknown"),
            "mechanismOfAction": med.get("mechanismOfAction", "Information not available"),
            "indications": med.get("indications", []),
            "contraindications": med.get("contraindications", []),
            "dosageGuidelines": med.get("dosageGuidelines", "Consult healthcare provider"),
            "sideEffects": med.get("sideEffects", []),
            "pharmacokinetics": med.get("pharmacokinetics", "Information not available"),
            "createdAt": firestore.SERVER_TIMESTAMP,
            "updatedAt": firestore.SERVER_TIMESTAMP,
            "source": med.get("source", "FDA API")
        }
        
        # Add to batch
        batch.set(doc_ref, med_data)
        batch_count += 1
        uploaded += 1
        
        # Show progress every 10 items
        if idx % 10 == 0:
            print(f"  Progress: {idx}/{len(medications)} medications processed")
        
        # Firestore limit: 500 operations per batch
        if batch_count >= 500:
            print(f"  ⏳ Committing batch of {batch_count} medications...")
            batch.commit()
            batch = db.batch()
            batch_count = 0
            print(f"  ✅ Batch committed. Total uploaded so far: {uploaded}")
            
    except Exception as e:
        failed += 1
        print(f"  ❌ Error uploading medication #{idx}: {e}")

# Commit final batch
if batch_count > 0:
    print(f"\n⏳ Committing final batch of {batch_count} medications...")
    try:
        batch.commit()
        print("✅ Final batch committed successfully!")
    except Exception as e:
        print(f"❌ Error committing final batch: {e}")
        failed += batch_count

# Summary
print("\n" + "=" * 60)
print("📊 UPLOAD SUMMARY")
print("=" * 60)
print(f"✅ Successfully uploaded: {uploaded} medications")
if failed > 0:
    print(f"❌ Failed to upload: {failed} medications")
print(f"📁 Collection: {collection_name}")
print("=" * 60)

# Verify
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
    else:
        print("⚠️ No documents found in collection")
except Exception as e:
    print(f"❌ Error verifying upload: {e}")

print("\n✨ Upload process complete!")
print("Check your Firebase Console to see the data.")