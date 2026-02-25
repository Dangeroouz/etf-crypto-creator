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

type Stat = { totalPerformance: number; bestDay: number; worstDay: number };
type Stats = Record<string, Stat>;

function PerformanceChart({ symbol1, symbol2, days = 90 }: { symbol1: string; symbol2: string; days?: number }) {
  const [data, setData] = useState<PerformancePoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    setLoading(true);

    Promise.all([
      axios.get<ApiHistoryItem[]>(`http://localhost:3333/api/history/${symbol1}?days=${days}`),
      axios.get<ApiHistoryItem[]>(`http://localhost:3333/api/history/${symbol2}?days=${days}`),
    ])
      .then(([res1, res2]) => {
        // Отримуємо першу ціну (базову)
        const basePrice1 = res1.data[0].close;
        const basePrice2 = res2.data[0].close;

        // Обчислюємо перформанс (% від базової ціни)
        const performanceData: PerformancePoint[] = res1.data.map((item, index) => {
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
        });

        setData(performanceData);

        // Обчислюємо статистику
        const lastData = performanceData[performanceData.length - 1];
        setStats({
          [symbol1]: {
            totalPerformance: Number(lastData[symbol1]),
            bestDay: Math.max(...performanceData.map((d: PerformancePoint) => Number(d[symbol1]))),
            worstDay: Math.min(...performanceData.map((d: PerformancePoint) => Number(d[symbol1]))),
          },
          [symbol2]: {
            totalPerformance: Number(lastData[symbol2]),
            bestDay: Math.max(...performanceData.map((d: PerformancePoint) => Number(d[symbol2]))),
            worstDay: Math.min(...performanceData.map((d: PerformancePoint) => Number(d[symbol2]))),
          },
        });

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

  const formatPercentage = (value: number) => {
    return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  return (
    <div style={{ width: "100%", margin: "30px auto", padding: "20px" }}>
      

      <ResponsiveContainer width="100%" height={450}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            interval={Math.floor(data.length / 10) || 0}
          />
          <YAxis
            label={{ value: "Performance (%)", angle: -90, position: "insideLeft" }}
            
          />
          <Tooltip
            formatter={(value) => {
              const v = typeof value === "number" ? value : Number(value as any);
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
              padding: "10px",
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: "20px" }}
            formatter={(value) => `${value} Performance`}
          />
          
          {/* Нульова лінія - базовий рівень (0%) */}
          <ReferenceLine
            y={0}
            stroke="#999"
            strokeDasharray="5 5"
            label={{ value: "Baseline (0%)", position: "right", fill: "#999" }}
          />

          {/* Лінія для першого активу */}
          <Line
            type="monotone"
            dataKey={symbol1}
            stroke="#3b41d3"
            dot={false}
            name={symbol1}
            strokeWidth={2.5}
            isAnimationActive={true}
          />

          {/* Лінія для другого активу */}
          <Line
            type="monotone"
            dataKey={symbol2}
            stroke="#35c55b"
            dot={false}
            name={symbol2}
            strokeWidth={2.5}
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>

      
    </div>
  );
}

export default PerformanceChart;
