import { Check, Plus } from "lucide-react";
import { useCryptoStore, useSelectedCryptos } from "../../store/cryptoStore";
import { allCrypto } from "../../store/cryptoStore";
import { tokenIcons } from "../../store/cryptoIcons";

const StepOne = () => {
  const selectedCryptos = useSelectedCryptos((s) => s.selected);
  const addCrypto = useSelectedCryptos((s) => s.addCrypto);
  const removeCrypto = useSelectedCryptos((s) => s.removeCrypto);

  const cryptoData = useCryptoStore((s) => s.crypto);
  const displayCryptos = allCrypto.map((meta, index) => {
    const live = cryptoData.find((item) => item.symbol === meta.symbol) || cryptoData[index];
    return { ...meta, ...live };
  });

  return (
    <div className="">
      {selectedCryptos.length > 0 && (
        <div className="mb-2 p-2 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-800">
          {selectedCryptos.length} cryptocurrenc
          {selectedCryptos.length > 1 ? "ies" : "y"} selected.
        </div>
      )} 
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayCryptos.map((crypto) => (
          <div
            key={crypto.symbol}
            className="border border-black/10 rounded-xl p-4 bg-white hover:shadow-md hover:border-indigo-600 transition-shadow duration-300"
            onClick={() => {
              if (selectedCryptos.includes(crypto.symbol)) {
                removeCrypto(crypto.symbol);
                
              } else {
                addCrypto(crypto.symbol);
              }
            }}
          >
            <div className="flex items-center justify-between mb-2 border-b border-black/10 pb-4">
              <div className="flex gap-4 ">
                <div className="sm:flex sm:gap-2">{(() => {
                  const Icon = tokenIcons[crypto.symbol];
                  return Icon ? (
                    <Icon
                      className="p-1 bg-linear-to-br from-indigo-100 to-indigo-50 rounded-full row-span-2"
                      variant="mono"
                      size={48}
                      color="#151515ff"
                    />
                  ) : null;
                })()}
                <h2 className="text-md">{crypto.name}</h2>
                </div>
                <h3 className="hidden sm:block text-xs font-semibold text-black border h-fit rounded-lg px-2 py-1 border-black/20">
                  {crypto.symbol}
                </h3>
              </div>
              <div className={`self-start p-2 border border-black/20 rounded-lg w-12 h-8 flex items-center justify-center hover:bg-black/5 cursor-pointer transition ${selectedCryptos.includes(crypto.symbol) && "bg-indigo-600 border-indigo-600 hover:bg-indigo-700"}`}>
                {selectedCryptos.includes(crypto.symbol) ? <Check size={20} className="text-white" />
                : <Plus size={20} className="text-black/80" />}
              </div>
            </div>
            <div className="grid grid-cols-2 grid-rows-1">
              <div className="">
                <p className="text-black/60 text-sm">Price</p>
                <p className="text-black text-lg ">
                  ${typeof crypto.price === "number" ? crypto.price.toFixed(2) : "0.00"}
                </p>
              </div>
              <div className="flex flex-col items-end justify-end">
                <p className="text-black/60 text-sm">24h Change</p>
                <p
                  className={`text-sm ${
                    (typeof crypto.priceChangePercent24h === "number" ? crypto.priceChangePercent24h : 0) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {(typeof crypto.priceChangePercent24h === "number" ? crypto.priceChangePercent24h : 0) >= 0 ? "+" : ""}
                  {(typeof crypto.priceChangePercent24h === "number" ? crypto.priceChangePercent24h : 0).toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StepOne;
