"""
test_vertex.py
Simple test to verify Vertex AI is working
Run this instead of fighting with curl!
"""

import vertexai
from vertexai.generative_models import GenerativeModel
import os
import sys

print("=" * 60)
print("🤖 TESTING VERTEX AI CONNECTION")
print("=" * 60)

# Project configuration
PROJECT_ID = "med-assist-9edf0"
LOCATION = "us-central1"

try:
    # Initialize Vertex AI
    print(f"\n🔌 Connecting to Vertex AI...")
    print(f"   Project: {PROJECT_ID}")
    print(f"   Location: {LOCATION}")
    
    vertexai.init(project=PROJECT_ID, location=LOCATION)
    print("✅ Vertex AI initialized successfully")
    
    # Load the model
    print("\n📦 Loading Gemini model...")
    model = GenerativeModel("gemini-2.0-flash-001")
    print("✅ Model loaded successfully")
    
    # Generate a simple response
    print("\n📝 Sending test prompt...")
    response = model.generate_content("Say hello in one word")
    
    print(f"✅ Response received!")
    print(f"\n🤖 AI says: {response.text}")
    
    print("\n" + "=" * 60)
    print("🎉 VERTEX AI IS WORKING PERFECTLY!")
    print("=" * 60)
    print("\nYou can now continue with Phase 3!")
    
except ImportError as e:
    print(f"\n❌ Missing required package: {e}")
    print("\n💡 Run: pip install google-cloud-aiplatform")
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    print("\n💡 Troubleshooting steps:")
    print("1. Run: gcloud auth application-default login")
    print("2. Go to: https://console.cloud.google.com/apis/library/aiplatform.googleapis.com")
    print("3. Make sure Vertex AI API is enabled")
    print("4. Check your project ID is 'med-assist-9edf0'")