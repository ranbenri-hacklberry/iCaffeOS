/**
 * GlassLayout — Primary application shell.
 *
 * ┌────────────────────────────────────────────────────────────┐
 * │  TopBar                                                    │
 * ├─────────────────────────┬──────────────────────────────────┤
 * │                         │                                  │
 * │  ContextPanel           │  ChatPanel                       │
 * │  (md: 360px fixed)      │  (md: flex-1)                    │
 * │                         │                                  │
 * └─────────────────────────┴──────────────────────────────────┘
 *
 * Mobile (<md):
 *   • ChatPanel fills the full viewport.
 *   • ContextPanel lives inside <ContextDrawer> (slides in from left).
 *   • Drawer toggled by the ≡ button in the chat header.
 *
 * Desktop (md+):
 *   • 2-column CSS grid: [360px  1fr].
 *   • Both panels rendered as glass cards side-by-side.
 *   • Drawer never mounts.
 */

import React from "react";
import { useCortexStore } from "../../store/cortexStore";
import ContextPanel from "./ContextPanel";
import ChatPanel from "./ChatPanel";
import ContextDrawer from "../ui/ContextDrawer";

// ── Tiny glass-card wrapper ───────────────────────────────────────────

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={[
        "bg-white/[0.06] backdrop-blur-xl",
        "border border-white/[0.12]",
        "rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
        "overflow-hidden",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

// ── TopBar ────────────────────────────────────────────────────────────

const VERTICAL_BADGE: Record<string, { label: string; cls: string }> = {
  IT_LAB:   { label: "IT Lab",     cls: "text-cyan-300   bg-cyan-500/15   border-cyan-500/30"   },
  LAW_FIRM: { label: "Law Firm",   cls: "text-amber-300  bg-amber-500/15  border-amber-500/30"  },
  CAFE:     { label: "Cafe",       cls: "text-emerald-300 bg-emerald-500/15 border-emerald-500/30" },
};

function TopBar({
  businessName,
  businessType,
  onReset,
}: {
  businessName: string;
  businessType: string;
  onReset: () => void;
}) {
  const badge = VERTICAL_BADGE[businessType] ?? { label: businessType, cls: "text-slate-300 bg-white/10 border-white/20" };

  return (
    <header className="shrink-0 flex items-center gap-3 px-4 md:px-6 h-14 border-b border-white/[0.08] bg-black/20 backdrop-blur-sm">
      {/* Wordmark */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-indigo-600 grid place-items-center text-white font-bold text-xs select-none shadow-lg shadow-indigo-900/50">
          C
        </div>
        <span className="font-semibold text-white text-sm tracking-tight hidden sm:block">
          {businessName}
        </span>
      </div>

      {/* Vertical badge */}
      <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${badge.cls}`}>
        {badge.label}
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Settings */}
      <button
        onClick={onReset}
        title="Re-run onboarding"
        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.07] transition"
        aria-label="Settings"
      >
        <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current">
          <path
            fillRule="evenodd"
            d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </header>
  );
}

// ── GlassLayout ───────────────────────────────────────────────────────

export default function GlassLayout() {
  const {
    tenant,
    selectedRecordId,
    setSelectedRecordId,
    isContextDrawerOpen,
    openContextDrawer,
    closeContextDrawer,
    toggleContextDrawer,
    resetTenant,
  } = useCortexStore();

  if (!tenant) return null; // App.tsx guarantees this never renders without a tenant

  return (
    <div className="h-dvh bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col overflow-hidden">

      {/* ── Top navigation bar ──────────────────────────────────── */}
      <TopBar
        businessName={tenant.businessName}
        businessType={tenant.businessType}
        onReset={resetTenant}
      />

      {/* ── Content area ────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 relative">

        {/* ════════════════════════════════════════════════════════
            DESKTOP  (md+)  —  2-column glass grid
            ════════════════════════════════════════════════════════ */}
        <div className="hidden md:grid md:grid-cols-[360px_1fr] md:gap-4 md:p-4 h-full">

          {/* Left: Context panel */}
          <GlassCard>
            <ContextPanel
              businessType={tenant.businessType}
              selectedRecordId={selectedRecordId}
              onSelectRecord={setSelectedRecordId}
            />
          </GlassCard>

          {/* Right: Chat panel */}
          <GlassCard>
            <ChatPanel
              tenant={tenant}
              selectedRecordId={selectedRecordId}
              showContextToggle={false}
            />
          </GlassCard>

        </div>

        {/* ════════════════════════════════════════════════════════
            MOBILE  (<md)  —  full-screen chat + drawer
            ════════════════════════════════════════════════════════ */}
        <div className="md:hidden h-full">
          <ChatPanel
            tenant={tenant}
            selectedRecordId={selectedRecordId}
            showContextToggle
            onContextToggle={toggleContextDrawer}
          />
        </div>

        {/* ── Mobile context drawer (never rendered on md+) ─────── */}
        <div className="md:hidden">
          <ContextDrawer isOpen={isContextDrawerOpen} onClose={closeContextDrawer}>
            <ContextPanel
              businessType={tenant.businessType}
              selectedRecordId={selectedRecordId}
              onSelectRecord={(id) => {
                setSelectedRecordId(id);
                closeContextDrawer();
              }}
            />
          </ContextDrawer>
        </div>

      </div>
    </div>
  );
}
