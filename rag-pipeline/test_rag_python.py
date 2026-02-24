"""
test_rag_python.py
Test RAG functionality using Python
"""

import json
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

# Load your chunks with embeddings
with open('./processed_chunks/all_chunks_with_embeddings.json', 'r') as f:
    chunks = json.load(f)

print(f"📚 Loaded {len(chunks)} chunks")

# Test queries
test_queries = [
    "side effects of ibuprofen",
    "ibuprofen and warfarin interaction",
    "how does amoxicillin work"
]

for query in test_queries:
    print(f"\n🔍 Query: {query}")
    
    # For testing, we'll just check if we have relevant chunks
    # In a real system, you'd generate an embedding for the query
    
    # Look for chunks containing keywords
    keywords = query.lower().split()
    relevant = []
    
    for chunk in chunks:
        text = chunk['text'].lower()
        score = sum(1 for word in keywords if word in text)
        if score > 0:
            relevant.append((chunk, score))
    
    # Sort by relevance
    relevant.sort(key=lambda x: x[1], reverse=True)
    
    print(f"✅ Found {len(relevant)} relevant chunks")
    for i, (chunk, score) in enumerate(relevant[:3]):
        print(f"   {i+1}. {chunk['drug_name']} (score: {score}) - {chunk['text'][:100]}...")