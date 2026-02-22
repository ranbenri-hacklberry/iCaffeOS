"""
╔══════════════════════════════════════════════════════════════════════╗
║  Cortex Gateway — Document Upload Route                              ║
║                                                                      ║
║  POST /api/documents/upload                                          ║
║                                                                      ║
║  Zero-Trust pipeline:                                                ║
║    1. Authenticate tenant (X-Cortex-Tenant-ID header)               ║
║    2. Read uploaded file bytes asynchronously (never touches disk)   ║
║    3. DocumentParser.extract_text()   — local CPU, no cloud I/O     ║
║    4. PiiSanitizer.sanitize()         — mask PII before storage     ║
║    5. Supabase upsert                 — tenant-scoped persistence    ║
║    6. Return metadata + sanitized preview to the UI                  ║
║                                                                      ║
║  Required Supabase migration                                         ║
║  ─────────────────────────────────────────────────────────────────   ║
║  Run once in the Supabase SQL Editor:                                ║
║                                                                      ║
║    CREATE TABLE IF NOT EXISTS document_extractions (                 ║
║      id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,   ║
║      tenant_id        UUID NOT NULL REFERENCES business_config(id), ║
║      record_id        UUID NOT NULL,                                 ║
║      filename         TEXT NOT NULL,                                 ║
║      mime_type        TEXT NOT NULL,                                 ║
║      extraction_method TEXT NOT NULL,                                ║
║      page_count       INT  NOT NULL DEFAULT 1,                       ║
║      char_count       INT  NOT NULL DEFAULT 0,                       ║
║      sanitized_text   TEXT NOT NULL,                                 ║
║      pii_detected     BOOLEAN NOT NULL DEFAULT false,                ║
║      masked_entities  JSONB DEFAULT '[]',                            ║
║      created_at       TIMESTAMPTZ DEFAULT NOW()                      ║
║    );                                                                ║
║                                                                      ║
║    ALTER TABLE document_extractions ENABLE ROW LEVEL SECURITY;      ║
║                                                                      ║
║    -- Service-role key bypasses RLS, so this policy guards the       ║
║    -- PostgREST anon/authenticated roles only:                        ║
║    CREATE POLICY tenant_isolation ON document_extractions            ║
║      USING (tenant_id = auth.uid());                                 ║
╚══════════════════════════════════════════════════════════════════════╝
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from core.document_parser import DocumentParser, SUPPORTED_MIME_TYPES
from core.sanitizer import PiiSanitizer
from core.tenant_guard import TenantRecord

log = logging.getLogger(__name__)


# ══════════════════════════════════════════════════════════════════════
#  Module-level singletons + init hook
# ══════════════════════════════════════════════════════════════════════

#: One parser instance is enough — it is stateless across requests.
_parser = DocumentParser()

#: Populated by init_document_router() before app.include_router().
_require_tenant = None
_sanitizer: Optional[PiiSanitizer] = None
_supabase = None


def init_document_router(*, require_tenant, sanitizer: PiiSanitizer, supabase) -> None:
    """
    Wire the router to the shared singletons created in main.py.

    Call this BEFORE ``app.include_router(document_router)`` so the
    module-level references are populated by the time FastAPI resolves
    route dependencies.

    Parameters
    ----------
    require_tenant:
        The async dependency function returned by ``make_tenant_guard()``.
    sanitizer:
        The shared ``PiiSanitizer`` singleton.
    supabase:
        The shared Supabase ``Client`` singleton (service-role key).
    """
    global _require_tenant, _sanitizer, _supabase
    _require_tenant = require_tenant
    _sanitizer      = sanitizer
    _supabase       = supabase


# ══════════════════════════════════════════════════════════════════════
#  Shared dependency bridge
# ══════════════════════════════════════════════════════════════════════

# FastAPI reads the type-annotated parameters at *import* time to build
# the OpenAPI schema, but the *body* of _tenant_dep() is evaluated at
# *request* time — by which point _require_tenant is already populated.
# This thin proxy lets us use the module-level singleton as a Depends
# without a circular import.

from fastapi import Header  # noqa: E402 — after module globals

async def _tenant_dep(
    x_cortex_tenant_id: Optional[str] = Header(
        default=None,
        alias="X-Cortex-Tenant-ID",
        description="Tenant UUID — same header used by all protected routes",
    ),
) -> TenantRecord:
    """
    Proxy Depends — extracts the header value (FastAPI handles that),
    then delegates to the real tenant guard that closes over Supabase.
    """
    if _require_tenant is None:
        raise RuntimeError(
            "Document router was not initialised — "
            "call init_document_router() before including the router."
        )
    return await _require_tenant(x_cortex_tenant_id=x_cortex_tenant_id)


# ══════════════════════════════════════════════════════════════════════
#  Router
# ══════════════════════════════════════════════════════════════════════

from fastapi import Depends  # noqa: E402

document_router = APIRouter(prefix="/api/documents", tags=["Documents"])


# ── Constants ────────────────────────────────────────────────────────

#: Hard size ceiling.  Files larger than this are rejected before any
#: parsing occurs, protecting the CPU on the N150 Mini-PC.
MAX_FILE_BYTES = 20 * 1024 * 1024   # 20 MB

#: Character limit for the sanitized_text preview returned to the UI.
#: Full text is always stored in Supabase; this keeps the JSON response lean.
PREVIEW_CHARS = 800


# ══════════════════════════════════════════════════════════════════════
#  Route
# ══════════════════════════════════════════════════════════════════════

@document_router.post(
    "/upload",
    summary="Upload & extract a document into the active record's context",
    response_description=(
        "Extraction metadata and a sanitized text preview.  "
        "Full text is persisted to Supabase document_extractions."
    ),
    status_code=status.HTTP_200_OK,
)
async def upload_document(
    # ── Multipart fields ─────────────────────────────────────────────
    file:      UploadFile = File(
        ...,
        description="PDF, JPEG, or PNG document (max 20 MB)",
    ),
    record_id: str = Form(
        ...,
        description="UUID of the active record this document belongs to",
    ),
    # ── Injected by FastAPI ──────────────────────────────────────────
    tenant: TenantRecord = Depends(_tenant_dep),
):
    """
    Document ingestion endpoint.

    **Zero-Trust guarantee**: the raw file bytes never leave the server.
    Only the PII-masked extracted text is written to Supabase.

    **Hybrid extraction**:
    - PDFs with a native text layer are parsed in milliseconds (PyMuPDF).
    - Scanned PDFs / image pages fall through to Tesseract OCR, which
      runs inside ``asyncio.to_thread()`` so the event loop stays free.
    - JPEG / PNG images are always OCR'd directly.

    **Returns** a JSON object:
    ```json
    {
      "document_id":        "<uuid>",
      "filename":           "invoice.pdf",
      "mime_type":          "application/pdf",
      "extraction_method":  "native_pdf",
      "page_count":         3,
      "char_count":         4821,
      "pii_detected":       true,
      "masked_entities":    ["[EMAIL_1]", "[ISRAELI_PHONE_1]"],
      "sanitized_preview":  "Acme Corp …",
      "record_id":          "<uuid>",
      "tenant_id":          "<uuid>",
      "stored_at":          "2026-02-21T12:00:00Z"
    }
    ```
    """
    filename  = file.filename or "<unknown>"
    mime_type = (file.content_type or "application/octet-stream").lower()

    # ── 1. Guard: content-type ────────────────────────────────────────
    normalised_mime = mime_type.split(";")[0].strip()
    if normalised_mime not in SUPPORTED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                f"Unsupported file type: '{normalised_mime}'. "
                f"Accepted: {', '.join(sorted(SUPPORTED_MIME_TYPES))}"
            ),
        )

    # ── 2. Read file bytes asynchronously ────────────────────────────
    # UploadFile wraps a SpooledTemporaryFile; reading it is I/O bound.
    # We read in one shot — max size enforced immediately after.
    try:
        raw_bytes = await file.read()
    except Exception as exc:
        log.error("Failed to read upload '%s': %s", filename, exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not read file: {exc}",
        ) from exc
    finally:
        await file.close()

    # ── 3. Guard: file size ───────────────────────────────────────────
    file_size = len(raw_bytes)
    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes)",
        )
    if file_size > MAX_FILE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=(
                f"File size {file_size / 1_048_576:.1f} MB exceeds the "
                f"20 MB limit.  Extract a smaller subset or split the file."
            ),
        )

    log.info(
        "Document upload: tenant=%s  record=%s  file='%s'  size=%d B  type=%s",
        tenant.id, record_id, filename, file_size, normalised_mime,
    )

    # ── 4. Extract text (CPU-heavy — runs in asyncio.to_thread) ──────
    try:
        result = await _parser.extract_text(
            raw_bytes,
            normalised_mime,
            filename=filename,
        )
    except ValueError as exc:
        # Unsupported MIME — shouldn't reach here after guard, but defensive
        raise HTTPException(status_code=415, detail=str(exc)) from exc
    except RuntimeError as exc:
        # Corrupt / encrypted / unreadable file
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Text extraction failed: {exc}",
        ) from exc

    if not result.text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "No text could be extracted from the document.  "
                "The file may be an image-only scan without recognisable text, "
                "or the content may be in a script that Tesseract cannot decode."
            ),
        )

    # ── 5. PII sanitization ───────────────────────────────────────────
    # sanitize() is synchronous but fast (regex only), no need for thread.
    if _sanitizer is None:
        raise RuntimeError("Document router not initialised")

    sanitized_text, session_map = _sanitizer.sanitize(result.text)
    pii_detected    = bool(session_map)
    masked_entities = list(session_map.keys())

    log.info(
        "Document parsed: method=%s  pages=%d  chars=%d  pii=%s",
        result.method, result.page_count, result.char_count, pii_detected,
    )

    # ── 6. Persist to Supabase document_extractions ───────────────────
    #
    # The service-role key bypasses RLS, so we enforce tenant isolation
    # ourselves by always writing tenant_id from the validated header.
    #
    # The full sanitized_text is stored.  If the document_extractions
    # table does not exist yet, persistence is skipped gracefully and
    # the extracted text is still returned to the UI.
    document_id  = str(uuid.uuid4())
    stored_at    = datetime.now(timezone.utc).isoformat()
    store_failed = False

    try:
        if _supabase is not None:
            _supabase.table("document_extractions").insert({
                "id":                 document_id,
                "tenant_id":          tenant.id,
                "record_id":          record_id,
                "filename":           filename,
                "mime_type":          normalised_mime,
                "extraction_method":  result.method,
                "page_count":         result.page_count,
                "char_count":         result.char_count,
                "sanitized_text":     sanitized_text,
                "pii_detected":       pii_detected,
                "masked_entities":    masked_entities,
                "created_at":         stored_at,
            }).execute()
    except Exception as db_exc:
        # Non-fatal: the table may not be migrated yet.
        # Return the extracted text to the UI so work is not lost.
        log.warning(
            "document_extractions insert failed (table may not exist yet): %s",
            db_exc,
        )
        store_failed = True
    finally:
        # Always wipe session tokens from RAM — Zero-Trust hygiene
        _sanitizer.clear_session(session_map)

    # ── 7. Return metadata + preview ─────────────────────────────────
    return {
        "document_id":       document_id,
        "filename":          filename,
        "mime_type":         normalised_mime,
        "extraction_method": result.method,
        "page_count":        result.page_count,
        "char_count":        result.char_count,
        "pii_detected":      pii_detected,
        "masked_entities":   masked_entities,
        # Preview only — full text is in Supabase (or returned for UI fallback)
        "sanitized_preview": sanitized_text[:PREVIEW_CHARS],
        # Include full text when persistence failed, so the UI can still use it
        "sanitized_text":    sanitized_text if store_failed else None,
        "record_id":         record_id,
        "tenant_id":         tenant.id,
        "stored_at":         stored_at,
        "storage_ok":        not store_failed,
    }


# ── GET /api/documents/list ───────────────────────────────────────────

@document_router.get(
    "/list",
    summary="List documents uploaded for a specific record",
)
async def list_documents(
    record_id: str,
    tenant: "TenantRecord" = Depends(_tenant_dep),
):
    """Return all documents previously uploaded for *record_id* within the
    current tenant.  Rows come from ``document_extractions`` ordered newest
    first.  The full sanitized_text is omitted to keep the response small —
    the AI reads it server-side via the context endpoint.
    """
    if _supabase is None:
        raise HTTPException(
            status_code=500,
            detail="call init_document_router() before including the router.",
        )

    try:
        response = (
            _supabase.table("document_extractions")
            .select(
                "id, filename, mime_type, extraction_method, "
                "page_count, char_count, pii_detected, created_at"
            )
            .eq("tenant_id", tenant.id)
            .eq("record_id", record_id)
            .order("created_at", desc=True)
            .execute()
        )
    except Exception as exc:
        log.error("document_extractions list failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return {"documents": response.data or []}


# ── DELETE /api/documents/{document_id} ──────────────────────────────

@document_router.delete(
    "/{document_id}",
    summary="Delete a previously uploaded document",
)
async def delete_document(
    document_id: str,
    tenant: "TenantRecord" = Depends(_tenant_dep),
):
    """Remove a single document extraction row for the current tenant."""
    if _supabase is None:
        raise HTTPException(status_code=500, detail="Router not initialised.")

    try:
        _supabase.table("document_extractions") \
            .delete() \
            .eq("id", document_id) \
            .eq("tenant_id", tenant.id) \
            .execute()
    except Exception as exc:
        log.error("document_extractions delete failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return {"deleted": document_id}
