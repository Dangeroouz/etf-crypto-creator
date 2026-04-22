import { Menu, X, LogOut} from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuthStore();
  
  const navItems = [
    { path: "/", label: "Home" },
    { path: "/create", label: "Create Index" },
    { path: "/my-indices", label: "My Indices" },
    { path: "/settings", label: "Settings" },
  ];

  const isActive = (path: string) => location.pathname === path;
  const [mobileMenuIsOpen, setMobileMenuIsOpen] = useState(false);

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
    <nav className="bg-white/90 border-b border-gray-200 sticky top-0 z-50 shadow-xs backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 md:b-20">
          <div className="flex items-center space-x-1 grpup cursor-pointer">
            <span className="text-lg sm:text-xl md:text-2xl font-medium">
              <Link to="/" className="text-gray-500 text-lg font-semibold">
                Crypto Index Builder
              </Link>
            </span>
          </div>

          {isAuthenticated ? (
            <>
              <nav className="hidden md:flex items-center space-x-3 lg:space-x-4">
                {navItems.map((item) => (
                  <Link key={item.path} to={item.path}>
                    <button
                      className={`text-gray-500 hover:shadow-sm border border-black/0   active:bg-gray-100 px-4 py-2 cursor-pointer rounded-md text-sm lg:text-base transition ${
                        isActive(item.path) ? "border-black/20" : "bg-white"
                      }`}
                    >
                      {item.label}
                    </button>
                  </Link>
                ))}
              </nav>

              
            </>
          ) : (
            <div className="hidden md:flex items-center space-x-3">
              <Link to="/login">
                <button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition">
                  Login
                </button>
              </Link>
              <Link to="/register">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
                  Register
                </button>
              </Link>
            </div>
          )}

          <button
            onClick={() => setMobileMenuIsOpen((prev) => !prev)}
            className="md:hidden p-2 text-gray-300 hover:text-white"
          >
            {mobileMenuIsOpen ? (
              <X className="w-5 h-5 sm:w-6 sm:h-6 cursor-pointer" />
            ) : (
              <Menu className="w-5 h-5 sm:w-6 sm:h-6 cursor-pointer" />
            )}
          </button>
        </div>
      </div>

      {mobileMenuIsOpen && (
        <div className="fixed md:hidden w-screen bg-white backdrop-blur-lg border-t border-slate-500 animate-in slide-in-from-top duration-300 ease-out">
          <div className="flex flex-col items-center space-y-3 py-4 px-4 sm:py-6 sm:space-y-4">
            {isAuthenticated ? (
              <>
                {navItems.map((item) => (
                  <Link key={item.path} to={item.path}>
                    <button
                      className={`text-gray-500 px-4 py-2 text-md hover:bg-gray-100 rounded-md`}
                    >
                      {item.label}
                    </button>
                  </Link>
                ))}
                {user && (
                  <>
                    <div className="border-t border-gray-200 w-full my-2"></div>
                    <span className="text-gray-600 text-sm">{user.email}</span>
                    <button
                      onClick={() => setShowLogoutModal(true)}
                      className="text-gray-500 hover:text-red-500 px-4 py-2 rounded-md hover:bg-gray-100 transition flex items-center space-x-2"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Logout</span>
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                <Link to="/login" className="w-full">
                  <button className="w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition">
                    Login
                  </button>
                </Link>
                <Link to="/register" className="w-full">
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
                    Register
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md mx-4 shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Logout?</h2>
            <p className="text-gray-600 mb-6 text-base">
              Are you sure you want to logout? You'll need to sign in again to access your indices.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition disabled:opacity-50"
              >
                {isLoggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
