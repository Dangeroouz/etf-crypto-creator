import { create } from "zustand";
import axios from "axios";

interface CryptoData {
  symbol: string;
  price: number;
  priceChangePercent24h: number;
}

interface CryptoStore {
  crypto: CryptoData[];
  fetchCrypto: () => Promise<void>;
}

interface BacktestResult {
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  benchmarkReturn?: number;
  outperformance?: number;
  startDate?: string;
}

interface CreatedIndex {
  id: string;
  name: string;
  selected: string[];
  weights: number[];
  initialInvestment: number;
  backtestSettings: {
    period: string;
    benchmark: string;
    rebalancingFrequency: string;
    customDate?: string;
  };
  backtestResult?: BacktestResult;
  createdAt: Date;
}

interface SelectedCryptoStore {
  selected: string[];
  total: number;
  weights: number[];
  initialInvestment: number;
  backtestSettings: {
    period: string; // Either "1M", "3M", "6M", "1Y", "3Y", "5Y" or "Custom" (when customDate is used)
    benchmark: string;
    rebalancingFrequency: string;
    customDate?: string; // Only set when period is "Custom"
  };
  name: string;
  createdIndices: CreatedIndex[];
  setName: (name: string) => void;
  setInitialInvestment: (investment: number) => void;
  setBacktestPeriod: (period: string) => void;
  setBacktestBenchmark: (benchmark: string) => void;
  setBacktestRebalancingFrequency: (rebalancingFrequency: string) => void;
  setBacktestCustomDate: (customDate: string | undefined) => void;
  setWeights: (weights: number[]) => void;
  setTotal: (num: number) => void;
  addCrypto: (symbol: string) => void;
  removeCrypto: (symbol: string) => void;
  saveIndex: () => void;
  getIndexByName: (name: string) => CreatedIndex | undefined;
  updateIndexBacktestResult: (indexId: string, result: BacktestResult) => void;
}

export const allCrypto = [
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "SOL", name: "Solana" },
  { symbol: "ADA", name: "Cardano" },
  { symbol: "AVAX", name: "Avalanche" },
  { symbol: "DOT", name: "Polkadot" },
  { symbol: "MATIC", name: "Polygon" },
  { symbol: "LINK", name: "Chainlink" },
];

export const useSelectedCryptos = create<SelectedCryptoStore>((set, get) => ({
  selected: [],
  weights: [],
  total: 0,
  initialInvestment: 1000,
  backtestSettings: {
    period: "1M",
    benchmark: "BTC",
    rebalancingFrequency: "None",
    customDate: undefined,
  },
  name: "",
  createdIndices: [],
  setName: (name: string) =>
    set(() => ({
      name: name,
    })),
  setInitialInvestment: (investment: number) =>
    set(() => ({
      initialInvestment: investment,
    })),
  setBacktestPeriod: (period: string) =>
    set((state) => {
      // Define period to months
      const periodToMonths: { [key: string]: number } = {
        "1M": 1,
        "3M": 3,
        "6M": 6,
        "1Y": 12,
        "3Y": 36,
        "5Y": 60,
      };
      const rebalancingToMonths: { [key: string]: number } = {
        "None": 0,
        "Monthly": 1,
        "Quarterly": 3,
        "Yearly": 12,
      };
      const newPeriodMonths = periodToMonths[period] || 12;
      const currentRebalanceMonths = rebalancingToMonths[state.backtestSettings.rebalancingFrequency] || 0;
      const newRebalancing = currentRebalanceMonths <= newPeriodMonths ? state.backtestSettings.rebalancingFrequency : "None";
      
      // When selecting a preset period, clear custom date
      return {
        backtestSettings: {
          ...state.backtestSettings,
          period,
          rebalancingFrequency: newRebalancing,
          customDate: undefined, // Clear custom date when preset period is selected
        },
      };
    }),
  setBacktestBenchmark: (benchmark: string) =>
    set((state) => ({
      backtestSettings: {
        ...state.backtestSettings,
        benchmark,
      },
    })),
  setBacktestRebalancingFrequency: (rebalancingFrequency: string) =>
    set((state) => ({
      backtestSettings: {
        ...state.backtestSettings,
        rebalancingFrequency,
      },
    })),
  setBacktestCustomDate: (customDate: string | undefined) =>
    set((state) => {
      // When setting custom date, change period to "Custom"
      // When clearing custom date (undefined), revert to default period "1M"
      const newPeriod = customDate ? "Custom" : "1M";
      return {
        backtestSettings: {
          ...state.backtestSettings,
          customDate,
          period: newPeriod,
        },
      };
    }),
  setWeights: (weights: number[]) =>
    set(() => ({
      weights: weights,
    })),
  setTotal: (num: number) =>
    set(() => ({
      total: num,
    })),
  addCrypto: (symbol: string) =>
    set((state) => ({
      selected: [...state.selected, symbol],
    })),
  removeCrypto: (symbol: string) =>
    set((state) => ({
      selected: state.selected.filter((sym: string) => sym !== symbol),
    })),
  saveIndex: () => {
    const state = get();
    const newIndex: CreatedIndex = {
      id: Date.now().toString(),
      name: state.name,
      selected: state.selected,
      weights: state.weights,
      backtestSettings: state.backtestSettings,
      initialInvestment: state.initialInvestment,
      createdAt: new Date(),
    };
    set((state) => ({
      createdIndices: [...state.createdIndices, newIndex],
      // Reset all fields to defaults
      selected: [],
      weights: [],
      total: 0,
      initialInvestment: 1000,
      backtestSettings: {
        period: "1M",
        benchmark: "BTC",
        rebalancingFrequency: "None",
        customDate: undefined,
      },
      name: "",
    }));
  },
  getIndexByName: (name: string) => {
    const state = get();
    return state.createdIndices.find((idx) => idx.name === name);
  },
  updateIndexBacktestResult: (indexId: string, result: BacktestResult) => {
    set((state) => ({
      createdIndices: state.createdIndices.map((idx) =>
        idx.id === indexId ? { ...idx, backtestResult: result } : idx
      ),
    }));
  },
}));


export const useCryptoStore = create<CryptoStore>((set) => ({
  crypto: [],
  fetchCrypto: async () => {
  const responses = await Promise.all(
    allCrypto.map((crypto) =>
      axios.get(`http://localhost:3333/api/crypto/${crypto.symbol}`)
    )
  );

  const merged = responses.map(r => r.data);

  set({ crypto: merged });
},
}));