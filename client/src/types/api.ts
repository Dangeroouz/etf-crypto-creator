/**
 * Типи для API відповідей
 */

export interface PriceResponse {
  symbol: string;
  date: string;
  closingPrice: string;
}

export interface MultiplePricesResponse {
  symbol: string;
  prices: Record<string, string | null>;
}

export interface DailyPricesResponse {
  symbol: string;
  data: DailyPrice[];
}

export interface DailyPrice {
  date: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

export interface HealthResponse {
  status: string;
  message: string;
}

export interface ApiError {
  error: string;
}
