"""
╔══════════════════════════════════════════════════════════════════╗
║  Cortex Gateway — Context Engine (Phase 3: Tenant-Scoped)        ║
║                                                                  ║
║  ALL Supabase queries are now scoped by tenant_id.               ║
║                                                                  ║
║  Security invariant:                                             ║
║    Every .select() / .single() call includes                     ║
║      .eq("tenant_id", tenant_id)                                 ║
║    so that a record that exists under a different tenant          ║
║    is indistinguishable from a record that does not exist.       ║
║    The caller always receives None / 404 — never data that       ║
║    belongs to another tenant.                                    ║
║                                                                  ║
║  NOTE: This module queries EXISTING Supabase tables.             ║
║  No new tables or migrations are needed.                         ║
╚══════════════════════════════════════════════════════════════════╝
"""

from typing import Any, Dict, List, Optional
from supabase import Client


# ── Table / Field Registry ──────────────────────────────────────────────
# Maps each business vertical to its Supabase table and the specific
# columns that are meaningful for the AI context window.

CONTEXT_CONFIG: Dict[str, Dict[str, Any]] = {
    "IT_LAB": {
        "table":       "devices",
        "label":       "Current Device",
        "id_col":      "id",
        "display_col": "name",
        "tenant_col":  "tenant_id",
        "fields": [
            "name", "cpu", "ram_gb", "storage_gb",
            "os", "os_version", "status", "location", "notes",
        ],
    },
    "LAW_FIRM": {
        "table":       "cases",
        "label":       "Active Legal Case",
        "id_col":      "id",
        "display_col": "title",
        "tenant_col":  "tenant_id",
        "fields": [
            "case_number", "title", "client_name", "status",
            "description", "court_date", "assigned_attorney", "notes",
        ],
    },
    "CAFE": {
        "table":       "menu_items",
        "label":       "Menu Item / Product",
        "id_col":      "id",
        "display_col": "name",
        "tenant_col":  "business_id",  # iCaffeOS legacy column name
        "fields": [
            "name", "category", "description", "price",
            "ingredients", "is_in_stock",
        ],
    },
}


class ContextEngine:
    """
    Fetches context records from Supabase, always scoped to a specific tenant.

    Every public method requires a ``tenant_id`` argument.  The tenant_id
    is appended to every WHERE clause so that data from other tenants is
    never returned — even if the caller supplies a valid record_id that
    belongs to a different business.
    """

    def __init__(self, supabase: Client) -> None:
        self.supabase = supabase

    # ── Internal helpers ────────────────────────────────────────────────

    @staticmethod
    def _config(business_type: str) -> Optional[Dict[str, Any]]:
        return CONTEXT_CONFIG.get(business_type.upper())

    @staticmethod
    def _select_fields(config: Dict[str, Any]) -> str:
        """
        Build the SELECT column list.
        Always include the tenant column so callers can do a secondary ownership check.
        """
        fields = list(config["fields"])
        tenant_col = config.get("tenant_col", "tenant_id")
        # Ensure id and the relevant tenant_id/business_id are always present
        for col in (config["id_col"], tenant_col):
            if col not in fields:
                fields.insert(0, col)
        return ", ".join(fields)

    # ── Public API ──────────────────────────────────────────────────────

    async def fetch_context(
        self,
        business_type: str,
        record_id:     str,
        tenant_id:     str,
    ) -> Optional[Dict[str, Any]]:
        """
        Fetch a single record **belonging to tenant_id**.

        Security contract:
          - Queries WHERE id = record_id AND tenant_id = tenant_id.
          - If the record exists under a *different* tenant the result is
            identical to "not found" (None).  The caller should return 404.
          - Never returns a row that belongs to another tenant.

        Returns
        -------
        dict with keys ``label`` and ``data``, or ``None`` if not found /
        not owned by this tenant.
        """
        config = self._config(business_type)
        if not config:
            return None

        try:
            tenant_col = config.get("tenant_col", "tenant_id")
            response = (
                self.supabase
                .table(config["table"])
                .select(self._select_fields(config))
                .eq(config["id_col"], record_id)
                .eq(tenant_col, tenant_id)          # ← TENANT SCOPE
                .limit(1)                             # guard against unexpected multi-row
                .execute()
            )

            rows = response.data or []
            if not rows:
                return None

            row = rows[0]

            # Secondary ownership check: belt-and-suspenders.
            # If somehow the DB returned a row with a different tenant_id,
            # we silently discard it rather than leak data.
            if str(row.get(tenant_col)) != str(tenant_id):
                return None

            # Strip the internal tenant_id column before returning to callers
            data = {k: v for k, v in row.items() if k != tenant_col}
            return {"label": config["label"], "data": data}

        except Exception as exc:
            # Non-fatal — callers treat None as "not found"
            print(f"[ContextEngine] fetch_context error ({business_type}/{record_id}): {exc}")
            return None

    async def fetch_extracted_documents(
        self,
        record_id: str,
        tenant_id: str,
    ) -> List[Dict[str, Any]]:
        """
        Fetch all sanitized document extractions for this record.
        """
        try:
            res = (
                self.supabase
                .table("document_extractions")
                .select("filename, sanitized_text, page_count")
                .eq("record_id", record_id)
                .eq("tenant_id", tenant_id)
                .execute()
            )
            return res.data or []
        except Exception as exc:
            print(f"[ContextEngine] fetch_extractions error ({record_id}): {exc}")
            return []

    async def list_records(
        self,
        business_type: str,
        tenant_id:     str,
        limit:         int = 50,
    ) -> List[Dict[str, Any]]:
        """
        Return a lightweight record list scoped to the authenticated tenant.

        Only id + display_name are returned for the picker UI.
        Records from other tenants are never included.
        """
        config = self._config(business_type)
        if not config:
            return []

        id_col      = config["id_col"]
        display_col = config["display_col"]

        try:
            tenant_col = config.get("tenant_col", "tenant_id")
            response = (
                self.supabase
                .table(config["table"])
                .select(f"{id_col}, {display_col}")
                .eq(tenant_col, tenant_id)          # ← TENANT SCOPE
                .limit(limit)
                .execute()
            )

            rows = response.data or []

            # Normalise display field to "name" so the frontend
            # doesn't need to know which column each vertical uses
            normalised = []
            for row in rows:
                normalised.append({
                    "id":   str(row[id_col]),
                    "name": str(row.get(display_col, "")),
                })
            return normalised

        except Exception as exc:
            print(f"[ContextEngine] list_records error ({business_type}): {exc}")
            return []

    def format_context_for_prompt(
        self, context: Optional[Dict[str, Any]]
    ) -> str:
        """
        Convert a context dict into a human-readable text block for injection
        into the system prompt.

        Example output:
            [Current Device Details]
              - Name: LAB-PC-07
              - CPU: AMD Ryzen 5 5600G
              - RAM (GB): 16
              - OS: Windows 11 Pro
        """
        if not context or not context.get("data"):
            return "No specific record context provided."

        lines: List[str] = [f"[{context['label']} Details]"]

        for key, value in context["data"].items():
            if value is None:
                continue
            human_key = key.replace("_", " ").title()
            lines.append(f"  - {human_key}: {value}")

        return "\n".join(lines)
