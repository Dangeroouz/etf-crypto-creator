import {  Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import { Home } from "./components/Home";
import { CreateIndex } from "./components/CreateIndex";
import { MyIndices } from "./components/MyIndices";
import { IndexDetail } from "./components/IndexDetail";
import { Settings } from "./components/Settings";
import { Login } from "./components/Login";
import { Register } from "./components/Register";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useEffect } from "react";
import { useCryptoStore } from "./store/cryptoStore";
import useAuthStore from "./store/authStore";
import RouteTitleUpdater from "./components/RouteTitleUpdater";

function App() {
    const fetchCrypto = useCryptoStore((s) => s.fetchCrypto);
    const { verifyToken, isAuthenticated } = useAuthStore();
    const location = useLocation();

    const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

useEffect(() => {
  fetchCrypto();
  verifyToken();
}, [fetchCrypto, verifyToken]);

  return (
      <div className="min-h-screen flex flex-col bg-gray-100">
    <RouteTitleUpdater />
    {!isAuthPage && <Navbar />}

    <div className={isAuthPage ? "flex-1 flex items-center justify-center" : "flex-grow container mx-auto p-4"}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Home />} />
        
        {/* Protected routes */}
        <Route 
          path="/create" 
          element={
            <ProtectedRoute>
              <CreateIndex />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/my-indices" 
          element={
            <ProtectedRoute>
              <MyIndices />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/my-indices/:indexName" 
          element={
            <ProtectedRoute>
              <IndexDetail />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } 
        />
        
        <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/"} replace />} />
      </Routes>
    </div>

    {!isAuthPage && (
      <footer className="bg-white w-full h-16 flex items-center justify-center">
        <p className="text-gray-500">Danylo Vakhniuk 2026©</p>
      </footer>
    )}
  </div>
  );
}

export default App;
