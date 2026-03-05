"""Extract text from uploaded document files using LangChain document loaders."""

from pathlib import Path

from langchain_community.document_loaders import CSVLoader, PyPDFLoader, TextLoader


def extract_text_from_file(file_path: str | Path, content_type: str = "") -> str:
    """
    Extract plain text from a stored document file using LangChain loaders.
    Supports PDF, text, CSV. Returns empty string if format is unsupported or extraction fails.
    """
    path = Path(file_path)
    if not path.is_file():
        return ""

    path_str = str(path.resolve())
    suffix = path.suffix.lower()

    try:
        if suffix == ".pdf" or (content_type and "pdf" in content_type):
            loader = PyPDFLoader(path_str)
            docs = loader.load()
            return "\n".join(d.page_content for d in docs if d.page_content.strip()).strip()

        if suffix == ".csv":
            loader = CSVLoader(file_path=path_str, encoding="utf-8")
            docs = loader.load()
            return "\n".join(d.page_content for d in docs if d.page_content.strip()).strip()

        if suffix in (".txt", ".text", ".md", ".markdown", ".log") or (
            content_type and ("text/" in content_type or "json" in content_type)
        ):
            loader = TextLoader(path_str, encoding="utf-8", autodetect_encoding=True)
            docs = loader.load()
            return "\n".join(d.page_content for d in docs if d.page_content.strip()).strip()

        return ""
    except Exception:
        return ""
