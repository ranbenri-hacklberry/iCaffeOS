/**
 * MessageBubble — Unified message renderer.
 *
 * Renders one ChatMessage. Keeps sanitisation logic fully
 * decoupled — it only reads the pre-parsed `privacy` receipt.
 *
 * Layout:
 *   User    →  [PrivacyShield]  [bubble (right-aligned, indigo)]
 *   Assistant→  [avatar dot]    [bubble (left-aligned, glass)]
 *
 * Assistant states:
 *   • Empty + streaming  → three-dot typing indicator
 *   • Content + streaming → text + blinking cursor
 *   • Complete           → plain text, no cursor
 *   • Error              → amber warning text
 */

import { motion } from "framer-motion";
import type { ChatMessage } from "../../hooks/useCortexStream";
import PrivacyShield from "./PrivacyShield";

// ── Typing dots (empty assistant bubble) ─────────────────────────────

function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-slate-400"
          animate={{ opacity: [0.25, 0.9, 0.25], y: [0, -2, 0] }}
          transition={{ duration: 1, delay: i * 0.16, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}

// ── Streaming cursor ──────────────────────────────────────────────────

function StreamCursor() {
  return (
    <motion.span
      className="inline-block w-[2px] h-[14px] rounded-full bg-current ml-0.5 align-middle"
      animate={{ opacity: [1, 0] }}
      transition={{ duration: 0.55, repeat: Infinity, ease: "linear" }}
    />
  );
}

// ── Minimal markdown-lite renderer ────────────────────────────────────
// Handles: **bold**, `code`, ⚠️-prefixed lines, numbered/bullet lists.
// Real markdown (react-markdown) can replace this in Phase 3.

function renderContent(text: string): string {
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, '<code class="bg-white/10 px-1 py-0.5 rounded text-[0.8em] font-mono">$1</code>')
    .replace(/^(⚠️.*)/gm, '<span class="text-amber-400">$1</span>')
    .replace(/^\d+\.\s+(.+)/gm, '<li class="ml-4 list-decimal text-sm">$1</li>')
    .replace(/^[-•]\s+(.+)/gm,  '<li class="ml-4 list-disc text-sm">$1</li>')
    .replace(/((?:<li[^>]*>.*<\/li>\n?)+)/g, '<ul class="my-1 space-y-0.5">$1</ul>')
    .replace(/\n/g, "<br/>");
}

// ── Component ─────────────────────────────────────────────────────────

interface Props {
  msg: ChatMessage;
}

export default function MessageBubble({ msg }: Props) {
  const isUser       = msg.role === "user";
  const isStreaming  = msg.streamStatus === "streaming";
  const isError      = msg.streamStatus === "error";
  const showTyping   = isStreaming && !msg.content;
  const showCursor   = isStreaming && !!msg.content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={`flex items-end gap-1.5 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {/* Privacy shield — left of user bubble, after receipt arrives */}
      {isUser && msg.privacy && <PrivacyShield privacy={msg.privacy} />}

      {/* Assistant avatar dot */}
      {!isUser && (
        <div className="w-5 h-5 rounded-full bg-indigo-600/40 border border-indigo-500/30 grid place-items-center shrink-0 mb-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
        </div>
      )}

      {/* ── Bubble ────────────────────────────────────────────────── */}
      <div
        className={[
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-indigo-600 text-white rounded-br-sm"
            : isError
            ? "bg-red-500/10 text-red-300 border border-red-500/20 rounded-bl-sm"
            : "bg-white/[0.07] text-slate-100 border border-white/[0.08] rounded-bl-sm",
        ].join(" ")}
      >
        {showTyping ? (
          <TypingDots />
        ) : (
          <>
            <span
              className="whitespace-pre-wrap break-words"
              dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }}
            />
            {showCursor && <StreamCursor />}
          </>
        )}

        {/* Timestamp */}
        <div className={`text-[10px] mt-1.5 ${isUser ? "text-indigo-200/60" : "text-slate-600"}`}>
          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </motion.div>
  );
}
