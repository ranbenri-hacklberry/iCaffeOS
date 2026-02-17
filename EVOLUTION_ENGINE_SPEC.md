# icaffeOS Evolution Engine — Full Technical Specification

**Version:** 1.0.0
**Date:** 2026-02-17
**Status:** Draft for Approval
**Depends on:** `sdk/types/index.ts` (ICaffeSDK contract)

---

## 0. Preamble: Immutable Rules

These rules override every other instruction in this spec. They come directly from `GUIDELINES_FOR_AI.md` and the icaffeOS security model.

1. **UI INTEGRITY** — The Evolution Agent MUST NOT modify visual presentation (JSX/CSS/Tailwind classes, grid layouts, button styles, colors, typography) unless the user explicitly requests it. Logic changes stay in logic files.
2. **DATA INTEGRITY** — `image_url` from the database is the absolute source of truth. Evolution code must never overwrite or omit it.
3. **NO RAW SQL** — All database mutations go through SDK `db.commit()` or approved Supabase RPCs. The `run_sql` RPC is forbidden.
4. **PLAN BEFORE CODE** — No file may be created or modified until an Action Plan is approved by the user.
5. **BUSINESS NEVER STOPS** — All evolution work happens in an isolated sandbox. Production data flows are never interrupted.

---

## 1. Terminology

| Term | Definition |
|------|-----------|
| **Evolution** | A discrete, named change to icaffeOS (new feature, modification, extension) |
| **Action Plan** | A structured JSON document describing what the evolution will do, its impact, and its requirements |
| **Sandbox** | An isolated React context subtree where the evolution runs against mock data |
| **Promote** | The act of moving approved sandbox code into the live application |
| **Rollback** | Reversing a promoted evolution using the audit log |
| **Component Registry** | A manifest mapping component IDs to source files and data dependencies |
| **Correlation ID** | A UUID that links all operations within a single evolution session |

---

## 2. Role Gates

All evolution operations are gated by the employee's `access_level` from the 7-role hierarchy.

| Operation | Minimum Role | access_level | Notes |
|-----------|-------------|-------------|-------|
| Request an evolution | Manager | >= 8 | Staff cannot trigger evolutions |
| Approve an Action Plan | Manager | >= 8 | The requester can also approve |
| View Sandbox Preview | Manager | >= 8 | Read-only preview for anyone >= 8 |
| Promote to Live | Admin | >= 9 | Only Admin or Super Admin |
| Rollback a promotion | Admin | >= 9 | Must provide the rollback_token |
| Override sandbox safety | Super Admin | = 10 | Bypass table-write restrictions |

**Enforcement:** The Evolution Agent must call `sdk.auth.identify()` at the start of every session and validate the returned `EmployeeProfile.role` against these gates. If the role is insufficient, the agent responds with error `E_AUTH_INSUFFICIENT` and stops.

> **SDK TYPE UPDATE REQUIRED:** The current `EmployeeProfile` in `sdk/types/index.ts` defines `role` as `'admin' | 'manager' | 'barista' | 'staff'`. This spec requires expanding it to:
> ```typescript
> role: 'super_admin' | 'admin' | 'manager' | 'barista' | 'chef' | 'checker' | 'staff';
> access_level: number; // 2-10, matching the 7-role hierarchy
> ```
> The `access_level` field is needed for numeric comparison in role gates (`>= 8`, `>= 9`, `= 10`). Until the SDK types are updated, the Evolution Agent must derive `access_level` from the role string using: `{ super_admin: 10, admin: 9, manager: 8, chef: 5, barista: 4, checker: 3, staff: 2 }`.

---

## 3. Phase 1: Analysis & Action Plan

### 3.1 Trigger

The user describes what they want in natural language. Examples:
- "I want a KDS screen that only shows dessert orders."
- "Add a tip field to the checkout flow."
- "Show low-stock alerts on the POS screen."

### 3.2 Component Discovery

The agent first checks for `evolution-manifest.json` at the project root.

**If the manifest exists**, the agent looks up the target component by matching the user's intent to registered component IDs using `sdk.ai.consult()`.

**If the manifest does not exist** (current state), the agent falls back to codebase scanning:
1. Scan `frontend_source/src/pages/` and `frontend_source/src/components/` for `.tsx` and `.jsx` files.
2. For each file related to the user's intent, identify which Supabase tables and Dexie tables it accesses.
3. Generate a temporary registry entry for the target component and its neighbors.

### 3.3 Action Plan Schema

The agent MUST output a valid Action Plan matching this JSON schema before any code is written.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": [
    "evolution_id",
    "title",
    "description",
    "requested_by",
    "correlation_id",
    "timestamp",
    "target_component",
    "impact_analysis",
    "database_requirements",
    "security_audit",
    "files",
    "ui_changes"
  ],
  "properties": {
    "evolution_id": {
      "type": "string",
      "pattern": "^evo-[a-z0-9-]+$",
      "description": "Unique evolution identifier (e.g., evo-dessert-kds)"
    },
    "title": {
      "type": "string",
      "maxLength": 100
    },
    "description": {
      "type": "string",
      "description": "What this evolution does, in plain language"
    },
    "requested_by": {
      "type": "object",
      "required": ["employee_id", "role", "business_id"],
      "properties": {
        "employee_id": { "type": "string", "format": "uuid" },
        "role": { "type": "string", "enum": ["admin", "manager", "super_admin"] },
        "business_id": { "type": "string", "format": "uuid" }
      }
    },
    "correlation_id": {
      "type": "string",
      "format": "uuid",
      "description": "Links all operations in this evolution session"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time"
    },
    "target_component": {
      "type": "object",
      "required": ["component_id", "file_path"],
      "properties": {
        "component_id": { "type": "string" },
        "file_path": { "type": "string", "description": "Relative to frontend_source/" },
        "current_behavior": { "type": "string", "description": "How it works NOW" },
        "proposed_behavior": { "type": "string", "description": "How it will work AFTER the change" }
      }
    },
    "impact_analysis": {
      "type": "object",
      "required": ["affected_screens", "affected_supabase_tables", "affected_dexie_tables", "affected_rpcs", "risk_level"],
      "properties": {
        "affected_screens": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["file_path", "impact_type"],
            "properties": {
              "file_path": { "type": "string" },
              "impact_type": { "type": "string", "enum": ["direct_modification", "data_dependency", "ui_dependency", "none"] },
              "description": { "type": "string" }
            }
          }
        },
        "affected_supabase_tables": {
          "type": "array",
          "items": { "type": "string" }
        },
        "affected_dexie_tables": {
          "type": "array",
          "items": { "type": "string" }
        },
        "affected_rpcs": {
          "type": "array",
          "items": { "type": "string" },
          "description": "List of Supabase RPC function names this evolution touches"
        },
        "risk_level": {
          "type": "string",
          "enum": ["low", "medium", "high", "critical"],
          "description": "low = cosmetic change, medium = new feature with no schema change, high = schema change, critical = security or RLS change"
        }
      }
    },
    "database_requirements": {
      "type": "object",
      "required": ["needs_supabase_migration", "needs_dexie_version_bump", "new_rpc_functions"],
      "properties": {
        "needs_supabase_migration": { "type": "boolean" },
        "supabase_migration": {
          "type": "object",
          "properties": {
            "filename": { "type": "string", "pattern": "^\\d{14}_[a-z_]+\\.sql$" },
            "description": { "type": "string" },
            "tables_added": { "type": "array", "items": { "type": "string" } },
            "columns_added": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "table": { "type": "string" },
                  "column": { "type": "string" },
                  "type": { "type": "string" },
                  "nullable": { "type": "boolean" },
                  "default": { "type": "string" }
                }
              }
            },
            "rls_changes": { "type": "boolean" },
            "rls_policy_description": { "type": "string" }
          }
        },
        "needs_dexie_version_bump": { "type": "boolean" },
        "dexie_version": {
          "type": "object",
          "properties": {
            "from_version": { "type": "integer", "description": "Current highest version (currently 24)" },
            "to_version": { "type": "integer", "description": "Must be from_version + 1" },
            "new_stores": {
              "type": "object",
              "additionalProperties": { "type": "string" },
              "description": "Table name -> index definition"
            },
            "dropped_stores": {
              "type": "array",
              "items": { "type": "string" }
            }
          }
        },
        "new_rpc_functions": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["name", "security", "description"],
            "properties": {
              "name": { "type": "string" },
              "security": { "type": "string", "enum": ["INVOKER", "DEFINER"], "description": "DEFINER for atomic/privileged ops, INVOKER for standard" },
              "description": { "type": "string" },
              "parameters": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "name": { "type": "string" },
                    "type": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "security_audit": {
      "type": "object",
      "required": ["rls_affected", "exposes_financial_data", "requires_auth_change"],
      "properties": {
        "rls_affected": { "type": "boolean" },
        "rls_details": { "type": "string" },
        "exposes_financial_data": { "type": "boolean" },
        "requires_auth_change": { "type": "boolean" },
        "new_permissions_required": {
          "type": "array",
          "items": { "type": "string" }
        },
        "forbidden_patterns_check": {
          "type": "object",
          "description": "Agent must verify none of these are used",
          "properties": {
            "uses_raw_sql": { "type": "boolean", "const": false },
            "uses_service_role_key": { "type": "boolean", "const": false },
            "bypasses_rls": { "type": "boolean", "const": false },
            "modifies_auth_tables": { "type": "boolean", "const": false }
          }
        }
      }
    },
    "files": {
      "type": "object",
      "required": ["modified", "created"],
      "properties": {
        "modified": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["path", "change_type"],
            "properties": {
              "path": { "type": "string" },
              "change_type": { "type": "string", "enum": ["logic_only", "data_binding", "new_props", "refactor"] },
              "description": { "type": "string" }
            }
          }
        },
        "created": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["path", "purpose"],
            "properties": {
              "path": { "type": "string" },
              "purpose": { "type": "string" }
            }
          }
        }
      }
    },
    "ui_changes": {
      "type": "object",
      "required": ["modifies_layout", "modifies_styles"],
      "properties": {
        "modifies_layout": { "type": "boolean" },
        "modifies_styles": { "type": "boolean" },
        "layout_description": { "type": "string" },
        "style_description": { "type": "string" },
        "user_approval_required": {
          "type": "boolean",
          "description": "MUST be true if modifies_layout or modifies_styles is true"
        }
      }
    }
  }
}
```

### 3.4 Plan Validation Rules

Before presenting the plan to the user, the agent MUST validate:

| Rule ID | Check | Error Code | Severity |
|---------|-------|------------|----------|
| V-001 | `evolution_id` matches pattern `^evo-[a-z0-9-]+$` | `E_INVALID_ID` | BLOCK |
| V-002 | `requested_by.role` is `manager`, `admin`, or `super_admin` | `E_AUTH_INSUFFICIENT` | BLOCK |
| V-003 | `forbidden_patterns_check` has all values = `false` | `E_SECURITY_VIOLATION` | BLOCK |
| V-004 | If `modifies_layout` or `modifies_styles` = true, `user_approval_required` = true | `E_UI_APPROVAL_MISSING` | BLOCK |
| V-005 | If `needs_dexie_version_bump` = true, `to_version` = `from_version + 1` | `E_DEXIE_VERSION_GAP` | BLOCK |
| V-006 | If `needs_supabase_migration` = true, `filename` follows timestamp pattern | `E_MIGRATION_NAME` | WARN |
| V-007 | All `file_path` values point to files that exist (or are in `created`) | `E_FILE_NOT_FOUND` | WARN |
| V-008 | `rls_affected` = true triggers `risk_level` >= `critical` | `E_RISK_UNDERESTIMATED` | WARN |
| V-009 | `affected_rpcs` lists every RPC used by affected screens | `E_RPC_INCOMPLETE` | WARN |
| V-010 | `correlation_id` is a valid UUID v4 | `E_INVALID_CORRELATION` | BLOCK |

**BLOCK** = Plan cannot proceed. **WARN** = Plan can proceed but user is informed.

### 3.5 User Presentation

The agent presents the plan to the user in this format:

```
## Evolution Plan: {title}

### What Changes
{description}

### How It Works Now
{target_component.current_behavior}

### How It Will Work After
{target_component.proposed_behavior}

### Impact
- Screens affected: {count}
- Supabase tables: {list}
- Dexie tables: {list}
- Risk level: {risk_level}
- Needs DB migration: {yes/no}

### Security
- RLS changes: {yes/no}
- Financial data exposed: {yes/no}
- UI changes requiring approval: {yes/no}

### Files
- Modified: {list with descriptions}
- Created: {list with purposes}

Shall I proceed to the Sandbox?
```

### 3.6 User Response Handling

| User Response | Agent Action |
|---------------|-------------|
| "Yes" / "Proceed" / approval | Move to Phase 2 |
| "No" / rejection | Discard plan, ask for revised requirements |
| Modification request | Regenerate plan with adjustments |
| Silence / timeout | Hold. Do not proceed. Remind once. |

---

## 4. Phase 2: Sandboxed Mutation

### 4.1 Sandbox Initialization

Once the Action Plan is approved, the agent creates the sandbox environment:

```
Sandbox Lifecycle:
┌─────────────────────────────────────────────────┐
│  1. Read approved Action Plan                    │
│  2. Snapshot current Dexie data for target tables│
│  3. Create MockSDK with snapshot data            │
│  4. Wrap target component in SandboxProvider     │
│  5. Agent writes code changes                    │
│  6. Hot-Preview renders in Evolution Drawer      │
│  7. User reviews → approve / reject / modify     │
└─────────────────────────────────────────────────┘
```

### 4.2 Sandbox Configuration Schema

```json
{
  "type": "object",
  "required": ["evolution_id", "correlation_id", "sandbox_mode", "sdk_config", "data_snapshot"],
  "properties": {
    "evolution_id": { "type": "string" },
    "correlation_id": { "type": "string", "format": "uuid" },
    "sandbox_mode": {
      "type": "string",
      "enum": ["isolated", "shadow"],
      "description": "isolated = fully mocked data, shadow = reads live data but writes to mock"
    },
    "sdk_config": {
      "type": "object",
      "properties": {
        "auth_role": {
          "type": "string",
          "enum": ["staff", "manager", "admin"],
          "default": "staff",
          "description": "Default sandbox role is staff (least privilege)"
        },
        "writable_tables": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Only tables listed in the Action Plan's affected_supabase_tables"
        },
        "rate_limit": {
          "type": "object",
          "properties": {
            "writes_per_minute": { "type": "integer", "default": 100 },
            "queries_per_minute": { "type": "integer", "default": 500 }
          }
        }
      }
    },
    "data_snapshot": {
      "type": "object",
      "description": "Map of table_name -> array of records, prefilled from live Dexie",
      "additionalProperties": {
        "type": "array",
        "items": { "type": "object" }
      }
    }
  }
}
```

### 4.3 Code Generation Rules

The agent MUST follow these rules when writing code inside the sandbox:

**ALLOWED:**
- Import and use `ICaffeSDK` interfaces (`sdk.db.query`, `sdk.db.commit`, `sdk.ai.consult`, `sdk.auth.identify`)
- Use React 18 patterns (hooks, functional components, Suspense)
- Use Framer Motion for animations
- Use Tailwind CSS utility classes
- Import from `dexie-react-hooks` for reactive local queries
- Create new components in `frontend_source/src/components/evolution/{evolution_id}/`
- Create new pages in `frontend_source/src/pages/evolution/{evolution_id}/`

**FORBIDDEN:**
- Direct `supabase.from(...).select(...)` calls — use `sdk.db.query()` instead
- Direct `supabase.rpc('run_sql', ...)` — NEVER
- Importing the Supabase client directly
- Modifying files outside the `evolution/{evolution_id}/` directory during sandbox phase
- Using `eval()`, `new Function()`, or dynamic code execution
- Modifying `database.js` (Dexie schema) without a declared `dexie_version` in the plan
- Changing existing component styles (Tailwind classes, CSS modules) without `ui_changes.user_approval_required = true`
- Writing to tables not listed in `sdk_config.writable_tables`

**PATTERN — SDK Usage in Components:**

```tsx
// Every evolution component receives the SDK via context
import { useEvolutionSDK } from '../context/EvolutionSandboxContext';

function DessertKDS() {
  const sdk = useEvolutionSDK();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await sdk.db.query('orders', {
        order_status: 'ready',
        /* additional filters */
      });
      setOrders(data.filter(o => o.category === 'dessert'));
    };
    load();
  }, [sdk]);

  return (/* JSX */);
}
```

### 4.4 Error Handling in Sandbox

| Error Scenario | Agent Behavior |
|----------------|---------------|
| Component throws during render | ErrorBoundary catches it; agent logs the error and suggests a fix |
| `sdk.db.commit()` returns `success: false` | Agent reads `error` from QueryResult and adjusts code |
| Write to non-whitelisted table | SDK throws `E_TABLE_FORBIDDEN`; agent must revise the Action Plan to include the table |
| Rate limit exceeded | SDK throws `E_RATE_LIMITED`; agent must optimize query/write patterns |
| Sandbox data snapshot is empty | Agent warns user that preview will show empty state; offers to seed mock data |

### 4.5 Hot-Preview Specification

The Evolution Preview renders in a slide-out drawer:

```
┌──────────────────────────┬─────────────────────────┐
│                          │                         │
│    Live Application      │   Evolution Preview     │
│    (unaffected)          │   ┌───────────────────┐ │
│                          │   │ Status Bar:       │ │
│                          │   │ SANDBOX MODE      │ │
│                          │   │ evo-dessert-kds   │ │
│                          │   │ corr: abc-123...  │ │
│                          │   ├───────────────────┤ │
│                          │   │                   │ │
│                          │   │  Rendered          │ │
│                          │   │  Component         │ │
│                          │   │  (isolated)        │ │
│                          │   │                   │ │
│                          │   ├───────────────────┤ │
│                          │   │ [Approve] [Reject]│ │
│                          │   │ [Modify]  [Close] │ │
│                          │   └───────────────────┘ │
│                          │                         │
└──────────────────────────┴─────────────────────────┘
```

**Drawer properties:**
- Width: 50% viewport on desktop (min 480px), 100% on tablet/mobile
- Animation: Framer Motion `x` slide from right, 300ms ease-out
- Z-index: above app content, below modals (z-40)
- Status bar: fixed at top of drawer, shows sandbox indicator + correlation_id
- Error boundary: wraps the rendered component; shows fallback UI on crash

---

## 5. Phase 3: Validation & Promote

### 5.1 Pre-Promote Checklist

Before the "Promote to Live" button becomes active, the agent validates:

| Check | Description | Required |
|-------|-------------|----------|
| Plan approved | Action Plan was explicitly approved by user | YES |
| Sandbox renders | Component renders without ErrorBoundary fallback | YES |
| No forbidden patterns | Code review confirms no raw SQL, no direct Supabase, no eval | YES |
| Auth check | Current user role >= Admin (access_level >= 9) | YES |
| Migration ready | If `needs_supabase_migration`, SQL file is generated and validated | YES |
| Dexie compatible | If `needs_dexie_version_bump`, version is sequential | YES |
| Tests pass | If test files exist in `evolution/{evolution_id}/__tests__/`, they pass | RECOMMENDED |
| UI approval | If `ui_changes.modifies_layout = true`, user explicitly approved visuals | YES |

### 5.2 Promote Token Schema

```json
{
  "type": "object",
  "required": ["evolution_id", "correlation_id", "promoted_by", "promoted_at", "files_promoted", "rollback_token", "audit_entries"],
  "properties": {
    "evolution_id": { "type": "string" },
    "correlation_id": { "type": "string", "format": "uuid" },
    "promoted_by": {
      "type": "object",
      "required": ["employee_id", "role"],
      "properties": {
        "employee_id": { "type": "string", "format": "uuid" },
        "role": { "type": "string", "enum": ["admin", "super_admin"] }
      }
    },
    "promoted_at": { "type": "string", "format": "date-time" },
    "files_promoted": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["from_path", "to_path", "action"],
        "properties": {
          "from_path": { "type": "string", "description": "Path in evolution/ directory" },
          "to_path": { "type": "string", "description": "Final path in src/" },
          "action": { "type": "string", "enum": ["create", "replace", "patch"] }
        }
      }
    },
    "migration_applied": { "type": "boolean" },
    "dexie_version_bumped": { "type": "boolean" },
    "rollback_token": {
      "type": "string",
      "format": "uuid",
      "description": "Same as correlation_id; used to reverse this promotion"
    },
    "audit_entries": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["action_type", "table_name", "old_data", "new_data"],
        "properties": {
          "action_type": { "type": "string", "enum": ["PROMOTE_FILE", "PROMOTE_MIGRATION", "PROMOTE_DEXIE", "PROMOTE_RPC"] },
          "table_name": { "type": "string" },
          "record_id": { "type": "string" },
          "old_data": { "type": "object", "description": "State before promotion (for rollback)" },
          "new_data": { "type": "object", "description": "State after promotion" }
        }
      }
    }
  }
}
```

### 5.3 Promote Procedure

```
Promote-to-Live Flow:
┌─────────────────────────────────────────────────────────┐
│ 1. Agent validates pre-promote checklist (5.1)           │
│ 2. Agent calls sdk.auth.identify() → verify Admin+       │
│ 3. Agent generates Promote Token with all audit entries   │
│ 4. Agent presents token summary to user                   │
│ 5. User confirms: "Promote" or "Cancel"                   │
│ 6. IF confirmed:                                          │
│    a. Write audit entries to sdk_audit_logs (Supabase)    │
│    b. Move files from evolution/{id}/ to final paths      │
│    c. If migration: apply SQL to Supabase                 │
│    d. If Dexie bump: add new version block to database.js │
│    e. Log EVOLUTION_PROMOTED to sdk_audit_logs             │
│ 7. Agent responds: "Evolution {id} promoted. Rollback     │
│    token: {token}. Store this for reversal."              │
└─────────────────────────────────────────────────────────┘
```

### 5.4 Rollback Procedure

```
Rollback Flow:
┌─────────────────────────────────────────────────────────┐
│ 1. User provides rollback_token (= correlation_id)       │
│ 2. Agent calls sdk.auth.identify() → verify Admin+       │
│ 3. Agent queries sdk_audit_logs WHERE correlation_id =    │
│    rollback_token, ORDER BY created_at DESC               │
│ 4. For each audit entry (in reverse order):               │
│    a. Read old_data                                       │
│    b. Write old_data back to original table               │
│    c. Log ROLLBACK action to sdk_audit_logs               │
│ 5. Restore files from VCS (git) or backup                 │
│ 6. If Dexie version was bumped: NOTE — Dexie versions     │
│    cannot be decremented. The rollback adds a NEW version │
│    that restores the previous schema state.               │
│ 7. Agent responds: "Evolution {id} rolled back. {n}       │
│    records restored."                                     │
└─────────────────────────────────────────────────────────┘
```

**Important:** Dexie.js does not support version decrement. A rollback that removes a table added by the evolution must create a new version (e.g., 26) that sets the removed table to `null`, rather than reverting to version 24.

---

## 6. Error Codes

| Code | Phase | Description | Resolution |
|------|-------|-------------|------------|
| `E_AUTH_INSUFFICIENT` | All | User role below minimum for operation | Inform user; suggest escalation to Admin |
| `E_PLAN_REQUIRED` | 2, 3 | Code generation attempted without approved plan | Stop and return to Phase 1 |
| `E_INVALID_ID` | 1 | Evolution ID doesn't match pattern | Regenerate with valid pattern |
| `E_SECURITY_VIOLATION` | 1, 2 | Forbidden pattern detected (raw SQL, service key, etc.) | Remove violating code; regenerate |
| `E_TABLE_FORBIDDEN` | 2 | Write attempted to non-whitelisted table | Revise Action Plan to include table, or remove the write |
| `E_RATE_LIMITED` | 2 | Too many SDK operations per minute | Batch operations; reduce frequency |
| `E_DEXIE_VERSION_GAP` | 1 | Proposed Dexie version is not sequential | Use next version after current max |
| `E_UI_APPROVAL_MISSING` | 1 | UI changes flagged but not marked for approval | Set `user_approval_required = true` |
| `E_RISK_UNDERESTIMATED` | 1 | RLS change present but risk_level < critical | Bump risk_level to critical |
| `E_SANDBOX_CRASH` | 2 | Component threw during sandbox render | Log stack trace; agent suggests fix |
| `E_PROMOTE_FAILED` | 3 | File move or migration application failed | Halt promotion; do not partial-promote |
| `E_ROLLBACK_PARTIAL` | 3 | Some audit entries couldn't be reversed | Log which entries failed; alert Super Admin |
| `E_FILE_NOT_FOUND` | 1 | Referenced file doesn't exist | Verify path; add to `created` list if new |
| `E_RPC_INCOMPLETE` | 1 | Not all RPCs listed in impact analysis | Scan affected components for RPC usage |
| `E_MIGRATION_NAME` | 1 | Migration filename doesn't match timestamp pattern | Regenerate with `YYYYMMDDHHMMSS_description.sql` |
| `E_INVALID_CORRELATION` | 1 | Correlation ID is not valid UUID v4 | Generate a new UUID |

---

## 7. File Structure Convention

```
frontend_source/
├── src/
│   ├── components/
│   │   ├── evolution/                    # All evolution sandboxes live here
│   │   │   ├── evo-dessert-kds/          # One folder per evolution
│   │   │   │   ├── DessertKDS.tsx        # The sandboxed component
│   │   │   │   ├── helpers.ts            # Evolution-specific utilities
│   │   │   │   ├── action-plan.json      # The approved Action Plan
│   │   │   │   ├── sandbox-config.json   # Sandbox configuration
│   │   │   │   ├── promote-token.json    # Generated at promote time
│   │   │   │   └── __tests__/            # Optional test files
│   │   │   │       └── DessertKDS.test.tsx
│   │   │   └── evo-tip-checkout/
│   │   │       └── ...
│   │   └── shared/
│   │       └── EvolutionPreviewDrawer.tsx # The reusable preview shell
│   ├── context/
│   │   └── EvolutionSandboxContext.tsx    # Provides MockSDK to sandbox subtree
│   └── ...
├── supabase/
│   └── migrations/
│       └── 20260217120000_evo_dessert_kds.sql  # If migration required
└── evolution-manifest.json               # Component Registry (generated)
```

---

## 8. SDK Integration Map

This table shows the relationship between Evolution Engine operations and the existing SDK interfaces defined in `sdk/types/index.ts`:

| Evolution Operation | SDK Method | Interface | Notes |
|--------------------|-----------|-----------|----- |
| Identify current user | `sdk.auth.identify()` | `AuthInterface` | Must bridge to Maya (Face/PIN) |
| Read data for component | `sdk.db.query(table, filter)` | `DBInterface` | Returns `QueryResult` with correlation_id |
| Write data from component | `sdk.db.commit(table, data, opts)` | `DBInterface` | Returns `CommitResult` with rollback_token |
| Generate plan suggestions | `sdk.ai.consult(prompt, ctx)` | `AIInterface` | Uses Maya-Lite for impact analysis |
| Sandbox data isolation | `createMockSDK(initialData)` | — | From `sdk/sandbox/mockCore.ts` |
| Audit logging | `sdk_audit_logs` table | — | Written by `CoreDB._logOperation()` (needs real implementation) |

**Missing from current SDK (must be added):**

| Needed Method | Proposed Interface | Purpose |
|---------------|--------------------|---------|
| `sdk.db.rollback(token)` | `DBInterface` | Reverse a commit using audit log |
| `sdk.db.queryLocal(table, filter)` | `DexieInterface` (new) | Query Dexie tables through SDK |
| `sdk.db.commitLocal(table, data, opts)` | `DexieInterface` (new) | Write to Dexie through SDK |
| `sdk.registry.lookup(componentId)` | `RegistryInterface` (new) | Look up component in manifest |
| `sdk.evolution.getPlan(evoId)` | `EvolutionInterface` (new) | Retrieve a stored Action Plan |
| `sdk.evolution.promote(evoId, token)` | `EvolutionInterface` (new) | Execute the promote flow |

---

## 9. Compatibility Notes

### Current Codebase Patterns (What NOT to Break)

1. **~90% of components use direct Supabase calls** (`supabase.from(...).select(...)`). The Evolution Engine does not require migrating these. Only new evolution code must use the SDK.

2. **Zustand store** (`core/store.js`) manages user, menu, cart, and KDS state. Evolution components may read from the Zustand store but should not write to it. Instead, use SDK methods that the store can subscribe to.

3. **8+ React Context providers** wrap the app. Evolution components inherit these contexts (Theme, Auth, Offline, Connection) naturally. The `EvolutionSandboxContext` adds one more layer, specifically for SDK injection.

4. **Dexie v24 is the current schema.** The next evolution that needs a Dexie change MUST use version 25. No gaps.

5. **Framer Motion v10.18.0** is installed. The Evolution Preview Drawer should use `motion.div` with `AnimatePresence` for enter/exit transitions.

6. **Tailwind with CSS variables** (`--color-primary`, `--color-secondary`). Evolution components should use these variables rather than hardcoded colors, to respect the existing theme system.

---

## 10. Example: Complete Evolution Walkthrough

**User request:** "I want a KDS screen that only shows dessert orders."

### Phase 1 Output (Action Plan):

```json
{
  "evolution_id": "evo-dessert-kds",
  "title": "Dessert-Only KDS Screen",
  "description": "A new KDS view that filters orders to show only items from the dessert category, with the same card layout as the main KDS.",
  "requested_by": {
    "employee_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "role": "admin",
    "business_id": "22222222-2222-2222-2222-222222222222"
  },
  "correlation_id": "c1d2e3f4-a5b6-7890-abcd-ef1234567890",
  "timestamp": "2026-02-17T14:30:00Z",
  "target_component": {
    "component_id": "kds-main",
    "file_path": "src/pages/kds/index.jsx",
    "current_behavior": "Displays all active orders grouped by status (new, in-progress, ready). Filters by business_id. Uses Dexie for local state and Supabase realtime for updates.",
    "proposed_behavior": "A new screen (DessertKDS) that applies an additional filter: only shows order_items where menu_item.category = 'dessert'. Same card layout and status flow as main KDS."
  },
  "impact_analysis": {
    "affected_screens": [
      { "file_path": "src/pages/kds/index.jsx", "impact_type": "data_dependency", "description": "Shares the same orders table; no modification needed" },
      { "file_path": "src/Routes.jsx", "impact_type": "direct_modification", "description": "New route /kds/dessert must be added" }
    ],
    "affected_supabase_tables": ["orders", "order_items", "menu_items"],
    "affected_dexie_tables": ["orders", "order_items", "menu_items"],
    "affected_rpcs": ["get_kds_orders", "update_order_status_v3"],
    "risk_level": "low"
  },
  "database_requirements": {
    "needs_supabase_migration": false,
    "needs_dexie_version_bump": false,
    "new_rpc_functions": []
  },
  "security_audit": {
    "rls_affected": false,
    "exposes_financial_data": false,
    "requires_auth_change": false,
    "new_permissions_required": [],
    "forbidden_patterns_check": {
      "uses_raw_sql": false,
      "uses_service_role_key": false,
      "bypasses_rls": false,
      "modifies_auth_tables": false
    }
  },
  "files": {
    "modified": [
      { "path": "src/Routes.jsx", "change_type": "new_props", "description": "Add route for /kds/dessert" }
    ],
    "created": [
      { "path": "src/components/evolution/evo-dessert-kds/DessertKDS.tsx", "purpose": "Main dessert KDS component" },
      { "path": "src/components/evolution/evo-dessert-kds/action-plan.json", "purpose": "Stored Action Plan" }
    ]
  },
  "ui_changes": {
    "modifies_layout": false,
    "modifies_styles": false,
    "user_approval_required": false
  }
}
```

### Phase 2: Agent generates `DessertKDS.tsx` using `sdk.db.query()`, wraps in `EvolutionSandboxProvider`, user previews in the drawer.

### Phase 3: User approves. Admin clicks "Promote." File moves from `evolution/evo-dessert-kds/` to `src/pages/KDSDessert.tsx`. Route added. Promote token saved.

---

## Appendix A: Changelog

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-02-17 | Initial specification |
