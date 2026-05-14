/**
 * Сервіс для взаємодії з API бекенду
 * Все запити здійснюються до http://localhost:5001
 */

import type {
  PriceResponse,
  MultiplePricesResponse,
  DailyPricesResponse,
  HealthResponse,
} from '../types/api';

const API_BASE_URL = 'http://localhost:5001/api';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 секунда

/**
 * Затримка для retry логіки
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Обробка помилок API
 */
async function handleApiError(response: Response): Promise<never> {
  let errorMessage = `HTTP Error: ${response.status}`;

  try {
    const data = await response.json();
    if (data.error) {
      errorMessage = data.error;
    }
  } catch {
    // Якщо не можемо парсити JSON, використовуємо стандартне повідомлення
  }

  throw new Error(errorMessage);
}

/**
 * Отримує ціни закриття для кількох днів з retry логікою
 * @param {string} symbol - Тікер (наприклад, AAPL, BTC)
 * @param {string[]} dates - Масив дат у форматі YYYY-MM-DD
 * @returns {Promise<MultiplePricesResponse>}
 */
export async function getMultiplePrices(
  symbol: string,
  dates: string[]
): Promise<MultiplePricesResponse> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${API_BASE_URL}/prices/multiple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbol, dates }),
      });

      if (!response.ok) {
        await handleApiError(response);
      }

      return await response.json();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < MAX_RETRIES - 1) {
        await delay(RETRY_DELAY * (attempt + 1));
      }
    }
  }

  throw lastError || new Error('Помилка при отриманні цін');
}

/**
 * Отримує всі дневні ціни для символу
 * @param {string} symbol - Тікер (наприклад, AAPL, BTC)
 * @returns {Promise<DailyPricesResponse>}
 */
export async function getDailyPrices(symbol: string): Promise<DailyPricesResponse> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${API_BASE_URL}/daily/${symbol}`);

      if (!response.ok) {
        await handleApiError(response);
      }

      return await response.json();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < MAX_RETRIES - 1) {
        await delay(RETRY_DELAY * (attempt + 1));
      }
    }
  }

  throw lastError || new Error('Помилка при отриманні дневних цін');
}

/**
 * Перевіряє статус сервера
 * @returns {Promise<HealthResponse>}
 */
export async function checkServerHealth(): Promise<HealthResponse> {
  try {
    const response = await fetch('http://localhost:5001/health');

    if (!response.ok) {
      throw new Error(`Сервер недоступний: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error('Помилка при перевірці здоров\'я сервера');
  }
}
