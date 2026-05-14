import { API_URL } from "../config";

interface DailyPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface BacktestResult {
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  peakBalance?: number;
  minBalance?: number;
  maxDailyLoss?: number;
  maxDailyProfit?: number;
  benchmarkReturn?: number;
  outperformance?: number;
  portfolioPrices?: number[]; // Portfolio prices in USD based on initial investment
  portfolioDates?: string[];
  benchmarkPrices?: number[];
  startDate?: string;
  biggestWinDay?: { date: string; return: number };
  biggestLossDay?: { date: string; return: number };
}

export interface PortfolioPNL {
  currentValue: number;
  pnlUSD: number;
  pnlPercent: number;
  creationDate: string;
  currentDate: string;
  assetPrices: { symbol: string; priceAtCreation: number; priceToday: number; change24h: number }[];
  sharpeRatio?: number;
  biggestWinDay?: { date: string; return: number };
  biggestLossDay?: { date: string; return: number };
  portfolioPrices?: number[];
  portfolioDates?: string[];
}




export async function getHistoricalData(
  symbol: string,
  days: number = 365
): Promise<DailyPrice[]> {
  try {
    console.log(`[API] Requesting history for ${symbol}`, { days, url: `${API_URL}/api/history/${symbol}?days=${days}` });
    
    const response = await fetch(
      `${API_URL}/api/history/${symbol}?days=${days}`
    );

    if (!response.ok) {
      console.error(`[API] HTTP Error for ${symbol}:`, response.status, response.statusText);
      throw new Error(`Failed to fetch history for ${symbol}: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[API] Got ${data.length} data points for ${symbol}`);
    return data;
  } catch (error) {
    console.error(`Error fetching history for ${symbol}:`, error);
    throw error;
  }
}

function calculateIndexPerformance(
  prices: { [key: string]: DailyPrice[] },
  weights: number[],
  symbols: string[],
  maxDataLength?: number
): number[] {
  
  let minLength = Math.min(...Object.values(prices).map(p => p.length));
  
  if (maxDataLength !== undefined) {
    minLength = Math.min(minLength, maxDataLength);
  }

  const indexPrices: number[] = [];

  let holdings: number[] = new Array(symbols.length).fill(0);
  let totalValue = 1; // Start with normalized value

  // Initial investment
  for (let j = 0; j < symbols.length; j++) {
    const weight = weights[j] / 100;
    const initialPrice = prices[symbols[j]][0].close;
    holdings[j] = (weight * totalValue) / initialPrice;
  }

  for (let i = 0; i < minLength; i++) {
    // Calculate current portfolio value
    let portfolioPrice = 0;
    for (let j = 0; j < symbols.length; j++) {
      portfolioPrice += holdings[j] * prices[symbols[j]][i].close;
    }
    indexPrices.push(portfolioPrice);
  }

  return indexPrices;
}

function calculateMetrics(prices: number[]): {
  totalReturn: number;
  dailyReturns: number[];
  volatility: number;
} {
  const dailyReturns: number[] = [];
  let sumReturn = 0;
  let sumSquaredReturn = 0;

  for (let i = 1; i < prices.length; i++) {
    const dailyReturn = (prices[i] - prices[i - 1]) / prices[i - 1];
    dailyReturns.push(dailyReturn);
    sumReturn += dailyReturn;
    sumSquaredReturn += dailyReturn * dailyReturn;
  }

  const avgReturn = sumReturn / dailyReturns.length;
  const variance = (sumSquaredReturn / dailyReturns.length) - (avgReturn * avgReturn);
  const volatility = Math.sqrt(Math.max(0, variance)) * Math.sqrt(252);
  const totalReturn = ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100;

  return { totalReturn, dailyReturns, volatility };
}

function calculateIndividualVolatilities(
  prices: { [key: string]: DailyPrice[] },
  symbols: string[],
  minLength: number
): number[] {
  const volatilities: number[] = [];

  for (const symbol of symbols) {
    const symbolPrices = prices[symbol].slice(-minLength).map(p => p.close);
    
    let sumReturn = 0;
    let sumSquaredReturn = 0;
    let returnCount = 0;

    for (let i = 1; i < symbolPrices.length; i++) {
      const dailyReturn = (symbolPrices[i] - symbolPrices[i - 1]) / symbolPrices[i - 1];
      sumReturn += dailyReturn;
      sumSquaredReturn += dailyReturn * dailyReturn;
      returnCount++;
    }

    const avgReturn = sumReturn / returnCount;
    const variance = (sumSquaredReturn / returnCount) - (avgReturn * avgReturn);
    const volatility = Math.sqrt(Math.max(0, variance)) * Math.sqrt(252); // Annualized

    volatilities.push(volatility);
  }

  return volatilities;
}

function calculatePortfolioVolatility(
  individualVolatilities: number[],
  weights: number[]
): number {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const normalizedWeights = weights.map(w => w / totalWeight);

  const volatilitySquaredSum = normalizedWeights.reduce(
    (sum, weight, i) => sum + Math.pow(weight * individualVolatilities[i], 2),
    0
  );

  return Math.sqrt(volatilitySquaredSum);
}


function calculateSharpeRatio(
  dailyReturns: number[],
  volatility: number
): number {
  const riskFreeRate = 0.02 / 252; // 2% annual risk-free rate
  const avgReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const excessReturn = (avgReturn - riskFreeRate) * 252; // Annualized

  if (volatility === 0) return 0;
  return excessReturn / volatility;
}

function calculateMaxDrawdown(portfolioPricesUSD: number[], initialInvestment: number): number {
  if (portfolioPricesUSD.length === 0) return 0;
  
  const minBalance = Math.min(...portfolioPricesUSD);
  const maxDrawdown = ((minBalance - initialInvestment) / initialInvestment) * 100;
  
  return maxDrawdown;
}

function calculateBalanceExtremes(
  portfolioPricesUSD: number[]
): { peakBalance: number; minBalance: number } {
  let peakBalance = portfolioPricesUSD[0];
  let minBalance = peakBalance;
  
  for (let i = 1; i < portfolioPricesUSD.length; i++) {
    const price = portfolioPricesUSD[i];
    if (price > peakBalance) peakBalance = price;
    else if (price < minBalance) minBalance = price;
  }
  
  return { peakBalance, minBalance };
}

function calculateDailyReturnMetrics(
  prices: number[],
  dates: string[],
  dailyReturns: number[]
): {
  maxDailyLoss: number;
  maxDailyProfit: number;
  biggestWinDay?: { date: string; return: number };
  biggestLossDay?: { date: string; return: number };
} {
  if (!prices || !dates || prices.length < 2 || !dailyReturns || dailyReturns.length === 0) {
    return { maxDailyLoss: 0, maxDailyProfit: 0 };
  }

  let maxDailyLoss = 0;
  let maxDailyProfit = 0;
  let maxWinIdx = -1;
  let maxLossIdx = -1;
  let maxWinReturn = -Infinity;
  let maxLossReturn = Infinity;

  for (let i = 0; i < dailyReturns.length; i++) {
    const dailyReturnPercent = dailyReturns[i] * 100;
    
    if (dailyReturnPercent < maxDailyLoss) maxDailyLoss = dailyReturnPercent;
    if (dailyReturnPercent > maxDailyProfit) maxDailyProfit = dailyReturnPercent;

    if (dailyReturnPercent > maxWinReturn) {
      maxWinReturn = dailyReturnPercent;
      maxWinIdx = i + 1;
    }
    if (dailyReturnPercent < maxLossReturn) {
      maxLossReturn = dailyReturnPercent;
      maxLossIdx = i + 1;
    }
  }

  return {
    maxDailyLoss,
    maxDailyProfit,
    biggestWinDay: maxWinIdx > 0 && maxWinIdx < dates.length ? { date: dates[maxWinIdx], return: maxWinReturn } : undefined,
    biggestLossDay: maxLossIdx > 0 && maxLossIdx < dates.length ? { date: dates[maxLossIdx], return: maxLossReturn } : undefined,
  };
}

function calculateWinRate(dailyReturns: number[]): number {
  const winDays = dailyReturns.filter(r => r > 0).length;
  return (winDays / dailyReturns.length) * 100;
}

export async function runBacktest(
  symbols: string[],
  weights: number[],
  benchmarkSymbol: string,
  period: string = "1Y",
  initialInvestment: number = 1000,
  customStartDate?: string,
  customEndDate?: string,
): Promise<BacktestResult> {
  try {
    console.log(`[Backtest] Starting backtest:`, {
      symbols,
      period,
      customStartDate,
      customEndDate,
      initialInvestment,
      benchmarkSymbol,
    });

    let daysToFetch = 1825; // Default to 5 years for fetching
    
    if (period !== "Custom") {
      const daysMap: { [key: string]: number } = {
        "1M": 30,
        "3M": 90,
        "6M": 180,
        "1Y": 365,
        "2Y": 730,
        "3Y": 1095,
        "5Y": 1825,
      };
      daysToFetch = daysMap[period] || 365;
    }

    const priceData: { [key: string]: DailyPrice[] } = {};

    const allRequests = [
      ...symbols.map(s => getHistoricalData(s, daysToFetch)),
    ];

    const hasBenchmark = benchmarkSymbol !== "None";
    if (hasBenchmark) {
      allRequests.push(getHistoricalData(benchmarkSymbol, daysToFetch));
    }

    const responses = await Promise.all(allRequests);

    for (let i = 0; i < symbols.length; i++) {
      priceData[symbols[i]] = responses[i];
      console.log(`[Backtest] ${symbols[i]}: Got ${responses[i].length} data points`);
    }

    if (hasBenchmark) {
      priceData[benchmarkSymbol] = responses[symbols.length];
      console.log(`[Backtest] ${benchmarkSymbol} (benchmark): Got ${responses[symbols.length].length} data points`);
    }

    if (period === "Custom" && customStartDate) {
      const startDateObj = new Date(customStartDate);
      const startDateStr = startDateObj.toISOString().split('T')[0]; // "YYYY-MM-DD"
      
      const endDateObj = customEndDate ? new Date(customEndDate) : new Date();
      const endDateStr = endDateObj.toISOString().split('T')[0]; // "YYYY-MM-DD"
      
      const allSymbols = hasBenchmark ? [...symbols, benchmarkSymbol] : symbols;
      
      console.log(`[Backtest] Filtering dates: ${startDateStr} to ${endDateStr} (from ${customStartDate})`);
      
      for (const sym of allSymbols) {
        if (!priceData[sym] || priceData[sym].length === 0) {
          console.warn(`[Backtest] No data to filter for ${sym}`);
          continue;
        }
        
        const beforeFilter = priceData[sym].length;
        const beforeRange = `${priceData[sym][0].date} to ${priceData[sym][priceData[sym].length - 1].date}`;
        
        priceData[sym] = priceData[sym].filter(p => {
          return p.date >= startDateStr && p.date <= endDateStr;
        });
        
        console.log(`[Backtest] ${sym}: ${beforeFilter} (${beforeRange}) → ${priceData[sym].length} after date filter`);
      }

      console.log(`[Backtest] Custom date range: ${customStartDate} to ${customEndDate || 'today'}`);
    }

    const allSymbols = hasBenchmark ? [...symbols, benchmarkSymbol] : symbols;
    const minLength = Math.min(...allSymbols.map(sym => priceData[sym].length));

    console.log(`[Backtest] Period: ${period}, Requested ${daysToFetch} days`);
    console.log(`[Backtest] Data lengths:`, allSymbols.map(sym => `${sym}=${priceData[sym].length}`).join(', '));
    console.log(`[Backtest] Min length: ${minLength}, Using last ${minLength} days for synchronization`);

    if (minLength < 2) {
      const details = allSymbols.map(sym => `${sym}=${priceData[sym]?.length || 0}`).join(', ');
      throw new Error(`Insufficient data for backtest. Got ${minLength} data points (${details}), need at least 2. Make sure all symbols are valid crypto tickers and have sufficient historical data.`);
    }

    const synchronizedData: { [key: string]: DailyPrice[] } = {};
    for (const sym of allSymbols) {
      synchronizedData[sym] = priceData[sym].slice(-minLength);
    }

    console.log(`[Backtest] Synchronized data range: ${synchronizedData[allSymbols[0]][0].date} to ${synchronizedData[allSymbols[0]][synchronizedData[allSymbols[0]].length - 1].date}`);

    const indexPrices = calculateIndexPerformance(
      synchronizedData,
      weights,
      symbols
    );

    const indexMetrics = calculateMetrics(indexPrices);

    const individualVolatilities = calculateIndividualVolatilities(
      synchronizedData,
      symbols,
      minLength
    );

    const portfolioVolatility = calculatePortfolioVolatility(
      individualVolatilities,
      weights
    );

    const portfolioPricesUSD = indexPrices.map(price => initialInvestment * price);

    if (!synchronizedData[symbols[0]] || synchronizedData[symbols[0]].length === 0) {
      throw new Error("No synchronized data available for backtest");
    }

    const portfolioDates = synchronizedData[symbols[0]].map(p => p.date).filter(d => d);
    
    if (portfolioDates.length === 0 || portfolioPricesUSD.length === 0) {
      throw new Error("Invalid data format: dates or prices are empty");
    }

    const dailyReturnMetrics = calculateDailyReturnMetrics(
      portfolioPricesUSD,
      portfolioDates,
      indexMetrics.dailyReturns
    );
    const balanceExtremes = calculateBalanceExtremes(portfolioPricesUSD);

    const baseResult: BacktestResult = {
      totalReturn: indexMetrics.totalReturn,
      annualizedReturn: (indexMetrics.totalReturn / minLength) * 365,
      sharpeRatio: Math.max(-5, Math.min(5, calculateSharpeRatio(
        indexMetrics.dailyReturns,
        portfolioVolatility
      ))),
      maxDrawdown: calculateMaxDrawdown(portfolioPricesUSD, initialInvestment),
      winRate: calculateWinRate(indexMetrics.dailyReturns),
      peakBalance: balanceExtremes.peakBalance,
      minBalance: balanceExtremes.minBalance,
      maxDailyLoss: dailyReturnMetrics.maxDailyLoss,
      maxDailyProfit: dailyReturnMetrics.maxDailyProfit,
      portfolioPrices: portfolioPricesUSD,
      portfolioDates: portfolioDates,
      startDate: portfolioDates[0],
      biggestWinDay: dailyReturnMetrics.biggestWinDay,
      biggestLossDay: dailyReturnMetrics.biggestLossDay,
    };

    if (hasBenchmark) {
      const benchmarkPrices = synchronizedData[benchmarkSymbol].map(p =>
        p.close / synchronizedData[benchmarkSymbol][0].close
      );

      const benchmarkPricesUSD = benchmarkPrices.map(price => initialInvestment * price);

      const benchmarkMetrics = calculateMetrics(benchmarkPrices);
      const outperformance = indexMetrics.totalReturn - benchmarkMetrics.totalReturn;

      return {
        ...baseResult,
        benchmarkReturn: benchmarkMetrics.totalReturn,
        outperformance,
        benchmarkPrices: benchmarkPricesUSD,
      };
    }

    return baseResult;
  } catch (error) {
    console.error("Backtest error:", error);
    throw error;
  }
}

export async function getPortfolioPNL(
  symbols: string[],
  weights: number[],
  initialInvestment: number,
  createdAt: string
): Promise<PortfolioPNL> {
  try {
    console.log(`[PortfolioPNL] Calculating for:`, { symbols, weights, initialInvestment, createdAt });

    const historicalRequests = symbols.map(s => getHistoricalData(s, 1825));
    
    const liveRequests = symbols.map(s => 
      fetch(`${API_URL}/price/${s}`)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null)
    );

    const [historicalResponses, liveResponses] = await Promise.all([
      Promise.all(historicalRequests),
      Promise.all(liveRequests)
    ]);

    const priceData: { [key: string]: DailyPrice[] } = {};
    const livePrices: { [key: string]: number } = {};

    for (let i = 0; i < symbols.length; i++) {
      priceData[symbols[i]] = historicalResponses[i];
      if (liveResponses[i] && liveResponses[i].price) {
        livePrices[symbols[i]] = liveResponses[i].price;
        console.log(`[PortfolioPNL] Live price for ${symbols[i]}: $${livePrices[symbols[i]]}`);
      }
    }

    // Parse creation date
    const createdDateStr = new Date(createdAt).toISOString().split('T')[0]; // "YYYY-MM-DD"
    const todayStr = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

    console.log(`[PortfolioPNL] Date range: ${createdDateStr} to ${todayStr}`);

    const synchronizedData: { [key: string]: DailyPrice[] } = {};
    for (const symbol of symbols) {
      const data = priceData[symbol];
      if (!data || data.length === 0) {
        throw new Error(`No data for ${symbol}`);
      }
      synchronizedData[symbol] = data.filter(d => d.date >= createdDateStr);
      if (synchronizedData[symbol].length === 0) {
        throw new Error(`No data available for ${symbol} on or after ${createdDateStr}`);
      }
    }

    // Find minimum length to synchronize all symbols
    const minLength = Math.min(...symbols.map(sym => synchronizedData[sym].length));
    
    // Synchronize to same length by taking last minLength days
    const syncedData: { [key: string]: DailyPrice[] } = {};
    for (const symbol of symbols) {
      syncedData[symbol] = synchronizedData[symbol].slice(-minLength);
    }

    // Calculate portfolio prices from creation to today
    const portfolioPricesNormalized = calculateIndexPerformance(
      syncedData,
      weights,
      symbols
    );
    const portfolioPricesUSD = portfolioPricesNormalized.map(p => initialInvestment * p);
    const portfolioDates = syncedData[symbols[0]].map(p => p.date);

    // Get prices at creation date and today
    const assetPrices: { symbol: string; priceAtCreation: number; priceToday: number; change24h: number }[] = [];
    let portfolioValueAtCreation = 0;
    let portfolioValueToday = 0;

    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      const weight = weights[i];
      const data = priceData[symbol];

      // Find price at creation date
      const creationPriceData = data.find(d => d.date >= createdDateStr);
      if (!creationPriceData) {
        throw new Error(`No data available for ${symbol} on or after ${createdDateStr}`);
      }
      const priceAtCreation = creationPriceData.close;

      // Get TODAY'S LIVE price (not historical)
      // First try to use live price from API, fallback to historical
      let priceToday = livePrices[symbol];
      if (!priceToday) {
        // Fallback to last historical data point
        const todayPriceData = priceData[symbol][priceData[symbol].length - 1];
        priceToday = todayPriceData.close;
        console.log(`[PortfolioPNL] Using fallback price for ${symbol}: $${priceToday}`);
      }

      console.log(`[PortfolioPNL] ${symbol}: Creation=$${priceAtCreation}, Today=$${priceToday}, Change=${((priceToday - priceAtCreation) / priceAtCreation * 100).toFixed(2)}%`);

      // Get 24h change from Binance API
      let change24h = 0;
      try {
        const statsResponse = await fetch(`${API_URL}/api/stats/${symbol}`);
        if (statsResponse.ok) {
          const stats = await statsResponse.json();
          change24h = parseFloat(stats.priceChangePercent24h) || 0;
        }
      } catch (err) {
        console.warn(`[PortfolioPNL] Could not fetch 24h data for ${symbol}`);
      }

      assetPrices.push({
        symbol,
        priceAtCreation,
        priceToday,
        change24h,
      });

      // Calculate weighted portfolio values
      const weightValue = (initialInvestment * weight) / 100;
      portfolioValueAtCreation += (weightValue / priceAtCreation) * priceAtCreation;
      portfolioValueToday += (weightValue / priceAtCreation) * priceToday;
    }

    const pnlUSD = portfolioValueToday - initialInvestment;
    const pnlPercent = (pnlUSD / initialInvestment) * 100;

    // Calculate Sharpe Ratio, biggest win/loss days
    const dailyReturns = [];
    for (let i = 1; i < portfolioPricesUSD.length; i++) {
      const dailyReturn = (portfolioPricesUSD[i] - portfolioPricesUSD[i - 1]) / portfolioPricesUSD[i - 1];
      dailyReturns.push(dailyReturn);
    }

    // Calculate portfolio volatility based on individual asset volatilities
    const individualVolatilities = calculateIndividualVolatilities(
      syncedData,
      symbols,
      minLength
    );
    const portfolioVolatility = calculatePortfolioVolatility(
      individualVolatilities,
      weights
    );

    const sharpeRatio = calculateSharpeRatio(dailyReturns, portfolioVolatility);
    const dailyMetrics = calculateDailyReturnMetrics(portfolioPricesUSD, portfolioDates, dailyReturns);

    const result: PortfolioPNL = {
      currentValue: portfolioValueToday,
      pnlUSD,
      pnlPercent,
      creationDate: createdDateStr,
      currentDate: todayStr,
      assetPrices,
      sharpeRatio: Math.max(-5, Math.min(5, sharpeRatio)),
      biggestWinDay: dailyMetrics.biggestWinDay,
      biggestLossDay: dailyMetrics.biggestLossDay,
      portfolioPrices: portfolioPricesUSD,
      portfolioDates,
    };

    console.log(`[PortfolioPNL] Result:`, result);
    return result;
  } catch (error) {
    console.error("PortfolioPNL error:", error);
    throw error;
  }
}
