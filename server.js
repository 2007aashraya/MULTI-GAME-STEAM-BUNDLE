/* ============================================================
   NULL BYTE — MULTI GAMES BUNDLE
   server.js — order-id authentication backend (deploy on Render)
   ============================================================ */

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/* ---------- config ---------- */

// Comma-separated list of origins allowed to call this API.
// Set this in Render's environment variables, e.g.:
//   FRONTEND_ORIGIN = https://yourname.github.io,https://nullbyte.example.com
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "*")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.includes("*") ? true : allowedOrigins,
  })
);
app.use(express.json());

/* ---------- load valid order IDs ---------- */

const KEYS_PATH = path.join(__dirname, "keys.json");
const REDEEMED_PATH = path.join(__dirname, "redeemed.json");

function loadOrderIds() {
  const raw = fs.readFileSync(KEYS_PATH, "utf8");
  const data = JSON.parse(raw);
  return new Set(data.orderIds.map((id) => id.trim().toUpperCase()));
}

function loadRedeemed() {
  try {
    const raw = fs.readFileSync(REDEEMED_PATH, "utf8");
    return new Set(JSON.parse(raw));
  } catch (err) {
    return new Set(); // file doesn't exist yet — nothing redeemed
  }
}

function saveRedeemed(set) {
  fs.writeFileSync(REDEEMED_PATH, JSON.stringify([...set], null, 2));
}

let VALID_ORDER_IDS = loadOrderIds();
let REDEEMED_ORDER_IDS = loadRedeemed();

/* ---------- in-memory session store ----------
   Fine for a single Render instance / demo scale. For anything
   bigger, swap this Map for Redis or a small database table. */

const SESSIONS = new Map(); // token -> expiresAt (ms)
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days — "stay logged in"

function createSession() {
  const token = crypto.randomBytes(24).toString("hex");
  SESSIONS.set(token, Date.now() + SESSION_TTL_MS);
  return token;
}

function isSessionValid(token) {
  const expiresAt = SESSIONS.get(token);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    SESSIONS.delete(token);
    return false;
  }
  return true;
}

// sweep expired sessions periodically so the Map doesn't grow forever
setInterval(() => {
  const now = Date.now();
  for (const [token, expiresAt] of SESSIONS) {
    if (now > expiresAt) SESSIONS.delete(token);
  }
}, 1000 * 60 * 30);

/* ---------- rate limiting ----------
   Slows down brute-force guessing of order IDs. */

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // 20 attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts. Try again later." },
});

/* ---------- routes ---------- */

app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "nullbyte-auth-backend" });
});

app.post("/api/login", loginLimiter, (req, res) => {
  const orderId = String(req.body?.orderId || "").trim().toUpperCase();

  if (!orderId) {
    return res.status(400).json({ success: false, message: "Order ID is required." });
  }

  if (!VALID_ORDER_IDS.has(orderId)) {
    return res.status(401).json({ success: false, message: "Order ID not recognized." });
  }

  if (REDEEMED_ORDER_IDS.has(orderId)) {
    return res.status(401).json({
      success: false,
      message: "This Order ID has already been used to log in.",
    });
  }

  REDEEMED_ORDER_IDS.add(orderId);
  saveRedeemed(REDEEMED_ORDER_IDS);

  const token = createSession();
  res.json({ success: true, token });
});

app.get("/api/session/:token", (req, res) => {
  const { token } = req.params;
  res.json({ valid: isSessionValid(token) });
});

// hot-reload keys.json without redeploying, in case you update it via
// Render's shell or a future admin route
app.post("/api/reload-keys", (req, res) => {
  const adminKey = req.headers["x-admin-key"];
  if (!process.env.ADMIN_KEY || adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({ success: false, message: "Forbidden." });
  }
  try {
    VALID_ORDER_IDS = loadOrderIds();
    res.json({ success: true, count: VALID_ORDER_IDS.size });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to reload keys." });
  }
});

app.listen(PORT, () => {
  console.log(`nullbyte-auth-backend listening on port ${PORT}`);
});
