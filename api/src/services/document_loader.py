"""Extract text from uploaded document files using Docling and LangChain loaders."""

from pathlib import Path

from langchain_community.document_loaders import CSVLoader, TextLoader

# Formats handled by lightweight loaders — Docling adds no value here.
_CSV_SUFFIXES = frozenset({".csv", ".tsv"})
_TEXT_SUFFIXES = frozenset({".txt", ".text", ".log", ".md", ".rst"})

# Image formats always require OCR.
_IMAGE_SUFFIXES = frozenset({
    ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".tif", ".webp",
})

# Text-native document formats: embedded text is available without OCR.
# XLSX/XLS are included — Docling parses their cell structure directly.
_NATIVE_SUFFIXES = frozenset({
    ".docx", ".pptx", ".html", ".htm", ".epub", ".odt", ".xlsx", ".xls",
})

# PDFs extracted below this character count after a text-native pass are
# treated as scanned/image-only and re-processed with OCR.
_SCANNED_PDF_THRESHOLD = 150


def _make_converter(*, enable_ocr: bool):
    """
    Build a Docling DocumentConverter with the PDF pipeline configured for the
    requested OCR mode. Other format pipelines (DOCX, PPTX, images, etc.) use
    Docling's defaults, which are appropriate for each format.
    """
    from docling.datamodel.base_models import InputFormat  # noqa: PLC0415
    from docling.datamodel.pipeline_options import PdfPipelineOptions  # noqa: PLC0415
    from docling.document_converter import DocumentConverter, PdfFormatOption  # noqa: PLC0415

    pdf_opts = PdfPipelineOptions()
    pdf_opts.do_ocr = enable_ocr
    pdf_opts.do_table_structure = True  # preserve tables (critical for financial documents)

    return DocumentConverter(
        format_options={InputFormat.PDF: PdfFormatOption(pipeline_options=pdf_opts)}
    )


def _run_docling(path_str: str, *, enable_ocr: bool = False) -> str | None:
    """
    Convert a file with Docling and return its markdown representation.
    Returns None if conversion fails or produces no text.
    """
    try:
        converter = _make_converter(enable_ocr=enable_ocr)
        result = converter.convert(path_str)
        text = result.document.export_to_markdown()
        return text.strip() or None
    except Exception as exc:
        print(f"[document_loader] Docling error (ocr={enable_ocr}): {exc}")
        return None


def extract_text_from_file(file_path: str | Path, content_type: str = "") -> str:
    """
    Extract plain text from a stored document file.

    Routing strategy (in priority order):
      CSV / TSV        → CSVLoader  (Docling does not parse tabular row data)
      TXT / MD / plain → TextLoader (no heavy ML pipeline needed)
      Images           → Docling with OCR always enabled
      PDF              → Docling without OCR; auto-retried with OCR when text
                         is sparse, indicating a scanned / image-only PDF
      DOCX / PPTX /
      HTML / EPUB /
      XLSX / XLS       → Docling without OCR (formats embed text natively)
      Unknown          → Docling without OCR, OCR retry as final fallback

    Returns an empty string when the format is unsupported or extraction fails.
    """
    path = Path(file_path)
    if not path.is_file():
        return ""

    path_str = str(path.resolve())
    suffix = path.suffix.lower()

    # ── CSV / TSV ────────────────────────────────────────────────────────────
    if suffix in _CSV_SUFFIXES:
        try:
            docs = CSVLoader(file_path=path_str, encoding="utf-8").load()
            return "\n".join(d.page_content for d in docs if d.page_content.strip()).strip()
        except Exception:
            return ""

    # ── Plain text ───────────────────────────────────────────────────────────
    if suffix in _TEXT_SUFFIXES or (content_type and "text/plain" in content_type):
        try:
            docs = TextLoader(path_str, encoding="utf-8", autodetect_encoding=True).load()
            return "\n".join(d.page_content for d in docs if d.page_content.strip()).strip()
        except Exception:
            return ""

    # ── Images (always OCR) ──────────────────────────────────────────────────
    if suffix in _IMAGE_SUFFIXES:
        return _run_docling(path_str, enable_ocr=True) or ""

    # ── PDFs (smart OCR fallback) ────────────────────────────────────────────
    if suffix == ".pdf":
        text = _run_docling(path_str, enable_ocr=False)
        if not text or len(text) < _SCANNED_PDF_THRESHOLD:
            text = _run_docling(path_str, enable_ocr=True)
        return text or ""

    # ── Text-native document formats ─────────────────────────────────────────
    if suffix in _NATIVE_SUFFIXES:
        return _run_docling(path_str, enable_ocr=False) or ""

    # ── Unknown formats ──────────────────────────────────────────────────────
    text = _run_docling(path_str, enable_ocr=False)
    if not text:
        text = _run_docling(path_str, enable_ocr=True)
    return text or ""
