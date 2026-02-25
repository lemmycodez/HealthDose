"""
STEP 1: Fetch medication data from OpenFDA
Run this first to download medication information
"""

import requests
import json
import time

print("Fetching medication data from OpenFDA...")

# OpenFDA API endpoint for drug labels
url = "https://api.fda.gov/drug/label.json"

# We'll fetch in batches (100 at a time)
all_drugs = []
page = 1
total_fetched = 0

while page <= 5:  # Get 5 pages = 500 drugs (enough for testing)
    print(f"Fetching page {page}...")
    
    # Parameters for the API request
    params = {
        "limit": 100,  # Get 100 drugs per page
        "skip": (page - 1) * 100,  # Skip previous pages
        "api_key": ""  # OpenFDA doesn't require key for testing
    }
    
    # Make the request
    response = requests.get(url, params=params)
    
    if response.status_code == 200:
        data = response.json()
        drugs = data.get('results', [])
        all_drugs.extend(drugs)
        total_fetched += len(drugs)
        print(f"Got {len(drugs)} drugs (Total: {total_fetched})")
    else:
        print(f"Error: {response.status_code}")
    
    # Don't overwhelm the API
    time.sleep(1)
    page += 1

# Save raw data to file
with open('medications_raw.json', 'w') as f:
    json.dump(all_drugs, f, indent=2)

print(f"Done. Saved {total_fetched} medications to medications_raw.json")
