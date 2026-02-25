import { useSelectedCryptos, allCrypto } from "../../store/cryptoStore";
import { tokenIcons } from "../../store/cryptoIcons";
const StepFour = () => {
  const name = useSelectedCryptos((s) => s.name);
  const setName = useSelectedCryptos((s) => s.setName);
  const selected = useSelectedCryptos((s) => s.selected);
  const weights = useSelectedCryptos((s) => s.weights);
  const backtestSettings = useSelectedCryptos((s) => s.backtestSettings);
  return (
    <div className="">
      <div className="mb-2">
        <h2 className="">Index name *</h2>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
          }}
          placeholder="e.g., My Diversified Crypto Portfolio"
          className="bg-white w-full rounded-md placeholder:text-gray-500 p-2 px-4 border border-gray-300 mt-2"
          type="text"
        />
      </div>
      <div className="">
        <div className="">
          <h2>Configuration Summary</h2>
        </div>
        <div className="w-full mt-2 border border-gray-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-2">
                <h2>Selected Cryptocurrencies</h2>
                <p className="bg-gray-200 p-2 py-1 text-sm rounded-lg">{selected.length} assets</p>
            </div>
            {selected.map((symbol) => (
            <div key={symbol} className="flex items-center justify-between h-full w-full gap-2 bg-gray-50 px-4 py-2 mb-2 rounded-lg border border-gray-200">
                <div className="flex items-center gap-4">
              {(() => {
                const Icon = tokenIcons[symbol];
                return Icon ? (
                  <Icon
                    variant="mono"
                    size={32}
                    color="#151515ff"
                  />
                ) : null;
              })()}
                <h2 className="text-lg flex items-center gap-2">
                    
                    <p>{allCrypto.find((c) => c.symbol === symbol)?.name}</p>
                    <h2 className="text-gray-500">({symbol})</h2>
                </h2>
                </div>
                <h3 className="text-md text-gray-500">
                    {weights[selected.indexOf(symbol)]}%
                </h3>
            </div>
          ))}
        </div>
        
        {/* Backtest Settings Summary */}
        <div className="w-full mt-4 border border-gray-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-2">
                <h2>Backtest Settings</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-600 text-xs mb-1">Period</p>
                <p className="text-lg font-semibold">
                  {backtestSettings.period === "Custom" 
                    ? `Custom (from ${new Date(backtestSettings.customDate!).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })})` 
                    : backtestSettings.period}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-600 text-xs mb-1">Benchmark</p>
                <p className="text-lg font-semibold">{backtestSettings.benchmark}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-600 text-xs mb-1">Rebalancing</p>
                <p className="text-lg font-semibold">{backtestSettings.rebalancingFrequency}</p>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StepFour;
