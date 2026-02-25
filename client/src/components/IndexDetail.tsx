import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useSelectedCryptos, allCrypto } from "../store/cryptoStore";
import { tokenIcons } from "../store/cryptoIcons";
import { runBacktest } from "../services/backtestService";
import {
  AlignHorizontalJustifyCenter,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  MoveDown,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface BacktestResult {
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  benchmarkReturn?: number;
  outperformance?: number;
  portfolioPrices?: number[];
  portfolioDates?: string[];
  benchmarkPrices?: number[];
}

export const IndexDetail = () => {
  const { indexName } = useParams<{ indexName: string }>();
  const navigate = useNavigate();
  const getIndexByName = useSelectedCryptos((s) => s.getIndexByName);
  const updateIndexBacktestResult = useSelectedCryptos(
    (s) => s.updateIndexBacktestResult,
  );

  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const decodedIndexName = indexName ? decodeURIComponent(indexName) : "";
  const index = getIndexByName(decodedIndexName);

  const yTicks = useMemo(() => {
    if (!backtestResult?.portfolioPrices) return [];

    const min = Math.min(...backtestResult.portfolioPrices);
    const max = Math.max(...backtestResult.portfolioPrices);
    const step = (max - min) / 5;

    return Array.from({ length: 6 }, (_, i) => +(min + step * i).toFixed(2));
  }, [backtestResult?.portfolioPrices]);

  const runBacktestAnalysis = async () => {
    if (!index) return;

    try {
      setLoading(true);
      setError(null);

      // Запускаємо бектест на основі справжніх даних
      const result = await runBacktest(
        index.selected,
        index.weights,
        index.backtestSettings.benchmark,
        index.backtestSettings.period,
        index.initialInvestment,
        index.backtestSettings.rebalancingFrequency,
        index.backtestSettings.customDate,
      );

      setBacktestResult(result);
      updateIndexBacktestResult(index.id, result);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to run backtest";
      setError(errorMessage);
      console.error("Backtest error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Якщо результат вже є в індексі, використовуємо його
    if (index?.backtestResult) {
      setBacktestResult(index.backtestResult);
      setLoading(false);
    } else if (index) {
      // Інакше запускаємо бектест
      runBacktestAnalysis();
    }
  }, [index]);

  if (!index) {
    return (
      <div className="container max-w-6xl mx-auto">
        <div className="bg-white p-12 rounded-xl border border-black/10 text-center">
          <p className="text-gray-600 text-lg mb-4">Index not found</p>
          <button
            onClick={() => navigate("/my-indices")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
          >
            Back to Indices
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto">
      <div className="bg-white p-6 rounded-xl border border-black/10 mb-4">
        <h1 className="text-3xl font-bold mb-2">{index.name}</h1>
        <p className="text-gray-600 text-lg">Backtest Results</p>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-xl border border-black/10 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 text-lg">
            Running backtest with real data...
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Analyzing {index.selected.length} assets over{" "}
            {index.backtestSettings.period}
          </p>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-12 rounded-xl border border-red-200 text-center">
          <p className="text-red-600 text-lg mb-4">Error running backtest</p>
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <button
            onClick={runBacktestAnalysis}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
          >
            Retry
          </button>
        </div>
      ) : backtestResult ? (
        <>
          {/* Backtest Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-center justify-between">
              <p className="text-sm font-semibold mb-1">
                Total Return
                <p
                  className={` ${backtestResult.totalReturn >= 0 ? "text-green-600" : "text-red-600"} text-3xl font-bold `}
                >
                  {backtestResult.totalReturn >= 0 ? "+" : ""}
                  {backtestResult.totalReturn.toFixed(2)}%
                </p>
              </p>
              {backtestResult.totalReturn >= 0 ? (
                <span className="text-green-600 text-3xl">
                  <TrendingUp className="w-6 h-6" />
                </span>
              ) : (
                <span className="text-red-600 text-3xl">
                  <TrendingDown className="w-6 h-6" />
                </span>
              )}
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-center justify-between">
              <p className="text-sm font-semibold mb-1">
                Inital Investment
                <p className="text-3xl font-bold ">
                  ${index.initialInvestment.toFixed(2)}
                </p>
              </p>
              <BriefcaseBusiness className="w-8 h-8 text-blue-400 mt-2" />
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-center justify-between">
              <p className="text-sm font-semibold mb-1">
                Sharpe Ratio
                <p className="text-3xl font-bold ">
                  {backtestResult.sharpeRatio.toFixed(2)}
                </p>
              </p>
              <AlignHorizontalJustifyCenter className="w-8 h-8 text-purple-400 mt-2" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-center justify-between">
              <p className=" text-sm font-semibold mb-1">
                Max Drawdown
                <p
                  className={` ${backtestResult.maxDrawdown >= 0 ? "text-green-600" : "text-red-600"} text-3xl font-bold `}
                >
                  {backtestResult.maxDrawdown.toFixed(2)}%
                </p>
              </p>
              <MoveDown className="w-8 h-8 text-red-400 mt-2" />
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-center justify-between">
              <p className="text-sm font-semibold mb-1">
                Current Balance
                <p
                  className={`text-3xl font-bold ${index.initialInvestment <= (backtestResult.portfolioPrices ? backtestResult.portfolioPrices[backtestResult.portfolioPrices.length - 1] : 0) ? "text-green-600" : "text-red-600"}`}
                >
                  $
                  {backtestResult.portfolioPrices
                    ? backtestResult.portfolioPrices[
                        backtestResult.portfolioPrices.length - 1
                      ].toFixed(2)
                    : "0.00"}
                </p>
              </p>
              {index.initialInvestment <=
              (backtestResult.portfolioPrices
                ? backtestResult.portfolioPrices[
                    backtestResult.portfolioPrices.length - 1
                  ]
                : 0) ? (
                <span className="text-green-600 text-3xl">
                  <TrendingUp className="w-6 h-6" />
                </span>
              ) : (
                <span className="text-red-600 text-3xl">
                  <TrendingDown className="w-6 h-6" />
                </span>
              )}
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-center justify-between">
              <p className=" text-sm font-semibold mb-1">
                Win Rate
                <p className="text-3xl font-bold ">
                  {backtestResult.winRate.toFixed(1)}%
                </p>
              </p>
              <ChartNoAxesCombined className="w-8 h-8 text-orange-400 mt-2" />
            </div>
          </div>

          {/* Comparison */}

          {/* Configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Selected Cryptocurrencies */}
            <div className="bg-white p-6 rounded-xl border border-black/10">
              <div className="mb-4 border-b border-gray-200 pb-4">
                <h2 className="text-xl font-semibold">
                  Selected Cryptocurrencies
                </h2>
                <p className="text-gray-500 text-sm">
                  Total: {index.selected.length} assets
                </p>
              </div>
              <div className="space-y-2 max-h-76 overflow-y-auto">
                {index.selected.map((symbol, idx) => (
                  <div
                    key={symbol}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      {(() => {
                        const Icon = tokenIcons[symbol];
                        return Icon ? (
                          <Icon variant="mono" size={24} color="#151515ff" />
                        ) : null;
                      })()}
                      <div>
                        <h3 className="font-semibold text-sm">
                          {allCrypto.find((c) => c.symbol === symbol)?.name}
                        </h3>
                        <p className="text-gray-500 text-xs">({symbol})</p>
                      </div>
                    </div>
                    <p className="font-bold">{index.weights[idx]}%</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Backtest Settings */}
            <div className="bg-white p-6 rounded-xl border border-black/10">
              <div className="mb-4 border-b border-gray-200 pb-4">
                <h2 className="text-xl font-semibold">Backtest Settings</h2>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 text-xs mb-1">Backtest Period</p>
                  <p className="text-lg font-semibold">
                    {index.backtestSettings.period === "Custom" 
                      ? `Custom (from ${new Date(index.backtestSettings.customDate!).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })})` 
                      : index.backtestSettings.period}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 text-xs mb-1">Benchmark</p>
                  <p className="text-lg font-semibold">
                    {index.backtestSettings.benchmark}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 text-xs mb-1">
                    Rebalancing Frequency
                  </p>
                  <p className="text-lg font-semibold">
                    {index.backtestSettings.rebalancingFrequency}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 text-xs mb-1">Date of Creation</p>
                  <p className="text-lg font-semibold">
                    {index.createdAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* Portfolio Price Chart */}
      {backtestResult &&
        backtestResult.portfolioPrices &&
        backtestResult.portfolioDates && (
          <div className="bg-white p-6 rounded-xl border border-black/10 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              Portfolio Value Over Time
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart
                data={backtestResult.portfolioDates.map((date, idx) => {
                  const dataPoint: any = {
                    date,
                    portfolio: backtestResult.portfolioPrices![idx],
                  };
                  if (
                    backtestResult.benchmarkPrices &&
                    backtestResult.benchmarkPrices[idx]
                  ) {
                    dataPoint.benchmark = backtestResult.benchmarkPrices[idx];
                  }
                  return dataPoint;
                })}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => {
                    const d = new Date(value);
                    const dd = String(d.getDate()).padStart(2, "0");
                    const mm = String(d.getMonth() + 1).padStart(2, "0");
                    const yy = String(d.getFullYear()).slice(-2);
                    return `${dd}/${mm}/${yy}`;
                  }}
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                  minTickGap={50}
                />
                <YAxis
                  ticks={yTicks}
                  domain={[yTicks[0], yTicks[yTicks.length - 1]]}
                  tick={{ fontSize: 12 }}
                  label={{
                    value: "Value ($)",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip
                  formatter={(value) => `$${(value as number).toFixed(2)}`}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Line
                  type="linear"
                  dataKey="portfolio"
                  stroke="#8884d8"
                  name="Portfolio"
                  dot={false}
                  isAnimationActive={false}
                />
                {index?.backtestSettings.benchmark !== "None" &&
                  backtestResult.benchmarkPrices && (
                    <Line
                      type="linear"
                      dataKey="benchmark"
                      stroke="#82ca9d"
                      name={`${index?.backtestSettings.benchmark} Benchmark`}
                      dot={false}
                      isAnimationActive={false}
                    />
                  )}
              </LineChart>
            </ResponsiveContainer>
            {index.backtestSettings.benchmark !== "None" &&
              backtestResult.benchmarkReturn !== undefined && (
                <div className="bg-white p-6 rounded-xl border border-black/10 mb-6">
                  <h2 className="text-xl font-semibold mb-4">
                    Comparison vs Benchmark
                  </h2>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-5">
                      <div>
                        <p className="text-gray-600 text-sm mb-1">
                          Your Index Return
                        </p>
                        <p className={`text-2xl font-bold `}>
                          {backtestResult.totalReturn >= 0 ? "+" : ""}
                          {backtestResult.totalReturn.toFixed(2)}%
                        </p>
                      </div>
                      <h2>VS</h2>
                      <div>
                        <p className="text-gray-600 text-sm mb-1">
                          {index.backtestSettings.benchmark} Return
                        </p>
                        <p className={`text-2xl font-bold  `}>
                          {backtestResult.benchmarkReturn >= 0 ? "+" : ""}
                          {backtestResult.benchmarkReturn.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl flex items-center justify-between">
                      <p className="text-sm font-semibold mb-1">
                        {backtestResult.outperformance! >= 0
                          ? "Outperformance"
                          : "Underperformance"}
                        <p
                          className={` ${backtestResult.outperformance! >= 0 ? "text-green-600" : "text-red-600"} text-3xl font-bold `}
                        >
                          {backtestResult.outperformance!.toFixed(2)}%
                        </p>
                      </p>
                      {backtestResult.outperformance! >= 0 ? (
                        <span className="text-green-600 text-3xl">
                          <TrendingUp className="w-6 h-6" />
                        </span>
                      ) : (
                        <span className="text-red-600 text-3xl">
                          <TrendingDown className="w-6 h-6" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
          </div>
        )}
      {/* Action Buttons */}
      <div className="flex gap-4 mt-6 mb-6">
        <button
          onClick={runBacktestAnalysis}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
        >
          Re-run Backtest
        </button>
        <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition">
          Export Results
        </button>
        <button
          onClick={() => navigate("/my-indices")}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition"
        >
          Back
        </button>
      </div>
    </div>
  );
};
