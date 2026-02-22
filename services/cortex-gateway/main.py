"""
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║   ██████╗ ██████╗ ██████╗ ████████╗███████╗██╗  ██╗                     ║
║  ██╔════╝██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝╚██╗██╔╝                     ║
║  ██║     ██║   ██║██████╔╝   ██║   █████╗   ╚███╔╝                      ║
║  ██║     ██║   ██║██╔══██╗   ██║   ██╔══╝   ██╔██╗                      ║
║  ╚██████╗╚██████╔╝██║  ██║   ██║   ███████╗██╔╝ ██╗                     ║
║   ╚═════╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝                    ║
║                                                                          ║
║   G A T E W A Y   —   icaffeOS Cortex AI Service  (Phase 3)             ║
║                                                                          ║
║   Context-Aware, Privacy-First, Multi-Tenant AI Agent                    ║
║   ─────────────────────────────────────────────────────────────────────  ║
║   Request pipeline (chat):                                               ║
║     0. Authenticate  → validate X-Cortex-Tenant-ID header                ║
║     1. Sanitize      → mask PII with volatile tokens                     ║
║     2. Fetch         → pull Active Record (tenant-scoped)                ║
║     3. Build         → assemble layered system prompt                    ║
║     4. Stream        → Gemini 1.5 Pro SSE stream                         ║
║     5. Rehydrate     → restore real PII in the response chunks           ║
║     6. Audit         → write ONLY tokenized text to disk                 ║
║     7. Cleanup       → clear volatile token map from RAM                 ║
╚══════════════════════════════════════════════════════════════════════════╝
"""

import asyncio
import json
import uuid
import traceback
import re
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import google.generativeai as genai
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from supabase import create_client, Client
import os

from core.sanitizer import PiiSanitizer
from core.context_engine import ContextEngine
from core.prompt_builder import SystemPromptBuilder
from core.audit_logger import AuditLogger
from core.tenant_guard import TenantRecord, make_tenant_guard, invalidate_tenant_cache
from models.schemas import (
    ChatRequest,
    OnboardingRequest,
    OnboardingResponse,
    HealthResponse,
)
from api.routes.documents import document_router, init_document_router
from fastapi import Request
from fastapi.responses import JSONResponse

load_dotenv()

# ── App Lifecycle ──────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Configure Gemini on startup; log shutdown."""
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    print("✅  Gemini 1.5 Pro (3.1) configured")
    print("✅  Cortex Gateway is ready  (tenant isolation: ON)")
    yield
    print("🛑  Cortex Gateway shutting down")


app = FastAPI(
    title="Cortex Gateway",
    description="Context-Aware, Privacy-First AI Agent for icaffeOS",
    version="2.0.0",
    lifespan=lifespan,
)

# ── CORS (Hybrid Ingress Standard) ─────────────────────────────────────
_default_origins = [
    "https://cortex.hacklberryfinn.com", # Vercel Production
    "http://localhost:5173",             # Local POS Dev
    "http://localhost:3000",             # Local Music Dev
    "http://localhost:4028",             # Local PWA Dev
]
_env_origins = os.getenv("ALLOWED_ORIGINS", "").split(",")
ALLOWED_ORIGINS = [o.strip() for o in (_default_origins + _env_origins) if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global Hardened Exception Handler ──────────────────────────────────
PATH_SCRUB_PATTERN = re.compile(r"/(?:Users|home|root)/[a-zA-Z0-9._-]+/")

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """
    Catch-all for unhandled exceptions. Scrubs paths and metadata
    to prevent information leakage in production responses.
    """
    trace_id = str(uuid.uuid4())
    full_stack = traceback.format_exc()

    # Log full trace internally for DevOps
    print(f"🛑 [CRITICAL ERROR] Trace ID: {trace_id}\n{full_stack}")

    # Scrub response text
    error_msg = str(exc)
    scrubbed_msg = PATH_SCRUB_PATTERN.sub("/[SCRUBBED_PATH]/", error_msg)
    
    # Generic security response
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal Server Error",
            "trace_id": trace_id,
            "message": "An unexpected error occurred. Technical details have been scrubbed for security.",
            "hint": "Provide the trace_id to your administrator."
        }
    )

# ── Service Singletons ─────────────────────────────────────────────────
supabase: Client = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_ROLE_KEY"],
)

sanitizer      = PiiSanitizer()
context_engine = ContextEngine(supabase)
prompt_builder = SystemPromptBuilder(supabase)
audit_logger   = AuditLogger(log_dir=os.getenv("LOG_DIR", "logs"))

# ── Tenant Guard (wired to the Supabase singleton) ─────────────────────
#
# require_tenant is a FastAPI Dependency that:
#   1. Reads X-Cortex-Tenant-ID from the request header
#   2. Validates it is a well-formed UUID
#   3. Verifies the UUID exists in business_config (with in-process TTL cache)
#   4. Returns a TenantRecord — or raises 401
#
require_tenant = make_tenant_guard(supabase)

# ── Document upload router ─────────────────────────────────────────────
#
# Wire shared singletons into the router module BEFORE include_router()
# so that _require_tenant / _sanitizer / _supabase are populated when
# FastAPI first resolves route dependencies at startup.
#
init_document_router(
    require_tenant=require_tenant,
    sanitizer=sanitizer,
    supabase=supabase,
)
app.include_router(document_router)

gemini_model = genai.GenerativeModel(
    model_name=os.getenv("GEMINI_MODEL", "gemini-3.1-pro-preview"),
)

GEMINI_CONFIG = genai.types.GenerationConfig(
    temperature=0.25,
    max_output_tokens=8192,
    top_p=0.9,
)


# ══════════════════════════════════════════════════════════════════════
#  ROUTES
# ══════════════════════════════════════════════════════════════════════

# ── Health (public — no auth) ──────────────────────────────────────────

@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    return HealthResponse(status="ok", service="cortex-gateway", version="2.0.0")


# ── Onboarding (public — creates the tenant, so no tenant yet) ─────────

@app.post("/api/onboarding", response_model=OnboardingResponse, tags=["Onboarding"])
async def save_onboarding(req: OnboardingRequest):
    """
    Persist the one-time business onboarding configuration.
    This endpoint is intentionally PUBLIC — it creates the tenant row.
    The returned tenant_id must be stored by the client and sent in
    X-Cortex-Tenant-ID for all subsequent requests.
    """
    try:
        data = {
            "business_name":        req.business_name,
            "business_type":        req.business_type,
            "core_entities":        req.core_entities,
            "tone_of_voice":        req.tone_of_voice,
            "custom_instructions":  req.custom_instructions or "",
        }

        response = supabase.table("business_config").upsert(data).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="Upsert returned no data")

        tenant_id = response.data[0]["id"]

        # Bust the in-process cache so the guard re-fetches fresh config
        invalidate_tenant_cache(tenant_id)
        prompt_builder.invalidate_cache(tenant_id)
        audit_logger.log_onboarding(tenant_id, req.business_type, "SAVED")

        return OnboardingResponse(
            success=True,
            tenant_id=tenant_id,
            message="Business configuration saved successfully",
        )

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── Onboarding read — requires auth ────────────────────────────────────

@app.get("/api/onboarding/{tenant_id}", tags=["Onboarding"])
async def get_onboarding(
    tenant_id: str,
    tenant: TenantRecord = Depends(require_tenant),
):
    """
    Retrieve existing onboarding configuration.
    The authenticated tenant may only read their own config.
    """
    # Guard ensures the header tenant is valid; we then verify the path
    # param matches — no cross-tenant config reads.
    if tenant.id != tenant_id:
        raise HTTPException(status_code=403, detail="Access denied")

    prompt_builder.invalidate_cache(tenant_id)
    config = await prompt_builder.get_business_config(tenant_id)

    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")

    return config


# ── Context Picker — requires auth ─────────────────────────────────────

@app.get("/api/records/{business_type}", tags=["Context"])
async def list_records(
    business_type: str,
    limit: int = Query(default=50, le=200),
    tenant: TenantRecord = Depends(require_tenant),
):
    """
    Return a lightweight list of records scoped to the authenticated tenant.
    Records from other tenants are never included.
    """
    records = await context_engine.list_records(
        business_type,
        tenant_id=tenant.id,   # ← scope to this tenant
        limit=limit,
    )
    return {"business_type": business_type, "records": records}


@app.get("/api/context/{business_type}/{record_id}", tags=["Context"])
async def get_context_preview(
    business_type: str,
    record_id: str,
    tenant: TenantRecord = Depends(require_tenant),
):
    """
    Preview the context block that will be injected for a given record.
    Returns 404 if the record does not exist OR belongs to a different tenant.
    The caller cannot distinguish between the two cases (prevents enumeration).
    """
    context = await context_engine.fetch_context(
        business_type,
        record_id,
        tenant_id=tenant.id,   # ← scope to this tenant
    )
    if not context:
        raise HTTPException(status_code=404, detail="Record not found")
    return context


# ── Chat (SSE Stream) — requires auth ──────────────────────────────────

@app.post("/api/chat/stream", tags=["Chat"])
async def chat_stream(
    req: ChatRequest,
    tenant: TenantRecord = Depends(require_tenant),
):
    """
    Main chat endpoint — returns a Server-Sent Events stream.

    The tenant identity ALWAYS comes from the validated header (TenantRecord),
    never from the request body, to prevent body-injection attacks where a
    client might embed another tenant's ID in the JSON payload.

    Each SSE event carries a JSON payload with ``type``:
      • ``shield_active`` — PII was detected; carries masked_entities + sanitized_prompt
      • ``status``        — progress message (fetching / thinking)
      • ``chunk``         — incremental response text (rehydrated, real PII restored)
      • ``done``          — stream complete, includes session_id
      • ``error``         — something went wrong
    """

    # Use the header-authenticated tenant ID — ignore any tenant_id in the body
    authoritative_tenant_id = tenant.id
    session_id = req.session_id or str(uuid.uuid4())

    async def event_stream() -> AsyncGenerator[str, None]:
        session_map: dict = {}
        full_sanitized_response: str = ""

        def sse(payload: dict) -> str:
            return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"

        try:
            # ── 1. Sanitize user query ────────────────────────────────
            sanitized_query, session_map = sanitizer.sanitize(req.query)
            has_pii = bool(session_map)

            yield sse({
                "type":             "shield_active",
                "has_pii":          has_pii,
                "masked_entities":  list(session_map.keys()),
                "sanitized_prompt": sanitized_query,
            })

            # ── 2. Fetch Active Record context + Documents ────────────
            yield sse({"type": "status", "message": "🔍 Loading case context…"})

            record_context_str = "No specific record context provided."
            documents = []

            if req.record_id:
                # Fetch record fields
                context = await context_engine.fetch_context(
                    req.business_type,
                    req.record_id,
                    tenant_id=authoritative_tenant_id,
                )
                record_context_str = context_engine.format_context_for_prompt(context)

                # Fetch extracted document text
                documents = await context_engine.fetch_extracted_documents(
                    req.record_id,
                    tenant_id=authoritative_tenant_id,
                )

            # ── 3. Fetch Tenant Config (from cache or DB) ─────────────
            tenant_config = await prompt_builder.get_business_config(
                authoritative_tenant_id
            )

            # ── 4. Build System & User Prompts ────────────────────────
            system_instruction = prompt_builder.build_system_instruction(
                business_type=req.business_type,
                tenant_config=tenant_config,
                tone=req.tone or tenant.tone_of_voice or "professional",
            )
            
            user_context = prompt_builder.build_user_context(
                record_context=record_context_str,
                documents=documents,
            )

            full_user_prompt = (
                f"{user_context}\n\n"
                f"# USER QUERY\n{sanitized_query}"
            )

            yield sse({"type": "status", "message": "🧠 Thinking…"})

            # ── 5. Stream from Gemini 1.5 Pro (3.1) with System Instruction ──
            model_name: str = os.getenv("GEMINI_MODEL", "gemini-3.1-pro-preview")
            
            # Re-initialize model with the specific system instruction for THIS interaction
            dynamic_model = genai.GenerativeModel(
                model_name=model_name,
                system_instruction=system_instruction
            )

            gemini_response = dynamic_model.generate_content(
                full_user_prompt,
                stream=True,
                generation_config=GEMINI_CONFIG,
            )

            for chunk in gemini_response:
                raw_text = getattr(chunk, "text", None)
                if raw_text:
                    rehydrated = sanitizer.rehydrate(raw_text, session_map)
                    full_sanitized_response += raw_text

                    yield sse({"type": "chunk", "content": rehydrated})
                    await asyncio.sleep(0)

            # ── 6. Extract token usage metadata ───────────────────────
            usage = {}
            try:
                # After the stream is consumed, usage_metadata should be available on the response object
                meta = gemini_response.usage_metadata
                usage = {
                    "prompt_tokens": meta.prompt_token_count,
                    "candidates_tokens": meta.candidates_token_count,
                    "total_tokens": meta.total_token_count,
                }
            except Exception:
                pass

            yield sse({
                "type": "done",
                "session_id": session_id,
                "usage": usage
            })

            # ── 6. Audit log (tokenized only — never real PII) ────────
            audit_logger.log_interaction(
                session_id=session_id,
                tenant_id=authoritative_tenant_id,
                business_type=req.business_type,
                sanitized_query=sanitized_query,
                sanitized_response=full_sanitized_response,
                record_id=req.record_id,
                has_pii=has_pii,
                model=os.getenv("GEMINI_MODEL", "gemini-3.1-pro-preview"),
            )

        except Exception as exc:
            audit_logger.log_error(session_id, type(exc).__name__, str(exc))
            yield sse({"type": "error", "message": f"Processing error: {type(exc).__name__}"})

        finally:
            # ── 7. Clear volatile token map from RAM ──────────────────
            sanitizer.clear_session(session_map)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control":     "no-cache",
            "X-Accel-Buffering": "no",
            "Connection":        "keep-alive",
        },
    )
