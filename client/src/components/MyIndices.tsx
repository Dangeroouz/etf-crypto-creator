import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useIndexStore } from "../store/indexStore";
import useAuthStore from "../store/authStore";

export const MyIndices = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { indices, isLoading, fetchIndices } = useIndexStore();

  useEffect(() => {
    if (token) {
      fetchIndices(token);
    }
  }, [token, fetchIndices]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading your indices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto">
      <div className="bg-white p-6 rounded-xl border border-black/10 mb-6">
        <h1 className="text-3xl font-bold mb-2">My Indices</h1>
        <p className="text-gray-600">
          {indices.length} {indices.length === 1 ? "index" : "indices"} created
        </p>
      </div>

      {indices.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-black/10 text-center">
          <p className="text-gray-600 text-lg mb-4">No indices created yet</p>
          <button
            onClick={() => navigate("/create")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
          >
            Create Your First Index
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {indices.map((index) => (
            <div
              key={index.id}
              className="bg-white p-6 rounded-xl border border-black/10 hover:shadow-lg transition cursor-pointer"
              onClick={() => navigate(`/my-indices/${encodeURIComponent(index.id)}`)}
            >
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 mb-2">{index.name}</h2>
                <p className="text-gray-600 text-sm">
                  Created {new Date(index.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Assets:</span>
                  <span className="font-semibold">{index.selected.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Investment:</span>
                  <span className="font-semibold">${index.initialInvestment.toFixed(2)}</span>
                </div>
              </div>

              <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition">
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};