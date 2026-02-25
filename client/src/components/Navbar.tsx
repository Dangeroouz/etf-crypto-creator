import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();
  const navItems = [
    { path: "/", label: "Dashboard" },
    { path: "/create", label: "Create Index" },
    { path: "/my-indices", label: "My Indices" },
    { path: "/settings", label: "Settings" },
  ];

  const isActive = (path: string) => location.pathname === path;
  const [mobileMenuIsOpen, setMobileMenuIsOpen] = useState(false);
  return (
    <nav className="bg-white/95 border-b border-gray-200 sticky top-0 z-50 shadow-sm backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 md:b-20">
          <div className="flex items-center space-x-1 grpup cursor-pointer">
            <span className="text-lg sm:text-xl md:text-2xl font-medium">
              <Link to="/" className="text-gray-500 text-lg font-semibold">
                Crypto Index Builder
              </Link>
            </span>
          </div>
          <nav className="hidden md:flex items-center space-x-3 lg:space-x-4">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <button
                  className={`text-gray-500 hover:bg-gray-100 active:bg-gray-200 px-4 py-2 cursor-pointer rounded-sm text-sm lg:text-base transition ${
                    isActive(item.path) ? "bg-gray-100" : "bg-white"
                  }`}
                >
                  {item.label}
                </button>
              </Link>
            ))}
          </nav>

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
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <button
                  className={`text-gray-500 px-4 py-2 text-md hover:bg-gray-100 rounded-md`}
                >
                  {item.label}
                </button>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
