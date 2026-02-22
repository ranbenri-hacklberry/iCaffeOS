/**
 * cortexStore.ts — Global Zustand state for the Cortex PWA.
 *
 * Single source of truth for:
 *   • Tenant identity (read from / synced to localStorage)
 *   • Active record selection
 *   • Mobile context-drawer open/close
 *
 * No API calls live here — just UI + identity state.
 */

import { create } from "zustand";

// ── Types ─────────────────────────────────────────────────────────────

export type BusinessType = "IT_LAB" | "LAW_FIRM" | "CAFE";
export type Tone = "professional" | "friendly" | "technical" | "casual";

export interface TenantConfig {
  id: string;
  businessName: string;
  businessType: BusinessType;
  tone: Tone;
}

// ── Storage keys ──────────────────────────────────────────────────────

const LS = {
  TENANT_ID:   "cortex_tenant_id",
  BIZ_TYPE:    "cortex_business_type",
  BIZ_NAME:    "cortex_business_name",
  TONE:        "cortex_tone",
} as const;

function readTenantFromStorage(): TenantConfig | null {
  const id   = localStorage.getItem(LS.TENANT_ID);
  const type = localStorage.getItem(LS.BIZ_TYPE) as BusinessType | null;
  const name = localStorage.getItem(LS.BIZ_NAME);
  const tone = (localStorage.getItem(LS.TONE) ?? "professional") as Tone;
  if (!id || !type || !name) return null;
  return { id, businessType: type, businessName: name, tone };
}

function writeTenantToStorage(cfg: TenantConfig) {
  localStorage.setItem(LS.TENANT_ID,   cfg.id);
  localStorage.setItem(LS.BIZ_TYPE,    cfg.businessType);
  localStorage.setItem(LS.BIZ_NAME,    cfg.businessName);
  localStorage.setItem(LS.TONE,        cfg.tone);
}

function clearTenantFromStorage() {
  Object.values(LS).forEach((k) => localStorage.removeItem(k));
}

// ── Store interface ───────────────────────────────────────────────────

interface CortexState {
  // ── Tenant ────────────────────────────────────────────────────────
  tenant: TenantConfig | null;
  setTenant: (cfg: TenantConfig) => void;
  resetTenant: () => void;

  // ── Active record ─────────────────────────────────────────────────
  selectedRecordId: string | null;
  setSelectedRecordId: (id: string | null) => void;

  // ── Mobile drawer ─────────────────────────────────────────────────
  isContextDrawerOpen: boolean;
  openContextDrawer: () => void;
  closeContextDrawer: () => void;
  toggleContextDrawer: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────

export const useCortexStore = create<CortexState>((set) => ({
  // ── Tenant — initialised from localStorage on first load ──────────
  tenant: readTenantFromStorage(),

  setTenant: (cfg) => {
    writeTenantToStorage(cfg);
    set({ tenant: cfg });
  },

  resetTenant: () => {
    clearTenantFromStorage();
    set({ tenant: null, selectedRecordId: null, isContextDrawerOpen: false });
  },

  // ── Active record ─────────────────────────────────────────────────
  selectedRecordId: null,

  setSelectedRecordId: (id) =>
    set({ selectedRecordId: id, isContextDrawerOpen: false }), // auto-close drawer on select

  // ── Mobile drawer ─────────────────────────────────────────────────
  isContextDrawerOpen: false,
  openContextDrawer:  () => set({ isContextDrawerOpen: true }),
  closeContextDrawer: () => set({ isContextDrawerOpen: false }),
  toggleContextDrawer: () =>
    set((s) => ({ isContextDrawerOpen: !s.isContextDrawerOpen })),
}));
