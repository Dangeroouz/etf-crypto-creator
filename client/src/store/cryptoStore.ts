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
interface SelectedCryptoStore {
  selected: string[];
  total: number;
  weights: number[];
  setWeights: (weights: number[]) => void;
  setTotal: (num: number) => void;
  addCrypto: (symbol: string) => void;
  removeCrypto: (symbol: string) => void;
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

export const useSelectedCryptos = create<SelectedCryptoStore>((set) => ({
  selected: [],
  weights: [],
  total: 0,
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