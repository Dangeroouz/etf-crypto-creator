import { create } from "zustand";
import axios from "axios";
import { API_URL } from "../config";

interface CryptoData {
  symbol: string;
  price: number;
  priceChangePercent24h: number;
}

interface CryptoStore {
  crypto: CryptoData[];
  fetchCrypto: () => Promise<void>;
}

interface CreatedIndex {
  id: string;
  name: string;
  selected: string[];
  weights: number[];
  initialInvestment: number;
  createdAt: Date;
}

interface SelectedCryptoStore {
  selected: string[];
  total: number;
  weights: number[];
  initialInvestment: number;
  name: string;
  createdIndices: CreatedIndex[];
  setName: (name: string) => void;
  setInitialInvestment: (investment: number) => void;
  setWeights: (weights: number[]) => void;
  setTotal: (num: number) => void;
  addCrypto: (symbol: string) => void;
  removeCrypto: (symbol: string) => void;
  resetForm: () => void;
}

export const allCrypto = [
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "SOL", name: "Solana" },
  { symbol: "ADA", name: "Cardano" },
  { symbol: "AVAX", name: "Avalanche" },
  { symbol: "DOT", name: "Polkadot" },
  { symbol: "LTC", name: "Litecoin" },
  { symbol: "LINK", name: "Chainlink" },
];

export const useSelectedCryptos = create<SelectedCryptoStore>((set) => ({
  selected: [],
  weights: [],
  total: 0,
  initialInvestment: 1000,
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
  resetForm: () => {
    set(() => ({
      selected: [],
      weights: [],
      total: 0,
      initialInvestment: 1000,
      name: "",
    }));
  },
}));


export const useCryptoStore = create<CryptoStore>((set) => ({
  crypto: [],
  fetchCrypto: async () => {
  const responses = await Promise.all(
    allCrypto.map((crypto) =>
      axios.get(`${API_URL}/api/crypto/${crypto.symbol}`)
    )
  );

  const merged = responses.map(r => r.data);

  set({ crypto: merged });
},
}));