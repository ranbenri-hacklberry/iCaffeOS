/**
 * MessageBubble.jsx
 *
 * Renders a single chat message.
 * If the assistant message contains [SYSTEM_ACTION]{...} tags, each is
 * extracted and rendered as a SystemActionCard. Surrounding text is
 * rendered normally.
 */

import { motion } from "framer-motion";
import PrivacyShield from "./PrivacyShield";
import SystemActionCard from "./SystemActionCard";
import { parseSystemActions } from "../useSystemAction";
import { useSystemAction } from "../useSystemAction";

// ── Sub-components ─────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-slate-400"
          animate={{ opacity: [0.25, 0.9, 0.25], y: [0, -2, 0] }}
          transition={{ duration: 1, delay: i * 0.16, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}

function StreamCursor() {
  return (
    <motion.span className="inline-block w-[2px] h-[14px] rounded-full bg-current ml-0.5 align-middle"
      animate={{ opacity: [1, 0] }}
      transition={{ duration: 0.55, repeat: Infinity, ease: "linear" }}
    />
  );
}

function renderText(text) {
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, '<code class="bg-white/10 px-1 py-0.5 rounded text-[0.8em] font-mono">$1</code>')
    .replace(/^(⚠️.*)/gm, '<span class="text-amber-400">$1</span>')
    .replace(/^\d+\.\s+(.+)/gm, '<li class="ml-4 list-decimal text-sm">$1</li>')
    .replace(/^[-•]\s+(.+)/gm, '<li class="ml-4 list-disc text-sm">$1</li>')
    .replace(/((?:<li[^>]*>.*<\/li>\n?)+)/g, '<ul class="my-1 space-y-0.5">$1</ul>')
    .replace(/\n/g, "<br/>");
}

// ── Assistant message content ───────────────────────────────────────────────

function AssistantContent({ content, isStreaming, isComplete }) {
  const { executionMap, execute, cancel } = useSystemAction();

  // Only parse once the stream is done (avoids partial JSON mid-stream)
  const hasAction = content.includes("[SYSTEM_ACTION]");
  const segments = (hasAction && !isStreaming)
    ? parseSystemActions(content)
    : [{ type: "text", content }];

  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === "action") {
          return (
            <SystemActionCard
              key={seg.id ?? i}
              payload={seg.payload}
              actionId={seg.id}
              execution={executionMap[seg.id]}
              onExecute={execute}
              onCancel={cancel}
            />
          );
        }
        // Plain text segment
        const trimmed = seg.content.trim();
        if (!trimmed) return null;
        return (
          <span
            key={i}
            className="whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{ __html: renderText(trimmed) }}
          />
        );
      })}
      {isStreaming && <StreamCursor />}
    </>
  );
}

// ── Main export ────────────────────────────────────────────────────────────

export default function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  const isStreaming = msg.streamStatus === "streaming";
  const isError = msg.streamStatus === "error";
  const isComplete = msg.streamStatus === "complete";
  const showTyping = isStreaming && !msg.content;

  // Detect if this assistant message contains system actions (skip bubble chrome)
  const hasAction = !isUser && !isStreaming && msg.content?.includes("[SYSTEM_ACTION]");

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={`flex items-end gap-1.5 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {isUser && msg.privacy && <PrivacyShield privacy={msg.privacy} />}

      {!isUser && (
        <div className="w-5 h-5 rounded-full bg-indigo-600/40 border border-indigo-500/30 grid place-items-center shrink-0 mb-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
        </div>
      )}

      {/* If the message has system actions, render outside the bubble for full width */}
      {hasAction ? (
        <div className="flex-1 min-w-0">
          <AssistantContent content={msg.content} isStreaming={isStreaming} isComplete={isComplete} />
          <div className={`text-[10px] mt-1 text-slate-600`}>
            {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            {msg.usage && (
              <span className="font-mono ml-2 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.05]">
                tokens: {msg.usage.prompt_tokens} in / {msg.usage.candidates_tokens} out
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-indigo-600 text-white rounded-br-sm"
            : isError
              ? "bg-red-500/10 text-red-300 border border-red-500/20 rounded-bl-sm"
              : "bg-white/[0.07] text-slate-100 border border-white/[0.08] rounded-bl-sm"
        }`}>
          {showTyping ? (
            <TypingDots />
          ) : (
            isUser ? (
              <span className="whitespace-pre-wrap break-words">{msg.content}</span>
            ) : (
              <AssistantContent content={msg.content} isStreaming={isStreaming} isComplete={isComplete} />
            )
          )}
          <div className={`flex items-center justify-between text-[10px] mt-1.5 ${isUser ? "text-indigo-200/60" : "text-slate-600"}`}>
            <span>{msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            {!isUser && msg.usage && (
              <span className="font-mono bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.05]">
                tokens: {msg.usage.prompt_tokens} in / {msg.usage.candidates_tokens} out
              </span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
