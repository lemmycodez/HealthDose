"""
retry_failed_embeddings.py
Re-generates embeddings only for chunks that are missing them, then uploads them to Firestore.
"""

import json
import os
import time
import subprocess
import sys
from pathlib import Path
from typing import List, Dict, Any

BASE_DIR = Path(__file__).resolve().parent
EMBEDDINGS_FILE = BASE_DIR / "processed_chunks" / "all_chunks_with_embeddings.json"
PROJECT_ID = "med-assist-9edf0"
LOCATION = "us-central1"
COLLECTION_NAME = "medical_knowledge"
MAX_RETRIES = 3


def find_gcloud() -> str:
    possible_paths = [
        r"C:\Users\Chosen.DESKTOP-PO3JMN8\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd",
        r"C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd",
        r"C:\Program Files\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd",
        "gcloud.cmd",
        "gcloud",
    ]
    for path in possible_paths:
        if os.path.exists(path):
            return path
    try:
        result = subprocess.run(["where", "gcloud"], capture_output=True, text=True, shell=True)
        if result.returncode == 0:
            return result.stdout.strip().split("\n")[0]
    except Exception:
        pass
    return None


def get_access_token() -> str:
    gcloud_path = find_gcloud()
    if not gcloud_path:
        print("❌ gcloud not found")
        return None
    result = subprocess.run(
        [gcloud_path, "auth", "print-access-token"],
        capture_output=True, text=True, check=True, shell=True,
    )
    return result.stdout.strip()


def generate_embedding(text: str, token: str) -> List[float]:
    import requests
    url = (
        f"https://{LOCATION}-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}"
        f"/locations/{LOCATION}/publishers/google/models/text-embedding-004:predict"
    )
    if len(text) > 8000:
        text = text[:8000]
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = requests.post(
                url,
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json={"instances": [{"content": text}]},
                timeout=30,
            )
            if response.status_code == 200:
                return response.json()["predictions"][0]["embeddings"]["values"]
            elif response.status_code == 401:
                print(f"      ⚠️  Token expired on attempt {attempt}")
                return None
            else:
                print(f"      ❌ HTTP {response.status_code} on attempt {attempt}")
        except Exception as e:
            print(f"      ❌ Error on attempt {attempt}: {type(e).__name__}")
        if attempt < MAX_RETRIES:
            time.sleep(3 * attempt)
    return None


def main():
    print("=" * 70)
    print("🔁 RETRY FAILED EMBEDDINGS")
    print("=" * 70)

    with open(str(EMBEDDINGS_FILE), "r", encoding="utf-8") as f:
        chunks = json.load(f)

    missing = [c for c in chunks if not c.get("embedding")]
    print(f"\n📊 Total chunks: {len(chunks)}")
    print(f"❌ Missing embeddings: {len(missing)}")

    if not missing:
        print("✅ All chunks already have embeddings!")
        return

    # Show what's missing
    from collections import Counter
    sources = Counter(c.get("filename", "unknown") for c in missing)
    print("\nMissing by file:")
    for fn, cnt in sources.most_common():
        print(f"  {fn}: {cnt} chunks")

    print("\n🔑 Getting access token...")
    token = get_access_token()
    if not token:
        return

    success = 0
    failed = 0
    chunk_map = {c["chunk_id"]: i for i, c in enumerate(chunks)}

    for i, chunk in enumerate(missing):
        print(f"\n  [{i+1}/{len(missing)}] {chunk.get('filename')} chunk {chunk.get('chunk_index')}")
        embedding = generate_embedding(chunk["text"], token)
        idx = chunk_map[chunk["chunk_id"]]
        if embedding:
            chunks[idx]["embedding"] = embedding
            success += 1
            print(f"      ✅ Done ({len(embedding)} dims)")
        else:
            failed += 1
            print(f"      ❌ Failed again")
        time.sleep(1)

    # Save updated file
    print(f"\n💾 Saving updated embeddings file...")
    with open(str(EMBEDDINGS_FILE), "w", encoding="utf-8") as f:
        json.dump(chunks, f, indent=2, ensure_ascii=False)
    print(f"✅ Saved. Success: {success}, Still failed: {failed}")

    if success == 0:
        print("❌ No new embeddings — skipping Firestore upload.")
        return

    # Upload only the newly embedded chunks
    print(f"\n📤 Uploading {success} newly embedded chunks to Firestore...")
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore as fs
        try:
            firebase_admin.get_app()
        except ValueError:
            firebase_admin.initialize_app()
        db = fs.client()
    except Exception as e:
        print(f"❌ Firestore init failed: {e}")
        return

    newly_embedded = [c for c in chunks if c.get("embedding") and c["chunk_id"] in {m["chunk_id"] for m in missing}]
    batch = db.batch()
    count = 0
    uploaded = 0
    for chunk in newly_embedded:
        if not chunk.get("embedding"):
            continue
        doc_ref = db.collection(COLLECTION_NAME).document(chunk["chunk_id"])
        batch.set(doc_ref, {
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
            "embedding": chunk["embedding"],
            "metadata": chunk.get("metadata", {}),
            "created_at": fs.SERVER_TIMESTAMP,
        })
        count += 1
        uploaded += 1
        if count >= 400:
            batch.commit()
            batch = db.batch()
            count = 0
    if count > 0:
        batch.commit()

    print(f"✅ Uploaded {uploaded} chunks to Firestore collection '{COLLECTION_NAME}'")
    print("\n" + "=" * 70)
    print("✅ RETRY COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    main()
