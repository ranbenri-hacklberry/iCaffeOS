/**
 * PrivacyShield — The "Trust Receipt" component.
 *
 * Renders next to every user message.
 * When the privacy receipt has isActive=true (PII was detected):
 *   • A green animated shield icon appears with a pulsing ring.
 *   • Clicking opens the "Vault" popover showing:
 *       – Which entity tokens were masked  (e.g. [EMAIL_1], [PHONE_1])
 *       – A collapsible "View Sanitized Prompt" section
 *
 * When isActive=false (no PII detected):
 *   • A subtle grey shield renders without animation or popover.
 *
 * Design constraints:
 *   • Pure CSS positioning (bottom-full) — no portal needed.
 *   • Click-outside closes the popover.
 *   • Framer Motion handles all enter/exit animations.
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { PrivacyReceipt } from "../../hooks/useCortexStream";

// ── Icons ─────────────────────────────────────────────────────────────

function ShieldIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7.001c0-.682.057-1.35.166-2.002zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={`w-3 h-3 fill-current transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

// ── Props ─────────────────────────────────────────────────────────────

interface Props {
  privacy: PrivacyReceipt;
}

// ── Component ─────────────────────────────────────────────────────────

export default function PrivacyShield({ privacy }: Props) {
  const [isOpen,      setIsOpen]      = useState(false);
  const [showPrompt,  setShowPrompt]  = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Close on click-outside ────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowPrompt(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const isActive = privacy.isActive;

  return (
    <div ref={containerRef} className="relative flex-none self-end mb-1">

      {/* ── Shield trigger ──────────────────────────────────────── */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 22, delay: 0.25 }}
        onClick={() => isActive && setIsOpen((v) => !v)}
        aria-label={isActive ? "View privacy receipt" : "No PII detected"}
        aria-expanded={isOpen}
        className={[
          "relative p-1.5 rounded-lg transition",
          isActive
            ? "text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
            : "text-slate-600 cursor-default",
        ].join(" ")}
      >
        {/* Expanding ring pulse — only when PII was masked */}
        {isActive && (
          <motion.span
            className="absolute inset-0 rounded-lg border border-emerald-400/50"
            animate={{ scale: [1, 1.55], opacity: [0.7, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <ShieldIcon />
      </motion.button>

      {/* ── "Vault" popover ─────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && isActive && (
          <motion.div
            key="vault"
            initial={{ opacity: 0, y: 8,  scale: 0.94 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: 8,  scale: 0.94 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={[
              // Positioning: above and to the right of the shield (user messages are right-aligned)
              "absolute bottom-full right-0 mb-3 z-50",
              "w-72 sm:w-80",
              // Glass surface
              "bg-slate-900/95 backdrop-blur-2xl",
              "border border-white/[0.12] rounded-2xl shadow-2xl",
              "p-4 space-y-3",
            ].join(" ")}
          >

            {/* Header */}
            <div className="flex items-center gap-2 pb-2 border-b border-white/[0.08]">
              <ShieldIcon className="w-3.5 h-3.5 text-emerald-400" />
              <p className="text-xs font-semibold text-emerald-300">Privacy Shield Active</p>
            </div>

            {/* Explanation */}
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Cortex protected your data. The following entities were tokenized and{" "}
              <span className="text-white font-medium">never left this device</span>:
            </p>

            {/* Token chips */}
            <div className="flex flex-wrap gap-1.5">
              {privacy.maskedEntities.length > 0 ? (
                privacy.maskedEntities.map((entity) => (
                  <span
                    key={entity}
                    className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono"
                  >
                    {entity}
                  </span>
                ))
              ) : (
                <span className="text-slate-500 text-[11px]">No entities</span>
              )}
            </div>

            {/* Sanitized prompt toggle */}
            <div className="border-t border-white/[0.08] pt-3">
              <button
                onClick={() => setShowPrompt((v) => !v)}
                className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 transition w-full text-left"
              >
                <ChevronIcon open={showPrompt} />
                {showPrompt ? "Hide" : "View"} Sanitized Prompt
              </button>

              <AnimatePresence>
                {showPrompt && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{    height: 0,      opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <pre
                      className={[
                        "mt-2 p-2.5 rounded-xl",
                        "bg-black/30 border border-white/[0.07]",
                        "text-[10px] text-slate-400 font-mono",
                        "whitespace-pre-wrap break-all leading-relaxed",
                        "max-h-32 overflow-y-auto",
                      ].join(" ")}
                    >
                      {privacy.sanitizedPrompt}
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Close hint */}
            <p className="text-[10px] text-slate-600 text-center">
              Click outside to close
            </p>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
