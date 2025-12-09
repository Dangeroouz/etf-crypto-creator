import express from "express";
import cors from "cors";

const app = express();
const PORT = 3333;

app.use(cors());

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
    
    const now = Date.now();
    const daysToShow = parseInt(days) || 1095;
    const startDate = now - (daysToShow * 24 * 60 * 60 * 1000);
    
    const response = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}USDT&interval=1d&startTime=${Math.floor(startDate)}&limit=3000`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const klines = await response.json();
    
    const data = klines.map(item => ({
      date: new Date(item[0]).toISOString().split('T')[0],
      open: parseFloat(item[1]),
      high: parseFloat(item[2]),
      low: parseFloat(item[3]),
      close: parseFloat(item[4]),
      volume: parseFloat(item[7]),
    }));
    
    console.log(`Returned ${data.length} real data points from Binance`);
    res.json(data);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
