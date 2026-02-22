/**
 * App.tsx — Onboarding Gate
 *
 * Reads tenant from Zustand (initialised from localStorage on import).
 * No async loading needed — store hydration is synchronous.
 *
 *   tenant === null  →  <OnboardingWizard>  (writes to store on complete)
 *   tenant !== null  →  <GlassLayout>       (reads from store internally)
 */

import React from "react";
import { useCortexStore } from "./store/cortexStore";
import OnboardingWizard from "./components/OnboardingWizard";
import GlassLayout from "./components/GlassLayout";

export default function App() {
  const tenant = useCortexStore((s) => s.tenant);

  if (!tenant) return <OnboardingWizard />;

  return <GlassLayout />;
}
