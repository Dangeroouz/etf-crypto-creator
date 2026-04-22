/**
 * CSV экспорт сервіс для бექтестів даних
 * Агрегує щоденні дані в тижневі/місячні свічки для меншого розміру файлу
 */

interface AggregatedBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  return: number;
}

/**
 * Універсальна функція для агрегації даних за періодом
 * periodDays: 7 для тижня, 30 для місяця
 */
function aggregateByPeriod(
  prices: number[],
  dates: string[],
  periodDays: number
): AggregatedBar[] {
  if (prices.length === 0 || prices.length !== dates.length) {
    return [];
  }

  const aggregated: AggregatedBar[] = [];
  let periodOpen = prices[0];
  let periodHigh = prices[0];
  let periodLow = prices[0];
  let periodStartDate = dates[0];
  const startDateObj = new Date(dates[0]);
  let currentPeriodStart = new Date(startDateObj);
  currentPeriodStart.setHours(0, 0, 0, 0);

  for (let i = 1; i < prices.length; i++) {
    const currentDate = new Date(dates[i]);
    currentDate.setHours(0, 0, 0, 0);

    const daysElapsed = Math.floor(
      (currentDate.getTime() - currentPeriodStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysElapsed >= periodDays) {
      // Зберігаємо бар попереднього періоду
      const periodClose = prices[i - 1];
      const periodReturn = ((periodClose - periodOpen) / periodOpen) * 100;

      aggregated.push({
        date: periodStartDate,
        open: periodOpen,
        high: periodHigh,
        low: periodLow,
        close: periodClose,
        return: parseFloat(periodReturn.toFixed(2)),
      });

      // Почитаємо новий період
      periodStartDate = dates[i];
      periodOpen = prices[i];
      periodHigh = prices[i];
      periodLow = prices[i];
      currentPeriodStart = new Date(dates[i]);
      currentPeriodStart.setHours(0, 0, 0, 0);
    } else {
      // Оновлюємо high/low для поточного періоду
      if (prices[i] > periodHigh) periodHigh = prices[i];
      if (prices[i] < periodLow) periodLow = prices[i];
    }
  }

  // Зберігаємо останній бар
  if (prices.length > 0) {
    const lastPrice = prices[prices.length - 1];
    const lastReturn = ((lastPrice - periodOpen) / periodOpen) * 100;

    aggregated.push({
      date: periodStartDate,
      open: periodOpen,
      high: periodHigh,
      low: periodLow,
      close: lastPrice,
      return: parseFloat(lastReturn.toFixed(2)),
    });
  }

  return aggregated;
}

/**
 * Агрегує щоденні дані в тижневі свічки
 */
export function aggregateToWeekly(
  prices: number[],
  dates: string[]
): AggregatedBar[] {
  return aggregateByPeriod(prices, dates, 7);
}

/**
 * Агрегує щоденні дані в місячні свічки
 */
export function aggregateToMonthly(
  prices: number[],
  dates: string[]
): AggregatedBar[] {
  return aggregateByPeriod(prices, dates, 30);
}

/**
 * Вибирає оптимальну агрегацію на основі кількості днів
 */
export function getOptimalAggregation(
  prices: number[],
  dates: string[]
): { bars: AggregatedBar[]; interval: "daily" | "weekly" | "monthly" } {
  const daysCount = prices.length;

  // Якщо менше 60 днів, експортуємо щоденні дані
  if (daysCount <= 60) {
    const daily = prices.map((price, idx) => ({
      date: dates[idx],
      open: price,
      high: price,
      low: price,
      close: price,
      return: idx === 0 ? 0 : ((price - prices[idx - 1]) / prices[idx - 1]) * 100,
    }));
    return { bars: daily, interval: "daily" };
  }

  // Якщо 60-365 днів, експортуємо тижневі дані
  if (daysCount <= 365) {
    return { bars: aggregateToWeekly(prices, dates), interval: "weekly" };
  }

  // Якщо більше 365 днів, експортуємо місячні дані
  return { bars: aggregateToMonthly(prices, dates), interval: "monthly" };
}

/**
 * Конвертує дані бектесту в CSV формат
 */
export function generateBacktestCSV(
  indexName: string,
  portfolioPrices: number[],
  portfolioDates: string[],
  backtestMetrics: {
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
    peakBalance?: number;
    minBalance?: number;
    maxDailyLoss?: number;
    maxDailyProfit?: number;
    outperformance?: number;
  },
  period: string,
  benchmark: string
): string {
  const { bars, interval } = getOptimalAggregation(portfolioPrices, portfolioDates);

  // Базові метадані
  const metadataRows = [
    [`Index Name`, indexName],
    [`Period`, period],
    [`Benchmark`, benchmark],
    [`Start Date`, portfolioDates[0]],
    [`End Date`, portfolioDates[portfolioDates.length - 1]],
    [`Total Return (%)`, backtestMetrics.totalReturn.toFixed(2)],
    [`Sharpe Ratio`, backtestMetrics.sharpeRatio.toFixed(4)],
    [`Max Drawdown (%)`, backtestMetrics.maxDrawdown.toFixed(2)],
    [`Win Rate (%)`, backtestMetrics.winRate.toFixed(2)],
  ];

  // Додаємо опціональні метрики тільки якщо вони визначені
  const optionalMetrics: [string, number | undefined][] = [
    [`Peak Balance ($)`, backtestMetrics.peakBalance],
    [`Min Balance ($)`, backtestMetrics.minBalance],
    [`Max Daily Profit (%)`, backtestMetrics.maxDailyProfit],
    [`Max Daily Loss (%)`, backtestMetrics.maxDailyLoss],
    [`Outperformance (%)`, backtestMetrics.outperformance],
  ];

  optionalMetrics.forEach(([label, value]) => {
    if (value !== undefined) {
      metadataRows.push([label, value.toFixed(2)]);
    }
  });

  metadataRows.push(
    [],
    [`Data Interval`, interval.toUpperCase()],
    [],
    [`Date`, `Open`, `High`, `Low`, `Close`, `Return (%)`]
  );

  // Комбінуємо метадані та дані
  const headers = metadataRows.map(row => row.join(","));
  const rows = bars.map(
    (bar) => `${bar.date},${bar.open.toFixed(2)},${bar.high.toFixed(2)},${bar.low.toFixed(2)},${bar.close.toFixed(2)},${bar.return.toFixed(2)}`
  );

  return [...headers, ...rows].join("\n");
}

/**
 * Скачує CSV файл в браузер
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
