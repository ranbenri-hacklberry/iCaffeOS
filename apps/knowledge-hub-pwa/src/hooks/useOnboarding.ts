/**
 * useOnboarding — React Hook
 *
 * Manages reading and writing the tenant's onboarding configuration.
 * On first load, checks localStorage for a saved tenant_id and
 * re-fetches the config from the Cortex Gateway.
 */

import { useCallback, useEffect, useState } from "react";
import { cortexFetch } from "../lib/api";
import type { BusinessType, Tone } from "./useCortexStream";

const TENANT_KEY = "cortex_tenant_id";

// ── Types ─────────────────────────────────────────────────────────────

export interface OnboardingData {
  business_name: string;
  business_type: BusinessType;
  core_entities: string[];
  tone_of_voice: Tone;
  custom_instructions?: string;
}

export interface SavedConfig extends OnboardingData {
  id: string;
}

export interface UseOnboardingReturn {
  tenantId: string | null;
  savedConfig: SavedConfig | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  isOnboarded: boolean;
  saveOnboarding: (data: OnboardingData) => Promise<void>;
  resetOnboarding: () => void;
}

// ── Hook ──────────────────────────────────────────────────────────────

export function useOnboarding(): UseOnboardingReturn {
  const [tenantId, setTenantId] = useState<string | null>(
    () => localStorage.getItem(TENANT_KEY),
  );
  const [savedConfig, setSavedConfig] = useState<SavedConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Load existing config on mount ─────────────────────────────────
  useEffect(() => {
    if (!tenantId) return;

    setIsLoading(true);
    cortexFetch<SavedConfig>(`/api/onboarding/${tenantId}`)
      .then((config) => setSavedConfig(config))
      .catch((err) => {
        // If 404 the stored id is stale — clear it
        console.warn("Onboarding config not found, resetting:", err);
        localStorage.removeItem(TENANT_KEY);
        setTenantId(null);
      })
      .finally(() => setIsLoading(false));
  }, [tenantId]);

  // ── Save / upsert config ──────────────────────────────────────────
  const saveOnboarding = useCallback(async (data: OnboardingData) => {
    setIsSaving(true);
    setError(null);

    try {
      const result = await cortexFetch<{ success: boolean; tenant_id: string }>(
        "/api/onboarding",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      );

      const newTenantId = result.tenant_id;
      localStorage.setItem(TENANT_KEY, newTenantId);
      setTenantId(newTenantId);
      setSavedConfig({ ...data, id: newTenantId });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save failed";
      setError(msg);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // ── Reset (re-run wizard) ─────────────────────────────────────────
  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(TENANT_KEY);
    setTenantId(null);
    setSavedConfig(null);
  }, []);

  return {
    tenantId,
    savedConfig,
    isLoading,
    isSaving,
    error,
    isOnboarded: !!savedConfig,
    saveOnboarding,
    resetOnboarding,
  };
}
