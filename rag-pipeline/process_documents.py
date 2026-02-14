"""
process_documents.py
RAG Pipeline - Document Processing
Reads medical documents and splits them into chunks
"""

import os
import json
import hashlib
from typing import List, Dict, Any

# Configuration
DOCUMENTS_FOLDER = "../medical-documents"
OUTPUT_FOLDER = "./processed_chunks"

# Create output folder if it doesn't exist
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

def read_text_file(file_path: str) -> str:
    """Read a text file and return its contents"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()

def smart_chunk_text(text: str, chunk_size: int = 500, overlap: int = 100) -> List[str]:
    """
    Intelligently split text into overlapping chunks
    Tries to break at paragraph boundaries when possible
    """
    # First, split by double newlines (paragraphs)
    paragraphs = text.split('\n\n')
    
    chunks = []
    current_chunk = []
    current_length = 0
    
    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
            
        # Skip section headers (all caps lines)
        if para.isupper() and len(para) < 100:
            # This is a header, treat as its own chunk
            if current_chunk:
                chunks.append('\n\n'.join(current_chunk))
                current_chunk = []
                current_length = 0
            chunks.append(para)
            continue
        
        para_words = para.split()
        para_length = len(para_words)
        
        # If this paragraph alone exceeds chunk size, split it
        if para_length > chunk_size:
            # If we have accumulated previous paragraphs, save them first
            if current_chunk:
                chunks.append('\n\n'.join(current_chunk))
                current_chunk = []
                current_length = 0
            
            # Split the long paragraph into sentences
            sentences = para.replace('! ', '!|').replace('? ', '?|').replace('. ', '.|').split('|')
            sentence_chunk = []
            sentence_length = 0
            
            for sentence in sentences:
                sent_words = sentence.split()
                sent_len = len(sent_words)
                
                if sentence_length + sent_len > chunk_size and sentence_chunk:
                    chunks.append(' '.join(sentence_chunk))
                    # Keep last sentence for overlap
                    sentence_chunk = sentence_chunk[-1:] if overlap > 0 else []
                    sentence_length = len(sentence_chunk[0].split()) if sentence_chunk else 0
                
                sentence_chunk.append(sentence)
                sentence_length += sent_len
            
            if sentence_chunk:
                chunks.append(' '.join(sentence_chunk))
        
        # Normal case - add paragraph to current chunk
        elif current_length + para_length <= chunk_size:
            current_chunk.append(para)
            current_length += para_length
        else:
            # Save current chunk and start new one
            if current_chunk:
                chunks.append('\n\n'.join(current_chunk))
            current_chunk = [para]
            current_length = para_length
    
    # Add the last chunk
    if current_chunk:
        chunks.append('\n\n'.join(current_chunk))
    
    return chunks

def extract_metadata(filename: str, text: str) -> Dict[str, Any]:
    """Extract metadata from document"""
    # Generate a document ID from filename
    doc_id = hashlib.md5(filename.encode()).hexdigest()[:8]
    
    # Extract title from first line
    lines = text.strip().split('\n')
    title = lines[0] if lines else filename
    
    # Extract drug name from filename
    drug_name = filename.replace('.txt', '').replace('-', ' ').title()
    
    return {
        "doc_id": doc_id,
        "filename": filename,
        "title": title,
        "drug_name": drug_name,
        "source": "medical_document",
        "word_count": len(text.split()),
        "char_count": len(text)
    }

def process_documents():
    """Main function to process all documents"""
    print("=" * 70)
    print("📚 RAG PIPELINE - Document Processing")
    print("=" * 70)
    
    # Get all text files
    if not os.path.exists(DOCUMENTS_FOLDER):
        print(f"❌ Documents folder not found: {DOCUMENTS_FOLDER}")
        print("   Create the folder and add .txt files first")
        return
    
    text_files = [f for f in os.listdir(DOCUMENTS_FOLDER) if f.endswith('.txt')]
    
    if not text_files:
        print("❌ No .txt files found in medical-documents folder!")
        print("   Add some medical documents first")
        return
    
    print(f"\n📂 Found {len(text_files)} documents to process")
    
    all_chunks = []
    
    for filename in text_files:
        print(f"\n📄 Processing: {filename}")
        
        # Read file
        file_path = os.path.join(DOCUMENTS_FOLDER, filename)
        text = read_text_file(file_path)
        
        # Extract metadata
        metadata = extract_metadata(filename, text)
        print(f"   Title: {metadata['title']}")
        print(f"   Word count: {metadata['word_count']}")
        
        # Chunk the text
        chunks = smart_chunk_text(text, chunk_size=400, overlap=50)
        print(f"   Created {len(chunks)} chunks")
        
        # Save each chunk with metadata
        for i, chunk_text in enumerate(chunks):
            chunk_data = {
                "chunk_id": f"{metadata['doc_id']}_{i:04d}",
                "doc_id": metadata['doc_id'],
                "filename": filename,
                "title": metadata['title'],
                "drug_name": metadata['drug_name'],
                "chunk_index": i,
                "text": chunk_text,
                "word_count": len(chunk_text.split()),
                "metadata": metadata
            }
            all_chunks.append(chunk_data)
    
    # Save all chunks to a JSON file
    output_file = os.path.join(OUTPUT_FOLDER, "all_chunks.json")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_chunks, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Processing complete!")
    print(f"📊 Total chunks created: {len(all_chunks)}")
    print(f"💾 Saved to: {output_file}")
    
    # Show sample chunks
    print("\n🔍 Sample chunks (first 3):")
    for i, chunk in enumerate(all_chunks[:3]):
        print(f"\n   Chunk {i+1} (from {chunk['drug_name']}):")
        preview = chunk['text'][:150] + "..." if len(chunk['text']) > 150 else chunk['text']
        print(f"   {preview}")
    
    print("\n" + "=" * 70)
    print("✅ STEP 3 COMPLETE! Ready for embedding generation.")
    print("=" * 70)
    
    return all_chunks

if __name__ == "__main__":
    process_documents()