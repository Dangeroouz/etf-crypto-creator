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
} from "recharts";

type ApiHistoryItem = { date: string; close: number };
interface HistoryPoint {
  date: string;
  [key: string]: number | string;
}

function HistoryChart({ symbol, symbol2, days = 1095 }: { symbol: string; symbol2: string; days?: number }) {
  const [data, setData] = useState<HistoryPoint[]>([]);
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
          axios.get<ApiHistoryItem[]>(`${API_URL}/api/history/${symbol}?days=${days}`),
          axios.get<ApiHistoryItem[]>(`${API_URL}/api/history/${symbol2}?days=${days}`)
    ])
      .then(([res1, res2]) => {
        const combinedData: HistoryPoint[] = res1.data.map((item, index) => ({
          date: item.date,
          [`${symbol}_close`]: item.close,
          [`${symbol2}_close`]: res2.data[index]?.close || 0,
        }));
        
        setData(combinedData);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to fetch data");
      })
      .finally(() => setLoading(false));
  }, [symbol, symbol2, days]);

  if (loading) return <div style={{ textAlign: "center", padding: "20px" }}>Loading...</div>;
  if (error) return <div style={{ color: "red", textAlign: "center", padding: "20px" }}>{error}</div>;
  if (data.length === 0) return <div style={{ textAlign: "center", padding: "20px" }}>No data available</div>;

  const isMobile = windowWidth < 640;
  const chartHeight = isMobile ? 250 : 400;
  const leftMargin = isMobile ? -20 : 0;
  const tickFontSize = isMobile ? 8 : 12;
  const minTickGap = isMobile ? 30 : 0;

  return (
    <div style={{ width: "90%", margin: "30px auto" }}>
      <h2 style={{ fontSize: isMobile ? "16px" : "20px" }}>{symbol} vs {symbol2} - Historical Price Chart</h2>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: leftMargin, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: tickFontSize }}
            interval={Math.floor(data.length / (isMobile ? 5 : 10)) || 0}
            minTickGap={minTickGap}
          />
          <YAxis tick={{ fontSize: tickFontSize }} />
          <Tooltip 
            formatter={(value) => {
              const v = typeof value === "number" ? value : Number(value as any);
              return `$${Number(v).toFixed(2)}`;
            }}
            labelFormatter={(label) => `Date: ${label}`}
            contentStyle={{ fontSize: isMobile ? "11px" : "12px" }}
          />
          <Legend wrapperStyle={{ fontSize: isMobile ? "11px" : "12px" }} />
          <Line
            type="monotone"
            dataKey={`${symbol}_close`}
            stroke="#8884d8"
            dot={false}
            name={`${symbol} Close Price`}
            strokeWidth={isMobile ? 1.5 : 2}
          />
          <Line
            type="monotone"
            dataKey={`${symbol2}_close`}
            stroke="#82ca9d"
            dot={false}
            name={`${symbol2} Close Price`}
            strokeWidth={isMobile ? 1.5 : 2}
          />
        </LineChart>
      </ResponsiveContainer>
      <p style={{ textAlign: "center", color: "#666", marginTop: "20px", fontSize: isMobile ? "12px" : "14px" }}>
        Data points: {data.length} | Period: {data[0]?.date} to {data[data.length - 1]?.date}
      </p>
    </div>
  );
}

export default HistoryChart;
