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
