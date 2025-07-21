import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

// Import your components
import Login from "./pages/Login";
import User from "./pages/User";
import Admin from "./pages/Admin";
import { useAuth } from "./contexts/AuthContext";

const DefaultRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-br from-gray-900 to-black rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Route based on user role
  if (
    user.role === "superadmin" ||
    user.role === "admin" ||
    user.role === "subadmin"
  ) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Regular employees go to user dashboard
  return <Navigate to="/user/dashboard" replace />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* Public routes - redirect if authenticated */}
            <Route
              path="/login"
              element={
                <ProtectedRoute requireAuth={false}>
                  <Login />
                </ProtectedRoute>
              }
            />

            {/* Admin routes (superadmin, admin, subadmin) */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute
                  requiredRoles={["superadmin", "admin", "subadmin"]}
                >
                  <Admin />
                </ProtectedRoute>
              }
            />

            {/* User routes (regular employees or fallback) */}
            <Route
              path="/user/*"
              element={
                <ProtectedRoute>
                  <User />
                </ProtectedRoute>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<DefaultRoute />} />
            <Route path="*" element={<DefaultRoute />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
