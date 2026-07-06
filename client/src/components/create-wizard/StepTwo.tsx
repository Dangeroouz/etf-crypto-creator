import { allCrypto, useSelectedCryptos } from "../../store/cryptoStore";
import { tokenIcons } from "../../store/cryptoIcons";
import { useCryptoStore } from "../../store/cryptoStore";
import { useEffect, } from "react";
const StepTwo = () => {
  const cryptoData = useCryptoStore((s) => s.crypto);
  const selectedCryptos = useSelectedCryptos((s) => s.selected);
  let total = useSelectedCryptos((s) => s.total);
  const setTotal = useSelectedCryptos((s) => s.setTotal);
  const name = useSelectedCryptos((s) => s.name);
  const setName = useSelectedCryptos((s) => s.setName);
  const weights = useSelectedCryptos((s) => s.weights);
  const setWeights = useSelectedCryptos((s) => s.setWeights);
  const initialInvestment = useSelectedCryptos((s) => s.initialInvestment);
  const setInitialInvestment = useSelectedCryptos((s) => s.setInitialInvestment);

  function getEqualWeights(selectedCount: number): number[] {
  if (selectedCount <= 0) return [];

  const raw = 100 / selectedCount;
  const weights = Array(selectedCount).fill(Math.floor(raw)); // базові ваги

  total = weights.reduce((a, b) => a + b, 0);
  let rest = 100 - total;

  let i = 0;
  while (rest > 0) {
    weights[i]++;
    rest--;
    i = (i + 1) % selectedCount;
  }
  return weights;
}


  useEffect(() => {
    const newWeights = getEqualWeights(selectedCryptos.length);
    setWeights(newWeights);
    setTotal(newWeights.reduce((a, b) => a + b, 0));
  }, [selectedCryptos.length, setWeights, setTotal]);

  return (
    <div>
      <div className="w-full mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Index Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., My Diversified Crypto Portfolio"
          className="w-full border border-black/20 rounded-lg p-3"
        />
      </div>

      <div className="w-full mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Initial Investment ($)
        </label>
        <input
          type="number"
          value={initialInvestment || ''}
          onChange={(e) => setInitialInvestment(e.target.value === '' ? 0 : Number(e.target.value))}
          min={0}
          step={100}
          className="w-full border border-black/20 rounded-lg p-3"
          placeholder="Enter initial investment amount"
        />
      </div>
      <div className="w-full mb-4">
        <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full bg-indigo-500 transition-all duration-300 ${total > 100 ? 'bg-red-600' : 'bg-indigo-500'}`}
            style={{ width: `${Math.min(100, weights.reduce((a, b) => a + b, 0))}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Total: {weights.reduce((a, b) => a + b, 0)}%
          {total > 100 && (<span className="text-red-600"> (Exceeds 100%)</span>)}
        </p>
      </div>
      <div className="grid grid-cols-12 gap-4 text-sm text-gray-700 border-gray-200 border-b mb-4 p-2">
        <div className="col-span-4">Currency</div>
        <div className="col-span-3">Weight (%)</div>
        <div className="sm:col-span-3 col-span-4 text-right">Price</div>
        <div className="hidden sm:block col-span-2 text-right">24h Change</div>
      </div>
      {selectedCryptos.map((symbol, index) => (
        <div className="grid grid-cols-12 gap-4 items-center py-3 bg-gray-50 mb-2 px-2 sm:px-4 rounded-lg" key={index}>
          <div className="col-span-4">
            <div key={symbol} className="flex items-start gap-2">
              {(() => {
                const Icon = tokenIcons[symbol];
                return Icon ? (
                  <Icon
                    className="hidden sm:block bg-linear-to-br from-indigo-100 to-indigo-50 rounded-full"
                    variant="mono"
                    size={48}
                    color="#151515ff"
                  />
                ) : null;
              })()}
              <div className="">
                <h2 className="text-lg">{allCrypto.find((c) => c.symbol === symbol) && (
                    allCrypto.find((c) => c.symbol === symbol)?.name
                )}</h2>
                <h3 className="text-md text-gray-500">{symbol}</h3>

              </div>
            </div>
          </div>
          <div className="col-span-3">
            <input
              value={weights[index] || ''}
              onChange={(e) => {
                const newVal = e.target.value === '' ? 0 : Number(e.target.value);
                const newWeights = [...weights];
                newWeights[index] = newVal;
                setWeights(newWeights);
                setTotal(newWeights.reduce((a, b) => a + b, 0));
                console.log(newWeights);
              }}
              type="number"
              min={0}
              max={100}
              className="w-full border border-black/20 rounded-lg p-2"
              placeholder="Enter weight %"
            />
          </div>

          <div className="sm:col-span-3 col-span-4">
            {cryptoData.find((c) => c.symbol === symbol) ? (
              <p className="text-right">
                ${cryptoData.find((c) => c.symbol === symbol)?.price.toFixed(2)}
              </p>
            ) : (
              <p className="text-right">--</p>
            )}
          </div>
          <div className="hidden sm:block col-span-2">
            {cryptoData.find((c) => c.symbol === symbol) ? (
              <p
                className="text-right flex items-center justify-end"
                style={{
                  color: cryptoData
                    .find((c) => c.symbol === symbol)
                    ?.priceChangePercent24h.toString()
                    .startsWith("-")
                    ? "red"
                    : "green",
                }}
              >
                {cryptoData
                  .find((c) => c.symbol === symbol)
                  ?.priceChangePercent24h?.toFixed(2) ?? "--"}
                %
              </p>
            ) : (
              <p className="text-right">--</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StepTwo;
