"""
Fetch raw medication data from OpenFDA API
Run this first to download medication information
"""

import requests
import json

print("📥 Fetching medication data from OpenFDA...")
print("This will download 10 sample drugs for testing...")

# OpenFDA API endpoint for drug labels
url = "https://api.fda.gov/drug/label.json"

# Parameters for the request
params = {
    "limit": 10,  # Get just 10 drugs to start
    "api_key": ""  # No key needed for testing
}

# Make the API request
print("Connecting to OpenFDA...")
response = requests.get(url, params=params)

# Check if it worked
if response.status_code == 200:
    print("✅ Successfully connected to OpenFDA!")
    
    # Parse the JSON response
    data = response.json()
    
    # Extract just the results (the actual drug data)
    drugs = data.get('results', [])
    
    print(f"📊 Found {len(drugs)} drugs")
    
    # Save to a file
    with open('raw_drugs.json', 'w') as f:
        json.dump(drugs, f, indent=2)
    
    print("✅ Saved raw data to: raw_drugs.json")
    print(f"📁 File location: C:\\Users\\Chosen.DESKTOP-PO3JMN8\\Desktop\\projects\\HealthDose\\data-scripts\\raw_drugs.json")
    
    # Show a sample of what we got
    if len(drugs) > 0:
        print("\n🔍 Sample drug data:")
        first_drug = drugs[0]
        
        # Show what fields are available
        if 'openfda' in first_drug:
            print("  - Has FDA data")
            openfda = first_drug['openfda']
            if 'generic_name' in openfda:
                print(f"  - Generic name: {openfda['generic_name']}")
            if 'brand_name' in openfda:
                print(f"  - Brand name: {openfda['brand_name']}")
        
        if 'indications_and_usage' in first_drug:
            print("  - Has indications/usage information")
        
        if 'warnings' in first_drug:
            print("  - Has warnings information")
    
else:
    print(f"❌ Error: Could not connect to OpenFDA")
    print(f"Error code: {response.status_code}")

print("\n✨ Done! You can now open raw_drugs.json to see the data.")