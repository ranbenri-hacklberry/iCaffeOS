"""
╔══════════════════════════════════════════════════════════════════╗
║  Cortex Gateway — PII Sanitizer                                  ║
║  Privacy-first middleware: detects & masks sensitive data        ║
║  before ANY text leaves the local machine to the Gemini API.     ║
║                                                                  ║
║  TOKEN MAP IS VOLATILE — stored in RAM only, never on disk.      ║
╚══════════════════════════════════════════════════════════════════╝
"""

import re
from typing import Dict, Tuple


class PiiSanitizer:
    """
    Detects and replaces PII (Personally Identifiable Information) with
    deterministic, reversible tokens so the same piece of PII always gets
    the same token within a session.

    Usage:
        sanitizer = PiiSanitizer()
        masked_text, session_map = sanitizer.sanitize(raw_text)
        # ... send masked_text to Gemini ...
        final_text = sanitizer.rehydrate(gemini_response, session_map)
        sanitizer.clear_session(session_map)  # free RAM
    """

    # ── Pattern Registry ────────────────────────────────────────────────
    # Order matters: more specific patterns first to avoid partial matches
    PII_PATTERNS: Dict[str, str] = {
        # Israeli-specific
        "ISRAELI_ID":    r"\b\d{9}\b",
        "ISRAELI_PHONE": r"\b0(?:5[012389]|[23489])-?\d{3}-?\d{4}\b",

        # Universal
        "EMAIL":         r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b",
        "CREDIT_CARD":   r"\b(?:\d{4}[\s\-]?){3}\d{4}\b",
        "IBAN":          r"\b[A-Z]{2}\d{2}[A-Z0-9]{1,30}\b",
        "IP_ADDRESS":    r"\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b",

        # Credential-style patterns (key=value)
        "PASSWORD":      r"(?i)(?:password|passwd|pass|pwd|סיסמ[אה])\s*[:=]\s*\S+",
        "API_KEY":       r"(?i)(?:api[_\-]?key|token|secret)\s*[:=]\s*[A-Za-z0-9_\-\.]{16,}",
    }

    def __init__(self) -> None:
        # Volatile store — lives only while the Python process is running
        self._token_map: Dict[str, str] = {}     # token  → real_value
        self._reverse_map: Dict[str, str] = {}   # real_value → token
        self._counters: Dict[str, int] = {}       # pii_type  → counter

    # ── Public API ──────────────────────────────────────────────────────

    def sanitize(self, text: str) -> Tuple[str, Dict[str, str]]:
        """
        Replace all detected PII in *text* with opaque tokens.

        Returns
        -------
        sanitized_text : str
            The text with all PII replaced by tokens like [EMAIL_1].
        session_map : dict
            A snapshot mapping {token: real_value} for THIS query only.
            Pass it to rehydrate() and clear_session() afterwards.
        """
        session_map: Dict[str, str] = {}

        for pii_type, pattern in self.PII_PATTERNS.items():
            for match in re.findall(pattern, text):
                token = self._get_or_create_token(pii_type, match)
                session_map[token] = match
                # Replace every occurrence in the text
                text = text.replace(match, token)

        return text, session_map

    def rehydrate(self, text: str, session_map: Dict[str, str]) -> str:
        """
        Restore tokens in *text* back to their original PII values.
        Only tokens present in *session_map* are replaced (session-scoped).
        """
        for token, real_value in session_map.items():
            text = text.replace(token, real_value)
        return text

    def clear_session(self, session_map: Dict[str, str]) -> None:
        """
        Remove the session's tokens from the global volatile maps.
        Call this after every request to limit memory footprint.
        """
        for token, real_value in session_map.items():
            self._token_map.pop(token, None)
            self._reverse_map.pop(real_value, None)

    # ── Internal helpers ────────────────────────────────────────────────

    def _get_or_create_token(self, pii_type: str, real_value: str) -> str:
        """
        Return the existing token for *real_value* or create a new one.
        Ensures the same value always maps to the same token (deduplication).
        """
        if real_value in self._reverse_map:
            return self._reverse_map[real_value]

        # Assign a monotonically-increasing counter per PII type
        self._counters[pii_type] = self._counters.get(pii_type, 0) + 1
        token = f"[{pii_type}_{self._counters[pii_type]}]"

        self._token_map[token] = real_value
        self._reverse_map[real_value] = token
        return token
