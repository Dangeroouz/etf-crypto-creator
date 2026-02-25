/**
 * Сервіс для виконання бектесту
 */

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
  benchmarkReturn?: number;
  outperformance?: number;
  portfolioPrices?: number[]; // Portfolio prices in USD based on initial investment
  portfolioDates?: string[];
  benchmarkPrices?: number[];
}

const API_BASE_URL = 'http://localhost:3333/api';

/**
 * Отримує історичні дані для символу
 */
export async function getHistoricalData(
  symbol: string,
  days: number = 365
): Promise<DailyPrice[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/history/${symbol}?days=${days}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch history for ${symbol}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching history for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Розраховує виділення індексу на основі ваг та історичних даних
 */
function calculateIndexPerformance(
  prices: { [key: string]: DailyPrice[] },
  weights: number[],
  symbols: string[],
  rebalancingFrequency: string = "None",
  maxDataLength?: number
): number[] {
  // Знаходимо мінімальну кількість днів з даними
  // Якщо передано maxDataLength, використовуємо найменше значення
  let minLength = Math.min(...Object.values(prices).map(p => p.length));
  
  if (maxDataLength !== undefined) {
    minLength = Math.min(minLength, maxDataLength);
  }

  const indexPrices: number[] = [];

  // Define rebalancing intervals
  const rebalanceIntervals: { [key: string]: number } = {
    "None": Infinity,
    "Monthly": 30,
    "Quarterly": 90,
    "Yearly": 365,
  };
  const rebalanceDays = rebalanceIntervals[rebalancingFrequency] || Infinity;

  // For rebalancing, track current holdings in terms of quantity
  let holdings: number[] = new Array(symbols.length).fill(0);
  let totalValue = 1; // Start with normalized value

  // Initial investment
  for (let j = 0; j < symbols.length; j++) {
    const weight = weights[j] / 100;
    const initialPrice = prices[symbols[j]][0].close;
    holdings[j] = (weight * totalValue) / initialPrice;
  }

  let lastRebalanceDay = 0;

  // Беремо останні minLength днів (синхронізуємо до спільного периоду)
  for (let i = 0; i < minLength; i++) {
    // Check if rebalance
    if (rebalancingFrequency !== "None" && i - lastRebalanceDay >= rebalanceDays) {
      // Rebalance: calculate current value and reallocate to target weights
      let currentValue = 0;
      for (let j = 0; j < symbols.length; j++) {
        currentValue += holdings[j] * prices[symbols[j]][i].close;
      }
      // Reallocate
      for (let j = 0; j < symbols.length; j++) {
        const weight = weights[j] / 100;
        holdings[j] = (weight * currentValue) / prices[symbols[j]][i].close;
      }
      lastRebalanceDay = i;
    }

    // Calculate current portfolio value
    let portfolioPrice = 0;
    for (let j = 0; j < symbols.length; j++) {
      portfolioPrice += holdings[j] * prices[symbols[j]][i].close;
    }
    indexPrices.push(portfolioPrice);
  }

  return indexPrices;
}

/**
 * Розраховує метрики для значень цін
 */
function calculateMetrics(prices: number[]): {
  totalReturn: number;
  dailyReturns: number[];
  volatility: number;
} {
  const totalReturn = ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100;

  const dailyReturns = [];
  for (let i = 1; i < prices.length; i++) {
    const dailyReturn = (prices[i] - prices[i - 1]) / prices[i - 1];
    dailyReturns.push(dailyReturn);
  }

  // Волатильність (стандартне відхилення)
  const avgReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const variance =
    dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) /
    dailyReturns.length;
  const volatility = Math.sqrt(variance) * Math.sqrt(252); // Annualized

  return {
    totalReturn,
    dailyReturns,
    volatility,
  };
}

/**
 * Розраховує Sharpe Ratio
 */
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

/**
 * Розраховує Max Drawdown
 */
function calculateMaxDrawdown(prices: number[]): number {
  let maxPrice = prices[0];
  let maxDrawdown = 0;

  for (let i = 1; i < prices.length; i++) {
    maxPrice = Math.max(maxPrice, prices[i]);
    const drawdown = ((prices[i] - maxPrice) / maxPrice) * 100;
    maxDrawdown = Math.min(maxDrawdown, drawdown);
  }

  return maxDrawdown;
}

/**
 * Розраховує Win Rate (відсоток днів з позитивними прибутками)
 */
function calculateWinRate(dailyReturns: number[]): number {
  const winDays = dailyReturns.filter(r => r > 0).length;
  return (winDays / dailyReturns.length) * 100;
}

/**
 * Основна функція для запуску бектесту
 */
export async function runBacktest(
  symbols: string[],
  weights: number[],
  benchmarkSymbol: string,
  period: string = "1Y",
  initialInvestment: number = 1000,
  rebalancingFrequency: string = "None",
  customStartDate?: string,
): Promise<BacktestResult> {
  try {
    // Визначаємо кількість днів на основі періоду
    let daysToFetch = 1825; // Default to 5 years for fetching
    
    if (period !== "Custom") {
      // Use period map if not custom
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

    // Отримуємо історичні дані для всіх символів
    const priceData: { [key: string]: DailyPrice[] } = {};

    // Якщо бенчмарк не вибраний ("None"), отримуємо дані тільки для портфелю
    const allRequests = [
      ...symbols.map(s => getHistoricalData(s, daysToFetch)),
    ];

    // Додаємо запит бенчмарку тільки якщо він не "None"
    const hasBenchmark = benchmarkSymbol !== "None";
    if (hasBenchmark) {
      allRequests.push(getHistoricalData(benchmarkSymbol, daysToFetch));
    }

    const responses = await Promise.all(allRequests);

    for (let i = 0; i < symbols.length; i++) {
      priceData[symbols[i]] = responses[i];
    }

    // Якщо є бенчмарк, додаємо його до priceData
    if (hasBenchmark) {
      priceData[benchmarkSymbol] = responses[symbols.length];
    }

    // Фільтруємо дані за кастомною датою, якщо період = "Custom"
    if (period === "Custom" && customStartDate) {
      const startDate = new Date(customStartDate);
      const allSymbols = hasBenchmark ? [...symbols, benchmarkSymbol] : symbols;
      
      for (const sym of allSymbols) {
        priceData[sym] = priceData[sym].filter(p => new Date(p.date) >= startDate);
      }

      console.log(`[Backtest] Custom start date: ${customStartDate}`);
    }

    // Знаходимо мінімальну кількість днів серед ВСІХ символів (включаючи бенчмарк)
    const allSymbols = hasBenchmark ? [...symbols, benchmarkSymbol] : symbols;
    const minLength = Math.min(...allSymbols.map(sym => priceData[sym].length));

    // Логування для дебагу
    console.log(`[Backtest] Period: ${period}, Requested ${daysToFetch} days`);
    console.log(`[Backtest] Data lengths:`, allSymbols.map(sym => `${sym}=${priceData[sym].length}`).join(', '));
    console.log(`[Backtest] Min length: ${minLength}, Using last ${minLength} days for synchronization`);

    // Обрізаємо всі дані до спільного періоду (беремо ОСТАННІ minLength днів)
    // Це гарантує, що ми маємо найсвіжіші дані від усіх символів
    const synchronizedData: { [key: string]: DailyPrice[] } = {};
    for (const sym of allSymbols) {
      synchronizedData[sym] = priceData[sym].slice(-minLength);
    }

    console.log(`[Backtest] Synchronized data range: ${synchronizedData[allSymbols[0]][0].date} to ${synchronizedData[allSymbols[0]][synchronizedData[allSymbols[0]].length - 1].date}`);

    // Розраховуємо виділення портфелю з синхронізованими даними
    const indexPrices = calculateIndexPerformance(
      synchronizedData,
      weights,
      symbols,
      rebalancingFrequency
    );

    // Обчислюємо метрики для індексу
    const indexMetrics = calculateMetrics(indexPrices);

    // Отримуємо дати з синхронізованих даних
    const portfolioDates = synchronizedData[symbols[0]].map(p => p.date);

    // Обчислюємо результат без бенчмарку
    const baseResult: BacktestResult = {
      totalReturn: indexMetrics.totalReturn,
      annualizedReturn: (indexMetrics.totalReturn / minLength) * 365,
      sharpeRatio: Math.max(-5, Math.min(5, calculateSharpeRatio(
        indexMetrics.dailyReturns,
        indexMetrics.volatility
      ))),
      maxDrawdown: calculateMaxDrawdown(indexPrices),
      winRate: calculateWinRate(indexMetrics.dailyReturns),
      portfolioPrices: indexPrices.map(price => initialInvestment * price),
      portfolioDates: portfolioDates,
      startDate: portfolioDates[0],
    };

    // Якщо є бенчмарк, додаємо порівняння
    if (hasBenchmark) {
      const benchmarkPrices = synchronizedData[benchmarkSymbol].map(p =>
        p.close / synchronizedData[benchmarkSymbol][0].close
      );

      // Конвертуємо нормалізовані ціни в USD на основі початкової інвестиції
      const benchmarkPricesUSD = benchmarkPrices.map(price => initialInvestment * price);

      // Розраховуємо метрики для бенчмарку
      const benchmarkMetrics = calculateMetrics(benchmarkPrices);

      // Розраховуємо додаткові метрики
      const sharpeRatio = calculateSharpeRatio(
        indexMetrics.dailyReturns,
        indexMetrics.volatility
      );
      const maxDrawdown = calculateMaxDrawdown(indexPrices);
      const winRate = calculateWinRate(indexMetrics.dailyReturns);
      const annualizedReturn = (indexMetrics.totalReturn / minLength) * 365;
      const outperformance = indexMetrics.totalReturn - benchmarkMetrics.totalReturn;

      return {
        totalReturn: indexMetrics.totalReturn,
        annualizedReturn,
        sharpeRatio: Math.max(-5, Math.min(5, sharpeRatio)),
        maxDrawdown,
        winRate,
        benchmarkReturn: benchmarkMetrics.totalReturn,
        outperformance,
        portfolioPrices: indexPrices.map(price => initialInvestment * price),
        portfolioDates: portfolioDates,
        benchmarkPrices: benchmarkPricesUSD,
        startDate: portfolioDates[0],
      };
    }

    return baseResult;
  } catch (error) {
    console.error("Backtest error:", error);
    throw error;
  }
}
