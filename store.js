/* ============================================================
   store.js — persistent key/value store for sessions + redeemed
   order IDs.

   If UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are set,
   this uses Upstash Redis (REST API, no client library needed) —
   data survives restarts, spin-downs, and redeploys.

   If those env vars are NOT set (e.g. running locally without
   Upstash configured), it falls back to a plain in-memory Map so
   local testing still works — it just won't persist across
   restarts, which is fine for a quick local check.
   ============================================================ */

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const usingUpstash = Boolean(UPSTASH_URL && UPSTASH_TOKEN);

async function redisCommand(...args) {
  const path = args.map((a) => encodeURIComponent(a)).join("/");
  const res = await fetch(`${UPSTASH_URL}/${path}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
  });
  const data = await res.json();
  return data.result;
}

// ---- in-memory fallback (local dev only) ----
const memory = new Map(); // key -> { value, expiresAt|null }

function memGet(key) {
  const entry = memory.get(key);
  if (!entry) return null;
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    memory.delete(key);
    return null;
  }
  return entry.value;
}

function memSet(key, value, ttlSeconds) {
  memory.set(key, {
    value,
    expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
  });
}

// ---- public API ----

async function get(key) {
  if (usingUpstash) return redisCommand("get", key);
  return memGet(key);
}

async function set(key, value, ttlSeconds) {
  if (usingUpstash) {
    if (ttlSeconds) return redisCommand("set", key, value, "EX", String(ttlSeconds));
    return redisCommand("set", key, value);
  }
  return memSet(key, value, ttlSeconds);
}

module.exports = { get, set, usingUpstash };
