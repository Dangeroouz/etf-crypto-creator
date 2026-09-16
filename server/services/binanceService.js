const BINANCE_BASE_URL = 'https://api.binance.com/api/v3';

function buildUrl(path, params = {}) {
  const query = new URLSearchParams(params).toString();
  return `${BINANCE_BASE_URL}${path}${query ? `?${query}` : ''}`;
}

async function fetchWithTimeout(url, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getPrice(symbol) {
  const url = buildUrl('/ticker/price', { symbol: `${symbol.toUpperCase()}USDT` });
  const response = await fetchWithTimeout(url);

  if (!response.ok) {
    throw new Error(`Binance price request failed with status ${response.status}`);
  }

  const data = await response.json();
  return {
    symbol: data.symbol,
    price: parseFloat(data.price),
    timestamp: new Date().toISOString(),
  };
}

export async function getStats(symbol) {
  const url = buildUrl('/ticker/24hr', { symbol: `${symbol.toUpperCase()}USDT` });
  const response = await fetchWithTimeout(url);

  if (!response.ok) {
    throw new Error(`Binance stats request failed with status ${response.status}`);
  }

  const data = await response.json();
  return {
    symbol: data.symbol,
    currentPrice: parseFloat(data.lastPrice),
    high24h: parseFloat(data.highPrice),
    low24h: parseFloat(data.lowPrice),
    priceChange24h: parseFloat(data.priceChange),
    priceChangePercent24h: parseFloat(data.priceChangePercent),
    volume24h: parseFloat(data.volume),
  };
}

export async function getCombinedCryptoData(symbol) {
  const [priceData, statsData] = await Promise.all([
    getPrice(symbol),
    getStats(symbol),
  ]);

  return {
    symbol: symbol.toUpperCase(),
    price: priceData.price,
    currentPrice: statsData.currentPrice,
    high24h: statsData.high24h,
    low24h: statsData.low24h,
    priceChange24h: statsData.priceChange24h,
    priceChangePercent24h: statsData.priceChangePercent24h,
    volume24h: statsData.volume24h,
    timestamp: new Date().toISOString(),
  };
}

export async function getHistorySeries(symbol, daysToShow) {
  const allKlines = [];
  let endTime;
  const requestsNeeded = Math.ceil(daysToShow / 1000);

  for (let i = 0; i < requestsNeeded; i += 1) {
    const params = new URLSearchParams({
      symbol: `${symbol.toUpperCase()}USDT`,
      interval: '1d',
      limit: '1000',
    });

    if (endTime) {
      params.set('endTime', String(endTime));
    }

    const url = buildUrl('/klines', Object.fromEntries(params.entries()));
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      throw new Error(`Binance history request failed with status ${response.status}`);
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
