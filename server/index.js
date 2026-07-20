import express from "express";
import cors from "cors";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Redis from "ioredis";
import { connectDB } from "./config/database.js";
import User from "./models/User.js";
import Index from "./models/Index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3333;
const JWT_SECRET = process.env.JWT_SECRET;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Validate required environment variables
if (!JWT_SECRET && NODE_ENV === 'production') {
  console.error('❌ JWT_SECRET is required in production');
  process.exit(1);
}

if (!process.env.MONGODB_URI && NODE_ENV === 'production') {
  console.error('❌ MONGODB_URI is required in production');
  process.exit(1);
}

// CORS Configuration for production
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

await connectDB();

// Optional Redis client (provide REDIS_URL to enable)
let redis = null;
if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL);
    redis.on('error', (err) => console.error('Redis error:', err));
    console.log('Redis enabled');
  } catch (err) {
    console.error('Failed to initialize Redis:', err.message);
    redis = null;
  }
}

const CACHE_TTL = parseInt(process.env.REDIS_TTL || '300', 10);

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
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  } catch (e) {
    console.error('Redis set error:', e.message);
  }
}

async function delCached(key) {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (e) {
    console.error('Redis del error:', e.message);
  }
}

async function fetchHistorySeries(symbol, daysToShow) {
  const allKlines = [];
  let endTime = undefined;
  const requestsNeeded = Math.ceil(daysToShow / 1000);

  for (let i = 0; i < requestsNeeded; i++) {
    let url = `https://api.binance.com/api/v3/klines?symbol=${symbol}USDT&interval=1d&limit=1000`;
    if (endTime) {
      url += `&endTime=${endTime}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const klines = await response.json();
    if (klines.length === 0) {
      break;
    }

    allKlines.unshift(...klines);
    endTime = klines[0][0] - 1;

    if (klines.length < 1000) {
      break;
    }
  }

  const recentKlines = allKlines.slice(-daysToShow);
  return recentKlines.map((item) => ({
    date: new Date(item[0]).toISOString().split('T')[0],
    open: parseFloat(item[1]),
    high: parseFloat(item[2]),
    low: parseFloat(item[3]),
    close: parseFloat(item[4]),
    volume: parseFloat(item[7]),
  }));
}

async function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = new mongoose.Types.ObjectId(decoded.userId);
    req.email = decoded.email;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
}


app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    const newUser = new User({
      email,
      password: hashedPassword,
    });

    const savedUser = await newUser.save();

    const token = jwt.sign(
      { userId: savedUser._id, email: savedUser.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const userResp = { id: savedUser._id.toString(), email: savedUser.email };
    await setCached(`user:${savedUser._id.toString()}`, userResp);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: userResp,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isValidPassword = await bcryptjs.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: { id: user._id.toString(), email: user.email },
    });
    // warm user cache after login
    await setCached(`user:${user._id.toString()}`, { id: user._id.toString(), email: user.email });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/auth/verify", verifyToken, async (req, res) => {
  try {
    const cacheKey = `user:${req.userId}`;

    const cached = await getCached(cacheKey);
    if (cached) {
      return res.json({ user: cached });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const userPayload = { id: user._id, email: user.email };
    await setCached(cacheKey, userPayload);

    res.json({ user: userPayload });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.post("/api/indices", verifyToken, async (req, res) => {
  try {
    const { name, selected, weights, initialInvestment } = req.body;
    
    console.log("📝 Creating index for userId:", req.userId);
    console.log("📝 Request body:", { name, selected, weights, initialInvestment });

    const newIndex = new Index({
      userId: req.userId,
      name,
      selected,
      weights,
      initialInvestment,
    });

    const savedIndex = await newIndex.save();
    
    console.log("✅ Index created successfully:", savedIndex._id);

    const transformedIndex = {
      id: savedIndex._id.toString(),
      userId: savedIndex.userId.toString(),
      name: savedIndex.name,
      selected: savedIndex.selected,
      weights: savedIndex.weights,
      initialInvestment: savedIndex.initialInvestment,
      createdAt: savedIndex.createdAt,
      updatedAt: savedIndex.updatedAt,
    };

    // update indices cache for this user (warm)
    try {
      const indices = await Index.find({ userId: req.userId });
      const transformedIndices = indices.map((index) => ({
        id: index._id.toString(),
        userId: index.userId.toString(),
        name: index.name,
        selected: index.selected,
        weights: index.weights,
        initialInvestment: index.initialInvestment,
        createdAt: index.createdAt,
        updatedAt: index.updatedAt,
      }));
      await setCached(`indices:${req.userId}`, transformedIndices);
      await setCached(`index:${req.userId}:${savedIndex._id.toString()}`, transformedIndex);
    } catch (e) {
      await delCached(`indices:${req.userId}`);
      await delCached(`index:${req.userId}:${savedIndex._id.toString()}`);
    }

    res.status(201).json({
      message: "Index created successfully",
      index: transformedIndex,
    });
  } catch (error) {
    console.error("❌ Create index error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/indices", verifyToken, async (req, res) => {
  try {
    console.log("🔍 Fetching indices for userId:", req.userId);
    const cacheKey = `indices:${req.userId}`;
    const cached = await getCached(cacheKey);
    if (cached) {
      console.log('✅ Returned cached indices');
      return res.json(cached);
    }

    const indices = await Index.find({ userId: req.userId });

    const transformedIndices = indices.map((index) => ({
      id: index._id.toString(),
      userId: index.userId.toString(),
      name: index.name,
      selected: index.selected,
      weights: index.weights,
      initialInvestment: index.initialInvestment,
      createdAt: index.createdAt,
      updatedAt: index.updatedAt,
    }));
    
    console.log(`📊 Found ${transformedIndices.length} indices for user`, req.userId);
    await setCached(cacheKey, transformedIndices);
    res.json(transformedIndices);
  } catch (error) {
    console.error("❌ Get indices error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/indices/:indexId", verifyToken, async (req, res) => {
  try {
    const { indexId } = req.params;
    const cacheKey = `index:${req.userId}:${indexId}`;
    const cached = await getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const index = await Index.findOne({
      _id: indexId,
      userId: req.userId,
    });

    if (!index) {
      return res.status(404).json({ error: "Index not found" });
    }

    const transformedIndex = {
      id: index._id.toString(),
      userId: index.userId.toString(),
      name: index.name,
      selected: index.selected,
      weights: index.weights,
      initialInvestment: index.initialInvestment,
      createdAt: index.createdAt,
      updatedAt: index.updatedAt,
    };

    await setCached(cacheKey, transformedIndex);
    res.json(transformedIndex);
  } catch (error) {
    console.error("Get index error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/indices/:indexId", verifyToken, async (req, res) => {
  try {
    const { indexId } = req.params;
    const { name, selected, weights, initialInvestment } = req.body;

    const index = await Index.findOneAndUpdate(
      { _id: indexId, userId: req.userId },
      {
        name: name ?? undefined,
        selected: selected ?? undefined,
        weights: weights ?? undefined,
        initialInvestment: initialInvestment ?? undefined,
      },
      { new: true, runValidators: true }
    );

    if (!index) {
      return res.status(404).json({ error: "Index not found" });
    }

    const transformedIndex = {
      id: index._id.toString(),
      userId: index.userId.toString(),
      name: index.name,
      selected: index.selected,
      weights: index.weights,
      initialInvestment: index.initialInvestment,
      createdAt: index.createdAt,
      updatedAt: index.updatedAt,
    };

    // update caches (warm)
    try {
      const indices = await Index.find({ userId: req.userId });
      const transformedIndices = indices.map((i) => ({
        id: i._id.toString(),
        userId: i.userId.toString(),
        name: i.name,
        selected: i.selected,
        weights: i.weights,
        initialInvestment: i.initialInvestment,
        createdAt: i.createdAt,
        updatedAt: i.updatedAt,
      }));
      await setCached(`indices:${req.userId}`, transformedIndices);
      await setCached(`index:${req.userId}:${indexId}`, transformedIndex);
    } catch (e) {
      await delCached(`indices:${req.userId}`);
      await delCached(`index:${req.userId}:${indexId}`);
    }

    res.json({
      message: "Index updated successfully",
      index: transformedIndex,
    });
  } catch (error) {
    console.error("Update index error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/indices/:indexId", verifyToken, async (req, res) => {
  try {
    const { indexId } = req.params;
    const index = await Index.findOneAndDelete({
      _id: indexId,
      userId: req.userId,
    });

    if (!index) {
      return res.status(404).json({ error: "Index not found" });
    }

    const transformedIndex = {
      id: index._id.toString(),
      userId: index.userId.toString(),
      name: index.name,
      selected: index.selected,
      weights: index.weights,
      initialInvestment: index.initialInvestment,
      createdAt: index.createdAt,
      updatedAt: index.updatedAt,
    };

    // update indices cache after delete
    try {
      const indices = await Index.find({ userId: req.userId });
      const transformedIndices = indices.map((i) => ({
        id: i._id.toString(),
        userId: i.userId.toString(),
        name: i.name,
        selected: i.selected,
        weights: i.weights,
        initialInvestment: i.initialInvestment,
        createdAt: i.createdAt,
        updatedAt: i.updatedAt,
      }));
      await setCached(`indices:${req.userId}`, transformedIndices);
      await delCached(`index:${req.userId}:${indexId}`);
    } catch (e) {
      await delCached(`indices:${req.userId}`);
      await delCached(`index:${req.userId}:${indexId}`);
    }

    res.json({
      message: "Index deleted successfully",
      index: transformedIndex,
    });
  } catch (error) {
    console.error("Delete index error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/price/:symbol", async (req, res) => {
  const { symbol } = req.params;
  const cacheKey = `price:${symbol.toUpperCase()}`;

  try {
    const cached = await getCached(cacheKey);
    if (cached) {
      console.log(`✅ Returned cached price for ${symbol}`);
      return res.json(cached);
    }

    console.log(`Fetching current price for ${symbol}...`);

    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const payload = {
      symbol: data.symbol,
      price: parseFloat(data.price),
      timestamp: new Date().toISOString(),
    };

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
      console.log(`✅ Returned cached stats for ${symbol}`);
      return res.json(cached);
    }

    console.log(`Fetching 24h stats for ${symbol}...`);

    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}USDT`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const payload = {
      symbol: data.symbol,
      currentPrice: parseFloat(data.lastPrice),
      high24h: parseFloat(data.highPrice),
      low24h: parseFloat(data.lowPrice),
      priceChange24h: parseFloat(data.priceChange),
      priceChangePercent24h: parseFloat(data.priceChangePercent),
      volume24h: parseFloat(data.volume),
    };

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
      console.log(`✅ Returned cached crypto data for ${symbol}`);
      return res.json(cached);
    }

    console.log(`Fetching combined data for ${symbol}...`);

    const [priceRes, statsRes] = await Promise.all([
      fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`),
      fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}USDT`)
    ]);

    if (!priceRes.ok || !statsRes.ok) {
      throw new Error("Failed to fetch combined data from Binance");
    }

    const priceData = await priceRes.json();
    const statsData = await statsRes.json();
    const payload = {
      symbol,
      price: parseFloat(priceData.price),
      currentPrice: parseFloat(statsData.lastPrice),
      high24h: parseFloat(statsData.highPrice),
      low24h: parseFloat(statsData.lowPrice),
      priceChange24h: parseFloat(statsData.priceChange),
      priceChangePercent24h: parseFloat(statsData.priceChangePercent),
      volume24h: parseFloat(statsData.volume),
      timestamp: new Date().toISOString()
    };

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
      console.log(`✅ Returned cached comparison history for ${symbols.join(",")}`);
      return res.json(cached);
    }

    console.log(`Fetching comparison history for ${symbols.join(",")} (${days} days)...`);
    const data = Object.fromEntries(
      await Promise.all(
        symbols.map(async (symbol) => {
          const series = await fetchHistorySeries(symbol, days);
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
  const daysToShow = parseInt(days) || 1095;
  const cacheKey = `history:${symbol.toUpperCase()}:${daysToShow}`;

  try {
    const cached = await getCached(cacheKey);
    if (cached) {
      console.log(`✅ Returned cached history for ${symbol} (${daysToShow} days)`);
      return res.json(cached);
    }

    console.log(`Fetching real data for ${symbol} (${daysToShow} days)...`);
    const data = await fetchHistorySeries(symbol, daysToShow);

    await setCached(cacheKey, data);
    console.log(`Requested ${daysToShow} days, returned ${data.length} real data points from Binance (range: ${data[0]?.date || 'N/A'} to ${data[data.length - 1]?.date || 'N/A'})`);
    res.json(data);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT} (${NODE_ENV})`)
);
