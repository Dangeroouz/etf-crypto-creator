import PerformanceChart from "./PerformanceChart"
import HistoryChart from "./HistoryChart"
export const Test = () => {
  return (
    <>
    <header style={{ textAlign: "center", padding: "20px", backgroundColor: "#f0f0f0", borderBottom: "2px solid #333" }}>
        <h1>📈 Crypto Historical Data Dashboard</h1>
        <p>Real-time cryptocurrency price charts powered by Binance API</p>
      </header>
      
      <section style={{ padding: "20px", backgroundColor: "#fff", marginBottom: "20px" }}>
        <HistoryChart symbol="BTC" symbol2="ETH" days={1200} />
      </section>

      {/* Графік з перформансом */}
      <section style={{ padding: "20px", backgroundColor: "#fafafa" }}>
        <PerformanceChart symbol1="BTC" symbol2="ETH" days={1200} />
      </section>
      </>
  );
}