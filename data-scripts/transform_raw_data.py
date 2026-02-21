"""
transform_raw_data.py
Transform raw FDA data into clean format for Firestore
Run this to create medications_clean.json from raw_drugs.json
"""

import json
import re

print("=" * 60)
print("🔄 TRANSFORM SCRIPT - Raw FDA Data to Clean Format")
print("=" * 60)

# Step 1: Load the raw data
print("\n📂 Loading raw_drugs.json...")
try:
    with open('raw_drugs.json', 'r', encoding='utf-8') as f:
        raw_drugs = json.load(f)
    print(f"✅ Loaded {len(raw_drugs)} raw drugs")
except FileNotFoundError:
    print("❌ Error: raw_drugs.json not found!")
    print("Run fetch_raw_data.py first to download the data.")
    exit(1)

# Step 2: Transform each drug
print("\n🔄 Transforming data...")
clean_drugs = []
skipped = 0

for idx, drug in enumerate(raw_drugs, 1):
    try:
        # Get the openfda section if it exists
        openfda = drug.get('openfda', {})
        
        # Extract generic name
        generic_name = ""
        if 'generic_name' in openfda:
            generic_name_list = openfda['generic_name']
            if generic_name_list and len(generic_name_list) > 0:
                generic_name = generic_name_list[0]
        
        # If no generic name, try other fields or skip
        if not generic_name:
            generic_name = drug.get('generic_name', [''])[0]
        
        if not generic_name:
            skipped += 1
            continue
        
        # Extract brand names
        brand_names = []
        if 'brand_name' in openfda:
            brand_names = openfda['brand_name']
        elif 'brand_name' in drug:
            brand_names = drug['brand_name'] if isinstance(drug['brand_name'], list) else [drug['brand_name']]
        
        # Extract drug class
        drug_class = "Unknown"
        if 'pharm_class_epc' in openfda:
            drug_class_list = openfda['pharm_class_epc']
            if drug_class_list and len(drug_class_list) > 0:
                drug_class = drug_class_list[0]
        elif 'pharm_class' in openfda:
            drug_class_list = openfda['pharm_class']
            if drug_class_list and len(drug_class_list) > 0:
                drug_class = drug_class_list[0]
        
        # Extract indications (what it's used for)
        indications = []
        if 'indications_and_usage' in drug:
            ind_text = drug['indications_and_usage'][0] if isinstance(drug['indications_and_usage'], list) else drug['indications_and_usage']
            # Clean HTML tags
            ind_text = re.sub('<[^<]+?>', '', ind_text)
            # Take first 200 characters as a summary
            if ind_text:
                indications = [ind_text[:200] + "..." if len(ind_text) > 200 else ind_text]
        
        # Extract warnings/side effects
        side_effects = []
        if 'warnings' in drug:
            warn_text = drug['warnings'][0] if isinstance(drug['warnings'], list) else drug['warnings']
            # Clean HTML tags
            warn_text = re.sub('<[^<]+?>', '', warn_text)
            if warn_text:
                side_effects = [warn_text[:200] + "..." if len(warn_text) > 200 else warn_text]
        
        # Extract dosage
        dosage = "Consult healthcare provider"
        if 'dosage_and_administration' in drug:
            dose_text = drug['dosage_and_administration'][0] if isinstance(drug['dosage_and_administration'], list) else drug['dosage_and_administration']
            dose_text = re.sub('<[^<]+?>', '', dose_text)
            if dose_text:
                dosage = dose_text[:200] + "..." if len(dose_text) > 200 else dose_text
        
        # Create clean drug object matching Firestore schema
        clean_drug = {
            "genericName": generic_name,
            "brandNames": brand_names if brand_names else [],
            "drugClass": drug_class,
            "mechanismOfAction": "Information not available in FDA data",  # FDA doesn't always have this
            "indications": indications if indications else ["Information not available"],
            "contraindications": [],  # Would need to extract from warnings
            "dosageGuidelines": dosage,
            "sideEffects": side_effects if side_effects else ["Information not available"],
            "pharmacokinetics": "Information not available in FDA data",
            "source": "FDA OpenFDA API"
        }
        
        clean_drugs.append(clean_drug)
        
        # Show progress every 10 drugs
        if idx % 10 == 0:
            print(f"  Processed {idx}/{len(raw_drugs)} drugs...")
            
    except Exception as e:
        print(f"  ⚠️ Error processing drug #{idx}: {e}")
        skipped += 1

# Step 3: Save the clean data
print(f"\n✅ Successfully transformed {len(clean_drugs)} drugs")
print(f"⚠️ Skipped {skipped} drugs (missing generic name)")

print("\n💾 Saving to medications_clean.json...")
with open('medications_clean.json', 'w', encoding='utf-8') as f:
    json.dump(clean_drugs, f, indent=2)

print(f"✅ Saved {len(clean_drugs)} drugs to medications_clean.json")

# Step 4: Show sample of what we created
print("\n🔍 Sample of transformed data (first 3 drugs):")
for i, drug in enumerate(clean_drugs[:3], 1):
    print(f"\n  Drug #{i}: {drug['genericName']}")
    print(f"    Brand Names: {', '.join(drug['brandNames'][:3]) if drug['brandNames'] else 'None'}")
    print(f"    Drug Class: {drug['drugClass']}")
    print(f"    Indications: {drug['indications'][0][:100]}..." if drug['indications'] else "    Indications: None")
    print(f"    Side Effects: {drug['sideEffects'][0][:100]}..." if drug['sideEffects'] else "    Side Effects: None")

print("\n" + "=" * 60)
print("✨ Transformation complete!")
print("Next step: Run upload_to_firestore.py to upload to Firebase")
print("=" * 60)