"""Extract text from uploaded document files for classification."""

from pathlib import Path

from pypdf import PdfReader


def extract_text_from_file(file_path: str | Path, content_type: str = "") -> str:
    """
    Extract plain text from a stored document file.
    Supports PDF and plain text. Returns empty string if format is unsupported or extraction fails.
    """
    path = Path(file_path)
    if not path.is_file():
        return ""

    try:
        suffix = path.suffix.lower()
        if suffix == ".pdf" or (content_type and "pdf" in content_type):
            reader = PdfReader(path)
            parts = []
            for page in reader.pages:
                try:
                    text = page.extract_text()
                    if text:
                        parts.append(text)
                except Exception:
                    continue
            return "\n".join(parts) if parts else ""
        if suffix in (".txt", ".text", ".md", ".markdown", ".csv", ".log"):
            return path.read_text(encoding="utf-8", errors="replace")
        # Fallback: try reading as text (e.g. .docx would need python-docx)
        if "text/" in (content_type or "") or "json" in (content_type or ""):
            return path.read_text(encoding="utf-8", errors="replace")
        return ""
    except Exception:
        return ""
