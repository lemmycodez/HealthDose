"""
generate_embeddings.py
RAG Pipeline - Step 4: Generate embeddings for text chunks
Uses Vertex AI's text-embedding-004 model
"""

import json
import os
import time
import subprocess
import sys
from pathlib import Path
from typing import List, Dict, Any

# Configuration
BASE_DIR = Path(__file__).resolve().parent
INPUT_FILE = BASE_DIR / "processed_chunks" / "all_chunks.json"
OUTPUT_FILE = BASE_DIR / "processed_chunks" / "all_chunks_with_embeddings.json"
BATCH_SIZE = 5  # Process 5 chunks at a time
PROJECT_ID = "med-assist-9edf0"
LOCATION = "us-central1"

def find_gcloud() -> str:
    """Find the path to gcloud executable"""
    possible_paths = [
        r"C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd",
        r"C:\Program Files\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd",
        r"C:\Users\Chosen.DESKTOP-PO3JMN8\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd",
        "gcloud.cmd",
        "gcloud"
    ]
    
    for path in possible_paths:
        try:
            if os.path.exists(path):
                return path
            # Try with which/where command
            if os.name == 'nt':  # Windows
                result = subprocess.run(
                    ["where", "gcloud"],
                    capture_output=True,
                    text=True,
                    shell=True
                )
                if result.returncode == 0:
                    return result.stdout.strip().split('\n')[0]
            else:  # Linux/Mac
                result = subprocess.run(
                    ["which", "gcloud"],
                    capture_output=True,
                    text=True
                )
                if result.returncode == 0:
                    return result.stdout.strip()
        except:
            continue
    
    return None

def get_access_token() -> str:
    """Get a fresh access token using gcloud"""
    print("   🔑 Looking for gcloud...")
    
    gcloud_path = find_gcloud()
    
    if not gcloud_path:
        print("   ❌ Could not find gcloud command!")
        print("   Trying direct token input instead...")
        
        # Ask user to manually provide token
        print("\n📋 Please run this command in a separate Command Prompt:")
        print("   gcloud auth print-access-token")
        print("\nCopy the token and paste it here:")
        token = input("Token: ").strip()
        
        if token:
            return token
        else:
            print("❌ No token provided")
            return None
    
    try:
        print(f"   ✅ Found gcloud at: {gcloud_path}")
        
        # Use the full path to gcloud
        result = subprocess.run(
            [gcloud_path, "auth", "print-access-token"],
            capture_output=True,
            text=True,
            check=True,
            shell=True
        )
        token = result.stdout.strip()
        print(f"   ✅ Token obtained (starts with: {token[:15]}...)")
        return token
    except subprocess.CalledProcessError as e:
        print(f"   ❌ Failed to get access token: {e}")
        print(f"   Error output: {e.stderr}")
        return None
    except Exception as e:
        print(f"   ❌ Unexpected error: {e}")
        return None

def generate_embedding(text: str, token: str) -> List[float]:
    """
    Generate embedding for a single text chunk using Vertex AI REST API
    """
    import requests
    
    url = f"https://{LOCATION}-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/{LOCATION}/publishers/google/models/text-embedding-004:predict"
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Truncate text if too long (model has 2048 token limit)
    # Rough estimate: 1 token ≈ 4 characters
    if len(text) > 8000:  # ~2000 tokens
        text = text[:8000]
    
    data = {
        "instances": [
            {
                "content": text
            }
        ]
    }
    
    try:
        print(f"      📡 Sending request to Vertex AI...")
        response = requests.post(url, headers=headers, json=data, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            # Extract embedding from response
            embedding = result['predictions'][0]['embeddings']['values']
            return embedding
        elif response.status_code == 401:
            print(f"      ❌ Token expired. Please run the script again.")
            return None
        else:
            print(f"      ❌ Error {response.status_code}")
            if response.text:
                print(f"         {response.text[:200]}")
            return None
    except requests.exceptions.Timeout:
        print(f"      ❌ Request timed out")
        return None
    except requests.exceptions.ConnectionError as e:
        print(f"      ❌ Connection error: {e}")
        return None
    except Exception as e:
        print(f"      ❌ Exception: {e}")
        return None

def process_embeddings():
    """Main function to generate embeddings for all chunks"""
    print("=" * 70)
    print("🔢 RAG PIPELINE - Generate Embeddings")
    print("=" * 70)
    
    # Check if input file exists
    if not os.path.exists(str(INPUT_FILE)):
        print(f"❌ Input file not found: {INPUT_FILE}")
        print("   Run process_documents.py first")
        return
    
    # Get access token
    print("\n🔑 Getting access token...")
    token = get_access_token()
    if not token:
        print("\n❌ Could not get access token.")
        print("   Alternative: Run this in Command Prompt:")
        print("   curl -X POST \\")
        print(f"     -H \"Authorization: Bearer $(gcloud auth print-access-token)\" \\")
        print(f"     -H \"Content-Type: application/json\" \\")
        print(f"     https://{LOCATION}-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/{LOCATION}/publishers/google/models/text-embedding-004:predict \\")
        print("     -d '{\"instances\":[{\"content\":\"test\"}]}'")
        return
    
    # Load chunks
    print(f"\n📂 Loading chunks from {INPUT_FILE}")
    with open(str(INPUT_FILE), 'r', encoding='utf-8') as f:
        chunks = json.load(f)
    print(f"✅ Loaded {len(chunks)} chunks")
    
    # Process chunks in batches
    print(f"\n⚙️ Generating embeddings for {len(chunks)} chunks...")
    print(f"   Batch size: {BATCH_SIZE}")
    
    chunks_with_embeddings = []
    successful = 0
    failed = 0
    
    for i in range(0, len(chunks), BATCH_SIZE):
        batch_num = i // BATCH_SIZE + 1
        total_batches = (len(chunks) + BATCH_SIZE - 1) // BATCH_SIZE
        batch = chunks[i:i + BATCH_SIZE]
        
        print(f"\n   Batch {batch_num}/{total_batches} ({len(batch)} chunks)")
        
        for j, chunk in enumerate(batch):
            print(f"      Chunk {j+1}/{len(batch)}: {chunk['drug_name']} (part {chunk['chunk_index']+1})")
            
            # Generate embedding
            embedding = generate_embedding(chunk['text'], token)
            
            if embedding:
                chunk['embedding'] = embedding
                chunks_with_embeddings.append(chunk)
                successful += 1
                print(f"         ✅ Embedding generated (dimensions: {len(embedding)})")
            else:
                chunk['embedding'] = None
                chunks_with_embeddings.append(chunk)
                failed += 1
                print(f"         ❌ Failed to generate embedding")
            
            # Small delay to avoid rate limits
            time.sleep(1)
        
        # Longer delay between batches
        if batch_num < total_batches:
            print(f"   ⏳ Waiting 3 seconds before next batch...")
            time.sleep(3)
    
    # Save results
    print(f"\n💾 Saving to {OUTPUT_FILE}")
    with open(str(OUTPUT_FILE), 'w', encoding='utf-8') as f:
        json.dump(chunks_with_embeddings, f, indent=2, ensure_ascii=False)
    
    # Summary
    print("\n" + "=" * 70)
    print("📊 EMBEDDING GENERATION SUMMARY")
    print("=" * 70)
    print(f"✅ Successful embeddings: {successful}")
    print(f"❌ Failed embeddings: {failed}")
    print(f"📁 Output file: {OUTPUT_FILE}")
    
    # Show sample embedding
    if successful > 0:
        # Find first successful embedding
        for chunk in chunks_with_embeddings:
            if chunk.get('embedding'):
                print("\n🔍 Sample embedding (first 10 values):")
                print(f"   {chunk['embedding'][:10]}")
                print(f"   ... and {len(chunk['embedding'])-10} more dimensions")
                print(f"   Total dimensions: {len(chunk['embedding'])}")
                break
    
    print("\n" + "=" * 70)
    print("✅ STEP 4 COMPLETE! Ready to upload to Firestore.")
    print("=" * 70)

if __name__ == "__main__":
    process_embeddings()
