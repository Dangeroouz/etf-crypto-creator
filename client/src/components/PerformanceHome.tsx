import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

type ApiHistoryItem = { date: string; close: number };
interface PerformancePoint {
  date: string;
  [key: string]: number | string;
}

function PerformanceChartHome({
  symbol1,
  symbol2,
  days = 90,
}: {
  symbol1: string;
  symbol2: string;
  days?: number;
}) {
  const [data, setData] = useState<PerformancePoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setLoading(true);

    Promise.all([
      axios.get<ApiHistoryItem[]>(
        `${API_URL}/api/history/${symbol1}?days=${days}`
      ),
      axios.get<ApiHistoryItem[]>(`${API_URL}/api/history/BTC?days=${days}`),
      axios.get<ApiHistoryItem[]>(`${API_URL}/api/history/ETH?days=${days}`),
      axios.get<ApiHistoryItem[]>(`${API_URL}/api/history/SOL?days=${days}`),
    ])
      .then(([res1, btcData, ethData, solData]) => {
        const basePrice1 = res1.data[0].close;
        const baseBTC = btcData.data[0].close;
        const baseETH = ethData.data[0].close;
        const baseSOL = solData.data[0].close;

        const performanceData: PerformancePoint[] = res1.data.map(
          (item, index) => {
            const price1 = item.close;
            const priceBTC = btcData.data[index]?.close || 0;
            const priceETH = ethData.data[index]?.close || 0;
            const priceSOL = solData.data[index]?.close || 0;

            const performance1 = ((price1 - basePrice1) / basePrice1) * 100;
            const performanceMix =
              (((priceBTC - baseBTC) / baseBTC) * 100 +
                ((priceETH - baseETH) / baseETH) * 100 +
                ((priceSOL - baseSOL) / baseSOL) * 100) /
              3;

            return {
              date: item.date,
              [symbol1]: parseFloat(performance1.toFixed(2)),
              MIX: parseFloat(performanceMix.toFixed(2)),
              price1,
              priceBTC,
              priceETH,
              priceSOL,
            };
          }
        );

        setData(performanceData);

        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to fetch data");
      })
      .finally(() => setLoading(false));
  }, [symbol1, symbol2, days]);

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>Loading...</div>
    );
  if (error)
    return (
      <div style={{ color: "red", textAlign: "center", padding: "20px" }}>
        {error}
      </div>
    );
  if (data.length === 0)
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        No data available
      </div>
    );

  const isMobile = windowWidth < 640;
  const chartHeight = isMobile ? 250 : 450;
  const leftMargin = isMobile ? -20 : 0;
  const tickFontSize = isMobile ? 8 : 12;
  const minTickGap = isMobile ? 30 : 0;
  const strokeWidth = isMobile ? 1.5 : 2.5;

  return (
    <div className="" style={{ padding: isMobile ? "10px" : "0" }}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 10, left: leftMargin, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: tickFontSize }}
            interval={Math.floor(data.length / (isMobile ? 5 : 10)) || 0}
            minTickGap={minTickGap}
            tickFormatter={(value) => {
              const date = new Date(value);
              const day = String(date.getDate()).padStart(2, "0");
              const month = String(date.getMonth() + 1).padStart(2, "0");
              return `${day}/${month}`;
            }}
          />
          <YAxis
            label={
              !isMobile
                ? {
                    value: "% Performance",
                    angle: -90,
                    position: "insideLeft",
                  }
                : undefined
            }
            tick={{ fontSize: tickFontSize }}
            tickFormatter={(value, index) => (index === 0 ? "" : value)}
          />
          <Tooltip
            formatter={(value) => {
              const v =
                typeof value === "number" ? value : Number(value as any);
              const color = v > 0 ? "#82ca9d" : v < 0 ? "#ff7c7c" : "#000";
              return (
                <span style={{ color }}>
                  {v > 0 ? "+" : ""}
                  {Number(v).toFixed(2)}%
                </span>
              );
            }}
            labelFormatter={(label) => `Date: ${label}`}
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #ccc",
              borderRadius: "4px",
              padding: "8px",
              fontSize: isMobile ? "11px" : "12px",
            }}
          />
          <Legend
            wrapperStyle={{
              paddingTop: isMobile ? "10px" : "20px",
              fontSize: isMobile ? "11px" : "12px",
            }}
            formatter={(value) => (isMobile ? value : `${value} Performance`)}
          />

          <ReferenceLine
            y={0}
            stroke="#999"
            strokeDasharray="5 5"
            label={
              !isMobile ? { value: "", position: "right", fill: "#999" } : undefined
            }
          />

          <Line
            type="linear"
            dataKey={symbol1}
            stroke="#3b41d3"
            dot={false}
            name={symbol1}
            strokeWidth={strokeWidth}
            isAnimationActive={true}
          />

          <Line
            type="linear"
            dataKey="MIX"
            stroke="#35c55b"
            dot={false}
            name="BTC + ETH + SOL"
            strokeWidth={strokeWidth}
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default PerformanceChartHome;
