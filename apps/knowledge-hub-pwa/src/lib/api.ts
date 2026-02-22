/**
 * Cortex API — authenticated fetch wrapper
 * =========================================
 *
 * Security design:
 *   Every request automatically receives the ``X-Cortex-Tenant-ID`` header
 *   populated from the Zustand store's persisted tenant ID.
 *
 *   The header is the *only* authoritative source of identity on the backend.
 *   The `tenant_id` field inside request bodies (e.g. ChatRequest) is treated
 *   as a hint and is ignored by the gateway's security middleware — so even if
 *   someone crafts a body with a different tenant_id, the header wins.
 *
 *   Reading the store with `.getState()` (instead of the `useCortexStore` hook)
 *   makes this safe to call from plain utility functions outside React components.
 */

import { useCortexStore } from "../store/cortexStore";

// ── Base URL ───────────────────────────────────────────────────────────

export const CORTEX_API =
  import.meta.env.VITE_CORTEX_API_URL ?? "http://localhost:8000";

// ── Tenant header injection ────────────────────────────────────────────

/**
 * Reads the authenticated tenant ID from the Zustand store without a hook.
 * Returns an empty object if no tenant is stored yet (e.g. during onboarding).
 */
function tenantHeaders(): Record<string, string> {
  const tenantId = useCortexStore.getState().tenant?.id;
  if (!tenantId) return {};
  return { "X-Cortex-Tenant-ID": tenantId };
}

// ── Typed fetch wrapper ───────────────────────────────────────────────

/**
 * `cortexFetch<T>` — authenticated, typed fetch for all Cortex API calls.
 *
 * Automatically injects:
 *   - Content-Type: application/json
 *   - X-Cortex-Tenant-ID: <tenant UUID from Zustand store>
 *
 * Throws on non-2xx responses with the HTTP status and body text.
 */
export async function cortexFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const callerHeaders =
    options?.headers instanceof Headers
      ? Object.fromEntries(options.headers.entries())
      : (options?.headers as Record<string, string> | undefined) ?? {};

  const res = await fetch(`${CORTEX_API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...tenantHeaders(),     // ← inject X-Cortex-Tenant-ID from store
      ...callerHeaders,       // ← caller overrides come last (e.g. during onboarding POST)
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

/**
 * `cortexFetchPublic<T>` — unauthenticated fetch for public endpoints.
 *
 * Use this only for routes that intentionally have no tenant guard:
 *   - GET  /health
 *   - POST /api/onboarding   (creates the tenant — no ID exists yet)
 *
 * This wrapper does NOT inject X-Cortex-Tenant-ID.
 */
export async function cortexFetchPublic<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${CORTEX_API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string> | undefined),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}
