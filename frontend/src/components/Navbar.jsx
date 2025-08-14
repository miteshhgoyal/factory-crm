import React, { useState, useRef, useEffect } from "react";
import {
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Shield,
  Loader2,
  Bell,
  SidebarIcon,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { authAPI } from "../services/api";
import { Link, useLocation } from "react-router-dom";

const Navbar = ({ toggleSidebar, navigationLinks, systemName }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const profileDropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const location = useLocation();

  // Close modals when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileDropdownOpen(false);
  }, [location.pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setIsProfileDropdownOpen(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        !event.target.closest("[data-mobile-menu-button]")
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close modals on escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
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
        <div className="bg-white/98 backdrop-blur-2xl rounded-none md:rounded-3xl shadow-lg border border-gray-200/60 w-full mx-auto transition-all duration-300 hover:bg-white">
          {/* Enhanced gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-50/80 via-white/20 to-gray-50/60 rounded-none md:rounded-3xl"></div>

          {/* Subtle top border accent */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300/50 to-transparent md:rounded-t-3xl"></div>

          <div className="relative px-4 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Left Section - Mobile Text Button / Desktop Logo */}
              <div className="flex items-center space-x-4 transition-all duration-300">
                {/* Mobile Text-based Sidebar Toggle */}
                <button
                  onClick={toggleSidebar}
                  className="md:hidden bg-gradient-to-r from-gray-800 to-gray-900 text-white px-2.5 py-1.5 rounded-xl text-sm font-bold tracking-wider hover:from-gray-700 hover:to-gray-800 transition-all duration-300 ease-out hover:shadow-lg hover:scale-105 group active:scale-95 uppercase"
                  aria-label="Toggle sidebar"
                >
                  <span className="transition-all duration-300 group-hover:scale-110">
                    Menu
                  </span>
                </button>

                {/* Desktop Logo Section */}
                <div className="hidden md:flex flex-shrink-0 items-center">
                  <div className="w-11 h-11 bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-2xl flex items-center justify-center shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:rotate-3 group">
                    <Shield className="w-6 h-6 text-white transition-all duration-300 group-hover:scale-110" />
                  </div>

                  <div className="ml-4 flex items-center transition-all duration-300">
                    <div>
                      <h1 className="font-bold text-lg md:text-xl text-gray-900 tracking-tight">
                        {systemName || "System"}
                      </h1>
                      <p className="text-gray-500 text-xs font-medium tracking-wide transition-colors duration-300">
                        Professional Platform
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Center Section - Mobile Company Name */}
              <div className="md:hidden flex-1 flex justify-center items-center px-4">
                <div className="text-center">
                  <h1 className="font-bold text-lg text-gray-900 tracking-tight truncate max-w-[200px]">
                    {systemName || "System"}
                  </h1>
                  <p className="text-gray-500 text-xs font-medium tracking-wide transition-colors duration-300">
                    Professional Platform
                  </p>
                </div>
              </div>

              {/* Right Section */}
              <div className="flex items-center space-x-2">
                {/* Enhanced Notification Bell */}
                {user.role !== "subadmin" && (
                  <Link
                    to="/admin/notifications"
                    className="text-gray-600 hover:text-gray-900 p-2 rounded-xl hover:bg-gray-100/70 transition-all duration-300 ease-out hover:shadow-md hover:scale-105 group active:scale-95 relative"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5 transition-all duration-300 group-hover:scale-110" />
                    {/* Notification indicator dot */}
                    <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-red-500 contrast-200 rounded-full"></div>
                  </Link>
                )}

                {/* Enhanced Profile Dropdown - Desktop */}
                <div
                  className="hidden md:block relative"
                  ref={profileDropdownRef}
                >
                  <button
                    onClick={() =>
                      setIsProfileDropdownOpen(!isProfileDropdownOpen)
                    }
                    className="flex items-center space-x-3 text-gray-600 hover:text-gray-900 px-4 py-2.5 rounded-2xl hover:bg-gray-100/70 transition-all duration-300 ease-out hover:shadow-md hover:scale-105 group active:scale-95"
                    aria-label="User menu"
                  >
                    <div className="w-9 h-9 bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:scale-105">
                      <User className="w-5 h-5 text-white transition-transform duration-300 group-hover:scale-110" />
                    </div>

                    <span className="text-sm font-semibold hidden lg:block max-w-32 truncate transition-all duration-300">
                      {user.name || user.username || "User"}
                    </span>

                    <ChevronDown
                      className={`w-4 h-4 transition-all duration-300 ${
                        isProfileDropdownOpen
                          ? "rotate-180 text-gray-900"
                          : "group-hover:text-gray-900"
                      }`}
                    />
                  </button>

                  {/* Enhanced Profile Dropdown Menu */}
                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-72 bg-white/98 backdrop-blur-2xl rounded-3xl shadow-2xl border border-gray-200/60 py-3 z-50 transition-all duration-300 ease-out animate-in slide-in-from-top-2 fade-in-0">
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/80 via-white/40 to-gray-100/60 rounded-3xl"></div>

                      {/* Top accent line */}
                      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300/50 to-transparent rounded-t-3xl"></div>

                      <div className="relative">
                        {/* Enhanced User Info */}
                        <div className="px-6 py-5 border-b border-gray-200/60">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 rounded-2xl flex items-center justify-center shadow-xl">
                              <User className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-gray-900 tracking-tight">
                                {user.name || user.username}
                              </p>
                              <p className="text-xs text-gray-500 truncate font-medium mt-1">
                                {user.email}
                              </p>
                              {user.role && (
                                <span className="inline-block px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg mt-2 capitalize">
                                  {user.role}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Enhanced Menu Items */}
                        <div className="py-3">
                          {navigationLinks.map((item, index) => {
                            const Icon = item.icon;
                            return (
                              <Link
                                key={item.name}
                                to={item.href}
                                className="flex items-center px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100/70 hover:text-gray-900 transition-all duration-200 ease-out group mx-2 rounded-2xl hover:shadow-sm"
                                onClick={() => setIsProfileDropdownOpen(false)}
                              >
                                <Icon className="w-5 h-5 mr-4 transition-all duration-200 group-hover:text-gray-900 group-hover:scale-110" />
                                <span className="transition-all duration-200 flex-1">
                                  {item.name}
                                </span>
                              </Link>
                            );
                          })}
                        </div>

                        {/* Enhanced Logout */}
                        <div className="border-t border-gray-200/60 pt-3">
                          <button
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="flex items-center w-full px-6 py-3 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-800 transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed group mx-2 rounded-2xl hover:shadow-sm"
                          >
                            {isLoggingOut ? (
                              <Loader2 className="w-5 h-5 mr-4 animate-spin" />
                            ) : (
                              <LogOut className="w-5 h-5 mr-4 transition-all duration-200 group-hover:scale-110" />
                            )}
                            <span className="transition-all duration-200 flex-1 text-left">
                              {isLoggingOut ? "Signing out..." : "Sign out"}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Enhanced Mobile menu button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  data-mobile-menu-button
                  className="md:hidden text-gray-600 hover:text-gray-900 p-2 rounded-xl hover:bg-gray-100/70 transition-all duration-300 ease-out hover:shadow-md hover:scale-105 group active:scale-95"
                  aria-label="Toggle menu"
                >
                  {isMobileMenuOpen ? (
                    <X className="w-5 h-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-90" />
                  ) : (
                    <Menu className="w-5 h-5 transition-all duration-300 group-hover:scale-110" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Enhanced Mobile Menu Modal */}
      {isMobileMenuOpen && (
        <>
          {/* Background Overlay */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden transition-all duration-300 ease-out"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Mobile Menu Modal */}
          <div className="fixed top-20 left-4 right-4 z-50 md:hidden">
            <div
              ref={mobileMenuRef}
              className="bg-white/98 backdrop-blur-2xl rounded-3xl shadow-2xl border border-gray-200/60 overflow-hidden max-h-[calc(100vh-6rem)] overflow-y-auto transition-all duration-300 ease-out animate-in slide-in-from-top-2 fade-in-0"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-50/80 via-white/40 to-gray-100/60 rounded-3xl"></div>

              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300/50 to-transparent rounded-t-3xl"></div>

              <div className="relative">
                {/* Enhanced User Info - Mobile */}
                <div className="px-6 py-5 border-b border-gray-200/60">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 rounded-2xl flex items-center justify-center shadow-xl">
                      <User className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 font-bold text-base tracking-tight">
                        {user.name || user.username}
                      </p>
                      <p className="text-gray-600 text-sm truncate font-medium mt-1">
                        {user.email}
                      </p>
                      {user.role && (
                        <span className="inline-block px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-xl mt-2 capitalize shadow-sm">
                          {user.role}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Enhanced Navigation Items - Mobile Modal Style */}
                <div className="py-4">
                  {navigationLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className="flex items-center px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100/70 hover:text-gray-900 transition-all duration-200 ease-out group mx-3 rounded-2xl hover:shadow-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Icon className="w-5 h-5 mr-4 transition-all duration-200 group-hover:text-gray-900 group-hover:scale-110" />
                        <span className="transition-all duration-200 flex-1">
                          {item.name}
                        </span>
                      </Link>
                    );
                  })}
                </div>

                {/* Enhanced Logout - Mobile Modal */}
                <div className="border-t border-gray-200/60 pt-3 pb-4">
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex items-center w-full px-6 py-3 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-800 transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed group mx-3 rounded-2xl hover:shadow-sm"
                  >
                    {isLoggingOut ? (
                      <Loader2 className="w-5 h-5 mr-4 animate-spin" />
                    ) : (
                      <LogOut className="w-5 h-5 mr-4 transition-all duration-200 group-hover:scale-110" />
                    )}
                    <span className="transition-all duration-200 flex-1 text-left">
                      {isLoggingOut ? "Signing out..." : "Sign out"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;
