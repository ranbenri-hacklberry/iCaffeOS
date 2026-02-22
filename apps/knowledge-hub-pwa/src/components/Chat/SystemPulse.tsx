/**
 * SystemPulse — Real-time status orchestrator.
 *
 * Renders a single animated pill that reflects the current stream phase.
 * Transitions smoothly between states using Framer Motion AnimatePresence.
 * Invisible when status is "idle".
 *
 * States:
 *   masking  → 🔒 Masking PII…
 *   fetching → 🔍 Fetching context…
 *   thinking → 🧠 Thinking…
 *   writing  → ✍️  Responding…
 *   error    → ⚠️  Error
 */

import { AnimatePresence, motion } from "framer-motion";
import type { StreamStatus } from "../../hooks/useCortexStream";

// ── Config ────────────────────────────────────────────────────────────

interface PulseConfig {
  icon:  string;
  label: string;
  ring:  string; // dot-pulse color
  bg:    string;
  text:  string;
  border:string;
}

const CONFIGS: Partial<Record<StreamStatus, PulseConfig>> = {
  masking: {
    icon: "🔒", label: "Masking PII…",
    ring:   "bg-amber-400",
    bg:     "bg-amber-500/10",
    text:   "text-amber-300",
    border: "border-amber-500/25",
  },
  fetching: {
    icon: "🔍", label: "Fetching context…",
    ring:   "bg-sky-400",
    bg:     "bg-sky-500/10",
    text:   "text-sky-300",
    border: "border-sky-500/25",
  },
  thinking: {
    icon: "🧠", label: "Thinking…",
    ring:   "bg-violet-400",
    bg:     "bg-violet-500/10",
    text:   "text-violet-300",
    border: "border-violet-500/25",
  },
  writing: {
    icon: "✍️", label: "Responding…",
    ring:   "bg-emerald-400",
    bg:     "bg-emerald-500/10",
    text:   "text-emerald-300",
    border: "border-emerald-500/25",
  },
  error: {
    icon: "⚠️", label: "Error",
    ring:   "bg-red-400",
    bg:     "bg-red-500/10",
    text:   "text-red-300",
    border: "border-red-500/25",
  },
};

// ── Dot loader ────────────────────────────────────────────────────────

function DotLoader({ color }: { color: string }) {
  return (
    <span className="flex items-center gap-0.5 ml-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className={`w-1 h-1 rounded-full ${color}`}
          animate={{ opacity: [0.25, 1, 0.25] }}
          transition={{ duration: 1.1, delay: i * 0.18, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────

export default function SystemPulse({ status }: { status: StreamStatus }) {
  const config = CONFIGS[status];

  return (
    <AnimatePresence mode="wait">
      {config && (
        <motion.div
          key={status}
          initial={{ opacity: 0, y: 5, scale: 0.92 }}
          animate={{ opacity: 1, y: 0,  scale: 1    }}
          exit={{    opacity: 0, y: -5, scale: 0.92 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          className={[
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
            "border text-xs font-medium select-none",
            config.bg, config.text, config.border,
          ].join(" ")}
        >
          <span aria-hidden>{config.icon}</span>
          <span>{config.label}</span>
          {status !== "error" && <DotLoader color={config.ring} />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
