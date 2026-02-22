/**
 * useCortexStream — Phase 3: Production SSE Implementation
 * =========================================================
 *
 * Why fetch + ReadableStream, not EventSource?
 * ─────────────────────────────────────────────
 * The browser's native EventSource API does not support custom headers.
 * Because every protected Cortex Gateway route requires `X-Cortex-Tenant-ID`,
 * we must open the SSE stream with a regular `fetch()` call and parse the
 * `response.body` ReadableStream ourselves.  The overhead is negligible and
 * the control we gain (custom headers, AbortController, status inspection)
 * is essential for correctness.
 *
 * ── Stream state machine ──────────────────────────────────────────────
 *
 *   IDLE ──[send]──► MASKING ──[shield_active]──► FETCHING
 *          ↑                                           │
 *          │                         [status: thinking]│
 *          │                                           ▼
 *          └──[done / abort]── IDLE ◄── WRITING ◄── THINKING
 *                                │
 *                           [error / 401 / 404]
 *                                │
 *                             ERROR ──[2 s]──► IDLE
 *
 * ── SSE event contract (cortex-gateway) ──────────────────────────────
 *
 *   shield_active  { has_pii, masked_entities[], sanitized_prompt }
 *   status         { message: string }
 *   chunk          { content: string }
 *   done           { session_id: string }
 *   error          { message: string }
 *
 * ── Chunk buffer (anti-flicker) ──────────────────────────────────────
 *
 * Gemini streams at ~15–25 chunks/sec.  Calling setState() on every chunk
 * creates ~25 synchronous re-renders per second, causing visible jitter.
 * The buffer pattern:
 *   1. Accumulate arriving text in a `useRef` (no re-render).
 *   2. Schedule a `requestAnimationFrame` callback (deduplicated — only
 *      one rAF in flight at a time).
 *   3. Inside rAF: flush the buffer into state in a single batched update.
 * This caps React re-renders to the display refresh rate (~60/sec) while
 * keeping the visible text perfectly smooth.
 *
 * ── Security error handling ───────────────────────────────────────────
 *
 *   HTTP 401 → "Security Alert: session invalid or expired"
 *   HTTP 403 → "Access denied"
 *   HTTP 404 → "Record not found — it may belong to another workspace"
 *   Abort    → silent, assistant message marked complete
 *   Other    → generic error with HTTP status
 *
 * ── Privacy separation ────────────────────────────────────────────────
 *
 *   PrivacyReceipt is stamped on the USER message (not the assistant).
 *   `maskedEntities` is also mirrored at the hook level so ChatPanel can
 *   pass it to <PrivacyShield> without digging through the messages array.
 */

import { useCallback, useRef, useState } from "react";
import { CORTEX_API } from "../lib/api";
import { useCortexStore } from "../store/cortexStore";
import type { TenantConfig } from "../store/cortexStore";

// ── Public types ───────────────────────────────────────────────────────

export type StreamStatus =
  | "idle"      // nothing happening
  | "masking"   // immediately after send (zero-latency feedback)
  | "fetching"  // shield_active emitted; DB context loading
  | "thinking"  // context ready; Gemini processing
  | "writing"   // first token received; streaming active
  | "error";    // terminal — auto-resets to idle after 2 s

export interface PrivacyReceipt {
  isActive:        boolean;   // true when ≥1 PII entity was detected
  maskedEntities:  string[];  // e.g. ["[EMAIL_1]", "[PHONE_1]"]
  sanitizedPrompt: string;    // tokenized string sent to Gemini
}

export interface ChatMessage {
  id:            string;
  role:          "user" | "assistant";
  content:       string;
  timestamp:     Date;
  streamStatus?: "streaming" | "complete" | "error";  // assistant only
  privacy?:      PrivacyReceipt;                        // user message only
}

export interface UseCortexStreamResult {
  messages:       ChatMessage[];
  streamStatus:   StreamStatus;
  statusMessage:  string | null;   // human-readable label from the last "status" event
  maskedEntities: string[];        // live mirror of the last shield_active payload
  isStreaming:    boolean;         // convenience — streamStatus !== idle/error
  error:          string | null;
  sendMessage:    (query: string) => void;
  stopStream:     () => void;
  clearMessages:  () => void;
}

// ── Internal SSE event types ───────────────────────────────────────────

type SseShieldEvent = {
  type:             "shield_active";
  has_pii:          boolean;
  masked_entities:  string[];
  sanitized_prompt: string;
};
type SseStatusEvent = { type: "status"; message: string };
type SseChunkEvent  = { type: "chunk";  content: string };
type SseDoneEvent   = { type: "done";   session_id: string };
type SseErrorEvent  = { type: "error";  message: string };
type SseEvent =
  | SseShieldEvent
  | SseStatusEvent
  | SseChunkEvent
  | SseDoneEvent
  | SseErrorEvent;

// ── Security-specific HTTP error messages ─────────────────────────────

function httpErrorMessage(status: number): string {
  switch (status) {
    case 401: return "🔐 Security Alert: Session invalid or expired. Please reload.";
    case 403: return "🚫 Access denied — you don't have permission for this resource.";
    case 404: return "🔍 Record not found — it may belong to a different workspace.";
    case 429: return "⏱ Rate limit reached. Please wait a moment.";
    case 500: return "🔧 Server error — the AI service encountered an internal problem.";
    default:  return `Connection error: HTTP ${status}`;
  }
}

// ── Status-message → StreamStatus mapper ──────────────────────────────

function mapStatusMsg(msg: string): StreamStatus | null {
  const l = msg.toLowerCase();
  if (l.includes("context") || l.includes("fetch") || l.includes("load")) return "fetching";
  if (l.includes("think")) return "thinking";
  return null;
}

// ── Hook options ──────────────────────────────────────────────────────

export interface UseCortexStreamOptions {
  tenant:           TenantConfig;
  selectedRecordId: string | null;
}

// ══════════════════════════════════════════════════════════════════════
//  useCortexStream
// ══════════════════════════════════════════════════════════════════════

export function useCortexStream({
  tenant,
  selectedRecordId,
}: UseCortexStreamOptions): UseCortexStreamResult {

  const [messages,       setMessages]       = useState<ChatMessage[]>([]);
  const [streamStatus,   setStreamStatus]   = useState<StreamStatus>("idle");
  const [statusMessage,  setStatusMessage]  = useState<string | null>(null);
  const [maskedEntities, setMaskedEntities] = useState<string[]>([]);
  const [error,          setError]          = useState<string | null>(null);

  // ── Refs (no re-render on mutation) ──────────────────────────────
  const abortRef          = useRef<AbortController | null>(null);

  // Chunk buffer: accumulate text between rAF flushes
  const chunkBufRef       = useRef<string>("");
  const rafHandleRef      = useRef<number | null>(null);
  // Track which assistant message is currently streaming
  const activeAssistIdRef = useRef<string | null>(null);

  // ── Derived state ──────────────────────────────────────────────
  const isStreaming = streamStatus !== "idle" && streamStatus !== "error";

  // ── Helpers ────────────────────────────────────────────────────

  const patchMsg = useCallback(
    (id: string, patch: Partial<ChatMessage>) =>
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...patch } : m)),
      ),
    [],
  );

  const toError = useCallback((msg: string) => {
    setStreamStatus("error");
    setError(msg);
    // Cancel any pending rAF flush
    if (rafHandleRef.current !== null) {
      cancelAnimationFrame(rafHandleRef.current);
      rafHandleRef.current = null;
      chunkBufRef.current   = "";
    }
    setTimeout(() => {
      setStreamStatus("idle");
      setError(null);
    }, 3000);
  }, []);

  // ── rAF chunk flush (anti-flicker) ────────────────────────────
  //
  // Called at most once per animation frame.  Flushes accumulated text
  // from chunkBufRef into the active assistant message in a single setState.

  const scheduleFlush = useCallback((assistantId: string) => {
    if (rafHandleRef.current !== null) return;  // rAF already in flight

    rafHandleRef.current = requestAnimationFrame(() => {
      rafHandleRef.current = null;
      const flushed = chunkBufRef.current;
      chunkBufRef.current = "";

      if (!flushed) return;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: m.content + flushed }
            : m,
        ),
      );
    });
  }, []);

  // ── sendMessage ────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (query: string) => {
      if (!query.trim() || isStreaming) return;

      setError(null);
      setStatusMessage(null);
      setMaskedEntities([]);

      const sessionId   = crypto.randomUUID();
      const userId      = crypto.randomUUID();
      const assistantId = crypto.randomUUID();

      activeAssistIdRef.current = assistantId;
      chunkBufRef.current       = "";

      // ── Zero-latency: paint both bubbles + MASKING immediately ──
      setMessages((prev) => [
        ...prev,
        {
          id:        userId,
          role:      "user",
          content:   query,
          timestamp: new Date(),
        },
        {
          id:           assistantId,
          role:         "assistant",
          content:      "",
          timestamp:    new Date(),
          streamStatus: "streaming",
        },
      ]);
      setStreamStatus("masking");

      // Kill any previous stream
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      // ── Read tenant ID from store (authoritative source) ──────
      //
      // We read it here rather than trusting the `tenant` prop so
      // that a stale prop value can never bypass the Phase 3 guard.
      const tenantId =
        useCortexStore.getState().tenant?.id ?? tenant.id;

      try {
        // ── Open the SSE stream ─────────────────────────────────
        const res = await fetch(`${CORTEX_API}/api/chat/stream`, {
          method: "POST",
          headers: {
            "Content-Type":       "application/json",
            "X-Cortex-Tenant-ID": tenantId,    // ← Phase 3 guard requirement
          },
          body: JSON.stringify({
            query,
            tenant_id:     tenantId,            // body hint (non-authoritative)
            business_type: tenant.businessType,
            record_id:     selectedRecordId ?? null,
            tone:          tenant.tone,
            session_id:    sessionId,
          }),
          signal: abortRef.current.signal,
        });

        // ── Security-aware HTTP error handling ─────────────────
        if (!res.ok) {
          const secMsg = httpErrorMessage(res.status);
          patchMsg(assistantId, {
            content:      `⚠️ ${secMsg}`,
            streamStatus: "error",
          });
          toError(secMsg);
          return;
        }

        if (!res.body) {
          throw new Error("Server returned an empty response body");
        }

        // ── ReadableStream parser ───────────────────────────────
        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let   lineBuf = "";      // carries incomplete SSE lines across chunks
        let   firstContent = true;

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            // Flush any remaining content in the decoder and buffer
            const tail = decoder.decode(undefined, { stream: false });
            if (tail) lineBuf += tail;
            break;
          }

          // Decode incrementally — `stream: true` keeps multi-byte sequences intact
          lineBuf += decoder.decode(value, { stream: true });

          // SSE frames are separated by "\n\n" (double newline)
          const frames = lineBuf.split("\n\n");
          lineBuf = frames.pop() ?? "";  // last element may be incomplete

          for (const frame of frames) {
            // Each frame may have multiple lines; we only care about "data:" lines
            for (const line of frame.split("\n")) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;

              let evt: SseEvent;
              try {
                evt = JSON.parse(trimmed.slice(5).trim()) as SseEvent;
              } catch {
                continue;  // malformed JSON — skip, don't crash
              }

              // ── Dispatch on event type ────────────────────────
              switch (evt.type) {

                // Privacy shield metadata → stamp USER message, expose at hook level
                case "shield_active":
                  patchMsg(userId, {
                    privacy: {
                      isActive:        evt.has_pii,
                      maskedEntities:  evt.masked_entities,
                      sanitizedPrompt: evt.sanitized_prompt,
                    },
                  });
                  setMaskedEntities(evt.masked_entities);  // hook-level exposure
                  setStreamStatus("fetching");
                  break;

                // Status progress updates → update statusMessage + drive SystemPulse
                case "status": {
                  setStatusMessage(evt.message);
                  const next = mapStatusMsg(evt.message);
                  if (next) setStreamStatus(next);
                  break;
                }

                // Incoming content → buffer, then flush on next rAF
                case "chunk":
                  if (!evt.content) break;
                  if (firstContent) {
                    setStreamStatus("writing");
                    firstContent = false;
                  }
                  chunkBufRef.current += evt.content;
                  scheduleFlush(assistantId);
                  break;

                // Stream complete → flush any remaining buffer synchronously
                case "done":
                  // Cancel pending rAF and flush immediately so the final
                  // content appears before the "complete" state is set.
                  if (rafHandleRef.current !== null) {
                    cancelAnimationFrame(rafHandleRef.current);
                    rafHandleRef.current = null;
                  }
                  if (chunkBufRef.current) {
                    const finalText = chunkBufRef.current;
                    chunkBufRef.current = "";
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantId
                          ? { ...m, content: m.content + finalText }
                          : m,
                      ),
                    );
                  }
                  patchMsg(assistantId, { streamStatus: "complete" });
                  setStreamStatus("idle");
                  setStatusMessage(null);
                  activeAssistIdRef.current = null;
                  break;

                // Backend-emitted error event
                case "error":
                  patchMsg(assistantId, {
                    content:      `⚠️ ${evt.message}`,
                    streamStatus: "error",
                  });
                  toError(evt.message ?? "Unknown error");
                  break;
              }
            }
          }
        }

      } catch (err: unknown) {
        // ── User-initiated abort (Stop button) → silent completion ──
        if (err instanceof Error && err.name === "AbortError") {
          // Flush whatever was buffered up to the abort point
          if (rafHandleRef.current !== null) {
            cancelAnimationFrame(rafHandleRef.current);
            rafHandleRef.current = null;
          }
          if (chunkBufRef.current) {
            const partial = chunkBufRef.current;
            chunkBufRef.current = "";
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + partial }
                  : m,
              ),
            );
          }
          patchMsg(assistantId, { streamStatus: "complete" });
          setStreamStatus("idle");
          setStatusMessage(null);
          activeAssistIdRef.current = null;
          return;
        }

        // ── All other errors (network loss, parse failure, etc.) ──
        const msg = err instanceof Error ? err.message : "Connection failed";
        patchMsg(assistantId, {
          content:      `⚠️ ${msg}`,
          streamStatus: "error",
        });
        toError(msg);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tenant, selectedRecordId, isStreaming, patchMsg, toError, scheduleFlush],
  );

  // ── stopStream ─────────────────────────────────────────────────

  const stopStream = useCallback(() => {
    abortRef.current?.abort();
    // setStreamStatus is handled inside the AbortError catch above
  }, []);

  // ── clearMessages ──────────────────────────────────────────────

  const clearMessages = useCallback(() => {
    // Cancel any in-flight stream first
    abortRef.current?.abort();
    if (rafHandleRef.current !== null) {
      cancelAnimationFrame(rafHandleRef.current);
      rafHandleRef.current = null;
    }
    chunkBufRef.current       = "";
    activeAssistIdRef.current = null;
    setMessages([]);
    setStreamStatus("idle");
    setStatusMessage(null);
    setMaskedEntities([]);
    setError(null);
  }, []);

  return {
    messages,
    streamStatus,
    statusMessage,
    maskedEntities,
    isStreaming,
    error,
    sendMessage,
    stopStream,
    clearMessages,
  };
}
