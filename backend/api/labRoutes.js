/**
 * labRoutes.js — Superadmin Remote Execution Gateway
 *
 * POST /api/lab/execute
 *   Body: { command: string, jwt: string }
 *   Response: SSE stream  (text/event-stream)
 *     data: { type: "status",  message, command }
 *     data: { type: "stdout",  line }
 *     data: { type: "stderr",  line }
 *     data: { type: "done",    exitCode }
 *     data: { type: "error",   message }
 *
 * Security layers:
 *   1. Static JWT secret check (env: LAB_SUPERADMIN_JWT)
 *   2. Blocklist of destructive patterns
 *   3. 5-minute timeout on any spawned process
 */

import express from 'express';
import { spawn } from 'child_process';

const router = express.Router();

// ── Auth ────────────────────────────────────────────────────────────────────

const EXPECTED_JWT = process.env.LAB_SUPERADMIN_JWT || 'superadmin-ryzen';

// ── Safety blocklist ────────────────────────────────────────────────────────

const BLOCKED_PATTERNS = [
  /\brm\s+-rf\s+\//,           // rm -rf /
  /\bmkfs\b/,                   // disk format
  /\bdd\s+if=/,                 // disk dump
  /:\(\)\s*\{\s*:\s*\|\s*:\s*&/, // fork bomb
  /\bshred\b.*\/dev\//,         // device shred
  /\bchmod\s+777\s+\//,         // world-writable root
  /\bcrontab\s+-r\b/,           // wipe crontab
  /\bpasswd\b.*root/,           // root passwd change
];

function isCommandBlocked(cmd) {
  return BLOCKED_PATTERNS.some((re) => re.test(cmd));
}

// ── SSE helper ──────────────────────────────────────────────────────────────

function sseInit(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Nginx: disable proxy buffering
  res.flushHeaders();
}

function sseWrite(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

// ── Route ───────────────────────────────────────────────────────────────────

router.post('/execute', (req, res) => {
  const { command, jwt } = req.body ?? {};

  // 1. Auth
  if (jwt !== EXPECTED_JWT) {
    return res.status(401).json({ error: '🔐 Unauthorized — invalid superadmin token.' });
  }

  // 2. Validate command
  if (!command || typeof command !== 'string' || !command.trim()) {
    return res.status(400).json({ error: 'Missing or empty command.' });
  }

  // 3. Safety check
  if (isCommandBlocked(command)) {
    return res.status(403).json({ error: '🚫 Command blocked by Ryzen safety policy.' });
  }

  // 4. Start SSE
  sseInit(res);
  sseWrite(res, { type: 'status', message: 'running', command });

  // 5. Spawn process
  const proc = spawn('bash', ['-c', command], {
    env: { ...process.env, TERM: 'xterm-256color', FORCE_COLOR: '1' },
    // Prevent shell from inheriting controlling terminal so it won't hang
    detached: false,
  });

  // 5-minute timeout
  const killTimer = setTimeout(() => {
    sseWrite(res, { type: 'stderr', line: '⏱ Process killed after 5-minute timeout.\n' });
    proc.kill('SIGKILL');
  }, 5 * 60 * 1000);

  proc.stdout.on('data', (chunk) => {
    sseWrite(res, { type: 'stdout', line: chunk.toString() });
  });

  proc.stderr.on('data', (chunk) => {
    sseWrite(res, { type: 'stderr', line: chunk.toString() });
  });

  proc.on('close', (code) => {
    clearTimeout(killTimer);
    sseWrite(res, { type: 'done', exitCode: code ?? -1 });
    res.end();
  });

  proc.on('error', (err) => {
    clearTimeout(killTimer);
    sseWrite(res, { type: 'error', message: err.message });
    res.end();
  });

  // Kill process if client disconnects
  req.on('close', () => {
    clearTimeout(killTimer);
    proc.kill('SIGTERM');
  });
});

export default router;
