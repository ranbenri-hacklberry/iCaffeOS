"""
╔══════════════════════════════════════════════════════════════════╗
║  Cortex Gateway — Tokenized Audit Logger                         ║
║                                                                  ║
║  SECURITY CONTRACT:                                              ║
║    ✅  Log sanitized (tokenized) queries and responses           ║
║    ✅  Log metadata: tenant, vertical, session, timestamp        ║
║    ❌  NEVER write real PII to disk — ever                       ║
╚══════════════════════════════════════════════════════════════════╝
"""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional


class AuditLogger:
    """
    Writes one JSONL entry per interaction to a daily rotating log file.

    The caller is responsible for passing already-sanitized text — this
    class adds no sanitization of its own.  The ``has_pii_detected`` flag
    signals that PII *was* present but was masked before this point.
    """

    LOG_PREVIEW_MAX = 300  # chars — keep log entries compact

    def __init__(self, log_dir: str = "logs") -> None:
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(parents=True, exist_ok=True)

    # ── Internal helpers ────────────────────────────────────────────────

    def _log_file(self) -> Path:
        """Returns today's log file path (rotates at midnight)."""
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        return self.log_dir / f"cortex_audit_{today}.jsonl"

    def _write(self, entry: dict) -> None:
        with open(self._log_file(), "a", encoding="utf-8") as fh:
            fh.write(json.dumps(entry, ensure_ascii=False) + "\n")

    @staticmethod
    def _preview(text: str, max_len: int) -> str:
        if len(text) <= max_len:
            return text
        return text[:max_len] + "…"

    # ── Public API ──────────────────────────────────────────────────────

    def log_interaction(
        self,
        session_id: str,
        tenant_id: str,
        business_type: str,
        sanitized_query: str,       # ← tokens, NOT real PII
        sanitized_response: str,    # ← tokens, NOT real PII
        record_id: Optional[str] = None,
        has_pii: bool = False,
        model: str = "gemini-3.1-pro-preview",
    ) -> None:
        """
        Persist one audit record.  Both query and response MUST already
        be sanitized by PiiSanitizer before calling this method.
        """
        entry = {
            "ts":                  datetime.now(timezone.utc).isoformat(),
            "event":               "CHAT_INTERACTION",
            "session_id":          session_id,
            "tenant_id":           tenant_id,
            "business_type":       business_type,
            "model":               model,
            "record_id":           record_id,
            "pii_detected_masked": has_pii,        # true = PII was found & masked
            # Truncated previews — full text NOT stored to limit log size
            "sanitized_query":     self._preview(sanitized_query, self.LOG_PREVIEW_MAX),
            "sanitized_response":  self._preview(sanitized_response, self.LOG_PREVIEW_MAX),
            "query_len":           len(sanitized_query),
            "response_len":        len(sanitized_response),
        }
        self._write(entry)

    def log_error(
        self,
        session_id: str,
        error_type: str,
        message: str,
    ) -> None:
        """Log a processing error — never include user data in the message."""
        entry = {
            "ts":         datetime.now(timezone.utc).isoformat(),
            "event":      "ERROR",
            "session_id": session_id,
            "error_type": error_type,
            "message":    message,
        }
        self._write(entry)

    def log_onboarding(
        self,
        tenant_id: str,
        business_type: str,
        action: str = "SAVED",
    ) -> None:
        """Log onboarding configuration changes (no sensitive data)."""
        entry = {
            "ts":            datetime.now(timezone.utc).isoformat(),
            "event":         f"ONBOARDING_{action}",
            "tenant_id":     tenant_id,
            "business_type": business_type,
        }
        self._write(entry)
