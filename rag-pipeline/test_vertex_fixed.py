"""
test_vertex_fixed.py
Simplified Vertex AI test using REST API directly
This bypasses SDK issues
"""

import requests
import json
import subprocess

print("=" * 60)
print("🤖 VERTEX AI - DIRECT REST API TEST")
print("=" * 60)

# Configuration
PROJECT_ID = "med-assist-9edf0"
LOCATION = "us-central1"
MODEL = "gemini-2.0-flash-001"

# Step 1: Get a fresh token
print("\n🔑 Getting authentication token...")
try:
    # Get token from gcloud
    token = subprocess.check_output(
        "gcloud auth print-access-token", 
        shell=True, 
        text=True
    ).strip()
    print(f"✅ Token obtained (first 10 chars: {token[:10]}...)")
except Exception as e:
    print(f"❌ Failed to get token: {e}")
    print("   Run: gcloud auth login")
    exit(1)

# Step 2: Prepare the API request
url = f"https://{LOCATION}-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/{LOCATION}/publishers/google/models/{MODEL}:generateContent"

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

data = {
    "contents": [
        {
            "role": "user",
            "parts": [
                {
                    "text": "Say hello in one word"
                }
            ]
        }
    ]
}

# Step 3: Make the request
print(f"\n📡 Sending request to Vertex AI...")
print(f"   URL: {url}")

try:
    response = requests.post(
        url, 
        headers=headers, 
        json=data,
        timeout=30
    )
    
    print(f"   Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print("\n✅ SUCCESS! Vertex AI is working!")
        
        # Extract the response text
        try:
            answer = result['candidates'][0]['content']['parts'][0]['text']
            print(f"\n🤖 AI says: {answer}")
        except:
            print(f"\n📦 Full response: {json.dumps(result, indent=2)}")
            
    else:
        print(f"\n❌ ERROR {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 403:
            print("\n💡 Permission error. Run:")
            print("   gcloud auth application-default login")
        elif response.status_code == 404:
            print("\n💡 API not enabled. Enable it at:")
            print("   https://console.cloud.google.com/apis/library/aiplatform.googleapis.com")
            
except requests.exceptions.Timeout:
    print("❌ Request timed out")
except requests.exceptions.ConnectionError as e:
    print(f"❌ Connection error: {e}")
except Exception as e:
    print(f"❌ Unexpected error: {e}")

print("\n" + "=" * 60)