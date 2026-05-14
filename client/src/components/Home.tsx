import { useNavigate } from "react-router-dom";
import { useCryptoStore } from "../store/cryptoStore";
import { allCrypto} from "../store/cryptoStore";
import { tokenIcons } from "../store/cryptoIcons";
import useAuthStore from "../store/authStore";

import { ArrowDownRight, ArrowUpRight, TrendingUp, BarChart2, BarChart3 } from "lucide-react";
import PerformanceChartHome from "./PerformanceHome";

export const Home = () => {
  const navigate = useNavigate();
  const cryptoData = useCryptoStore((s) => s.crypto);
  const { isAuthenticated } = useAuthStore();

  const handleCreateClick = () => {
    if (isAuthenticated) {
      navigate("/create");
    } else {
      navigate("/login");
    }
  };

  const handleMyIndicesClick = () => {
    if (isAuthenticated) {
      navigate("/my-indices");
    } else {
      navigate("/login");
    }
  };
  
  return (
    <div className="min-h-screen sm:p-8">
      <div className="">
        <h1 className="text-4xl sm:text-5xl mx-auto tracking-tight bg-linear-to-r from-indigo-600 to-teal-500 bg-clip-text text-transparent text-center mt-16">
          Build Your Custom Crypto Index
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 mt-4 text-center">
          Create diversified cryptocurrency portfolios, run historical
          backtests, and compare <br /> performance against major benchmarks.
        </p>
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            onClick={handleCreateClick}
            className="text-sm sm:text-md inline-block px-6 py-1.5 bg-linear-to-r from-blue-600 to-indigo-500 text-white font-semibold rounded-md shadow-md hover:from-indigo-700 hover:to-teal-600 transition duration-300 ease-in-out transform cursor-pointer"
          >
            Create New Index
          </button>
          <button
            onClick={handleMyIndicesClick}
            className="text-sm sm:text-md inline-block px-6 py-1.5 bg-white border border-gray-200 text-black font-semibold rounded-md shadow-md hover:bg-gray-100 transition duration-300 ease-in-out transform cursor-pointer"
          >
            View My Indices
          </button>
        </div>
        <section className="hidden sm:block bg-white p-4 rounded-xl border border-black/10 mt-16" style={{ padding: "20px", backgroundColor: "#fafafa" }}>
          <PerformanceChartHome symbol1="BTC" symbol2="ETH" days={10}/>
        </section>
        <div className="flex justify-center mt-12 gap-6 md:flex-nowrap flex-wrap">
          <div className="bg-white p-4 rounded-xl border border-black/10">
            <TrendingUp size={48} className="text-indigo-600 mx-auto" />
            <h2 className="text-lg md:text-xl text-gray-800 text-center mt-4">
              Start Building Your Index 
            </h2>
            <p className="text-sm md:text-md text-gray-400 text-center mt-2">
              Join our platform to create and manage your own cryptocurrency
              indices with ease.
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-black/10">
            <BarChart2 size={48} className="text-indigo-600 mx-auto" />
            <h2 className="text-lg md:text-xl text-gray-800 text-center mt-4">
              Historical Backtesting
            </h2>
            <p className="text-sm md:text-md text-gray-400 text-center mt-2">
              Test your portfolio strategy against historical data with various rebalancing options.
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-black/10">
            <BarChart3 size={48} className="text-indigo-600 mx-auto" />
            <h2 className="text-lg md:text-xl text-gray-800 text-center mt-4">
              Performance Analytics
            </h2>
            <p className="text-sm md:text-md text-gray-400 text-center mt-2">
              Comprehensive metrics including returns, volatility, Sharpe ratio, and drawdowns.
            </p>
          </div>
        </div>
        <div className="mt-8">
          <h2 className="text-2xl text-gray-800">Trending Cryptocurrencies</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {cryptoData.map((crypto, index) => (
              
              <div
                key={crypto.symbol}
                className={`bg-white p-4 rounded-xl border border-black/10 hover:shadow-lg transition-shadow duration-300 ${index >= 4 ? "hidden sm:block" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <div className="p-2">
                    {(() => {
                      const Icon = tokenIcons[allCrypto[index].symbol];
                      return Icon ? (
                        <Icon
                          className="bg-linear-to-br from-indigo-100 to-indigo-50 rounded-full"
                          variant="mono"
                          size={48}
                          color="#151515ff"
                        />
                      ) : null;
                    })()}
                  </div>
                  <div className="mb-2">
                    <p className="text-lg font-semibold text-gray-800">
                      {allCrypto[index].name}
                    </p>
                    <p className="text-sm text-gray-600">{crypto.symbol}</p>
                  </div>
                </div>
                <p className="text-black-600 text-bold text-xl mt-2 pl-2">
                  ${crypto.price.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600 flex align-center" style={{
                  color: crypto.priceChangePercent24h.toString().startsWith("-") ? "red" : "green"
                }}> 
                  <span>
                    {crypto.priceChangePercent24h.toString().startsWith("-") ? <ArrowDownRight/> : <ArrowUpRight/>}
                  </span>
                  {crypto.priceChangePercent24h?.toFixed(2) ?? "--"}%
                </p>
              </div>
            ))}
          </div>
        </div>
        
      </div>
    </div>
  );
};
