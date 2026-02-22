# Cortex — Architecture Reference
**icaffeOS Monorepo Addition · Phase 1**

---

## Folder Structure

```
icaffeOS/
│
├── services/
│   └── cortex-gateway/                  ← FastAPI backend service
│       ├── main.py                      ← Entry point, all routes
│       ├── requirements.txt
│       ├── .env.example
│       │
│       ├── core/
│       │   ├── __init__.py
│       │   ├── sanitizer.py             ← PII Sanitizer (volatile token map)
│       │   ├── context_engine.py        ← Supabase record fetcher + formatter
│       │   ├── prompt_builder.py        ← Layered system prompt assembler
│       │   └── audit_logger.py          ← JSONL audit logger (tokenized only)
│       │
│       ├── models/
│       │   ├── __init__.py
│       │   └── schemas.py               ← Pydantic request/response models
│       │
│       └── logs/                        ← Daily JSONL audit files (git-ignored)
│           └── cortex_audit_YYYY-MM-DD.jsonl
│
└── apps/
    └── knowledge-hub-pwa/               ← React/Vite frontend
        ├── .env.example
        ├── package.json
        ├── vite.config.ts
        │
        └── src/
            ├── main.tsx                 ← React entry point
            ├── App.tsx                  ← Onboarding gate + root router
            ├── index.css                ← Tailwind base styles
            │
            ├── lib/
            │   └── api.ts               ← Typed fetch wrapper + base URL
            │
            ├── hooks/
            │   ├── useCortexStream.ts   ← SSE chat hook (stream parser)
            │   └── useOnboarding.ts     ← Config persistence hook
            │
            └── components/
                ├── OnboardingWizard/
                │   └── index.tsx        ← 3-step wizard (biz type → entities → tone)
                │
                └── GlassLayout/
                    ├── index.tsx        ← Split-panel shell
                    ├── ContextPanel.tsx ← Left: record picker + detail card
                    └── ChatPanel.tsx    ← Right: message thread + input bar
```

---

## Request Lifecycle (7 Steps)

```
Browser                 Cortex Gateway              Supabase        Gemini API
  │                          │                          │               │
  │── POST /api/chat/stream ─►│                          │               │
  │                          │                          │               │
  │                          │── 1. PiiSanitizer ───────┤               │
  │                          │   mask: email→[EMAIL_1]  │               │
  │◄── SSE: "🔒 PII masked" ─┤                          │               │
  │                          │                          │               │
  │                          │── 2. ContextEngine ──────►               │
  │                          │   SELECT * FROM devices  │               │
  │                          │   WHERE id = record_id   │               │
  │◄── SSE: "🔍 Loading…" ───┤◄── context row ──────────┤               │
  │                          │                          │               │
  │                          │── 3. PromptBuilder       │               │
  │                          │   fetch business_config ─►               │
  │                          │◄─ config row ────────────┤               │
  │                          │                          │               │
  │                          │── 4. build() ────────────┤               │
  │                          │   [Identity]             │               │
  │                          │   [Tone]                 │               │
  │                          │   [Rules + Anti-halluc.] │               │
  │                          │   [Business context]     │               │
  │                          │   [Active Record]        │               │
  │◄── SSE: "🧠 Thinking…" ──┤                          │               │
  │                          │                          │               │
  │                          │── 5. Gemini stream ─────────────────────►│
  │                          │◄── chunk ────────────────────────────────┤
  │                          │   rehydrate [EMAIL_1]→real email         │
  │◄── SSE: chunk ───────────┤                          │               │
  │◄── SSE: chunk ───────────┤                          │               │
  │◄── SSE: done ────────────┤                          │               │
  │                          │                          │               │
  │                          │── 6. AuditLogger ────────┤               │
  │                          │   write TOKENIZED text   │               │
  │                          │   to logs/cortex_audit_  │               │
  │                          │   YYYY-MM-DD.jsonl       │               │
  │                          │                          │               │
  │                          │── 7. clear_session() ────┤               │
  │                          │   free RAM token map     │               │
```

---

## System Prompt Structure (5 Layers)

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1 — IDENTITY                                         │
│  "You are an Expert IT Technician for TechPoint Lab."       │
├─────────────────────────────────────────────────────────────┤
│  Layer 2 — TONE                                             │
│  "Communicate in a professional, precise, formal tone."     │
├─────────────────────────────────────────────────────────────┤
│  Layer 3 — RULES  (domain + anti-hallucination)             │
│  - ONLY use information explicitly provided below           │
│  - NEVER invent names, numbers, or specs                    │
│  - If unknown, say "I don't have that info in the record"   │
│  - ⚠️ Flag data-loss actions                               │
├─────────────────────────────────────────────────────────────┤
│  Layer 4 — GLOBAL BUSINESS CONTEXT  (from onboarding DB)   │
│  - Business Name: TechPoint Lab                             │
│  - Business Type: IT_LAB                                    │
│  - Core Entities: Devices, Tickets, Users                   │
│  - Custom Instructions: Always respond in Hebrew            │
├─────────────────────────────────────────────────────────────┤
│  Layer 5 — ACTIVE RECORD CONTEXT  (from Supabase record)   │
│  [Current Device Details]                                   │
│    - Name: LAB-PC-07                                        │
│    - CPU: AMD Ryzen 5 5600G                                 │
│    - RAM (GB): 16                                           │
│    - OS: Windows 11 Pro                                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                  USER QUERY (sanitized)
```

---

## PII Sanitizer — Regex Patterns

| Token Format     | Detects                                      |
|-----------------|----------------------------------------------|
| `[ISRAELI_ID_1]`   | 9-digit Israeli ID numbers                |
| `[ISRAELI_PHONE_1]`| 05x-xxxxxxx phone numbers                |
| `[EMAIL_1]`        | email@domain.com                         |
| `[CREDIT_CARD_1]`  | 16-digit card numbers (with separators)  |
| `[IBAN_1]`         | IBAN bank account strings                |
| `[IP_ADDRESS_1]`   | IPv4 addresses                           |
| `[PASSWORD_1]`     | password=xxx, סיסמה: xxx                |
| `[API_KEY_1]`      | api_key=xxx, token: xxx (16+ chars)      |

**Security guarantee:** The `_token_map` and `_reverse_map` dictionaries live only in Python process RAM.
They are wiped per-request via `clear_session()`. Nothing is serialised to disk, DB, or logs.

---

## Onboarding Data Flow

```
Browser                     Cortex Gateway        Supabase
  │                               │                   │
  │── POST /api/onboarding ───────►│                   │
  │   {business_name, type,        │                   │
  │    core_entities, tone,        │── UPSERT ─────────►
  │    custom_instructions}        │   business_config │
  │                               │◄── {id: uuid} ────┤
  │◄── {success, tenant_id} ──────┤                   │
  │                               │                   │
  │  localStorage.setItem(        │                   │
  │    "cortex_tenant_id", uuid)  │                   │
  │                               │                   │
  │  (All future chat requests    │                   │
  │   include tenant_id in body)  │                   │
```

---

## Supabase Tables Used (existing — no new tables or columns needed)

| Table             | Used by            | Purpose                                      |
|------------------|--------------------|----------------------------------------------|
| `business_config` | PromptBuilder      | Global tenant onboarding config              |
| `devices`         | ContextEngine      | IT Lab device records                        |
| `cases`           | ContextEngine      | Law Firm case records                        |
| `products`        | ContextEngine      | Cafe menu / product records                  |

---

## Environment Variables

### Backend (`services/cortex-gateway/.env`)
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-1.5-pro
ALLOWED_ORIGINS=http://localhost:5173
LOG_DIR=logs
```

### Frontend (`apps/knowledge-hub-pwa/.env`)
```
VITE_CORTEX_API_URL=http://localhost:8000
```

---

## Running Locally

```bash
# 1. Start the backend
cd services/cortex-gateway
pip install -r requirements.txt
cp .env.example .env   # fill in keys
uvicorn main:app --reload --port 8000

# 2. Start the frontend
cd apps/knowledge-hub-pwa
npm install
cp .env.example .env
npm run dev            # → http://localhost:5173
```

---

## API Endpoints

| Method | Path                               | Description                          |
|--------|------------------------------------|--------------------------------------|
| GET    | `/health`                          | Health check                         |
| POST   | `/api/chat/stream`                 | SSE streaming chat (main endpoint)   |
| POST   | `/api/onboarding`                  | Save business config (upsert)        |
| GET    | `/api/onboarding/{tenant_id}`      | Fetch existing config                |
| GET    | `/api/records/{business_type}`     | List records for context picker      |
| GET    | `/api/context/{business_type}/{id}`| Preview context for a record         |

---

## Security Summary

| Concern              | Mitigation                                                    |
|---------------------|---------------------------------------------------------------|
| PII sent to Gemini   | PiiSanitizer replaces with tokens before every API call       |
| PII on disk          | AuditLogger receives only tokenized text — by contract        |
| PII in DB logs       | Token map never persisted; cleared from RAM after each request|
| Prompt injection     | Anti-hallucination rules are non-negotiable layer in prompt   |
| Domain hallucination | Business persona + vertical-specific rules per tenant config  |
| Secret leakage       | Service-role key server-side only; ANON key never used        |
