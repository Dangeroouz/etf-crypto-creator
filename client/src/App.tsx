import {  Routes, Route} from "react-router-dom";
import Navbar from "./components/Navbar";
import { Home } from "./components/Home";
import { CreateIndex } from "./components/CreateIndex";
import { MyIndices } from "./components/MyIndices";
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
      <div className="min-h-screen bg-gray-100 ">
        <Navbar />
        <div className="container mx-auto p-4">

        
        <Routes>
          {/* Тут ви можете додати інші маршрути */}
          <Route path="/" element={<Home/>} />
          <Route path="/create" element={<CreateIndex/>} />
          <Route path="/my-indices" element={<MyIndices/>} />
          <Route path="/settings" element={<Settings/>} />
        </Routes>
        </div>
      </div>
  );
}

export default App;
