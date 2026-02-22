"""
╔══════════════════════════════════════════════════════════════════════╗
║  Cortex Gateway — Tenant Authentication Guard                        ║
║                                                                      ║
║  Every protected route declares:                                     ║
║      tenant: TenantRecord = Depends(require_tenant)                  ║
║                                                                      ║
║  The guard performs three checks in sequence:                        ║
║    1. Header present   → 401 if X-Cortex-Tenant-ID is missing        ║
║    2. UUID valid       → 401 if the value is not a well-formed UUID   ║
║    3. Tenant exists    → 401 if no matching row in business_config    ║
║                           (intentionally NOT 404 — prevents          ║
║                            tenant enumeration by timing / status)     ║
║                                                                      ║
║  Validated tenants are cached in-process for TTL_SECONDS to avoid    ║
║  hitting Supabase on every request in the hot path.                  ║
╚══════════════════════════════════════════════════════════════════════╝
"""

import time
import uuid as uuid_lib
from dataclasses import dataclass, field
from typing import Any, Dict, Optional

from fastapi import Depends, Header, HTTPException, status
from supabase import Client


# ── Tenant record (resolved from business_config) ─────────────────────

@dataclass(frozen=True)
class TenantRecord:
    """
    Immutable snapshot of the authenticated tenant's config row.
    Injected into every protected route handler via Depends(require_tenant).
    """
    id:                  str
    business_name:       str
    business_type:       str
    tone_of_voice:       str
    core_entities:       list
    custom_instructions: str = ""


# ── In-process validated tenant cache ────────────────────────────────

TTL_SECONDS = 300   # 5 minutes — balance freshness vs. DB pressure

@dataclass
class _CacheEntry:
    tenant:     TenantRecord
    expires_at: float


_cache: Dict[str, _CacheEntry] = {}


def _cache_get(tenant_id: str) -> Optional[TenantRecord]:
    entry = _cache.get(tenant_id)
    if entry and entry.expires_at > time.monotonic():
        return entry.tenant
    _cache.pop(tenant_id, None)
    return None


def _cache_set(tenant: TenantRecord) -> None:
    _cache[tenant.id] = _CacheEntry(
        tenant=tenant,
        expires_at=time.monotonic() + TTL_SECONDS,
    )


def invalidate_tenant_cache(tenant_id: str) -> None:
    """
    Call this after an onboarding upsert so the next request
    reads fresh config rather than a stale cached snapshot.
    """
    _cache.pop(tenant_id, None)


# ── The 401 factory ───────────────────────────────────────────────────

def _unauthorized(detail: str) -> HTTPException:
    """
    Always returns 401 — never 403 or 404.
    This prevents leaking whether a given UUID belongs to any tenant.
    """
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "X-Cortex-Tenant-ID"},
    )


# ── Guard factory — returns a Depends-compatible async function ───────

def make_tenant_guard(supabase: Client):
    """
    Factory that closes over the Supabase client singleton.
    Call once at startup:

        require_tenant = make_tenant_guard(supabase)

    Then use in routes:

        @app.get("/api/records/{business_type}")
        async def list_records(
            business_type: str,
            tenant: TenantRecord = Depends(require_tenant),
        ):
            ...
    """

    async def require_tenant(
        x_cortex_tenant_id: Optional[str] = Header(
            default=None,
            alias="X-Cortex-Tenant-ID",
            description="UUID of the authenticated tenant (from Zustand store)",
        ),
    ) -> TenantRecord:

        # ── Check 1: Header must be present ─────────────────────────
        if not x_cortex_tenant_id or not x_cortex_tenant_id.strip():
            raise _unauthorized("Missing X-Cortex-Tenant-ID header")

        raw_id = x_cortex_tenant_id.strip()

        # ── Check 2: Must be a well-formed UUID ──────────────────────
        try:
            uuid_lib.UUID(raw_id, version=4)
        except ValueError:
            print(f"DEBUG [TenantGuard]: Invalid UUID format received: {raw_id}")
            raise _unauthorized("X-Cortex-Tenant-ID is not a valid UUID")

        # ── Check 3: Fast path — served from in-process cache ────────
        cached = _cache_get(raw_id)
        if cached:
            return cached

        print(f"DEBUG [TenantGuard]: Verifying new tenant: {raw_id}")
        # ── Check 3: Slow path — verify against Supabase ─────────────
        try:
            response = (
                supabase
                .table("business_config")
                .select(
                    "id, business_name, business_type, "
                    "tone_of_voice, core_entities, custom_instructions"
                )
                .eq("id", raw_id)
                .single()
                .execute()
            )
        except Exception:
            # Any DB error (including PostgREST's "not found" exception)
            # is converted to 401 — do not leak DB internals.
            raise _unauthorized("Tenant not recognised")

        if not response.data:
            raise _unauthorized("Tenant not recognised")

        row: Dict[str, Any] = response.data
        tenant = TenantRecord(
            id=row["id"],
            business_name=row.get("business_name", ""),
            business_type=row.get("business_type", ""),
            tone_of_voice=row.get("tone_of_voice", "professional"),
            core_entities=row.get("core_entities") or [],
            custom_instructions=row.get("custom_instructions") or "",
        )

        _cache_set(tenant)
        return tenant

    return require_tenant
