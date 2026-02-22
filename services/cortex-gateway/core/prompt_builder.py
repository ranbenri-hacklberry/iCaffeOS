"""
╔══════════════════════════════════════════════════════════════════╗
║  Cortex Gateway — System Prompt Builder                          ║
║                                                                  ║
║  Builds a layered, context-aware system prompt for every         ║
║  interaction:                                                    ║
║    Layer 1 — Business Persona      (who the AI is)              ║
║    Layer 2 — Global Tenant Config  (from onboarding DB row)      ║
║    Layer 3 — Active Record Context (the specific entity)         ║
║    Layer 4 — Anti-Hallucination    (hard rules)                  ║
║    Layer 5 — Tone of Voice                                       ║
╚══════════════════════════════════════════════════════════════════╝
"""

from typing import Any, Dict, List, Optional
from supabase import Client


# ── Business Vertical Personas ─────────────────────────────────────────
# Each vertical gets a role, domain description, and domain-specific rules.
# The CAFE persona explicitly defines "Sachlav" to prevent hallucination.

BUSINESS_PERSONAS: Dict[str, Dict[str, Any]] = {
    "IT_LAB": {
        "role":   "Expert IT Technician and Systems Engineer",
        "domain": (
            "hardware diagnostics, software troubleshooting, network configuration, "
            "OS administration (Windows / Linux), cybersecurity, and device lifecycle management"
        ),
        "rules": [
            "Always reference the exact hardware specs from the Active Record when diagnosing issues.",
            "Prefix any action that risks data loss with ⚠️ WARNING.",
            "Suggest the least-invasive solution first, then escalate.",
            "If a spec is missing from the record, say so — do not guess.",
            "Format multi-step procedures as a numbered list.",
        ],
    },
    "LAW_FIRM": {
        "role":   "Expert Israeli Legal Research Assistant",
        "domain": (
            "Israeli civil and commercial law, legal procedures, "
            "case management, document drafting, and court processes"
        ),
        "rules": [
            "Be extremely direct and concise. Avoid formal greetings and boilerplate openings (e.g., do NOT start with 'לקוחה נכבדה').",
            "Get straight to the point and answer the question immediately based on the data.",
            "Cite relevant Israeli law codes or Supreme Court precedents where applicable.",
            "Clearly distinguish between established legal facts and your analysis.",
            "Use formal, precise legal terminology in both Hebrew and English as appropriate.",
        ],
    },
    "CAFE": {
        "role":   "Experienced Cafe Manager and Head Barista",
        "domain": (
            "coffee preparation, Israeli cafe culture, menu management, "
            "inventory and pricing, kosher dietary compliance, and customer service"
        ),
        "rules": [
            # Anti-hallucination rule: prevent confusing the drink with the plant
            "IMPORTANT — Sachlav (סחלב): In THIS cafe context, Sachlav is a warm sweet "
            "milk beverage thickened with orchid-root starch powder. It is NOT about orchid plants. "
            "Always refer to it as a drink.",
            "Always consider Israeli kashrut (kosher) rules when recommending ingredients.",
            "Provide practical, immediately actionable advice.",
            "If a product is unavailable (is_available = false), say so before suggesting it.",
            "Use warm, friendly language — this is a hospitality context.",
        ],
    },
}

DEFAULT_PERSONA: Dict[str, Any] = {
    "role":   "Intelligent Business Assistant",
    "domain": "general business operations, productivity, and decision-making",
    "rules":  [],
}

# ── Anti-Hallucination Rules (applied to ALL verticals) ────────────────
ANTI_HALLUCINATION_RULES: List[str] = [
    "ONLY use information explicitly provided in the sections below.",
    "If a fact is not present in the provided context, respond with: "
    "'I don't have that information in the current record.'",
    "Do NOT use generic placeholders or boilerplate text.",
    "NEVER invent names, phone numbers, dates, prices, or technical specs.",
    "NEVER extrapolate beyond what the data says.",
]

# ── Tone Instructions ─────────────────────────────────────────────────
TONE_MAP: Dict[str, str] = {
    "professional": "Communicate in a professional, precise, and formal tone.",
    "friendly":     "Communicate in a warm, friendly, and approachable tone.",
    "technical":    "Communicate in a highly technical, detailed, and exact manner with minimal filler.",
    "casual":       "Communicate in a relaxed, conversational, and easy-going tone.",
}


class SystemPromptBuilder:
    """
    Constructs the full system prompt for every Gemini call.
    Reads the tenant's business_config row from Supabase (one fetch,
    then cached in RAM for the life of the process).
    """

    def __init__(self, supabase: Client) -> None:
        self.supabase = supabase
        self._config_cache: Dict[str, Dict] = {}  # tenant_id → config row

    # ── Public API ──────────────────────────────────────────────────────

    async def get_business_config(
        self, tenant_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Fetch the onboarding config from the existing ``business_config`` table.
        Result is cached in RAM to avoid redundant DB calls.
        """
        if tenant_id in self._config_cache:
            return self._config_cache[tenant_id]

        try:
            response = (
                self.supabase
                .table("business_config")
                .select("*")
                .eq("id", tenant_id)
                .single()
                .execute()
            )
            if response.data:
                self._config_cache[tenant_id] = response.data
                return response.data
        except Exception as exc:
            print(f"[PromptBuilder] config fetch error (tenant={tenant_id}): {exc}")

        return None

    def invalidate_cache(self, tenant_id: str) -> None:
        """Call this after an onboarding update to force a fresh DB read."""
        self._config_cache.pop(tenant_id, None)

    def build_system_instruction(
        self,
        business_type: str,
        tenant_config: Optional[Dict[str, Any]],
        tone: str = "professional",
    ) -> str:
        """
        Build the persistent 'identity' layer for Gemini's system_instruction.
        """
        persona = BUSINESS_PERSONAS.get(business_type.upper(), DEFAULT_PERSONA)
        biz_name = (tenant_config or {}).get("business_name", "this business")
        custom_instr = (tenant_config or {}).get("custom_instructions", "")
        tone_instr = TONE_MAP.get(tone, TONE_MAP["professional"])

        sections = [
            f"# IDENTITY\n"
            f"You are a **{persona['role']}** working exclusively for **{biz_name}**.\n"
            f"Your area of expertise: {persona['domain']}.",
            
            f"# TONE\n{tone_instr}",
            
            "# RULES (NON-NEGOTIABLE)\n" + "\n".join(f"- {r}" for r in (ANTI_HALLUCINATION_RULES + persona["rules"]))
        ]

        if custom_instr:
            sections.append(f"# CUSTOM BUSINESS POLICIES\n{custom_instr}")

        sections.append(
            "# YOUR TASK\n"
            "Answer using ONLY the provided Record Context and Attached Documents. "
            "Be extremely direct. If you cannot find an answer in the data, say so. "
            "Never use formal greetings like 'לקוחה נכבדה'."
        )

        return "\n\n".join(sections)

    def build_user_context(
        self,
        record_context: str,
        documents: List[Dict[str, Any]] = [],
    ) -> str:
        """
        Build the dynamic 'data' layer for the user's prompt.
        """
        sections = [f"# ACTIVE RECORD CONTEXT\n{record_context}"]

        if documents:
            doc_sections = []
            for d in documents:
                doc_text = (
                    f"## File: {d['filename']}\n"
                    f"{d['sanitized_text']}"
                )
                doc_sections.append(doc_text)
            sections.append("# ATTACHED DOCUMENTS\n" + "\n\n".join(doc_sections))
        else:
            sections.append("# ATTACHED DOCUMENTS\nNo documents available.")

        return "\n\n".join(sections)
