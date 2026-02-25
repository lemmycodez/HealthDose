"""
Seed sample drug interactions into Firestore.
Input: seed_interactions.json
Output: Firestore collection 'interactions'
"""

import json
import os
from typing import Dict, Any

import firebase_admin
from firebase_admin import credentials, firestore


def init_firestore():
    if not firebase_admin._apps:
        try:
            firebase_admin.initialize_app()
        except Exception:
            cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")
            if cred_path:
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
            else:
                raise
    return firestore.client()


def build_name_map(db) -> Dict[str, Any]:
    snapshot = db.collection("medications").get()
    name_map: Dict[str, Any] = {}
    for doc in snapshot:
        data = doc.to_dict()
        generic = (data.get("genericName") or "").strip()
        if generic:
            name_map[generic.lower()] = doc.reference
        for brand in data.get("brandNames") or []:
            if brand:
                name_map[str(brand).lower()] = doc.reference
    return name_map


def main():
    with open("seed_interactions.json", "r", encoding="utf-8") as f:
        items = json.load(f)

    db = init_firestore()
    name_map = build_name_map(db)

    batch = db.batch()
    count = 0

    for item in items:
        drug_a = (item.get("drugA") or "").lower()
        drug_b = (item.get("drugB") or "").lower()
        ref_a = name_map.get(drug_a)
        ref_b = name_map.get(drug_b)

        if not ref_a or not ref_b:
            print(f"Skipping: missing medication for {item.get('drugA')} / {item.get('drugB')}")
            continue

        doc_ref = db.collection("interactions").document()
        batch.set(
            doc_ref,
            {
                "drugA": ref_a,
                "drugB": ref_b,
                "severity": item.get("severity", "mild"),
                "interactionType": item.get("interactionType", "general"),
                "description": item.get("description", ""),
                "clinicalManagementAdvice": item.get("clinicalManagementAdvice", ""),
                "createdAt": firestore.SERVER_TIMESTAMP,
            },
        )
        count += 1

        if count % 500 == 0:
            batch.commit()
            batch = db.batch()
            print(f"Uploaded {count} interactions...")

    if count % 500 != 0:
        batch.commit()

    print(f"Done. Uploaded {count} interactions.")


if __name__ == "__main__":
    main()
