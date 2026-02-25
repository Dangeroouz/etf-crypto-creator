import { useSelectedCryptos } from "../../store/cryptoStore";
import { useEffect, useState } from "react";

const StepThree = () => {
    const HistoricalPeriod = useSelectedCryptos((s) => s.backtestSettings.period);
    const CustomDate = useSelectedCryptos((s) => s.backtestSettings.customDate);
    const Benchmark = useSelectedCryptos((s) => s.backtestSettings.benchmark);
    const RebalancingFrequency = useSelectedCryptos((s) => s.backtestSettings.rebalancingFrequency);
    const setBacktestBenchmark = useSelectedCryptos((s) => s.setBacktestBenchmark);
    const setRebalancingFrequency = useSelectedCryptos((s) => s.setBacktestRebalancingFrequency);
    const setBacktestPeriod = useSelectedCryptos((s) => s.setBacktestPeriod);
    const setBacktestCustomDate = useSelectedCryptos((s) => s.setBacktestCustomDate);
    
    const [useCustomDate, setUseCustomDate] = useState(!!CustomDate);
    const [maxDate, setMaxDate] = useState<string>("");
    const [minDate, setMinDate] = useState<string>("");

    // Розраховуємо max і min дати при монтуванні компонента
    useEffect(() => {
        const today = new Date();
        const max = today.toISOString().split('T')[0];
        const min = new Date(today.getTime() - 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        setMaxDate(max);
        setMinDate(min);
    }, []);
    const benchmarkOptions = [
      { value: "BTC", title: "Bitcoin (BTC)", description: "Compare your index against Bitcoin" },
      { value: "ETH", title: "Etherium (ETH)", description: "Compare your index against Etherium" },
      { value: "SOL", title: "Solana (SOL)", description: "Compare your index against Solana" },
      { value: "ADA", title: "Cardano (ADA)", description: "Compare your index against Cardano" },
      { value: "DOT", title: "Polkadot (DOT)", description: "Compare your index against Polkadot" },
      { value: "None", title: "No Benchmark", description: "Show only your index performance" }
    ];
    const rebalancingOptions = [
      { value: "None", title: "None", description: "Buy and hold without rebalancing" },
      { value: "Monthly", title: "Monthly", description: "Rebalance weights every month" },
      { value: "Quarterly", title: "Quarterly", description: "Rebalance weights every quarter" },
      { value: "Yearly", title: "Yearly", description: "Rebalance weights annually" }
    ];
    const yearOptions = ["1M", "3M", "6M", "1Y", "3Y", "5Y"];

    // Define period to months
    const periodToMonths: { [key: string]: number } = {
      "1M": 1,
      "3M": 3,
      "6M": 6,
      "1Y": 12,
      "3Y": 36,
      "5Y": 60,
    };

    // Define rebalancing to months
    const rebalancingToMonths: { [key: string]: number } = {
      "None": 0,
      "Monthly": 1,
      "Quarterly": 3,
      "Yearly": 12,
    };

    // Get allowed rebalancing for current period
    const currentPeriodMonths = periodToMonths[HistoricalPeriod] || 12;
    const allowedRebalancing = rebalancingOptions.filter(option => {
      const rebalanceMonths = rebalancingToMonths[option.value];
      return rebalanceMonths <= currentPeriodMonths;
    });

    return (
        <div className="p-2">
            <div className="">
                <h2 className="font-semibold">Historical Period</h2>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-4">
                    {yearOptions.map((option) => (
                        <button 
                            key={option} 
                            onClick={() => setBacktestPeriod(option)}
                            className={`border border-gray-300 rounded-xl py-4 cursor-pointer hover:border-indigo-500 hover:shadow-md transition w-full ${HistoricalPeriod === option ? 'border-indigo-500 shadow-md' : ''}`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
                <p className="text-gray-400 mt-2">Select the time period to backtest your index performance</p>
                
                {/* Custom Date Selector */}
                <div className="mt-6 p-4 border border-gray-200 rounded-xl bg-gray-50">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={useCustomDate}
                            onChange={(e) => {
                                setUseCustomDate(e.target.checked);
                                if (!e.target.checked) {
                                    setBacktestCustomDate(undefined);
                                } else if (maxDate) {
                                    setBacktestCustomDate(maxDate);
                                }
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-indigo-500 cursor-pointer"
                        />
                        <span className="font-semibold">Use Custom Start Date (up to 5 years ago)</span>
                    </label>
                    
                    {useCustomDate && maxDate && minDate && (
                        <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Start Date</label>
                            <input 
                                type="date" 
                                value={CustomDate || maxDate}
                                onChange={(e) => setBacktestCustomDate(e.target.value)}
                                min={minDate}
                                max={maxDate}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                Range: {minDate} to {maxDate}
                            </p>
                            {CustomDate && (
                                <p className="text-sm text-indigo-600 mt-2 font-semibold">
                                    Selected: {new Date(CustomDate).toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div className="">
                <h2 className="font-semibold mt-6">Benchmark Comparison</h2>
                <div className="grid grid-cols-1 gap-2 mt-4">
                    {benchmarkOptions.map((b) => (
                      <button
                        key={b.value}
                        onClick={() => setBacktestBenchmark(b.value)}
                        className={`border border-gray-300 rounded-xl py-4 cursor-pointer hover:border-indigo-500 hover:shadow-md transition w-full text-left px-4 ${
                          Benchmark === b.value ? "border-indigo-500 shadow-md" : ""
                        }`}
                      >
                        <div className="flex gap-4 items-center">
                          <div className="w-4 h-4 bg-white border border-gray-200 rounded-full"></div>
                          <p>{b.title}</p>
                          <p className="text-gray-400">{b.description}</p>
                        </div>
                      </button>
                    ))}
                </div>
            </div>
            <div className="">
                <h2 className="font-semibold mt-6">Rebalancing frequency</h2>
                <div className="grid grid-cols-1 gap-2 mt-4">
                    {rebalancingOptions.map((r) => {
                      const isAllowed = allowedRebalancing.some(allowed => allowed.value === r.value);
                      return (
                        <button
                          key={r.value}
                          onClick={() => isAllowed && setRebalancingFrequency(r.value)}
                          className={`border border-gray-300 rounded-xl py-4 cursor-pointer hover:border-indigo-500 hover:shadow-md transition w-full text-left px-4 ${
                            RebalancingFrequency === r.value ? "border-indigo-500 shadow-md" : ""
                          } ${!isAllowed ? "opacity-50 cursor-not-allowed" : ""}`}
                          disabled={!isAllowed}
                        >
                          <div className="flex gap-4 items-center">
                            <div className="w-4 h-4 bg-white border border-gray-200 rounded-full"></div>
                            <p>{r.title}</p>
                            <p className="text-gray-400">{r.description}</p>
                          </div>
                        </button>
                      );
                    })}
                </div>
            </div>

        </div>
    );
};

export default StepThree;