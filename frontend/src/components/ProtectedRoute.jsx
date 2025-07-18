import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Loader2, Shield } from "lucide-react";

const ProtectedRoute = ({
  children,
  requireAuth = true,
  requiredRoles = [],
}) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  // Show loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black rounded-xl rotate-3 shadow-lg opacity-20"></div>
            <div className="relative w-full h-full bg-gradient-to-br from-gray-900 to-black rounded-xl flex items-center justify-center shadow-xl">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <Loader2 className="w-6 h-6 text-gray-700 animate-spin mx-auto mb-2" />
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authentication is NOT required but user IS authenticated
  if (!requireAuth && isAuthenticated) {
    // Redirect authenticated users away from auth pages to their appropriate dashboard
    if (
      user?.role === "superadmin" ||
      user?.role === "admin" ||
      user?.role === "subadmin"
    ) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/user/dashboard" replace />;
  }

  // If specific roles are required, check if user has the required role
  if (requireAuth && requiredRoles.length > 0) {
    if (!user?.role || !requiredRoles.includes(user.role)) {
      // User doesn't have the required role - redirect to appropriate dashboard
      return <Navigate to="/user/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
