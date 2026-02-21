"""
Simple script to view the downloaded drug data in a readable format
"""

import json

# Load the data
with open('raw_drugs.json', 'r') as f:
    drugs = json.load(f)

print(f"\n📊 Found {len(drugs)} drugs in raw_drugs.json\n")
print("=" * 60)

for i, drug in enumerate(drugs, 1):
    print(f"\n📋 Drug #{i}")
    print("-" * 40)
    
    # Check if it has openfda data
    if 'openfda' in drug:
        openfda = drug['openfda']
        
        if 'generic_name' in openfda:
            print(f"Generic name: {openfda['generic_name'][0]}")
        
        if 'brand_name' in openfda:
            print(f"Brand name: {openfda['brand_name'][0]}")
        
        if 'product_type' in openfda:
            print(f"Type: {openfda['product_type'][0]}")
    else:
        print("No FDA structured data available")
    
    # Check for other useful fields
    if 'indications_and_usage' in drug:
        print("✅ Has indications/usage information")
    
    if 'warnings' in drug:
        print("✅ Has warnings information")
    
    if 'dosage_and_administration' in drug:
        print("✅ Has dosage information")

print("\n" + "=" * 60)
print("✨ Done viewing drug data")