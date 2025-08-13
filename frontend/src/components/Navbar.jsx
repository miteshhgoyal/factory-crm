import React, { useState, useRef, useEffect } from "react";
import {
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Shield,
  Loader2,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { authAPI } from "../services/api";
import { Link } from "react-router-dom";

const Navbar = ({ toggleSidebar, navigationLinks, systemName }) => {
  const { user, logout, isAuthenticated } = useAuth();
  console.log(user);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const profileDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await authAPI.logout();
      logout();
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
      logout();
      window.location.href = "/login";
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out md:top-4 md:left-4 md:right-4">
        <div className="bg-white/95 backdrop-blur-xl rounded-none md:rounded-2xl shadow-xl border border-gray-200/50 w-full mx-auto transition-all duration-300 hover:shadow-2xl">
          {/* Inner Shadow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-50/50 via-transparent to-gray-50/30 rounded-2xl"></div>

          <div className="relative px-4 lg:px-6">
            <div className="flex items-center justify-between h-16">
              {/* Logo Section */}
              <div className="flex items-center space-x-4 transition-all duration-300">
                {/* Mobile Sidebar Toggle */}
                <button
                  onClick={toggleSidebar}
                  className="md:hidden text-gray-700 hover:text-black p-2.5 rounded-xl hover:bg-gray-100 transition-all duration-300 ease-out hover:shadow-lg hover:scale-105 group"
                >
                  <Menu className="w-5 h-5 transition-all duration-300 group-hover:scale-110" />
                </button>
                <div className="flex-shrink-0 flex items-center">
                  {/* Logo */}
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-black rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
                    <Shield className="w-6 h-6 text-white transition-transform duration-300" />
                  </div>
                  <div className="ml-3 hidden sm:block transition-all duration-300">
                    <h1 className="font-bold text-base md:text-lg text-gray-900">
                      {systemName || "System"}
                    </h1>
                    <p className="text-gray-600 text-xs transition-colors duration-300">
                      Professional Platform
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Section */}
              <div className="flex items-center space-x-3">
                {/* Profile Dropdown - Desktop */}
                <div
                  className="hidden md:block relative"
                  ref={profileDropdownRef}
                >
                  <button
                    onClick={() =>
                      setIsProfileDropdownOpen(!isProfileDropdownOpen)
                    }
                    className="flex items-center space-x-3 text-gray-700 hover:text-black px-3 py-2 rounded-xl hover:bg-gray-100 transition-all duration-300 ease-out hover:shadow-lg hover:scale-105 group"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-900 to-black rounded-full flex items-center justify-center shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:scale-105">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt="Profile"
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 text-white transition-transform duration-300 group-hover:scale-110" />
                      )}
                    </div>
                    <span className="text-sm font-medium hidden lg:block max-w-32 truncate transition-all duration-300">
                      {user.name || user.username || "User"}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-all duration-300 ${
                        isProfileDropdownOpen
                          ? "rotate-180 text-black"
                          : "group-hover:text-black"
                      }`}
                    />
                  </button>

                  {/* Profile Dropdown Menu */}
                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-64 max-w-[calc(100vw-2rem)] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 py-2 z-50 transition-all duration-300 ease-out animate-in slide-in-from-top-2">
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 via-transparent to-gray-100/30 rounded-2xl"></div>

                      <div className="relative">
                        {/* User Info */}
                        <div className="px-5 py-4 border-b border-gray-200/50">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-black rounded-full flex items-center justify-center shadow-lg">
                              {user.avatar ? (
                                <img
                                  src={user.avatar}
                                  alt="Profile"
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <User className="w-5 h-5 text-white" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {user.name || user.username}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                          {navigationLinks.map((item) => {
                            const Icon = item.icon;
                            return (
                              <Link
                                key={item.name}
                                to={item.href}
                                className="flex items-center px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-black transition-all duration-200 ease-out group"
                              >
                                <Icon className="w-4 h-4 mr-3 transition-all duration-200 group-hover:text-black group-hover:scale-110" />
                                <span className="transition-all duration-200">
                                  {item.name}
                                </span>
                              </Link>
                            );
                          })}
                        </div>

                        {/* Logout */}
                        <div className="border-t border-gray-200/50 pt-2">
                          <button
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="flex items-center w-full px-5 py-2.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-800 transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed group"
                          >
                            {isLoggingOut ? (
                              <Loader2 className="w-4 h-4 mr-3 animate-spin" />
                            ) : (
                              <LogOut className="w-4 h-4 mr-3 transition-all duration-200 group-hover:scale-110" />
                            )}
                            <span className="transition-all duration-200">
                              {isLoggingOut ? "Signing out..." : "Sign out"}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile menu button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden text-gray-700 hover:text-black p-2.5 rounded-xl hover:bg-gray-100 transition-all duration-300 ease-out hover:shadow-lg hover:scale-105 group"
                >
                  {isMobileMenuOpen ? (
                    <X className="w-6 h-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-90" />
                  ) : (
                    <Menu className="w-6 h-6 transition-all duration-300 group-hover:scale-110" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed top-16 md:top-20 left-0 right-0 md:left-4 md:right-4 z-40 md:hidden transition-all duration-300 ease-out">
          <div className="bg-white/95 backdrop-blur-xl rounded-none md:rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 via-transparent to-gray-100/30 rounded-2xl"></div>

            <div className="relative">
              <div className="px-4 pt-4 pb-3 space-y-2">
                {/* User Info - Mobile */}
                <div className="px-4 py-4 border-b border-gray-200 mb-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-900 to-black rounded-full flex items-center justify-center shadow-lg">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt="Profile"
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-black font-semibold text-sm">
                        {user.name || user.username}
                      </p>
                      <p className="text-gray-600 text-xs truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Profile Menu Items - Mobile */}
                <div className="border-t border-gray-200 pt-3 mt-3">
                  {navigationLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className="text-gray-700 hover:bg-gray-100 hover:text-black px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 ease-out flex items-center space-x-4 group hover:shadow-lg"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Icon className="w-5 h-5 transition-all duration-300 group-hover:text-black group-hover:scale-110" />
                        <span className="transition-all duration-300">
                          {item.name}
                        </span>
                      </Link>
                    );
                  })}

                  {/* Logout - Mobile */}
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="text-red-600 hover:bg-red-50 hover:text-red-800 w-full text-left px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 ease-out flex items-center space-x-4 disabled:opacity-50 disabled:cursor-not-allowed group hover:shadow-lg"
                  >
                    {isLoggingOut ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <LogOut className="w-5 h-5 transition-all duration-300 group-hover:scale-110" />
                    )}
                    <span className="transition-all duration-300">
                      {isLoggingOut ? "Signing out..." : "Sign out"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
