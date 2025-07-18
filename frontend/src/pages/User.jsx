import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Routes, Route } from "react-router-dom";
import {
  Home,
  User as NavUser,
  Calendar,
  DollarSign,
  FileText,
  HelpCircle,
  Clock,
} from "lucide-react";
import { CONFIG } from "../constants";

// Import user components
import Dashboard from "./user/Dashboard";
import Profile from "./user/Profile";
import MyAttendance from "./user/MyAttendance";
import MySalary from "./user/MySalary";
import MyExpenses from "./user/MyExpenses";
import Support from "./user/Support";

const navbarLinks = [
  { name: "My Profile", href: "/user/profile", icon: NavUser },
  { name: "Support", href: "/user/support", icon: HelpCircle },
];

const sidebarLinks = [
  {
    name: "Dashboard",
    href: "/user/dashboard",
    icon: Home,
  },
  {
    name: "My Attendance",
    href: "/user/attendance",
    icon: Calendar,
  },
  {
    name: "My Salary",
    href: "/user/salary",
    icon: DollarSign,
  },
  {
    name: "My Expenses",
    href: "/user/expenses",
    icon: FileText,
  },
  {
    name: "Time Tracking",
    href: "/user/time-tracking",
    icon: Clock,
  },
];

const User = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileNow = window.innerWidth < 768;
      setIsMobile(isMobileNow);

      if (isMobileNow) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 relative overflow-x-hidden">
      <Navbar
        toggleSidebar={toggleSidebar}
        navigationLinks={navbarLinks}
        config={CONFIG}
      />
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        navigationLinks={sidebarLinks}
        config={CONFIG}
      />

      {/* Mobile overlay when sidebar is open */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      <main
        className={`transition-all duration-300 ease-in-out ${
          isMobile
            ? "pt-16 px-4 sm:px-6"
            : `pt-20 md:pt-24 px-4 sm:px-6 lg:px-8 ${
                sidebarOpen ? "ml-64" : "ml-16"
              }`
        }`}
      >
        <div
          className={`py-6 md:py-8 max-w-full ${
            !isMobile && sidebarOpen ? "max-w-[calc(100vw-16rem)]" : ""
          }`}
        >
          <Routes>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="attendance" element={<MyAttendance />} />
            <Route path="salary" element={<MySalary />} />
            <Route path="expenses" element={<MyExpenses />} />
            <Route path="time-tracking" element={<MyAttendance />} />
            <Route path="support" element={<Support />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default User;
