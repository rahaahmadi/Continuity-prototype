"""Extract text from uploaded document files using DoclingLoader and LangChain loaders."""

from pathlib import Path

from langchain_community.document_loaders import CSVLoader, TextLoader
from langchain_docling.loader import DoclingLoader, ExportType


def _extract_with_docling(path_str: str) -> str | None:
    """Use DoclingLoader to convert document to text (markdown). Returns None on failure."""
    try:
        loader = DoclingLoader(
            file_path=path_str,
            export_type=ExportType.MARKDOWN,
        )
        docs = loader.load()
        if not docs:
            return None
        text = "\n".join(d.page_content for d in docs if d.page_content.strip())
        return text.strip() if text.strip() else None
    except Exception as e:
        print(f"Error extracting text with DoclingLoader: {e}")
        return None


def extract_text_from_file(file_path: str | Path, content_type: str = "") -> str:
    """
    Extract plain text from a stored document file.
    Uses DoclingLoader for PDF, DOCX, PPTX, HTML, etc.; falls back to LangChain for CSV and plain text.
    Returns empty string if format is unsupported or extraction fails.
    """
    path = Path(file_path)
    if not path.is_file():
        return ""

    path_str = str(path.resolve())
    suffix = path.suffix.lower()

    # Try DoclingLoader first (PDF, DOCX, PPTX, HTML, and other formats)
    text = _extract_with_docling(path_str)
    if text is not None:
        return text

    # Fallback: LangChain loaders for plain text and CSV
    try:
        if suffix == ".csv":
            loader = CSVLoader(file_path=path_str, encoding="utf-8")
            docs = loader.load()
            return "\n".join(d.page_content for d in docs if d.page_content.strip()).strip()

        if suffix in (".txt", ".text", ".log") or (
            content_type and "text/" in (content_type or "")
        ):
            loader = TextLoader(path_str, encoding="utf-8", autodetect_encoding=True)
            docs = loader.load()
            return "\n".join(d.page_content for d in docs if d.page_content.strip()).strip()
    except Exception:
        pass

    return ""
