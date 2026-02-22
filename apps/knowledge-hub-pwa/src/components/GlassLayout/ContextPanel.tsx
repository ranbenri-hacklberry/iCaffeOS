/**
 * ContextPanel — Phase 2
 *
 * Left panel (desktop) / Drawer content (mobile).
 *
 * Data flow:
 *   1. Fetch record list  GET /api/records/{businessType}
 *   2. Render scrollable picker with search filter
 *   3. On selection → fetch detail GET /api/context/{businessType}/{recordId}
 *   4. Render a key/value field table from the live context
 *   5. Emit onSelectRecord so ChatPanel gains context
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cortexFetch } from "../../lib/api";
import type { BusinessType } from "../../store/cortexStore";

// ── API response shapes ───────────────────────────────────────────────

interface RecordItem {
  id:    string;
  name:  string;    // primary display label
  [k: string]: unknown;
}

interface RecordsResponse {
  business_type: string;
  records:       RecordItem[];
}

interface ContextResponse {
  label: string;
  data:  Record<string, unknown>;
}

// ── Props ─────────────────────────────────────────────────────────────

interface Props {
  businessType:     BusinessType;
  selectedRecordId: string | null;
  onSelectRecord:   (id: string) => void;
}

// ── Vertical meta ─────────────────────────────────────────────────────

const VERTICAL_META: Record<BusinessType, { icon: string; label: string }> = {
  IT_LAB:   { icon: "🖥️", label: "Devices"    },
  LAW_FIRM: { icon: "⚖️", label: "Cases"      },
  CAFE:     { icon: "☕", label: "Menu Items" },
};

// ── Small helpers ─────────────────────────────────────────────────────

function Spinner() {
  return (
    <motion.span
      className="inline-block w-4 h-4 rounded-full border-2 border-white/20 border-t-indigo-400"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
    />
  );
}

function fieldLabel(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function fieldValue(val: unknown): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

// ── Component ─────────────────────────────────────────────────────────

export default function ContextPanel({
  businessType,
  selectedRecordId,
  onSelectRecord,
}: Props) {
  const meta = VERTICAL_META[businessType];

  // ── Record list state ──────────────────────────────────────────────
  const [records,      setRecords]      = useState<RecordItem[]>([]);
  const [listLoading,  setListLoading]  = useState(true);
  const [listError,    setListError]    = useState<string | null>(null);
  const [search,       setSearch]       = useState("");

  // ── Detail card state ─────────────────────────────────────────────
  const [detail,       setDetail]       = useState<ContextResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError,  setDetailError]  = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  // ── Fetch record list when businessType changes ───────────────────
  useEffect(() => {
    let cancelled = false;
    setListLoading(true);
    setListError(null);
    setRecords([]);
    setDetail(null);

    cortexFetch<RecordsResponse>(`/api/records/${businessType}`)
      .then((res) => { if (!cancelled) setRecords(res.records ?? []); })
      .catch((err: Error) => { if (!cancelled) setListError(err.message); })
      .finally(() => { if (!cancelled) setListLoading(false); });

    return () => { cancelled = true; };
  }, [businessType]);

  // ── Fetch detail when selectedRecordId changes ───────────────────
  useEffect(() => {
    if (!selectedRecordId) { setDetail(null); return; }

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setDetailLoading(true);
    setDetailError(null);

    cortexFetch<ContextResponse>(
      `/api/context/${businessType}/${selectedRecordId}`,
      { signal: abortRef.current.signal },
    )
      .then(setDetail)
      .catch((err: Error) => {
        if (err.name !== "AbortError") setDetailError(err.message);
      })
      .finally(() => setDetailLoading(false));

    return () => abortRef.current?.abort();
  }, [businessType, selectedRecordId]);

  // ── Filtered records ─────────────────────────────────────────────
  const filtered = records.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleRefresh = useCallback(() => {
    setSearch("");
    setListLoading(true);
    setListError(null);
    cortexFetch<RecordsResponse>(`/api/records/${businessType}`)
      .then((res) => setRecords(res.records ?? []))
      .catch((err: Error) => setListError(err.message))
      .finally(() => setListLoading(false));
  }, [businessType]);

  // ══════════════════════════════════════════════════════════════════
  //  Render
  // ══════════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col h-full p-4 gap-4">

      {/* ── Section header ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-lg">{meta.icon}</span>
        <h2 className="text-sm font-semibold text-white">{meta.label}</h2>

        {listLoading ? (
          <span className="ml-auto"><Spinner /></span>
        ) : (
          <span className="ml-auto text-xs text-slate-500">
            {records.length} records
          </span>
        )}

        {/* Refresh button */}
        {!listLoading && (
          <button
            onClick={handleRefresh}
            aria-label="Refresh records"
            className="p-1 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/[0.06] transition"
          >
            <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 fill-current">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Search box ──────────────────────────────────────────── */}
      <div className="shrink-0 relative">
        <svg
          viewBox="0 0 20 20"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 fill-current text-slate-600 pointer-events-none"
        >
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter records…"
          className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-indigo-500/40 transition"
        />
      </div>

      {/* ── Record list ─────────────────────────────────────────── */}
      <div className="shrink-0 rounded-xl overflow-hidden border border-white/[0.08] divide-y divide-white/[0.06] max-h-[220px] overflow-y-auto">

        {/* Error state */}
        {listError && (
          <div className="px-3.5 py-3 text-xs text-red-400">
            ⚠️ {listError}
          </div>
        )}

        {/* Loading skeleton */}
        {listLoading && !listError && (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-3.5 py-2.5 flex items-center gap-2">
                <div className="h-3 rounded bg-white/[0.07] animate-pulse flex-1" />
              </div>
            ))}
          </>
        )}

        {/* Empty */}
        {!listLoading && !listError && filtered.length === 0 && (
          <div className="px-3.5 py-3 text-xs text-slate-600">
            {search ? "No matches" : "No records found"}
          </div>
        )}

        {/* Records */}
        <AnimatePresence initial={false}>
          {!listLoading && filtered.map((rec) => (
            <motion.button
              key={rec.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => onSelectRecord(rec.id)}
              className={[
                "w-full text-left px-3.5 py-2.5 text-xs transition-colors",
                "focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500",
                selectedRecordId === rec.id
                  ? "bg-indigo-500/20 text-indigo-200"
                  : "text-slate-300 hover:bg-white/[0.05] hover:text-white",
              ].join(" ")}
            >
              <span className="block truncate">{rec.name}</span>
              <span className="block text-[10px] text-slate-600 font-mono mt-0.5">
                #{rec.id}
              </span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Detail card ─────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">

        {/* No selection */}
        {!selectedRecordId && (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-600 select-none">
            <span className="text-3xl opacity-20">👆</span>
            <p className="text-xs text-center">Select a record above to load context</p>
          </div>
        )}

        {/* Loading detail */}
        {selectedRecordId && detailLoading && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Spinner />
              <span className="text-xs text-slate-500">Loading context…</span>
            </div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="grid grid-cols-5 gap-2">
                <div className="col-span-2 h-2.5 rounded bg-white/[0.06] animate-pulse" />
                <div className="col-span-3 h-2.5 rounded bg-white/[0.06] animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {/* Detail error */}
        {selectedRecordId && detailError && !detailLoading && (
          <div className="text-xs text-red-400 space-y-1">
            <p>⚠️ {detailError}</p>
            <button
              onClick={() => onSelectRecord(selectedRecordId)}
              className="text-indigo-400 hover:text-indigo-300 underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Detail data */}
        <AnimatePresence mode="wait">
          {selectedRecordId && detail && !detailLoading && (
            <motion.div
              key={selectedRecordId}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="space-y-3"
            >
              {/* Record type badge + label */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
                  {detail.label}
                </span>
              </div>

              {/* Field table */}
              <div className="space-y-2">
                {Object.entries(detail.data)
                  .filter(([, v]) => v !== null && v !== undefined && v !== "")
                  .map(([k, v]) => (
                    <div key={k} className="grid grid-cols-5 gap-2 text-xs items-start">
                      <span className="col-span-2 text-slate-500 font-medium truncate">
                        {fieldLabel(k)}
                      </span>
                      <span className="col-span-3 text-slate-300 break-words">
                        {fieldValue(v)}
                      </span>
                    </div>
                  ))}
              </div>

              {/* Context-active footer */}
              <div className="pt-2 border-t border-white/[0.06] flex items-center gap-1.5">
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"
                  animate={{ scale: [1, 1.35, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                />
                <span className="text-[10px] text-slate-500">
                  Context injected into every AI reply
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
