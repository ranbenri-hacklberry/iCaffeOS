# 🔧 MAYA/GROK ANALYSIS REQUEST: Kanban ↔ KDS Sync Issues

**Date:** January 2, 2026  
**Priority:** CRITICAL - Production Sync Bug

---

## 🎯 Problem Summary

There are **critical synchronization issues** between the **Kanban board** (`/kanban`) and the **KDS screen** (`/kds`).

### Key Facts

- ✅ **KDS has been working perfectly** for a long time
- ❌ **Kanban has sync issues** - suspected to be the ONLY problem area
- 🔍 **Root cause is likely in `/hooks/useOrders.js`** (used by Kanban)

### Observed Issues

1. **Status updates from Kanban don't sync properly** - When dragging a card to a new column, the status sometimes doesn't update in the database or reverts
2. **Orders appear in wrong columns** - Orders show up in incorrect status columns after refresh
3. **Customer data missing** - Customer names/phones sometimes don't load correctly (shows "אורח" instead of real name)
4. **Real-time updates not reflecting** - Changes made in KDS don't immediately appear in Kanban and vice versa

---

## 📋 Previous Fix Attempts (ALL FAILED)

1. ❌ Added `.maybeSingle()` instead of `.single()` - Didn't fix the core issue
2. ❌ Tried using RPC calls instead of direct table access - Partially worked but introduced new issues
3. ❌ Various state management tweaks - Temporary fixes that reverted

---

## 🏗️ Architecture Overview

### Kanban System Uses

- **`/pages/kanban/index.jsx`** - Main Kanban page
- **`/components/kanban/KanbanBoard.jsx`** - DnD board with columns
- **`/hooks/useOrders.js`** - Custom hook for order management ⚠️ **THIS IS LIKELY THE PROBLEM**

### KDS System Uses (WORKING CORRECTLY ✅)

- **`/pages/kds/index.jsx`** - Main KDS screen  
- **`/pages/kds/hooks/useKDSData.js`** - Custom hook (2400+ lines, stable and working)

### Key Differences

- KDS uses `useKDSData.js` which is **well-tested and stable**
- Kanban uses `useOrders.js` which has **sync issues**
- Both should be reading from the **SAME Supabase tables**

---

## 🧠 ANALYSIS REQUEST

Please analyze the code in `MAYA_KANBAN_SYNC_ANALYSIS.md` (same directory) and:

1. **Identify the root cause** of the Kanban ↔ KDS sync issues
2. **Explain why KDS works but Kanban doesn't** (they should use similar logic)
3. **Provide a COMPLETE, FIXED version of `useOrders.js`** that solves all sync issues
4. **Consider:**
   - Status field mapping (`order_status` vs `orderStatus`)
   - Column name mapping (`in_prep` vs `in_progress`)
   - Real-time subscription handling
   - Dexie ↔ Supabase sync timing
   - Optimistic updates and rollback
   - The `pending_sync` protection mechanism

**⚠️ IMPORTANT: Return the ENTIRE fixed file, not partial snippets.**

---

## 📁 Full Code Files

All relevant code files are provided in:
**`MAYA_KANBAN_SYNC_ANALYSIS.md`** (in the same directory)

This includes:

- Complete `useOrders.js` (577 lines)
- Complete `KanbanBoard.jsx`
- Complete `/pages/kanban/index.jsx`
- Relevant excerpts from `useKDSData.js` for comparison

---

*Waiting for analysis and complete fixed code...*
