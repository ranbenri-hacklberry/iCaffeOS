/**
 * dispatcher.js — icaffeOS Cortex Communication Dispatcher
 *
 * Runs 24/7 on the Ryzen 370AI server as a systemd service.
 * Polls communication_jobs and dispatches each contact with
 * triple-redundancy fallback:
 *
 *   1. WAHA (WhatsApp HTTP API)     → sent_via: 'whatsapp'
 *   2. Local SMS Modem (Python CLI) → sent_via: 'local_sms'
 *   3. GlobalSMS Cloud REST API     → sent_via: 'globalsms'
 *
 * If all three fail → job marked 'failed', error_log populated.
 * UI can call fn_retry_job to re-queue.
 *
 * Golden Answer: if a query-similar golden answer exists in
 * ai_training_data (quality >= 4), it's appended as context.
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// ── Config ───────────────────────────────────────────────────────────

const {
  BUSINESS_ID,

  WAHA_BASE_URL = "http://localhost:3000",
  WAHA_API_KEY = "",
  WAHA_SESSION = "default",
  WAHA_RATE_MS = "1200",

  MODEM_SCRIPT_PATH = "/home/ran/modem-scripts/send_sms.py",
  MODEM_TIMEOUT_MS = "30000",

  GLOBALSMS_API_URL = "https://api.globalsms.com/v1/send",
  GLOBALSMS_API_KEY = "",
  GLOBALSMS_SENDER = "iCaffe",

  POLL_INTERVAL_MS = "5000",
  JOB_BATCH_SIZE = "5",
  MAX_RETRIES = "3",
  LOG_LEVEL = "info",

  // Zombie Reaper config
  ZOMBIE_TIMEOUT_MIN = "10",   // minutes before a running job is declared stale
  REAPER_EVERY_N_CYCLES = "12",   // run reaper every N poll cycles (~1 min at 5s interval)
} = process.env;

const ZOMBIE_TIMEOUT = `${parseInt(ZOMBIE_TIMEOUT_MIN, 10)} minutes`;
const REAPER_EVERY_N = parseInt(REAPER_EVERY_N_CYCLES, 10);

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log('--- [Cortex Worker: Validating Environment] ---');
const hasRoleKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasStandardKey = !!process.env.SUPABASE_KEY;
const hasAnonKey = !!process.env.VITE_SUPABASE_ANON_KEY;
const hasUrl = !!process.env.VITE_SUPABASE_URL || !!process.env.SUPABASE_URL;

console.log(`- SUPABASE_URL present: ${hasUrl}`);
console.log(`- AUTH_KEY present: ${hasRoleKey || hasStandardKey || hasAnonKey}`);
console.log('------------------------------------------------');

if (!hasUrl || !(hasRoleKey || hasStandardKey || hasAnonKey)) {
  console.error("🚨 FATAL [Worker]: Missing Supabase credentials. Halting dispatcher.");
  process.exit(1);
}
if (!BUSINESS_ID) {
  console.error("[FATAL] BUSINESS_ID is required — run: SELECT id FROM businesses");
  process.exit(1);
}

const POLL_MS = parseInt(POLL_INTERVAL_MS, 10);
const BATCH_SIZE = parseInt(JOB_BATCH_SIZE, 10);
const WAHA_RATE = parseInt(WAHA_RATE_MS, 10);
const MODEM_TMOUT = parseInt(MODEM_TIMEOUT_MS, 10);
const MAX_RETRY = parseInt(MAX_RETRIES, 10);

// ── Supabase client (service_role — bypasses RLS) ────────────────────

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

// ── Logger ───────────────────────────────────────────────────────────

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = LEVELS[LOG_LEVEL] ?? 1;

function log(level, ...args) {
  if ((LEVELS[level] ?? 1) >= currentLevel) {
    const ts = new Date().toISOString();
    console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
      `[${ts}] [${level.toUpperCase()}]`,
      ...args
    );
  }
}

// ── Circuit breakers per channel ─────────────────────────────────────
// Skips a channel if it fails 3+ consecutive attempts.

const breakers = {
  whatsapp: { failures: 0, threshold: 3, openUntil: 0 },
  local_sms: { failures: 0, threshold: 3, openUntil: 0 },
  globalsms: { failures: 0, threshold: 5, openUntil: 0 },
};

function circuitOpen(channel) {
  const b = breakers[channel];
  if (b.openUntil > Date.now()) {
    log("warn", `[circuit] ${channel} is OPEN — skipping for ${Math.round((b.openUntil - Date.now()) / 1000)}s`);
    return true;
  }
  return false;
}

function recordSuccess(channel) {
  breakers[channel].failures = 0;
  breakers[channel].openUntil = 0;
}

function recordFailure(channel) {
  const b = breakers[channel];
  b.failures++;
  if (b.failures >= b.threshold) {
    b.openUntil = Date.now() + 60_000; // open for 60s
    log("warn", `[circuit] ${channel} tripped — backing off 60s`);
  }
}

// ── Message personalisation ──────────────────────────────────────────

function personalizeMessage(template, contact) {
  return template
    .replace(/\{\{name\}\}/gi, contact.name ?? "")
    .replace(/\{\{phone\}\}/gi, contact.phone ?? "")
    .replace(/\{\{role\}\}/gi, contact.role ?? "")
    .replace(/\{\{entity\}\}/gi, contact.entity ?? "")
    .trim();
}

// ── Golden Answer lookup ─────────────────────────────────────────────
// If the broadcast message has a very close golden answer (quality ≥ 4),
// append it as a PS. This is optional — set USE_GOLDEN_ANSWERS=false to skip.

const USE_GOLDEN = process.env.USE_GOLDEN_ANSWERS !== "false";

async function enrichWithGoldenAnswer(businessId, message) {
  if (!USE_GOLDEN || message.length < 10) return message;
  try {
    const { data } = await supabase.rpc("fn_get_training_context", {
      p_business_id: businessId,
      p_query: message,
      p_limit: 1,
    });
    const match = data?.[0];
    if (match && match.quality_score >= 4) {
      log("debug", `[golden] injecting golden answer (quality=${match.quality_score})`);
      return `${message}\n\n---\n${match.golden_answer}`;
    }
  } catch (err) {
    log("warn", "[golden] fn_get_training_context failed:", err.message);
  }
  return message;
}

// ── CHANNEL 1: WAHA (WhatsApp HTTP API) ──────────────────────────────

async function sendViaWAHA(phone, message) {
  if (!WAHA_BASE_URL || !phone) throw new Error("WAHA not configured or phone missing");

  // Resolve JID: prefer explicit JID (phone@s.whatsapp.net), else derive
  const chatId = phone.includes("@")
    ? phone
    : `${phone.replace(/\D/g, "")}@s.whatsapp.net`;

  const headers = {};
  if (WAHA_API_KEY) headers["X-Api-Key"] = WAHA_API_KEY;

  const response = await axios.post(
    `${WAHA_BASE_URL}/api/sendText`,
    { chatId, text: message, session: WAHA_SESSION },
    { headers, timeout: 15_000 }
  );

  if (response.status >= 400) {
    throw new Error(`WAHA HTTP ${response.status}: ${JSON.stringify(response.data)}`);
  }

  log("debug", `[waha] sent to ${chatId} → msgId=${response.data?.id ?? "?"}`);
  return { waha_response: response.data };
}

// ── CHANNEL 2: Local SMS Modem (Python CLI on Ryzen) ─────────────────

async function sendViaModem(phone, message) {
  if (!MODEM_SCRIPT_PATH || !phone) throw new Error("Modem script not configured or phone missing");

  // Sanitise: strip special chars from phone, escape message for shell
  const safePhone = phone.replace(/[^+\d]/g, "");
  const safeMessage = message.replace(/'/g, "\\'").replace(/\n/g, " ");

  const cmd = `python3 "${MODEM_SCRIPT_PATH}" --phone "${safePhone}" --text '${safeMessage}'`;
  log("debug", `[modem] exec: ${cmd.substring(0, 80)}…`);

  const { stdout, stderr } = await execAsync(cmd, { timeout: MODEM_TMOUT });

  if (stderr && stderr.toLowerCase().includes("error")) {
    throw new Error(`Modem script stderr: ${stderr.trim()}`);
  }

  log("debug", `[modem] stdout: ${stdout?.trim()}`);
  return { modem_output: stdout?.trim() };
}

// ── CHANNEL 3: GlobalSMS Cloud API ───────────────────────────────────

async function sendViaGlobalSMS(phone, message) {
  if (!GLOBALSMS_API_KEY || !phone) throw new Error("GlobalSMS not configured or phone missing");

  const safePhone = phone.replace(/[^+\d]/g, "");

  const response = await axios.post(
    GLOBALSMS_API_URL,
    {
      to: safePhone,
      from: GLOBALSMS_SENDER,
      message: message.substring(0, 160), // GSM-7 standard limit
    },
    {
      headers: {
        Authorization: `Bearer ${GLOBALSMS_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 20_000,
    }
  );

  if (response.data?.status === "failed" || response.status >= 400) {
    throw new Error(`GlobalSMS error: ${JSON.stringify(response.data)}`);
  }

  log("debug", `[globalsms] sent to ${safePhone} → msgId=${response.data?.message_id ?? "?"}`);
  return { globalsms_response: response.data };
}

// ── Triple-redundancy send ────────────────────────────────────────────

async function sendWithFallback(contact, message) {
  const channels = [
    { name: "whatsapp", fn: () => sendViaWAHA(contact.jid || contact.phone, message) },
    { name: "local_sms", fn: () => sendViaModem(contact.phone, message) },
    { name: "globalsms", fn: () => sendViaGlobalSMS(contact.phone, message) },
  ];

  const errors = [];

  for (const channel of channels) {
    if (circuitOpen(channel.name)) {
      errors.push({ channel: channel.name, error: "circuit-open" });
      continue;
    }

    try {
      const meta = await channel.fn();
      recordSuccess(channel.name);
      return {
        success: true,
        channel: channel.name,
        sent_at: new Date().toISOString(),
        meta,
      };
    } catch (err) {
      recordFailure(channel.name);
      log("warn", `[fallback] ${channel.name} → ${contact.phone}: ${err.message}`);
      errors.push({ channel: channel.name, error: err.message });
    }
  }

  // All channels exhausted
  return {
    success: false,
    channel: null,
    error: errors.map((e) => `${e.channel}: ${e.error}`).join(" | "),
    errors,
  };
}

// ── Job processor ─────────────────────────────────────────────────────

async function processJob(job) {
  const jobId = job.id;
  const contacts = job.payload?.contacts ?? [];
  const template = job.payload?.message ?? "";

  log("info", `[job:${jobId.slice(0, 8)}] starting — ${contacts.length} contacts`);

  if (contacts.length === 0) {
    await supabase.rpc("fn_complete_job", {
      p_job_id: jobId,
      p_status: "failed",
      p_sent_via: null,
      p_sent_count: 0,
      p_failed_count: 0,
      p_results: [],
      p_error_log: "No contacts in payload",
    });
    return;
  }

  // Enrich template with golden answer if available
  const enrichedTemplate = await enrichWithGoldenAnswer(job.business_id, template);

  const results = [];
  const metaAudit = {};
  let sentCount = 0;
  let failedCount = 0;
  let primaryChannel = null;

  for (const contact of contacts) {
    const personalised = personalizeMessage(enrichedTemplate, contact);
    const result = await sendWithFallback(contact, personalised);

    results.push({
      contact_id: contact.id,
      name: contact.name,
      phone: contact.phone,
      success: result.success,
      channel: result.channel,
      sent_at: result.sent_at ?? null,
      error: result.error ?? null,
    });

    if (result.meta) {
      metaAudit[contact.id] = result.meta;
    }

    if (result.success) {
      sentCount++;
      if (!primaryChannel) primaryChannel = result.channel;
    } else {
      failedCount++;
    }

    // Rate-limit between contacts (avoid WA ban / modem saturation)
    if (contacts.indexOf(contact) < contacts.length - 1) {
      await sleep(WAHA_RATE);
    }
  }

  const allFailed = failedCount === contacts.length;
  const finalStatus = allFailed ? "failed" : "completed";

  await supabase.rpc("fn_complete_job", {
    p_job_id: jobId,
    p_status: finalStatus,
    p_sent_via: primaryChannel,
    p_sent_count: sentCount,
    p_failed_count: failedCount,
    p_results: results,
    p_error_log: allFailed ? results.at(-1)?.error ?? "All channels exhausted" : null,
    p_metadata: metaAudit,
  });

  log(
    allFailed ? "error" : "info",
    `[job:${jobId.slice(0, 8)}] ${finalStatus} — ✓${sentCount} ✗${failedCount} via:${primaryChannel ?? "none"}`
  );
}

// ── Zombie Reaper cycle ───────────────────────────────────────────────
// Calls fn_worker_heartbeat_reap on every Nth poll.
// The advisory lock inside the function prevents concurrent reaper storms
// when multiple workers are running. pg_cron takes priority if installed.

async function reaperCycle() {
  try {
    const { data, error } = await supabase.rpc("fn_worker_heartbeat_reap", {
      p_timeout_interval: ZOMBIE_TIMEOUT,
    });

    if (error) {
      log("warn", "[reaper] fn_worker_heartbeat_reap error:", error.message);
      return;
    }

    if (data?.skipped) {
      log("debug", "[reaper] skipped — another worker holds advisory lock");
      return;
    }

    const count = data?.reaped_count ?? 0;
    if (count > 0) {
      log("warn", `[reaper] ⚡ reaped ${count} zombie job(s) older than ${ZOMBIE_TIMEOUT}`);
      if (data?.reaped_ids?.length) {
        data.reaped_ids.forEach((id) =>
          log("warn", `[reaper]   ↳ reset job ${id.slice(0, 8)} → pending`)
        );
      }
      // Trigger an immediate poll to pick up the freshly-reset jobs
      pollCycle();
    } else {
      log("debug", `[reaper] no zombies found (timeout=${ZOMBIE_TIMEOUT})`);
    }
  } catch (err) {
    log("error", "[reaper] Unhandled error:", err.message);
  }
}

// ── Poll cycle ────────────────────────────────────────────────────────

let running = true;
let activeJobs = 0;
let pollCount = 0;   // used to throttle reaperCycle to every N cycles

async function pollCycle() {
  try {
    const { data: jobs, error } = await supabase.rpc("fn_get_pending_jobs", {
      p_business_id: BUSINESS_ID,
      p_limit: BATCH_SIZE,
    });

    if (error) {
      log("error", "[poll] fn_get_pending_jobs failed:", error.message);
      return;
    }

    if (!jobs?.length) return;

    log("debug", `[poll] found ${jobs.length} pending job(s)`);

    for (const job of jobs) {
      // Skip jobs that exceeded MAX_RETRIES
      if (job.retry_count >= MAX_RETRY) {
        log("warn", `[job:${job.id.slice(0, 8)}] exceeded max retries (${MAX_RETRY}) — abandoning`);
        await supabase
          .from("communication_jobs")
          .update({ status: "failed", error_log: `Exceeded max retries (${MAX_RETRY})` })
          .eq("id", job.id);
        continue;
      }

      // Atomically claim the job
      const { data: claimed } = await supabase.rpc("fn_claim_job", { p_job_id: job.id });
      if (!claimed) {
        log("debug", `[job:${job.id.slice(0, 8)}] already claimed by another worker`);
        continue;
      }

      activeJobs++;
      processJob(job)
        .catch((err) => {
          log("error", `[job:${job.id.slice(0, 8)}] unhandled crash:`, err.message);
          // Mark as failed so it doesn't get stuck in 'running'
          supabase
            .from("communication_jobs")
            .update({ status: "failed", error_log: `Worker crash: ${err.message}` })
            .eq("id", job.id)
            .then(() => { });
        })
        .finally(() => { activeJobs--; });
    }
  } catch (err) {
    log("error", "[poll] Unhandled error:", err.message);
  }
}

// ── Optional: Supabase Realtime subscription ─────────────────────────
// Fires immediately when a new job is inserted — no need to wait for next poll.

async function subscribeToNewJobs() {
  const channel = supabase
    .channel("comm_jobs_inserts")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "communication_jobs",
        filter: `business_id=eq.${BUSINESS_ID}`,
      },
      (payload) => {
        if (payload.new?.status === "pending" || payload.new?.status === "queued") {
          log("debug", `[realtime] new job detected: ${payload.new.id.slice(0, 8)} — triggering early poll`);
          pollCycle();
        }
      }
    )
    .subscribe((status) => {
      log("info", `[realtime] subscription: ${status}`);
    });

  return channel;
}

// ── Graceful shutdown ─────────────────────────────────────────────────

async function shutdown(signal) {
  log("info", `[shutdown] received ${signal} — draining ${activeJobs} active job(s)…`);
  running = false;

  const start = Date.now();
  while (activeJobs > 0 && Date.now() - start < 30_000) {
    await sleep(250);
  }

  if (activeJobs > 0) {
    log("warn", `[shutdown] force-exit — ${activeJobs} job(s) still active`);
  } else {
    log("info", "[shutdown] clean exit");
  }

  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("uncaughtException", (err) => log("error", "[uncaught]", err));
process.on("unhandledRejection", (err) => log("error", "[unhandled]", err));

// ── Utilities ─────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Entry point ───────────────────────────────────────────────────────

(async function main() {
  log("info", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  log("info", "  icaffeOS Cortex Dispatcher v1.0");
  log("info", `  Business : ${BUSINESS_ID}`);
  log("info", `  Supabase : ${supabaseUrl}`);
  log("info", `  Channels : WAHA → LocalSMS → GlobalSMS`);
  log("info", `  Poll     : every ${POLL_MS}ms, batch=${BATCH_SIZE}`);
  log("info", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Connectivity check
  const { error: pingErr } = await supabase
    .from("communication_jobs")
    .select("id", { count: "exact", head: true })
    .eq("business_id", BUSINESS_ID);

  if (pingErr) {
    log("error", "[startup] Supabase connectivity check failed:", pingErr.message);
    process.exit(1);
  }
  log("info", "[startup] Supabase connectivity OK");

  // Subscribe to realtime inserts for sub-second response
  await subscribeToNewJobs();

  // Main polling loop
  while (running) {
    await pollCycle();
    pollCount++;

    // Run zombie reaper every N cycles (~once per minute at default 5s interval).
    // pg_cron handles this automatically if enabled; this is the fallback.
    if (pollCount % REAPER_EVERY_N === 0) {
      reaperCycle(); // fire-and-forget: don't await, don't block job dispatch
    }

    await sleep(POLL_MS);
  }
})();
