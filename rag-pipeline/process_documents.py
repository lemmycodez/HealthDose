"""
process_documents.py
RAG pipeline document processing.
Loads supported documents, chunks text, and writes processed_chunks/all_chunks.json.
"""

import hashlib
import json
import os
from pathlib import Path
from typing import Any, Dict, List, Tuple

# Configuration
BASE_DIR = Path(__file__).resolve().parent
SOURCE_FOLDERS = [
    BASE_DIR.parent / "medical-documents",
    BASE_DIR.parent / "docx",
]
SUPPORTED_EXTENSIONS = {".txt", ".md", ".pdf"}
OUTPUT_FOLDER = BASE_DIR / "processed_chunks"
CHUNK_SIZE = 400
OVERLAP = 50
MAX_PDF_PAGES = int(os.getenv("MAX_PDF_PAGES", "120"))

os.makedirs(str(OUTPUT_FOLDER), exist_ok=True)


def read_text_file(file_path: str) -> str:
    """Read UTF-8 text/markdown file contents."""
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()


def read_pdf_file(file_path: str, max_pages: int = MAX_PDF_PAGES) -> str:
    """Extract text from a PDF file, optionally capping number of pages."""
    try:
        from pypdf import PdfReader
    except ImportError as exc:
        raise RuntimeError("Missing dependency 'pypdf'. Install with: pip install pypdf") from exc

    reader = PdfReader(file_path)
    pages: List[str] = []
    total_pages = len(reader.pages)
    pages_to_read = total_pages if max_pages <= 0 else min(total_pages, max_pages)

    for page_index in range(pages_to_read):
        page = reader.pages[page_index]
        page_text = page.extract_text() or ""
        if page_text.strip():
            pages.append(page_text.strip())

    if pages_to_read < total_pages:
        pages.append(
            f"[Truncated PDF extraction: processed first {pages_to_read} of {total_pages} pages]"
        )

    return "\n\n".join(pages)


def read_document(file_path: str) -> str:
    """Read a supported input document and return plain text."""
    extension = Path(file_path).suffix.lower()
    if extension in {".txt", ".md"}:
        return read_text_file(file_path)
    if extension == ".pdf":
        return read_pdf_file(file_path)
    raise ValueError(f"Unsupported file extension: {extension}")


def smart_chunk_text(text: str, chunk_size: int = 500, overlap: int = 100) -> List[str]:
    """
    Split text into overlapping chunks.
    Prefers paragraph boundaries; falls back to sentence chunking for long paragraphs.
    """
    paragraphs = text.split("\n\n")

    chunks: List[str] = []
    current_chunk: List[str] = []
    current_length = 0

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue

        para_words = para.split()
        para_length = len(para_words)

        if para_length > chunk_size:
            if current_chunk:
                chunks.append("\n\n".join(current_chunk))
                current_chunk = []
                current_length = 0

            sentences = para.replace("! ", "!|").replace("? ", "?|").replace(". ", ".|").split("|")
            sentence_chunk: List[str] = []
            sentence_length = 0

            for sentence in sentences:
                sent_words = sentence.split()
                sent_len = len(sent_words)

                if sentence_length + sent_len > chunk_size and sentence_chunk:
                    chunks.append(" ".join(sentence_chunk))
                    sentence_chunk = sentence_chunk[-1:] if overlap > 0 else []
                    sentence_length = len(sentence_chunk[0].split()) if sentence_chunk else 0

                sentence_chunk.append(sentence)
                sentence_length += sent_len

            if sentence_chunk:
                chunks.append(" ".join(sentence_chunk))

        elif current_length + para_length <= chunk_size:
            current_chunk.append(para)
            current_length += para_length
        else:
            if current_chunk:
                chunks.append("\n\n".join(current_chunk))
            current_chunk = [para]
            current_length = para_length

    if current_chunk:
        chunks.append("\n\n".join(current_chunk))

    return chunks


def extract_metadata(filename: str, source_folder: str, text: str) -> Dict[str, Any]:
    """Build document metadata for downstream upload."""
    source_key = f"{source_folder}/{filename}"
    doc_id = hashlib.md5(source_key.encode()).hexdigest()[:8]
    lines = text.strip().split("\n")
    title = lines[0] if lines else filename
    drug_name = Path(filename).stem.replace("-", " ").replace("_", " ").title()

    return {
        "doc_id": doc_id,
        "filename": filename,
        "source_folder": source_folder,
        "file_type": Path(filename).suffix.lower(),
        "title": title,
        "drug_name": drug_name,
        "source": "medical_document",
        "word_count": len(text.split()),
        "char_count": len(text),
    }


def find_input_documents() -> List[Tuple[str, str]]:
    """Find supported documents in configured source folders."""
    discovered: List[Tuple[str, str]] = []
    for folder in SOURCE_FOLDERS:
        folder_path = Path(folder)
        if not folder_path.exists():
            continue
        for name in os.listdir(str(folder_path)):
            extension = Path(name).suffix.lower()
            if extension in SUPPORTED_EXTENSIONS:
                discovered.append((str(folder_path / name), folder_path.name))
    return discovered


def process_documents() -> List[Dict[str, Any]]:
    """Main entrypoint for document processing."""
    print("=" * 70)
    print("RAG PIPELINE - Document Processing")
    print("=" * 70)

    input_documents = find_input_documents()
    if not input_documents:
        folders = ", ".join(str(folder) for folder in SOURCE_FOLDERS)
        exts = ", ".join(sorted(SUPPORTED_EXTENSIONS))
        print(f"No documents found in: {folders}")
        print(f"Add files with one of: {exts}")
        return []

    print(f"\nFound {len(input_documents)} documents to process")

    all_chunks: List[Dict[str, Any]] = []

    for file_path, source_folder in input_documents:
        filename = os.path.basename(file_path)
        print(f"\nProcessing: {source_folder}/{filename}")

        try:
            text = read_document(file_path)
        except Exception as exc:
            print(f"  Failed to read file: {exc}")
            continue

        if not text.strip():
            print("  Skipping empty document after extraction")
            continue

        metadata = extract_metadata(filename, source_folder, text)
        print(f"  Title: {metadata['title'][:120]}")
        print(f"  Word count: {metadata['word_count']}")

        chunks = smart_chunk_text(text, chunk_size=CHUNK_SIZE, overlap=OVERLAP)
        print(f"  Created {len(chunks)} chunks")

        for i, chunk_text in enumerate(chunks):
            chunk_data = {
                "chunk_id": f"{metadata['doc_id']}_{i:04d}",
                "doc_id": metadata["doc_id"],
                "filename": filename,
                "source_folder": source_folder,
                "file_type": metadata["file_type"],
                "title": metadata["title"],
                "drug_name": metadata["drug_name"],
                "chunk_index": i,
                "text": chunk_text,
                "word_count": len(chunk_text.split()),
                "metadata": metadata,
            }
            all_chunks.append(chunk_data)

    output_file = OUTPUT_FOLDER / "all_chunks.json"
    with open(str(output_file), "w", encoding="utf-8") as f:
        json.dump(all_chunks, f, indent=2, ensure_ascii=False)

    print(f"\nProcessing complete")
    print(f"Total chunks created: {len(all_chunks)}")
    print(f"Saved to: {str(output_file)}")
    print("=" * 70)

    return all_chunks


if __name__ == "__main__":
    process_documents()
