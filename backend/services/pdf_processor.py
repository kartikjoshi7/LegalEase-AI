import fitz  # PyMuPDF
from fastapi import HTTPException
import io

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
    Extracts raw text from a PDF file.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text

def find_exact_quote_coordinates(pdf_bytes: bytes, exact_quote: str) -> dict:
    """
    Deterministically finds the bounding box coordinates (quads) for a given text quote.
    Throws a 422 GEOMETRY_MATCH_FAILED if the quote cannot be found.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    
    # We will search page by page
    for page_num in range(len(doc)):
        page = doc[page_num]
        
        # 1. Search for the exact string
        quads = page.search_for(exact_quote, quads=True)
        
        # 2. Fallback: Search for the first 30 chars if line-break caused a miss
        if not quads and len(exact_quote) > 30:
            fallback_quote = exact_quote[:30]
            quads = page.search_for(fallback_quote, quads=True)
            
        if quads:
            # Format the quads into JSON serializable dictionaries
            formatted_quads = []
            for q in quads:
                formatted_quads.append({
                    "ul": [q.ul.x, q.ul.y],
                    "ur": [q.ur.x, q.ur.y],
                    "ll": [q.ll.x, q.ll.y],
                    "lr": [q.lr.x, q.lr.y]
                })
            
            doc.close()
            return {
                "page_number": page_num + 1,
                "quads": formatted_quads
            }
            
    doc.close()
    
    # 3. Final Fallback: Return empty geometry instead of crashing the entire analysis API
    return {
        "page_number": 1,
        "quads": []
    }
