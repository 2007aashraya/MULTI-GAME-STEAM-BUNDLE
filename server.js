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
const store = require("./store");

const app = express();
const PORT = process.env.PORT || 3000;

// Render sits behind a reverse proxy — this tells Express to trust its
// X-Forwarded-For header. Without it, express-rate-limit throws on
// every request instead of rate-limiting.
app.set("trust proxy", 1);

/* ---------- config ---------- */

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

// serve the frontend (index.html, style.css, home.js, intro.html,
// intro.css, intro.js, library.html, etc.) from this same service
app.use(express.static(__dirname));

/* ---------- load order IDs + package assignment ---------- */

const KEYS_PATH = path.join(__dirname, "keys.json");

function loadOrders() {
  const raw = fs.readFileSync(KEYS_PATH, "utf8");
  const data = JSON.parse(raw);
  const byId = new Map();
  data.orders.forEach((o) => byId.set(o.id.trim().toUpperCase(), o.package));
  return { byId, packages: data.packages };
}

let { byId: ORDER_PACKAGE, packages: PACKAGES } = loadOrders();

/* ---------- session + redemption (persistent) ---------- */

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days — "stay logged in"

function createToken() {
  return crypto.randomBytes(24).toString("hex");
}

/* ---------- rate limiting ---------- */

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts. Try again later." },
});

/* ---------- routes ---------- */

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "nullbyte-auth-backend", persistent: store.usingUpstash });
});

app.post("/api/login", loginLimiter, async (req, res) => {
  const orderId = String(req.body?.orderId || "").trim().toUpperCase();

  if (!orderId) {
    return res.status(400).json({ success: false, message: "Order ID is required." });
  }

  const pkg = ORDER_PACKAGE.get(orderId);
  if (!pkg) {
    return res.status(401).json({ success: false, message: "Order ID not recognized." });
  }

  const alreadyRedeemed = await store.get(`redeemed:${orderId}`);
  if (alreadyRedeemed) {
    return res.status(401).json({
      success: false,
      message: "This Order ID has already been used to log in.",
    });
  }

  // mark redeemed permanently (no TTL) — one-time use, forever
  await store.set(`redeemed:${orderId}`, "1");

  const token = createToken();
  await store.set(
    `session:${token}`,
    JSON.stringify({ orderId, package: pkg }),
    SESSION_TTL_SECONDS
  );

  res.json({ success: true, token, package: pkg });
});

app.get("/api/me/:token", async (req, res) => {
  const raw = await store.get(`session:${req.params.token}`);
  if (!raw) return res.json({ valid: false });

  const session = JSON.parse(raw);
  res.json({
    valid: true,
    package: session.package,
    packageInfo: PACKAGES[session.package] || null,
  });
});

// kept for backwards compatibility with earlier frontend code
app.get("/api/session/:token", async (req, res) => {
  const raw = await store.get(`session:${req.params.token}`);
  res.json({ valid: Boolean(raw) });
});

app.post("/api/reload-keys", (req, res) => {
  const adminKey = req.headers["x-admin-key"];
  if (!process.env.ADMIN_KEY || adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({ success: false, message: "Forbidden." });
  }
  try {
    const reloaded = loadOrders();
    ORDER_PACKAGE = reloaded.byId;
    PACKAGES = reloaded.packages;
    res.json({ success: true, count: ORDER_PACKAGE.size });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to reload keys." });
  }
});

app.listen(PORT, () => {
  console.log(`nullbyte-auth-backend listening on port ${PORT}`);
  console.log(`persistent store: ${store.usingUpstash ? "Upstash Redis" : "in-memory (NOT persistent — set UPSTASH_REDIS_REST_URL/TOKEN)"}`);
});
