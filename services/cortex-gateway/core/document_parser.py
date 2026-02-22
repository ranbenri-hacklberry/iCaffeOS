"""
╔══════════════════════════════════════════════════════════════════════╗
║  Cortex Gateway — Document Parser                                    ║
║                                                                      ║
║  Hybrid text extraction engine.                                      ║
║                                                                      ║
║  Zero-Trust contract:                                                ║
║    Raw file bytes NEVER leave this machine.                          ║
║    Only the extracted (and PII-masked) text is forwarded to Gemini.  ║
║                                                                      ║
║  Decision tree:                                                      ║
║                                                                      ║
║   ┌──────────┐                                                       ║
║   │ PDF file │                                                       ║
║   └────┬─────┘                                                       ║
║        │  PyMuPDF (fitz) — native text layer                        ║
║        ▼                                                             ║
║   per-page text ≥ 80 chars? ──YES──► use native text (fast)         ║
║        │                                                             ║
║        NO                                                            ║
║        │                                                             ║
║        ▼  pdf2image (poppler) → PIL → pytesseract OCR               ║
║   OCR that page → merge all pages → return full text (slow)         ║
║                                                                      ║
║   ┌─────────────────────┐                                            ║
║   │ Image (JPEG/PNG/…)  │ → PIL (grayscale) → pytesseract → text    ║
║   └─────────────────────┘                                            ║
║                                                                      ║
║  CPU tuning for M1 Mac and Intel N150 Mini-PC:                       ║
║    • Tesseract --oem 1  (LSTM engine only — faster than default)     ║
║    • Tesseract --psm 3  (auto page segmentation, no OSD)             ║
║    • grayscale=True     (halves image data, ~30 % faster OCR)        ║
║    • dpi=200            (enough for OCR quality, keeps images small) ║
║    • thread_count=1     (deterministic, avoids process-pool bloat)   ║
║    • asyncio.to_thread  (event loop never blocked by CPU work)       ║
╚══════════════════════════════════════════════════════════════════════╝
"""

import asyncio
import io
import logging
from dataclasses import dataclass
from typing import Literal

import fitz                          # PyMuPDF — C extension, very fast
import pytesseract
from PIL import Image
from pdf2image import convert_from_bytes

log = logging.getLogger(__name__)


# ══════════════════════════════════════════════════════════════════════
#  Constants / tuning knobs
# ══════════════════════════════════════════════════════════════════════

#: MIME types the parser accepts.
SUPPORTED_MIME_TYPES: frozenset[str] = frozenset({
    "application/pdf",
    "image/jpeg",
    "image/jpg",         # non-standard alias used by many clients
    "image/png",
    "image/tiff",
    "image/webp",
})

#: Pages whose native PyMuPDF text is shorter than this (stripped) are
#: treated as "image-only" and sent to the OCR slow-path.
#: 80 chars ≈ one line of dense text.  Tune up if you see false OCR triggers.
_OCR_FALLBACK_THRESHOLD: int = 80

#: Tesseract engine config shared by both PDF-OCR and direct image paths.
#:  --oem 1   LSTM neural-net only (skip legacy Tesseract engine — faster)
#:  --psm 3   Fully automatic page segmentation (no OSD — cheaper)
_TESSERACT_CONFIG: str = "--psm 3 --oem 1"

#: DPI for rendering PDF pages to bitmap before OCR.
#: 200 dpi gives good accuracy for typical document fonts while keeping
#: memory usage manageable (~5 MB per A4 page in grayscale at 200 dpi).
_PDF_RENDER_DPI: int = 200


# ══════════════════════════════════════════════════════════════════════
#  Result type
# ══════════════════════════════════════════════════════════════════════

ExtractionMethod = Literal["native_pdf", "ocr_pdf", "ocr_image"]


@dataclass(frozen=True)
class ExtractionResult:
    """
    Immutable output from DocumentParser.extract_text().

    Attributes
    ----------
    text:
        Plain UTF-8 text extracted from the document.
        Ready to be passed into PiiSanitizer.sanitize().
    method:
        Which extraction path was used:
          • ``native_pdf`` — PyMuPDF text layer only (fastest, ~ms)
          • ``ocr_pdf``    — At least one page needed Tesseract OCR
          • ``ocr_image``  — Direct image OCR (JPEG/PNG/etc.)
    page_count:
        Number of pages in the source document.  Always 1 for images.
    char_count:
        Length of ``text`` in Unicode characters.
    """
    text:       str
    method:     ExtractionMethod
    page_count: int
    char_count: int


# ══════════════════════════════════════════════════════════════════════
#  DocumentParser
# ══════════════════════════════════════════════════════════════════════

class DocumentParser:
    """
    Hybrid text extractor.  A single instance is safe to share across
    concurrent requests (all per-request state lives on the stack).

    Usage (async)
    -------------
    ::

        parser = DocumentParser()
        result = await parser.extract_text(file_bytes, "application/pdf",
                                           filename="invoice.pdf")
        print(result.text)           # plain text → pass to PiiSanitizer
        print(result.method)         # "native_pdf" | "ocr_pdf" | "ocr_image"
        print(result.char_count)     # useful for progress / logging

    Raises
    ------
    ValueError
        If the MIME type is not in SUPPORTED_MIME_TYPES.
    RuntimeError
        If PyMuPDF cannot open the file (corrupt, encrypted, zero-byte).
    """

    # ── Public API ────────────────────────────────────────────────────

    async def extract_text(
        self,
        file_bytes: bytes,
        mime_type: str,
        *,
        filename: str = "<unknown>",
    ) -> ExtractionResult:
        """
        Entry point.  Normalise the MIME type, validate, then dispatch.

        All CPU-heavy operations run inside ``asyncio.to_thread()`` so
        FastAPI's event loop is never blocked — critical for SSE streams
        that must continue ticking while OCR is in progress.
        """
        # Normalise: strip charset suffix ("image/jpeg; charset=binary")
        mime_type = mime_type.lower().split(";")[0].strip()

        if mime_type not in SUPPORTED_MIME_TYPES:
            raise ValueError(
                f"Unsupported file type: '{mime_type}'. "
                f"Accepted MIME types: {', '.join(sorted(SUPPORTED_MIME_TYPES))}"
            )

        if not file_bytes:
            raise ValueError(f"File '{filename}' is empty (0 bytes)")

        if mime_type == "application/pdf":
            return await self._extract_pdf(file_bytes, filename)
        else:
            return await self._extract_image(file_bytes, filename)

    # ── PDF path ─────────────────────────────────────────────────────

    async def _extract_pdf(self, data: bytes, filename: str) -> ExtractionResult:
        """
        Offload synchronous PDF work to a thread pool worker.
        FastAPI's default thread pool has min(32, cpu_count+4) workers,
        which is more than sufficient for concurrent uploads.
        """
        return await asyncio.to_thread(self._sync_extract_pdf, data, filename)

    def _sync_extract_pdf(self, data: bytes, filename: str) -> ExtractionResult:
        """
        Synchronous inner — called from a worker thread.

        Algorithm
        ---------
        1. Open document with PyMuPDF (C-level, no interpreter overhead).
        2. For each page, extract the native text layer.
        3. Pages with text ≥ threshold → keep native text (fast path).
        4. Pages with text  < threshold → mark for OCR (slow path).
        5. If any pages need OCR:
              a. Convert ONLY those pages to PIL images via pdf2image.
              b. Run pytesseract on each image.
        6. Merge native + OCR text in original page order.
        7. Return ExtractionResult.
        """

        # ── Open document ────────────────────────────────────────────
        try:
            doc = fitz.open(stream=data, filetype="pdf")
        except Exception as exc:
            raise RuntimeError(
                f"Cannot open PDF '{filename}': {exc}"
            ) from exc

        page_count = len(doc)
        if page_count == 0:
            doc.close()
            raise RuntimeError(f"PDF '{filename}' contains no pages")

        # ── Fast-path: native text layer (per-page) ──────────────────
        native_texts: list[str] = []          # indexed by page (0-based)
        ocr_needed:   list[int] = []          # 0-based page indices

        for i, page in enumerate(doc):
            # "text" mode: plain UTF-8, preserves reading order
            raw = page.get_text("text")
            stripped = raw.strip()

            if len(stripped) >= _OCR_FALLBACK_THRESHOLD:
                native_texts.append(stripped)
            else:
                # Image-only or blank page — remember the index
                native_texts.append("")
                ocr_needed.append(i)

        doc.close()

        # ── No OCR needed — return immediately ──────────────────────
        if not ocr_needed:
            full_text = "\n\n".join(p for p in native_texts if p)
            log.debug(
                "PDF '%s': %d pages, all native  (chars=%d)",
                filename, page_count, len(full_text),
            )
            return ExtractionResult(
                text=full_text,
                method="native_pdf",
                page_count=page_count,
                char_count=len(full_text),
            )

        # ── Slow-path: OCR for image-only pages ─────────────────────
        log.info(
            "PDF '%s': %d/%d pages below text threshold → OCR",
            filename, len(ocr_needed), page_count,
        )

        # pdf2image uses poppler (pdftoppm) internally.
        # We render ONLY the pages that need OCR to save CPU/RAM.
        # pdf2image uses 1-based page numbers.
        first_1based = ocr_needed[0] + 1
        last_1based  = ocr_needed[-1] + 1

        pil_images = convert_from_bytes(
            data,
            dpi=_PDF_RENDER_DPI,
            first_page=first_1based,
            last_page=last_1based,
            grayscale=True,       # ~30 % faster OCR; reduces image RAM
            thread_count=1,       # deterministic + avoids fork bombs on N150
        )

        # Map rendered pages back to their absolute page indices.
        # Note: convert_from_bytes returns exactly (last - first + 1) images,
        # which includes pages that might NOT need OCR if they fall in the range.
        ocr_texts: dict[int, str] = {}
        needed_set = set(ocr_needed)
        for rel_idx, img in enumerate(pil_images):
            abs_page = (first_1based - 1) + rel_idx
            if abs_page in needed_set:
                ocr_texts[abs_page] = pytesseract.image_to_string(
                    img,
                    config=_TESSERACT_CONFIG,
                ).strip()

        # ── Merge: original page order, native wins where available ─
        merged: list[str] = []
        for i in range(page_count):
            if i in ocr_texts:
                merged.append(ocr_texts[i])
            else:
                merged.append(native_texts[i])

        full_text = "\n\n".join(p for p in merged if p)
        log.debug(
            "PDF '%s': %d pages, %d OCR'd  (chars=%d)",
            filename, page_count, len(ocr_needed), len(full_text),
        )
        return ExtractionResult(
            text=full_text,
            method="ocr_pdf",
            page_count=page_count,
            char_count=len(full_text),
        )

    # ── Image path ───────────────────────────────────────────────────

    async def _extract_image(self, data: bytes, filename: str) -> ExtractionResult:
        """
        Offload image OCR to a thread.  Images are always OCR'd directly —
        there is no native text layer to attempt first.
        """
        return await asyncio.to_thread(self._sync_extract_image, data, filename)

    def _sync_extract_image(self, data: bytes, filename: str) -> ExtractionResult:
        """
        Synchronous inner — called from a worker thread.

        Convert to grayscale before OCR: Tesseract performs roughly
        equally well on grayscale vs. colour, but grayscale halves the
        data throughput through the image processing pipeline.
        """
        try:
            img = Image.open(io.BytesIO(data))
            img = img.convert("L")   # grayscale ("Luma") — faster OCR
        except Exception as exc:
            raise RuntimeError(
                f"Cannot decode image '{filename}': {exc}"
            ) from exc

        text = pytesseract.image_to_string(
            img,
            config=_TESSERACT_CONFIG,
        ).strip()

        log.debug("Image '%s': OCR  (chars=%d)", filename, len(text))
        return ExtractionResult(
            text=text,
            method="ocr_image",
            page_count=1,
            char_count=len(text),
        )
