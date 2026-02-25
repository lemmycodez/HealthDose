"""
Upload normalized medication data to Firestore.

Input: medications_raw.json (OpenFDA label results).
Output: Firestore collection 'medications'
"""

import argparse
import json
import os
from typing import Any, Dict, List

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


def pick_first(values: Any) -> str:
    if isinstance(values, list) and values:
        return str(values[0]).strip()
    if isinstance(values, str):
        return values.strip()
    return ""


def normalize_record(raw: Dict[str, Any]) -> Dict[str, Any]:
    openfda = raw.get("openfda", {}) or {}

    generic_name = pick_first(openfda.get("generic_name"))
    brand_names = openfda.get("brand_name") or []
    brand_names = [str(b).strip() for b in brand_names if str(b).strip()]

    if not generic_name:
        generic_name = brand_names[0] if brand_names else pick_first(raw.get("id"))

    # Prefer pharmacologic class if present
    drug_class = (
        pick_first(openfda.get("pharm_class_epc"))
        or pick_first(openfda.get("pharm_class_moa"))
        or pick_first(openfda.get("pharm_class_cs"))
        or "Unknown"
    )

    route = pick_first(openfda.get("route"))
    product_type = pick_first(openfda.get("product_type"))
    manufacturer = pick_first(openfda.get("manufacturer_name"))

    return {
        "genericName": generic_name,
        "brandNames": [b for b in brand_names if b.lower() != generic_name.lower()],
        "drugClass": drug_class,
        "route": route,
        "productType": product_type,
        "manufacturerName": manufacturer,
        "setId": raw.get("set_id"),
        "labelId": raw.get("id"),
        "source": "openfda",
        "createdAt": firestore.SERVER_TIMESTAMP,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="medications_raw.json")
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--start", type=int, default=0)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    with open(args.input, "r", encoding="utf-8") as f:
        data = json.load(f)

    if args.start:
        data = data[args.start :]
    if args.limit:
        data = data[: args.limit]

    records = [normalize_record(r) for r in data]

    if args.dry_run:
        print(f"Dry run: prepared {len(records)} records")
        print(json.dumps(records[0], indent=2))
        return

    db = init_firestore()
    batch = db.batch()
    count = 0

    for rec in records:
        doc_ref = db.collection("medications").document()
        batch.set(doc_ref, rec)
        count += 1

        if count % 500 == 0:
            batch.commit()
            batch = db.batch()
            print(f"Uploaded {count} records...")

    if count % 500 != 0:
        batch.commit()

    print(f"Done. Uploaded {count} medication records.")


if __name__ == "__main__":
    main()
