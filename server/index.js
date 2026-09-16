import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Redis from "ioredis";
import { fileURLToPath } from "node:url";
import { connectDB, getDatabaseStatus, isDatabaseReady } from "./config/database.js";
import authRoutes from "./routes/authRoutes.js";
import indexRoutes from "./routes/indexRoutes.js";
import { securityMiddleware, authLimiter, generalLimiter } from "./middleware/security.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { getCombinedCryptoData, getHistorySeries, getPrice, getStats } from "./services/binanceService.js";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const defaultEnvCandidates = [
  process.env.ENV_FILE,
  `${rootDir}/.env.local`,
  `${rootDir}/.env`,
].filter(Boolean);

for (const envPath of defaultEnvCandidates) {
  const result = dotenv.config({ path: envPath });
  if (!result.error) {
    break;
  }
}

const app = express();
const PORT = process.env.PORT || 3333;
const NODE_ENV = process.env.NODE_ENV || "development";

if (!process.env.JWT_SECRET && NODE_ENV === "production") {
  console.error("❌ JWT_SECRET is required in production");
  process.exit(1);
}

if (!process.env.MONGODB_URI && NODE_ENV === "production") {
  console.error("❌ MONGODB_URI is required in production");
  process.exit(1);
}

const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(securityMiddleware);
app.use(cors(corsOptions));
app.use(express.json());
app.disable("x-powered-by");

await connectDB();

let redis = null;
if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL);
    redis.on("error", (err) => console.error("Redis error:", err));
    console.log("Redis enabled");
  } catch (err) {
    console.error("Failed to initialize Redis:", err.message);
    redis = null;
  }
}

const CACHE_TTL = parseInt(process.env.REDIS_TTL || "300", 10);

async function getCached(key) {
  if (!redis) return null;
  const raw = await redis.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

async function setCached(key, value, ttl = CACHE_TTL) {
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttl);
  } catch (e) {
    console.error("Redis set error:", e.message);
  }
}

app.get("/", (_req, res) => {
  res.json({ status: "ok", environment: NODE_ENV });
});

app.get("/health", (_req, res) => {
  const dbStatus = getDatabaseStatus();
  res.json({
    status: isDatabaseReady() ? "ok" : "degraded",
    environment: NODE_ENV,
    database: dbStatus,
    redis: Boolean(redis),
  });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/indices", authLimiter, indexRoutes);
app.use("/api/price", generalLimiter);
app.use("/api/stats", generalLimiter);
app.use("/api/crypto", generalLimiter);
app.use("/api/history", generalLimiter);

app.get("/api/price/:symbol", async (req, res) => {
  const { symbol } = req.params;
  const cacheKey = `price:${symbol.toUpperCase()}`;

  try {
    const cached = await getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const payload = await getPrice(symbol);

    await setCached(cacheKey, payload, 60);
    res.json(payload);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/stats/:symbol", async (req, res) => {
  const { symbol } = req.params;
  const cacheKey = `stats:${symbol.toUpperCase()}`;

  try {
    const cached = await getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const payload = await getStats(symbol);

    await setCached(cacheKey, payload, 60);
    res.json(payload);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/crypto/:symbol", async (req, res) => {
  const { symbol } = req.params;
  const cacheKey = `crypto:${symbol.toUpperCase()}`;

  try {
    const cached = await getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const payload = await getCombinedCryptoData(symbol);

    await setCached(cacheKey, payload, 60);
    res.json(payload);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/history/compare", async (req, res) => {
  const symbols = (req.query.symbols || "BTC")
    .toString()
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  const days = parseInt(req.query.days?.toString() || "1095", 10) || 1095;
  const cacheKey = `history:compare:${symbols.join(",")}:${days}`;

  try {
    const cached = await getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const data = Object.fromEntries(
      await Promise.all(
        symbols.map(async (symbol) => {
          const series = await getHistorySeries(symbol, days);
          return [symbol, series];
        })
      )
    );

    await setCached(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/history/:symbol", async (req, res) => {
  const { symbol } = req.params;
  const { days } = req.query;
  const daysToShow = parseInt(days, 10) || 1095;
  const cacheKey = `history:${symbol.toUpperCase()}:${daysToShow}`;

  try {
    const cached = await getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const data = await getHistorySeries(symbol, daysToShow);
    await setCached(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} (${NODE_ENV})`);
});
