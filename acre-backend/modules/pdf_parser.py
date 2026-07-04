import fitz  # pymupdf
import os

class PDFParser:
    def extract_text(self, pdf_path: str) -> str:
        doc = fitz.open(pdf_path)
        full_text = ""
        for page in doc:
            full_text += page.get_text()
        doc.close()
        return full_text

    def extract_from_bytes(self, pdf_bytes: bytes) -> str:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        full_text = ""
        for page in doc:
            full_text += page.get_text()
        doc.close()
        return full_text