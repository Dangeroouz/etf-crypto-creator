import { useEffect, useState } from "react";
import axios from "axios";
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
  price1: number;
  price2: number;
  [key: string]: number | string;
}

function PerformanceChart({
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
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';
  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  useEffect(() => {
    setLoading(true);

    Promise.all([
      axios.get<ApiHistoryItem[]>(
        `${API_URL}/api/history/${symbol1}?days=${days}`,
      ),

      axios.get<ApiHistoryItem[]>(
        `${API_URL}/api/history/${symbol2}?days=${days}`,
      ),
    ])
      .then(([res1, res2]) => {
        const basePrice1 = res1.data[0].close;
        const basePrice2 = res2.data[0].close;

        const performanceData: PerformancePoint[] = res1.data.map(
          (item, index) => {
            const price1 = item.close;
            const price2 = res2.data[index]?.close || 0;

            const performance1 = ((price1 - basePrice1) / basePrice1) * 100;
            const performance2 = ((price2 - basePrice2) / basePrice2) * 100;

            return {
              date: item.date,
              [symbol1]: parseFloat(performance1.toFixed(2)),
              [symbol2]: parseFloat(performance2.toFixed(2)),
              price1,
              price2,
            };
          },
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
    <div style={{ width: "100%", margin: "30px auto", padding: isMobile ? "10px" : "20px" }}>
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
          />
          <YAxis
            tick={{ fontSize: tickFontSize }}
            label={!isMobile ? {
              value: "Performance (%)",
              angle: -90,
              position: "insideLeft",
            } : undefined}
            tickFormatter={(value) => `${value}%`}
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
            wrapperStyle={{ paddingTop: "10px", fontSize: isMobile ? "11px" : "12px" }}
            formatter={(value) => `${value} ${!isMobile ? "Performance" : "Perf"}`}
          />

          <ReferenceLine
            y={0}
            stroke="#999"
            strokeDasharray="5 5"
            label={!isMobile ? { value: "Baseline (0%)", position: "right", fill: "#999" } : undefined}
          />

          <Line
            type="monotone"
            dataKey={symbol1}
            stroke="#3b41d3"
            dot={false}
            name={symbol1}
            strokeWidth={strokeWidth}
            isAnimationActive={true}
          />

          <Line
            type="monotone"
            dataKey={symbol2}
            stroke="#35c55b"
            dot={false}
            name={symbol2}
            strokeWidth={strokeWidth}
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default PerformanceChart;
