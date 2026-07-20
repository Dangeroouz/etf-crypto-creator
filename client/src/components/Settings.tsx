import { LogOut } from "lucide-react";
import useAuthStore from "../store/authStore";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
export const Settings = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      logout();
      navigate("/");
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };
  return (
    <div>
      <div className="container max-w-6xl mx-auto">
        <div className="gap-6 mb-6 bg-white p-6 rounded-xl border border-black/10">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-gray-600">
            Manage your account settings and preferences.
          </p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-black/10">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Account</h2>
              <div className="hidden md:flex items-center space-x-4">
                {user && (
                  <>
                    <span className="text-gray-800 text-md">{user.email}</span>
                    <button
                      onClick={() => setShowLogoutModal(true)}
                      className="text-gray-500 hover:text-red-500 rounded-md hover:bg-gray-100 transition cursor-pointer"
                      title="Logout"
                    >
                      <LogOut className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>
            </div>
            
            

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-8 max-w-md mx-4 shadow-2xl">
                  <h2 className="text-2xl font-bold mb-4 text-gray-800">
                    Logout?
                  </h2>
                  <p className="text-gray-600 mb-6 text-base">
                    Are you sure you want to logout? You'll need to sign in
                    again to access your indices.
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setShowLogoutModal(false)}
                      disabled={isLoggingOut}
                      className="cursor-pointer flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="cursor-pointer flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition disabled:opacity-50"
                    >
                      {isLoggingOut ? "Logging out..." : "Logout"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
