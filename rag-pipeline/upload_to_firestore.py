"""
upload_to_firestore.py
RAG Pipeline - Step 5: Upload chunks with embeddings to Firestore
"""

import json
import os
from pathlib import Path
from typing import Dict, Any, List

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    print("⚠️ Firebase Admin not installed. Run: pip install firebase-admin")

# Configuration
BASE_DIR = Path(__file__).resolve().parent
INPUT_FILE = BASE_DIR / "processed_chunks" / "all_chunks_with_embeddings.json"
COLLECTION_NAME = "medical_knowledge"

def init_firestore():
    """Initialize Firestore connection"""
    if not FIREBASE_AVAILABLE:
        return None
    
    try:
        # Try to initialize with default credentials (from gcloud)
        firebase_admin.initialize_app()
        db = firestore.client()
        print("✅ Connected to Firestore using default credentials")
        return db
    except Exception as e:
        print(f"❌ Failed to initialize Firestore: {e}")
        
        # Try with application default credentials
        try:
            import google.auth
            credentials, project = google.auth.default()
            firebase_admin.initialize_app(credentials=credentials)
            db = firestore.client()
            print("✅ Connected to Firestore using application default credentials")
            return db
        except Exception as e2:
            print(f"❌ Also failed with ADC: {e2}")
            return None

def prepare_for_firestore(chunk: Dict[str, Any]) -> Dict[str, Any]:
    """Prepare chunk data for Firestore (remove non-serializable items)"""
    firestore_data = {
        "chunk_id": chunk["chunk_id"],
        "doc_id": chunk["doc_id"],
        "filename": chunk["filename"],
        "source_folder": chunk.get("source_folder"),
        "file_type": chunk.get("file_type"),
        "title": chunk["title"],
        "drug_name": chunk["drug_name"],
        "chunk_index": chunk["chunk_index"],
        "text": chunk["text"],
        "word_count": chunk["word_count"],
        "embedding": chunk.get("embedding"),  # This will be stored as array
        "metadata": chunk.get("metadata", {}),
        "created_at": firestore.SERVER_TIMESTAMP
    }
    return firestore_data

def upload_chunks(db, chunks: List[Dict[str, Any]]):
    """Upload chunks to Firestore in batches"""
    print(f"\n📤 Uploading {len(chunks)} chunks to Firestore...")
    print(f"   Collection: {COLLECTION_NAME}")
    
    batch = db.batch()
    batch_count = 0
    uploaded = 0
    
    for chunk in chunks:
        # Skip chunks without embeddings
        if not chunk.get('embedding'):
            print(f"   ⚠️ Skipping chunk {chunk['chunk_id']} (no embedding)")
            continue
        
        # Prepare data
        doc_data = prepare_for_firestore(chunk)
        
        # Use chunk_id as document ID
        doc_ref = db.collection(COLLECTION_NAME).document(chunk['chunk_id'])
        
        # Add to batch
        batch.set(doc_ref, doc_data)
        batch_count += 1
        uploaded += 1
        
        # Firestore limits batches to 500 operations
        if batch_count >= 400:  # Safe limit
            print(f"   ⏳ Committing batch of {batch_count} chunks...")
            batch.commit()
            batch = db.batch()
            batch_count = 0
            print(f"   ✅ Batch committed. Total uploaded: {uploaded}")
    
    # Commit final batch
    if batch_count > 0:
        print(f"   ⏳ Committing final batch of {batch_count} chunks...")
        batch.commit()
        print(f"   ✅ Final batch committed.")
    
    return uploaded

def verify_upload(db, expected_count: int):
    """Verify chunks were uploaded correctly"""
    print("\n🔍 Verifying upload...")
    
    try:
        # Get count
        docs = db.collection(COLLECTION_NAME).limit(10).get()
        print(f"   ✅ Found {len(docs)} documents in Firestore (sample)")
        
        # Show sample
        if len(docs) > 0:
            print("\n   📋 Sample documents:")
            for i, doc in enumerate(docs[:3]):
                data = doc.to_dict()
                print(f"      {i+1}. {data.get('drug_name')} - {data.get('title')[:50]}...")
        
        # Check if we got all expected
        if len(docs) >= expected_count:
            print(f"\n   ✅ All {expected_count} chunks verified!")
            return True
        else:
            print(f"\n   ⚠️ Only found {len(docs)} of {expected_count} chunks")
            return False
            
    except Exception as e:
        print(f"   ❌ Verification error: {e}")
        return False

def main():
    """Main function to upload embeddings to Firestore"""
    print("=" * 70)
    print("📤 RAG PIPELINE - Upload to Firestore")
    print("=" * 70)
    
    # Check if input file exists
    if not os.path.exists(str(INPUT_FILE)):
        print(f"❌ Input file not found: {INPUT_FILE}")
        print("   Run generate_embeddings.py first")
        return
    
    # Load chunks with embeddings
    print(f"\n📂 Loading chunks from {INPUT_FILE}")
    with open(str(INPUT_FILE), 'r', encoding='utf-8') as f:
        chunks = json.load(f)
    print(f"✅ Loaded {len(chunks)} chunks")
    
    # Count chunks with embeddings
    chunks_with_embeddings = [c for c in chunks if c.get('embedding')]
    print(f"✅ {len(chunks_with_embeddings)} chunks have embeddings")
    
    if len(chunks_with_embeddings) == 0:
        print("❌ No chunks with embeddings found!")
        return
    
    # Initialize Firestore
    print("\n🔌 Connecting to Firestore...")
    db = init_firestore()
    if not db:
        print("❌ Could not connect to Firestore")
        print("\n💡 Troubleshooting:")
        print("1. Run: gcloud auth application-default login")
        print("2. Make sure Firestore is enabled in your project")
        print("3. Check your internet connection")
        return
    
    # Upload chunks
    uploaded = upload_chunks(db, chunks_with_embeddings)
    
    # Summary
    print("\n" + "=" * 70)
    print("📊 UPLOAD SUMMARY")
    print("=" * 70)
    print(f"✅ Successfully uploaded: {uploaded} chunks")
    print(f"📁 Collection: {COLLECTION_NAME}")
    print(f"📦 Document IDs: {chunks_with_embeddings[0]['chunk_id'][:10]}... to {chunks_with_embeddings[-1]['chunk_id'][:10]}...")
    
    # Verify
    verify_upload(db, uploaded)
    
    print("\n" + "=" * 70)
    print("✅ STEP 5 COMPLETE! Chunks are now in Firestore.")
    print("=" * 70)
    print("\n📋 Next step: Build RAG query function to search these chunks!")
    print("   Type 'continue' when you're ready for Step 6.")

if __name__ == "__main__":
    main()
