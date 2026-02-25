# Data Scripts

This folder contains scripts for loading medication data and seeding sample interactions into Firestore.

## Prerequisites
- Python 3.10+
- Firestore enabled in your Firebase project
- Auth available via either:
  - `gcloud auth application-default login`
  - Or `GOOGLE_APPLICATION_CREDENTIALS` pointing to a service account JSON

## Install Python deps
```bash
python -m venv venv
venv\\Scripts\\activate
pip install -r requirements.txt
```

## Step 1: Fetch medication data (OpenFDA)
```bash
python fetch_medications.py
```
This produces `medications_raw.json`.

## Step 2: Upload medications to Firestore
```bash
python upload_medications.py --limit 500
```
Increase the limit after validating the data shape.

## Step 3: Seed sample interactions
```bash
python seed_interactions.py
```
Update `seed_interactions.json` to add more samples.
