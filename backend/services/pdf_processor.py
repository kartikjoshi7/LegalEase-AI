"""
PDF Processing service for the LegalEase AI backend.

Provides deterministic text extraction and geometric coordinate mapping
using PyMuPDF (fitz). All operations execute entirely in-memory using
byte streams to ensure zero disk I/O and zero data persistence.
"""
import fitz  # PyMuPDF
from typing import Dict, List, Any
import logging
from fastapi import HTTPException

logger = logging.getLogger("legalease.pdf_processor")


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
    Extract raw text content from a PDF byte stream.

    Args:
        pdf_bytes: Raw PDF file bytes read from the upload.

    Returns:
        Concatenated plain text from all pages of the PDF.
    """
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    except fitz.FileDataError:
        logger.error("Failed to parse PDF: Corrupted or invalid file format.")
        raise HTTPException(status_code=400, detail="INVALID_PDF_FORMAT")
    except Exception as e:
        logger.error(f"Unexpected error opening PDF: {e}")
        raise HTTPException(status_code=500, detail="PDF_PROCESSING_ERROR")
        
    try:
        text: str = ""
        for page in doc:
            text += page.get_text()
        return text
    finally:
        doc.close()


def find_exact_quote_coordinates(pdf_bytes: bytes, exact_quote: str) -> Dict[str, Any]:
    """
    Deterministically locate the bounding box coordinates (quads) for a text quote.

    Uses PyMuPDF's search engine to find the exact substring on each page.
    Falls back to a prefix search (first 30 characters) if line-breaks cause
    an exact match miss. Returns empty geometry instead of crashing if the
    quote cannot be located.

    Args:
        pdf_bytes: Raw PDF file bytes.
        exact_quote: The exact text string to locate in the document.

    Returns:
        Dictionary containing 'page_number' (1-indexed) and 'quads' list.
        Each quad contains 'ul', 'ur', 'll', 'lr' corner coordinates.
    """
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    except fitz.FileDataError:
        logger.error("Failed to parse PDF during geometry mapping.")
        raise HTTPException(status_code=400, detail="INVALID_PDF_FORMAT")
    except Exception as e:
        logger.error(f"Unexpected error opening PDF for geometry mapping: {e}")
        raise HTTPException(status_code=500, detail="PDF_PROCESSING_ERROR")

    try:
        for page_num in range(len(doc)):
            page = doc[page_num]

            # 1. Search for the exact string
            quads: List[fitz.Quad] = page.search_for(exact_quote, quads=True)

            # 2. Fallback: Search for the first 30 chars if line-break caused a miss
            if not quads and len(exact_quote) > 30:
                fallback_quote: str = exact_quote[:30]
                quads = page.search_for(fallback_quote, quads=True)

            if quads:
                formatted_quads: List[Dict[str, List[float]]] = []
                for q in quads:
                    formatted_quads.append({
                        "ul": [q.ul.x, q.ul.y],
                        "ur": [q.ur.x, q.ur.y],
                        "ll": [q.ll.x, q.ll.y],
                        "lr": [q.lr.x, q.lr.y]
                    })

                logger.info("Geometry match found on page %d for quote: '%.30s...'", page_num + 1, exact_quote)
                return {
                    "page_number": page_num + 1,
                    "quads": formatted_quads
                }
    finally:
        doc.close()

    # 3. Final Fallback: Return empty geometry instead of crashing the analysis API
    logger.warning("No geometry match found for quote: '%.50s...'", exact_quote)
    return {
        "page_number": 1,
        "quads": []
    }
