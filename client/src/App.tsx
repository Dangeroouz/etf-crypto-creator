import {  Routes, Route} from "react-router-dom";
import Navbar from "./components/Navbar";
import { Home } from "./components/Home";
import { CreateIndex } from "./components/CreateIndex";
import { MyIndices } from "./components/MyIndices";
import { IndexDetail } from "./components/IndexDetail";
import { Settings } from "./components/Settings";
import { Test } from "./components/Test";
import { useEffect } from "react";
import { useCryptoStore } from "./store/cryptoStore";

function App() {
    const fetchCrypto = useCryptoStore((s) => s.fetchCrypto);

useEffect(() => {
  fetchCrypto();
}, [fetchCrypto]);
  return (
      <div className="min-h-screen flex flex-col bg-gray-100">
    <Navbar />

    {/* Основний контент розтягується */}
    <div className="flex-grow container mx-auto p-4">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateIndex />} />
        <Route path="/my-indices" element={<MyIndices />} />
        <Route path="/my-indices/:indexName" element={<IndexDetail />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </div>

    {/* Footer завжди внизу */}
    <footer className="bg-white w-full h-16 flex items-center justify-center">
      <p className="text-gray-500">Danylo Vakhniuk 2026©</p>
    </footer>
  </div>
  );
}

export default App;
