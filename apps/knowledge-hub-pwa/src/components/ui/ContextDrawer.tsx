/**
 * ContextDrawer — Mobile-only sliding panel.
 *
 * Renders as a fixed overlay that slides in from the left.
 * On md+ screens this component is never mounted (handled by parent).
 *
 * Behaviour:
 *  • Backdrop darkens behind the panel.
 *  • Clicking the backdrop closes the drawer.
 *  • Body scroll is locked while open.
 *  • CSS-only animation — no external dep required.
 */

import React, { useEffect } from "react";

interface ContextDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function ContextDrawer({
  isOpen,
  onClose,
  children,
}: ContextDrawerProps) {
  // ── Lock body scroll while drawer is open ────────────────────────
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      {/* ── Backdrop ──────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={[
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm",
          "transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
      />

      {/* ── Sliding panel ─────────────────────────────────────────── */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Context panel"
        className={[
          // Positioning
          "fixed top-0 left-0 z-50 h-full w-[85vw] max-w-sm",
          // Glass surface
          "bg-slate-900/95 backdrop-blur-2xl",
          "border-r border-white/10 shadow-2xl",
          // Slide animation
          "transform transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          // Layout
          "flex flex-col",
        ].join(" ")}
      >
        {/* Drag handle (decorative) */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-12 rounded-full bg-white/10" />

        {/* Close button */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2 border-b border-white/10">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Context
          </span>
          <button
            onClick={onClose}
            aria-label="Close context panel"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            {/* × icon */}
            <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current">
              <path d="M4.293 4.293a1 1 0 011.414 0L8 6.586l2.293-2.293a1 1 0 111.414 1.414L9.414 8l2.293 2.293a1 1 0 01-1.414 1.414L8 9.414l-2.293 2.293a1 1 0 01-1.414-1.414L6.586 8 4.293 5.707a1 1 0 010-1.414z" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </aside>
    </>
  );
}
