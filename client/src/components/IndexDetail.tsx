import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useIndexStore } from "../store/indexStore";
import useAuthStore from "../store/authStore";
import { runBacktest, getPortfolioPNL } from "../services/backtestService";
import type { PortfolioPNL } from "../services/backtestService";
import { generateBacktestCSV, downloadCSV } from "../services/csvExportService";
import { Trash2, Download, Save, Trash, FileText } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface BacktestResult {
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  peakBalance?: number;
  minBalance?: number;
  maxDailyLoss?: number;
  maxDailyProfit?: number;
  outperformance?: number;
  portfolioPrices?: number[];
  portfolioDates?: string[];
  benchmarkPrices?: number[];
  startDate?: string;
  biggestWinDay?: { date: string; return: number };
  biggestLossDay?: { date: string; return: number };
}

type Tab = "overview" | "backtest" | "saved_backtests";

interface SavedBacktest {
  id: string;
  indexId: string;
  period: string;
  benchmark: string;
  customDate?: string;
  customEndDate?: string;
  result: BacktestResult;
  createdAt: string;
  name: string;
}

export const IndexDetail = () => {
  const { indexName = "" } = useParams<{ indexName?: string }>();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const {
    getIndexById,
    deleteIndex,
    fetchIndices,
    indices,
    isLoading: isIndicesLoading,
  } = useIndexStore();

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(
    null,
  );
  const [backtestLoading, setBacktestLoading] = useState(false);
  const [backtestError, setBacktestError] = useState<string | null>(null);
  const [indicesFetchStarted, setIndicesFetchStarted] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Overview tab - simple PNL data
  const [overviewData, setOverviewData] = useState<PortfolioPNL | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  // Динамічні параметри бектесту
  const [backtestPeriod, setBacktestPeriod] = useState("1Y");
  const [benchmarkCrypto, setBenchmarkCrypto] = useState("BTC");
  const [customDate, setCustomDate] = useState<string | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<string | undefined>(
    undefined,
  );

  // Saved backtests
  const [savedBacktests, setSavedBacktests] = useState<SavedBacktest[]>([]);
  const [backtestName, setBacktestName] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedSavedBacktest, setSelectedSavedBacktest] =
    useState<SavedBacktest | null>(null);

  const decodedIndexId = indexName ? decodeURIComponent(indexName) : "";
  const index = getIndexById(decodedIndexId);

  useEffect(() => {
    if (token && indices.length === 0 && !indicesFetchStarted) {
      setIndicesFetchStarted(true);
      fetchIndices(token).catch((err) => {
        console.error("Failed to fetch indices:", err);
      });
    }
  }, [token, indices.length, indicesFetchStarted]);

  // Load saved backtests from localStorage
  useEffect(() => {
    if (index) {
      const saved = localStorage.getItem(`backtests_${index.id}`);
      if (saved) {
        setSavedBacktests(JSON.parse(saved));
      }
    }
  }, [index?.id]);

  // Load Overview data from creation date to today
  useEffect(() => {
    if (index && !overviewData && !overviewLoading) {
      loadOverviewData();
    }
  }, [index?.id]);

  const loadOverviewData = async () => {
    if (!index) return;

    try {
      setOverviewLoading(true);
      setOverviewError(null);

      // Get simple PNL data from creation date to today
      const result = await getPortfolioPNL(
        index.selected,
        index.weights,
        index.initialInvestment,
        index.createdAt,
      );

      setOverviewData(result);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load portfolio data";
      setOverviewError(errorMessage);
      console.error("Overview data error:", err);
    } finally {
      setOverviewLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!index || !token) return;

    try {
      setIsDeleting(true);
      await deleteIndex(token, index.id);
      navigate("/my-indices");
    } catch (err) {
      console.error("Failed to delete index:", err);
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const runBacktestAnalysis = async () => {
    if (!index || !token) return;

    try {
      setBacktestLoading(true);
      setBacktestError(null);

      const result = await runBacktest(
        index.selected,
        index.weights,
        benchmarkCrypto,
        backtestPeriod,
        index.initialInvestment,
        customDate,
        customEndDate,
      );

      setBacktestResult(result);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to run backtest";
      setBacktestError(errorMessage);
      console.error("Backtest error:", err);
    } finally {
      setBacktestLoading(false);
    }
  };

  const saveBacktest = () => {
    if (!backtestResult || !index || !backtestName.trim()) return;

    const newBacktest: SavedBacktest = {
      id: `${Date.now()}`,
      indexId: index.id,
      period: backtestPeriod,
      benchmark: benchmarkCrypto,
      customDate,
      customEndDate,
      result: backtestResult,
      createdAt: new Date().toISOString(),
      name: backtestName,
    };

    const updated = [...savedBacktests, newBacktest];
    setSavedBacktests(updated);
    localStorage.setItem(`backtests_${index.id}`, JSON.stringify(updated));
    setBacktestName("");
    setShowSaveModal(false);
  };

  const deleteBacktest = (id: string) => {
    if (!index) return;
    const updated = savedBacktests.filter((b) => b.id !== id);
    setSavedBacktests(updated);
    localStorage.setItem(`backtests_${index.id}`, JSON.stringify(updated));
    if (selectedSavedBacktest?.id === id) {
      setSelectedSavedBacktest(null);
    }
  };

  const downloadBacktestChart = () => {
    if (!selectedSavedBacktest || !selectedSavedBacktest.result.portfolioDates)
      return;

    const canvas = document.getElementById(
      "backtest-chart-to-export",
    ) as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `backtest_${selectedSavedBacktest.name}_${Date.now()}.png`;
      link.click();
    }
  };

  const downloadBacktestCSV = () => {
    if (
      !selectedSavedBacktest ||
      !selectedSavedBacktest.result.portfolioDates ||
      !selectedSavedBacktest.result.portfolioPrices
    ) {
      return;
    }

    try {
      const csvContent = generateBacktestCSV(
        index?.name || "Backtest",
        selectedSavedBacktest.result.portfolioPrices,
        selectedSavedBacktest.result.portfolioDates,
        {
          totalReturn: selectedSavedBacktest.result.totalReturn,
          sharpeRatio: selectedSavedBacktest.result.sharpeRatio,
          maxDrawdown: selectedSavedBacktest.result.maxDrawdown,
          winRate: selectedSavedBacktest.result.winRate,
          peakBalance: selectedSavedBacktest.result.peakBalance,
          minBalance: selectedSavedBacktest.result.minBalance,
          maxDailyLoss: selectedSavedBacktest.result.maxDailyLoss,
          maxDailyProfit: selectedSavedBacktest.result.maxDailyProfit,
          outperformance: selectedSavedBacktest.result.outperformance,

        },
        selectedSavedBacktest.period,
        selectedSavedBacktest.benchmark,
      );

      const filename = `backtest_${selectedSavedBacktest.name}_${selectedSavedBacktest.period}_${new Date().toISOString().split("T")[0]}.csv`;
      downloadCSV(csvContent, filename);
    } catch (error) {
      console.error("Error downloading CSV:", error);
      alert("Failed to download CSV file");
    }
  };

  if (
    isIndicesLoading ||
    (indicesFetchStarted && !index && indices.length === 0)
  ) {
    return (
      <div className="container max-w-6xl mx-auto">
        <div className="bg-white p-12 rounded-xl border border-black/10 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 text-lg">Loading your indices...</p>
        </div>
      </div>
    );
  }

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
      <div className="bg-linear-to-br bg-white p-8 rounded-lg border border-black/10 mb-6">
        <h2 className="text-3xl font-bold mb-2">{index.name}</h2>
        <p className="mb-2">
          Initial Investment:{" "}
          <span className="font-semibold ">
            ${index.initialInvestment.toLocaleString()}
          </span>
        </p>
        <p className="text-gray-600 text-sm">
          Created:{" "}
          {new Date(index.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md mx-4 shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Delete Index?
            </h2>
            <p className="text-gray-600 mb-6 text-base">
              Are you sure you want to delete "
              <strong className="text-gray-800">{index.name}</strong>"? This
              action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="bg-white border-b  border border-black/10 rounded-t-xl mb-0">
        <div className="flex gap-8 px-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-4 px-2 font-semibold border-b-2 transition ${
              activeTab === "overview"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("backtest")}
            className={`py-4 px-2 font-semibold border-b-2 transition ${
              activeTab === "backtest"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Backtest
          </button>
          <button
            onClick={() => setActiveTab("saved_backtests")}
            className={`py-4 px-2 font-semibold border-b-2 transition ${
              activeTab === "saved_backtests"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Saved Backtests
          </button>
        </div>
      </div>

      {/* Tabs Content */}
      <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 p-6">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div>
            {overviewLoading ? (
              <div className="bg-gray-50 p-12 rounded-lg text-center border border-gray-200">
                <div className="flex justify-center mb-4">
                  <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-600 text-lg">
                  Loading portfolio data...
                </p>
              </div>
            ) : overviewData ? (
              <div>
                {/* Index Info */}

                {/* PNL Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="p-6 rounded-lg border border-black/10">
                    <p className="text-gray-600 text-sm mb-2 font-semibold">
                      CURRENT VALUE
                    </p>
                    <p className={`text-3xl font-bold `}>
                      ${overviewData.currentValue.toFixed(2)}
                    </p>
                  </div>

                  <div className={`p-6 rounded-lg border border-black/10 `}>
                    <p className="text-gray-600 text-sm mb-2 font-semibold">
                      PNL (USD)
                    </p>
                    <p
                      className={`text-3xl font-bold ${overviewData.pnlPercent >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {overviewData.pnlPercent >= 0 ? "+" : "-"}$
                      {Math.abs(overviewData.pnlUSD).toFixed(2)}
                    </p>
                  </div>

                  <div className={`p-6 rounded-lg border border-black/10`}>
                    <p className="text-gray-600 text-sm mb-2 font-semibold">
                      PNL %
                    </p>
                    <p
                      className={`text-3xl font-bold ${overviewData.pnlPercent >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {overviewData.pnlPercent >= 0 ? "+" : ""}
                      {overviewData.pnlPercent.toFixed(2)}%
                    </p>
                  </div>

                  <div className=" p-6 rounded-lg border border-black/10">
                    <p className="text-gray-600 text-sm mb-2 font-semibold">
                      SHARPE RATIO
                    </p>
                    {!Number.isNaN(overviewData.sharpeRatio) ? (
                      <p className="text-3xl font-bold ">
                        {overviewData.sharpeRatio?.toFixed(2)}
                      </p>
                    ) : (
                      <p className="text-3xl font-bold ">N/A</p>
                    )}
                  </div>
                </div>

                {/* Assets Breakdown */}
                <div className="bg-gray-100/20 border border-gray-200 rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-semibold mb-4">
                    Portfolio Composition
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Pie Chart */}
                    <div className="lg:col-span-1 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={index.selected.map((symbol, idx) => ({
                              name: symbol,
                              value: index.weights[idx],
                            }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {index.selected.map((_, idx) => (
                              <Cell
                                key={`cell-${idx}`}
                                fill={`hsl(${(idx * 360) / index.selected.length}, 70%, 60%)`}
                              />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `${value}%`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Assets List */}
                    <div className="lg:col-span-2 space-y-3 overflow-y-scroll max-h-96 pr-4">
                      {index.selected.map((symbol, idx) => {
                        const assetData = overviewData.assetPrices[idx];
                        const assetValueCreation =
                          (index.initialInvestment * index.weights[idx]) / 100;
                        const assetValueToday =
                          (assetValueCreation / assetData.priceAtCreation) *
                          assetData.priceToday;
                        const assetPNL = assetValueToday - assetValueCreation;
                        const assetPNLPercent =
                          (assetPNL / assetValueCreation) * 100;

                        return (
                          <div
                            key={symbol}
                            className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200  transition "
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <span className="font-semibold text-lg text-gray-900">
                                  {symbol}
                                </span>
                                <span className="text-sm bg-gray-50 border border-black/10 text-gray-700 px-2 py-1 rounded">
                                  {index.weights[idx]}%
                                </span>
                              </div>
                              <div className="text-sm text-gray-600">
                                ${assetData.priceAtCreation.toFixed(4)} → $
                                {assetData.priceToday.toFixed(4)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div
                                className={`text-2xl font-bold ${assetPNLPercent >= 0 ? "text-green-600" : "text-red-600"}`}
                              >
                                {assetPNLPercent >= 0 ? "+" : ""}
                                {assetPNLPercent.toFixed(2)}%
                              </div>
                              <div className="text-sm text-gray-600">
                                {assetPNL >= 0 ? "+" : ""} $
                                {assetPNL.toFixed(2)}
                              </div>
                              <div
                                className={`text-xs font-semibold ${assetData.change24h >= 0 ? "text-green-600" : "text-red-600"}`}
                              >
                                24h: {assetData.change24h >= 0 ? "+" : ""}
                                {assetData.change24h.toFixed(2)}%
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Summary Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className=" p-4 rounded-lg border border-black/10">
                    <p className="text-gray-600 text-xs mb-2 font-semibold">
                      CREATION
                    </p>
                    <p className="text-lg font-bold text-gray-700">
                      {overviewData.creationDate}
                    </p>
                  </div>
                  <div className=" p-4 rounded-lg border border-black/10">
                    <p className="text-gray-600 text-xs mb-2 font-semibold">
                      TODAY
                    </p>
                    <p className="text-lg font-bold text-gray-700">
                      {overviewData.currentDate}
                    </p>
                  </div>
                  <div className=" p-4 rounded-lg border border-black/10">
                    <p className="text-gray-600 text-xs mb-2 font-semibold">
                      ASSETS
                    </p>
                    <p className="text-lg font-bold text-gray-700">
                      {index.selected.length}
                    </p>
                  </div>
                  <div className=" p-4 rounded-lg border border-black/10">
                    <p className="text-gray-600 text-xs mb-2 font-semibold">
                      DIVERSIFIED
                    </p>
                    <p className="text-lg font-bold text-gray-700">
                      {Math.min(...index.weights) > 0 ? "Yes" : "No"}
                    </p>
                  </div>
                </div>

                {((overviewData.biggestWinDay &&
                  overviewData.biggestWinDay.return !== undefined &&
                  overviewData.biggestWinDay.return > 0) ||
                  (overviewData.biggestLossDay &&
                    overviewData.biggestLossDay.return !== undefined &&
                    overviewData.biggestLossDay.return < 0)) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {overviewData.biggestWinDay &&
                      overviewData.biggestWinDay.return !== undefined &&
                      overviewData.biggestWinDay.return > 0 && (
                        <div className=" p-6 rounded-lg border border-black/10">
                          <h3 className="text-lg font-semibold  mb-3">
                            Biggest Win Day
                          </h3>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-700">Date</p>
                              <p className="text-2xl font-bold text-gray-600">
                                {overviewData.biggestWinDay.date}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-700">Return</p>
                              <p className="text-3xl font-bold text-green-600">
                                +{overviewData.biggestWinDay.return.toFixed(2)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    {overviewData.biggestLossDay &&
                      overviewData.biggestLossDay.return !== undefined &&
                      overviewData.biggestLossDay.return < 0 && (
                        <div className="p-6 rounded-lg border border-black/10">
                          <h3 className="text-lg font-semibold  mb-3">
                            Biggest Loss Day
                          </h3>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-700">Date</p>
                              <p className="text-2xl font-bold text-gray-600">
                                {overviewData.biggestLossDay.date}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-700">Return</p>
                              <p className="text-3xl font-bold text-red-600">
                                {overviewData.biggestLossDay.return.toFixed(2)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {/* Performance Chart from Creation to Today */}
                {overviewData.portfolioPrices &&
                  overviewData.portfolioDates && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 mt-4">
                      <h3 className="text-xl font-semibold mb-4">
                        Performance from Creation to Today
                      </h3>
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart
                          data={overviewData.portfolioDates.map(
                            (date, idx) => ({
                              date,
                              portfolio: overviewData.portfolioPrices![idx],
                              initialBalance: index.initialInvestment,
                            }),
                          )}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(value) => {
                              const date = new Date(value);
                              const day = String(date.getDate()).padStart(
                                2,
                                "0",
                              );
                              const month = String(
                                date.getMonth() + 1,
                              ).padStart(2, "0");
                              return `${day}/${month}`;
                            }}
                            tick={{ fontSize: 10 }}
                            minTickGap={40}
                          />
                          <YAxis
                            domain={["auto", "auto"]}
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value, index) =>
                              index === 0 ? "" : value
                            }
                          />
                          <Tooltip
                            formatter={(value) =>
                              `$${(value as number).toFixed(2)}`
                            }
                            labelFormatter={(label) => {
                              const d = new Date(label);
                              return d.toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              });
                            }}
                          />
                          <Legend />
                          <Line
                            type="linear"
                            dataKey="portfolio"
                            stroke="#8884d8"
                            name="Portfolio Value"
                            dot={false}
                            isAnimationActive={true}
                          />
                          <Line
                            type="linear"
                            dataKey="initialBalance"
                            stroke="#999999"
                            strokeDasharray="5 5"
                            name="Initial Investment"
                            dot={false}
                            isAnimationActive={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition flex items-center gap-3 mt-4"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete Index
                </button>
              </div>
            ) : overviewError ? (
              <div className="bg-red-50 p-6 rounded-lg border border-red-200 text-center">
                <p className="text-red-600 text-lg mb-2">
                  Unable to load portfolio data
                </p>
                <p className="text-red-500 text-sm">{overviewError}</p>
              </div>
            ) : null}
          </div>
        )}

        {/* Backtest Tab */}
        {activeTab === "backtest" && (
          <div>
            {/* Backtest Parameters */}
            <div className="  rounded-lg  mb-6">
              <h2 className="text-xl font-semibold mb-4">
                Backtest Parameters
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Period
                  </label>
                  <select
                    value={backtestPeriod}
                    onChange={(e) => {
                      setBacktestPeriod(e.target.value);
                      // Reset custom dates when changing period
                      if (e.target.value !== "Custom") {
                        setCustomDate(undefined);
                        setCustomEndDate(undefined);
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg p-2"
                  >
                    <option value="1M">1 Month</option>
                    <option value="3M">3 Months</option>
                    <option value="6M">6 Months</option>
                    <option value="1Y">1 Year</option>
                    <option value="3Y">3 Years</option>
                    <option value="5Y">5 Years</option>
                    <option value="Custom">Custom Range</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Benchmark
                  </label>
                  <select
                    value={benchmarkCrypto}
                    onChange={(e) => setBenchmarkCrypto(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2"
                  >
                    <optgroup label="Major">
                      <option value="BTC">Bitcoin (BTC)</option>
                      <option value="ETH">Ethereum (ETH)</option>
                    </optgroup>
                    <optgroup label="Layer 1">
                      <option value="SOL">Solana (SOL)</option>
                      <option value="ADA">Cardano (ADA)</option>
                      <option value="DOT">Polkadot (DOT)</option>
                      <option value="AVAX">Avalanche (AVAX)</option>
                    </optgroup>
                    <optgroup label="Layer 2 & Scaling">
                      <option value="LTC">Litecoin (LTC)</option>
                      <option value="ARB">Arbitrum (ARB)</option>
                      <option value="OP">Optimism (OP)</option>
                    </optgroup>
                    <optgroup label="DeFi & Tokens">
                      <option value="LINK">Chainlink (LINK)</option>
                      <option value="AAVE">Aave (AAVE)</option>
                      <option value="UNI">Uniswap (UNI)</option>
                    </optgroup>
                    <optgroup label="Other">
                      <option value="XRP">XRP (XRP)</option>
                      <option value="DOGE">Dogecoin (DOGE)</option>
                      <option value="BCH">Bitcoin Cash (BCH)</option>
                    </optgroup>
                    <optgroup label="None">
                      <option value="None">No Benchmark</option>
                    </optgroup>
                  </select>
                </div>

                {backtestPeriod === "Custom" ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={customDate || ""}
                        onChange={(e) =>
                          setCustomDate(e.target.value || undefined)
                        }
                        className="w-full border border-gray-300 rounded-lg p-2"
                        max={new Date().toISOString().split("T")[0]}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Max 5 years back from end date
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={customEndDate || ""}
                        onChange={(e) =>
                          setCustomEndDate(e.target.value || undefined)
                        }
                        className="w-full border border-gray-300 rounded-lg p-2"
                        max={new Date().toISOString().split("T")[0]}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Leave empty to use today
                      </p>
                    </div>
                  </>
                ) : null}
              </div>

              <button
                onClick={runBacktestAnalysis}
                disabled={
                  backtestLoading ||
                  (backtestPeriod === "Custom" && !customDate)
                }
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {backtestLoading ? "Running Backtest..." : "Run Backtest"}
              </button>
            </div>

            {/* Backtest Results */}
            {backtestLoading && (
              <div className="bg-white p-12 rounded-lg text-center border border-gray-200">
                <div className="flex justify-center mb-4">
                  <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-600 text-lg">
                  Running backtest with real data...
                </p>
              </div>
            )}

            {backtestError && (
              <div className="bg-red-50 p-6 rounded-lg border border-red-200 text-center">
                <p className="text-red-600 text-lg mb-4">
                  Error running backtest
                </p>
                <p className="text-red-500 text-sm">{backtestError}</p>
              </div>
            )}

            {backtestResult && !backtestLoading && (
              <div>
                {/* Results Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Total Return</p>
                    <p
                      className={`text-3xl font-bold ${backtestResult.totalReturn >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {backtestResult.totalReturn >= 0 ? "+" : ""}
                      {backtestResult.totalReturn.toFixed(2)}%
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Sharpe Ratio</p>
                    <p className="text-3xl font-bold">
                      {backtestResult.sharpeRatio.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Max Drawdown</p>
                    <p className="text-3xl font-bold text-red-600">
                      {backtestResult.maxDrawdown.toFixed(2)}%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Win Rate</p>
                    <p className="text-3xl font-bold">
                      {backtestResult.winRate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Final Balance</p>
                    <p className="text-3xl font-bold">
                      $
                      {backtestResult.portfolioPrices
                        ? backtestResult.portfolioPrices[
                            backtestResult.portfolioPrices.length - 1
                          ].toFixed(2)
                        : "0.00"}
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Peak Balance</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${(backtestResult.peakBalance || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Min Balance</p>
                    <p className="text-2xl font-bold text-red-600">
                      ${(backtestResult.minBalance || 0).toFixed(2)}
                    </p>
                  </div>
                    <div className="col-span-4 w-100%">
                    <div className="bg-white gap-4 rounded-lg flex justify-around">
                      
                          <div className="w-full p-6 rounded-lg border border-black/10">
                            <h3 className="text-lg font-semibold  mb-3">
                              Biggest Win Day
                            </h3>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-700">Date</p>
                              
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-700">Return</p>
                                <p className="text-3xl font-bold text-green-600">
                                  +{backtestResult.maxDailyProfit?.toFixed(2)}%
                                </p>
                              </div>
                            </div>
                          </div>
                      
                      
                          <div className="w-full p-6 rounded-lg border border-black/10">
                            <h3 className="text-lg font-semibold  mb-3">
                              Biggest Loss Day
                            </h3>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-700">Date</p>
                              
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-700">Return</p>
                                <p className="text-3xl font-bold text-red-600">
                                  {backtestResult.maxDailyLoss?.toFixed(2)}%
                                </p>
                              </div>
                            </div>
                          </div>
                        
                      
                    </div>
                    </div>
                </div>

                {/* Chart */}
                {backtestResult.portfolioPrices &&
                  backtestResult.portfolioDates && (
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <h3 className="text-lg font-semibold mb-4">
                        Portfolio Value Over Time
                      </h3>
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart
                          data={backtestResult.portfolioDates.map(
                            (date, idx) => {
                              const dataPoint: any = {
                                date,
                                portfolio: backtestResult.portfolioPrices![idx],
                              };
                              if (
                                backtestResult.benchmarkPrices &&
                                backtestResult.benchmarkPrices[idx]
                              ) {
                                dataPoint.benchmark =
                                  backtestResult.benchmarkPrices[idx];
                              }
                              return dataPoint;
                            },
                          )}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(value) => {
                              const d = new Date(value);
                              const dd = String(d.getDate()).padStart(2, "0");
                              const mm = String(d.getMonth() + 1).padStart(
                                2,
                                "0",
                              );
                              const yy = String(d.getFullYear()).slice(-2);
                              return `${dd}/${mm}/${yy}`;
                            }}
                            tick={{ fontSize: 10 }}
                            interval="preserveStartEnd"
                            minTickGap={40}
                          />
                          <YAxis
                            domain={["auto", "auto"]}
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => {
                              if (value >= 1000)
                                return `$${value.toLocaleString()}`;
                              return `$${value.toFixed(2)}`;
                            }}
                          />
                          <Tooltip
                            formatter={(value) =>
                              `$${(value as number).toFixed(2)}`
                            }
                            labelFormatter={(label) => {
                              const d = new Date(label);
                              return d.toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              });
                            }}
                          />
                          <Legend />
                          <Line
                            type="linear"
                            dataKey="portfolio"
                            stroke="#8884d8"
                            name="Your Portfolio"
                            dot={false}
                            isAnimationActive={false}
                          />
                          {benchmarkCrypto !== "None" &&
                            backtestResult.benchmarkPrices && (
                              <Line
                                type="linear"
                                dataKey="benchmark"
                                stroke="#82ca9d"
                                name={`${benchmarkCrypto} Benchmark`}
                                dot={false}
                                isAnimationActive={false}
                              />
                            )}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                {/* Save Backtest Button */}
                {backtestResult && !backtestLoading && (
                  <div className="mt-6 flex gap-4">
                    <button
                      onClick={() => setShowSaveModal(true)}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition flex items-center justify-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      Save This Backtest
                    </button>
                    <button
                      onClick={() => {
                        try {
                          const csvContent = generateBacktestCSV(
                            index?.name || "Backtest",
                            backtestResult.portfolioPrices || [],
                            backtestResult.portfolioDates || [],
                            {
                              totalReturn: backtestResult.totalReturn,
                              sharpeRatio: backtestResult.sharpeRatio,
                              maxDrawdown: backtestResult.maxDrawdown,
                              winRate: backtestResult.winRate,
                              peakBalance: backtestResult.peakBalance,
                              minBalance: backtestResult.minBalance,
                              maxDailyLoss: backtestResult.maxDailyLoss,
                              maxDailyProfit: backtestResult.maxDailyProfit,
                              outperformance: backtestResult.outperformance,
                            },
                            backtestPeriod,
                            benchmarkCrypto,
                          );
                          const filename = `backtest_${index?.name}_${backtestPeriod}_${new Date().toISOString().split("T")[0]}.csv`;
                          downloadCSV(csvContent, filename);
                        } catch (error) {
                          console.error("Error downloading CSV:", error);
                          alert("Failed to download CSV file");
                        }
                      }}
                      className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold transition flex items-center justify-center gap-2"
                    >
                      <FileText className="w-5 h-5" />
                      Download CSV
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Save Backtest Modal */}
        {showSaveModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-md mx-4 shadow-2xl">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">
                Save This Backtest
              </h2>
              <input
                type="text"
                placeholder="Enter backtest name (e.g., 'Conservative Mix')"
                value={backtestName}
                onChange={(e) => setBacktestName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 mb-4"
              />
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowSaveModal(false);
                    setBacktestName("");
                  }}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveBacktest}
                  disabled={!backtestName.trim()}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Saved Backtests Tab */}
        {activeTab === "saved_backtests" && (
          <div>
            {savedBacktests.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg mb-4">
                  No saved backtests yet
                </p>
                <p className="text-gray-500">
                  Run a backtest and save it to view it here
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Saved Backtests List */}
                <div className="lg:col-span-1">
                  <h3 className="text-xl font-semibold mb-4">
                    Saved Backtests
                  </h3>
                  <div className="space-y-3">
                    {savedBacktests.map((backtest) => (
                      <div
                        key={backtest.id}
                        onClick={() => setSelectedSavedBacktest(backtest)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                          selectedSavedBacktest?.id === backtest.id
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <h4 className="font-semibold text-gray-900 mb-2">
                          {backtest.name}
                        </h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Period: {backtest.period}</p>
                          <p>Benchmark: {backtest.benchmark}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(backtest.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteBacktest(backtest.id);
                          }}
                          className="mt-3 w-full px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <Trash className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Saved Backtest Details */}
                {selectedSavedBacktest && (
                  <div className="lg:col-span-2">
                    <div className=" p-6 rounded-lg border border-gray-200 mb-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">
                            {selectedSavedBacktest.name}
                          </h3>
                          <p className="text-gray-600 text-sm mt-1">
                            {new Date(
                              selectedSavedBacktest.createdAt,
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          
                          <button
                            onClick={downloadBacktestCSV}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold transition flex items-center gap-2"
                          >
                            <FileText className="w-5 h-5" />
                            Download CSV
                          </button>
                        </div>
                      </div>

                      {/* Results Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-lg border border-gray-300">
                          <p className="text-sm text-gray-600 mb-1">
                            Total Return
                          </p>
                          <p
                            className={`text-2xl font-bold ${selectedSavedBacktest.result.totalReturn >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {selectedSavedBacktest.result.totalReturn >= 0
                              ? "+"
                              : ""}
                            {selectedSavedBacktest.result.totalReturn.toFixed(
                              2,
                            )}
                            %
                          </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-300">
                          <p className="text-sm text-gray-600 mb-1">
                            Sharpe Ratio
                          </p>
                          <p className="text-2xl font-bold">
                            {selectedSavedBacktest.result.sharpeRatio.toFixed(
                              2,
                            )}
                          </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-300">
                          <p className="text-sm text-gray-600 mb-1">
                            Max Drawdown
                          </p>
                          <p className="text-2xl font-bold text-red-600">
                            {selectedSavedBacktest.result.maxDrawdown.toFixed(
                              2,
                            )}
                            %
                          </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-300">
                          <p className="text-sm text-gray-600 mb-1">Win Rate</p>
                          <p className="text-2xl font-bold">
                            {selectedSavedBacktest.result.winRate.toFixed(1)}%
                          </p>
                        </div>
                        {selectedSavedBacktest.result.peakBalance !==
                          undefined && (
                          <div className="bg-white p-4 rounded-lg border border-gray-300">
                            <p className="text-sm text-gray-600 mb-1">
                              Peak Balance
                            </p>
                            <p className="text-2xl font-bold text-green-600">
                              $
                              {(
                                selectedSavedBacktest.result.peakBalance || 0
                              ).toFixed(2)}
                            </p>
                          </div>
                        )}
                        {selectedSavedBacktest.result.minBalance !==
                          undefined && (
                          <div className="bg-white p-4 rounded-lg border border-gray-300">
                            <p className="text-sm text-gray-600 mb-1">
                              Min Balance
                            </p>
                            <p className="text-2xl font-bold text-red-600">
                              $
                              {(
                                selectedSavedBacktest.result.minBalance || 0
                              ).toFixed(2)}
                            </p>
                          </div>
                        )}
                        {selectedSavedBacktest.result.maxDailyProfit !==
                          undefined && (
                          <div className="bg-white p-4 rounded-lg border border-gray-300">
                            <p className="text-sm text-gray-600 mb-1">
                              Max Daily Profit
                            </p>
                            <p className="text-2xl font-bold text-green-600">
                              +
                              {(
                                selectedSavedBacktest.result.maxDailyProfit || 0
                              ).toFixed(2)}
                              %
                            </p>
                          </div>
                        )}
                        {selectedSavedBacktest.result.maxDailyLoss !==
                          undefined && (
                          <div className="bg-white p-4 rounded-lg border border-gray-300">
                            <p className="text-sm text-gray-600 mb-1">
                              Max Daily Loss
                            </p>
                            <p className="text-2xl font-bold text-red-600">
                              {(
                                selectedSavedBacktest.result.maxDailyLoss || 0
                              ).toFixed(2)}
                              %
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Chart */}
                    {selectedSavedBacktest.result.portfolioPrices &&
                      selectedSavedBacktest.result.portfolioDates && (
                        <div className="bg-white p-6 rounded-lg">
                          <h3 className="text-lg font-semibold mb-4">
                            Performance Chart
                          </h3>
                          <ResponsiveContainer width="100%" height={400}>
                            <LineChart
                              data={selectedSavedBacktest.result.portfolioDates.map(
                                (date, idx) => {
                                  const dataPoint: any = {
                                    date,
                                    portfolio:
                                      selectedSavedBacktest.result
                                        .portfolioPrices![idx],
                                  };
                                  if (
                                    selectedSavedBacktest.result
                                      .benchmarkPrices &&
                                    selectedSavedBacktest.result
                                      .benchmarkPrices[idx]
                                  ) {
                                    dataPoint.benchmark =
                                      selectedSavedBacktest.result.benchmarkPrices[
                                        idx
                                      ];
                                  }
                                  return dataPoint;
                                },
                              )}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                dataKey="date"
                                tickFormatter={(value) => {
                                  const d = new Date(value);
                                  const dd = String(d.getDate()).padStart(
                                    2,
                                    "0",
                                  );
                                  const mm = String(d.getMonth() + 1).padStart(
                                    2,
                                    "0",
                                  );
                                  const yy = String(d.getFullYear()).slice(-2);
                                  return `${dd}/${mm}/${yy}`;
                                }}
                                tick={{ fontSize: 10 }}
                                interval="preserveStartEnd"
                                minTickGap={40}
                              />
                              <YAxis
                                domain={["auto", "auto"]}
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => {
                                  if (value >= 1000)
                                    return `$${value.toLocaleString()}`;
                                  return `$${value.toFixed(2)}`;
                                }}
                              />
                              <Tooltip
                                formatter={(value) =>
                                  `$${(value as number).toFixed(2)}`
                                }
                                labelFormatter={(label) => {
                                  const d = new Date(label);
                                  return d.toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  });
                                }}
                              />
                              <Legend />
                              <Line
                                type="linear"
                                dataKey="portfolio"
                                stroke="#8884d8"
                                name="Your Portfolio"
                                dot={false}
                                isAnimationActive={false}
                              />
                              {selectedSavedBacktest.result.benchmarkPrices && (
                                <Line
                                  type="linear"
                                  dataKey="benchmark"
                                  stroke="#82ca9d"
                                  name={`${selectedSavedBacktest.benchmark} Benchmark`}
                                  dot={false}
                                  isAnimationActive={false}
                                />
                              )}
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-6 mb-6">
        <button
          onClick={() => navigate("/my-indices")}
          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold transition"
        >
          Back to My Indices
        </button>
      </div>
    </div>
  );
};
