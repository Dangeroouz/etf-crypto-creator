import express from "express";
import cors from "cors";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3333;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";

const USERS_FILE = path.join(__dirname, "data", "users.json");
const INDICES_FILE = path.join(__dirname, "data", "indices.json");

app.use(cors());
app.use(express.json());

// Helpers for file operations
async function readUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function writeUsers(users) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

async function readIndices() {
  try {
    const data = await fs.readFile(INDICES_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function writeIndices(indices) {
  await fs.writeFile(INDICES_FILE, JSON.stringify(indices, null, 2));
}

// Middleware: Verify JWT token
async function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.email = decoded.email;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
}

// ====== AUTHENTICATION ENDPOINTS ======

// Register endpoint
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const users = await readUsers();
    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const userId = Date.now().toString();
    
    const newUser = {
      id: userId,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await writeUsers(users);

    const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: { id: userId, email }
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Login endpoint
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const users = await readUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isValidPassword = await bcryptjs.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      message: "Login successful",
      token,
      user: { id: user.id, email: user.email }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Verify token endpoint
app.get("/api/auth/verify", verifyToken, async (req, res) => {
  try {
    const users = await readUsers();
    const user = users.find(u => u.id === req.userId);

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    res.json({ user: { id: user.id, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ====== INDEX MANAGEMENT ENDPOINTS ======

// Create new index
app.post("/api/indices", verifyToken, async (req, res) => {
  try {
    const { name, selected, weights, initialInvestment } = req.body;

    const indices = await readIndices();
    const newIndex = {
      id: Date.now().toString(),
      userId: req.userId,
      name,
      selected,
      weights,
      initialInvestment,
      createdAt: new Date().toISOString()
    };

    indices.push(newIndex);
    await writeIndices(indices);

    res.status(201).json({ message: "Index created successfully", index: newIndex });
  } catch (error) {
    console.error("Create index error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get all user's indices
app.get("/api/indices", verifyToken, async (req, res) => {
  try {
    const indices = await readIndices();
    const userIndices = indices.filter(idx => idx.userId === req.userId);
    res.json(userIndices);
  } catch (error) {
    console.error("Get indices error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get single index by ID
app.get("/api/indices/:indexId", verifyToken, async (req, res) => {
  try {
    const { indexId } = req.params;
    const indices = await readIndices();
    const index = indices.find(idx => idx.id === indexId && idx.userId === req.userId);

    if (!index) {
      return res.status(404).json({ error: "Index not found" });
    }

    res.json(index);
  } catch (error) {
    console.error("Get index error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update index
app.put("/api/indices/:indexId", verifyToken, async (req, res) => {
  try {
    const { indexId } = req.params;
    const { name, selected, weights, initialInvestment } = req.body;

    const indices = await readIndices();
    const indexIdx = indices.findIndex(idx => idx.id === indexId && idx.userId === req.userId);

    if (indexIdx === -1) {
      return res.status(404).json({ error: "Index not found" });
    }

    indices[indexIdx] = {
      ...indices[indexIdx],
      name: name ?? indices[indexIdx].name,
      selected: selected ?? indices[indexIdx].selected,
      weights: weights ?? indices[indexIdx].weights,
      initialInvestment: initialInvestment ?? indices[indexIdx].initialInvestment,
      updatedAt: new Date().toISOString()
    };

    await writeIndices(indices);
    res.json({ message: "Index updated successfully", index: indices[indexIdx] });
  } catch (error) {
    console.error("Update index error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete index
app.delete("/api/indices/:indexId", verifyToken, async (req, res) => {
  try {
    const { indexId } = req.params;
    const indices = await readIndices();
    const indexIdx = indices.findIndex(idx => idx.id === indexId && idx.userId === req.userId);

    if (indexIdx === -1) {
      return res.status(404).json({ error: "Index not found" });
    }

    const deletedIndex = indices.splice(indexIdx, 1);
    await writeIndices(indices);

    res.json({ message: "Index deleted successfully", index: deletedIndex[0] });
  } catch (error) {
    console.error("Delete index error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Ендпоінт 1: Остання ціна BTC
app.get("/api/price/:symbol", async (req, res) => {
  const { symbol } = req.params;
  
  try {
    console.log(`Fetching current price for ${symbol}...`);
    
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    res.json({
      symbol: data.symbol,
      price: parseFloat(data.price),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Ендпоінт 2: 24-годинна статистика
app.get("/api/stats/:symbol", async (req, res) => {
  const { symbol } = req.params;
  
  try {
    console.log(`Fetching 24h stats for ${symbol}...`);
    
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}USDT`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    res.json({
      symbol: data.symbol,
      currentPrice: parseFloat(data.lastPrice),
      high24h: parseFloat(data.highPrice),
      low24h: parseFloat(data.lowPrice),
      priceChange24h: parseFloat(data.priceChange),
      priceChangePercent24h: parseFloat(data.priceChangePercent),
      volume24h: parseFloat(data.volume),
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Ендпоінт 2.5: Об'єднаний ендпоінт (ціна + 24h статистика)
app.get("/api/crypto/:symbol", async (req, res) => {
  const { symbol } = req.params;

  try {
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

    res.json({
      symbol,
      price: parseFloat(priceData.price),
      currentPrice: parseFloat(statsData.lastPrice),
      high24h: parseFloat(statsData.highPrice),
      low24h: parseFloat(statsData.lowPrice),
      priceChange24h: parseFloat(statsData.priceChange),
      priceChangePercent24h: parseFloat(statsData.priceChangePercent),
      volume24h: parseFloat(statsData.volume),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Ендпоінт 3: Історичні дані
app.get("/api/history/:symbol", async (req, res) => {
  const { symbol } = req.params;
  const { days } = req.query;
  
  try {
    console.log(`Fetching real data for ${symbol} (${days || 1095} days)...`);
    
    const daysToShow = parseInt(days) || 1095;
    // Binance API limit is 1000 candles per request
    // We need to fetch multiple times to get older data
    const allKlines = [];
    let endTime = undefined; // undefined means fetch the most recent data
    const requestsNeeded = Math.ceil(daysToShow / 1000);
    
    console.log(`Need ${requestsNeeded} requests to fetch ${daysToShow} days of data`);
    
    for (let i = 0; i < requestsNeeded; i++) {
      let url = `https://api.binance.com/api/v3/klines?symbol=${symbol}USDT&interval=1d&limit=1000`;
      if (endTime) {
        url += `&endTime=${endTime}`;
      }
      
      console.log(`Fetching batch ${i + 1}/${requestsNeeded}...`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const klines = await response.json();
      
      if (klines.length === 0) {
        console.log(`No more data available for ${symbol}`);
        break;
      }
      
      // Add to beginning (since we're fetching backwards)
      allKlines.unshift(...klines);
      
      // Set endTime to the beginning of this batch for the next request
      endTime = klines[0][0] - 1; // Subtract 1 to avoid overlap
      
      // If we got fewer than 1000, we've reached the beginning
      if (klines.length < 1000) {
        console.log(`Reached the beginning of data at ${new Date(klines[0][0]).toISOString()}`);
        break;
      }
    }
    
    // Take the last daysToShow records
    const recentKlines = allKlines.slice(-daysToShow);
    
    const data = recentKlines.map(item => ({
      date: new Date(item[0]).toISOString().split('T')[0],
      open: parseFloat(item[1]),
      high: parseFloat(item[2]),
      low: parseFloat(item[3]),
      close: parseFloat(item[4]),
      volume: parseFloat(item[7]),
    }));
    
    console.log(`Requested ${daysToShow} days, returned ${data.length} real data points from Binance (range: ${data[0]?.date || 'N/A'} to ${data[data.length - 1]?.date || 'N/A'})`);
    res.json(data);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
