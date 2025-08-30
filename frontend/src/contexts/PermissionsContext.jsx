import React, { createContext, useContext, useState, useEffect } from "react";
import { userAPI } from "../services/api";
import { useAuth } from "./AuthContext";

const PermissionsContext = createContext();

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }
  return context;
};

export const PermissionsProvider = ({ children }) => {
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  const fetchPermissions = async () => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    try {
      const response = await userAPI.getUserPermissions();
      if (response?.data?.success) {
        setPermissions(response.data.data.permissions);
      }
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
      // Set default permissions based on role
      setDefaultPermissions();
    } finally {
      setLoading(false);
    }
  };

  const setDefaultPermissions = () => {
    if (user?.role === "superadmin") {
      setPermissions({
        dashboard: true,
        stock: {
          dashboard: true,
          stockIn: true,
          stockOut: true,
          reports: true,
        },
        cashFlow: {
          dashboard: true,
          cashIn: true,
          cashOut: true,
          reports: true,
        },
        expenses: { dashboard: true, add: true, reports: true },
        employees: { dashboard: true, add: true, list: true, ledger: true },
        attendance: {
          dashboard: true,
          sheet: true,
          mark: true,
          calendar: true,
        },
        clients: { dashboard: true, add: true, list: true, ledger: true },
        accounts: { cash: true, purchase: true, sales: true, production: true },
        reports: {
          dashboard: true,
          daily: true,
          weekly: true,
          monthly: true,
          yearly: true,
        },
        settings: { companiesAndUsers: true },
      });
    } else {
      // Set limited permissions for non-superadmin
      setPermissions({
        dashboard: true,
        stock: {
          dashboard: true,
          stockIn: true,
          stockOut: false,
          reports: false,
        },
        cashFlow: {
          dashboard: true,
          cashIn: true,
          cashOut: false,
          reports: false,
        },
        expenses: { dashboard: true, add: true, reports: false },
        employees: { dashboard: true, add: true, list: true, ledger: false },
        attendance: {
          dashboard: true,
          sheet: false,
          mark: true,
          calendar: true,
        },
        clients: { dashboard: true, add: true, list: true, ledger: false },
        accounts: {
          cash: false,
          purchase: false,
          sales: false,
          production: false,
        },
        reports: {
          dashboard: false,
          daily: false,
          weekly: false,
          monthly: false,
          yearly: false,
        },
        settings: { companiesAndUsers: false },
      });
    }
  };

  const hasPermission = (module, action = null) => {
    if (!permissions) return false;

    if (action) {
      return permissions[module]?.[action] === true;
    }
    return permissions[module] === true;
  };

  const refreshPermissions = () => {
    fetchPermissions();
  };

  useEffect(() => {
    fetchPermissions();
  }, [user, isAuthenticated]);

  return (
    <PermissionsContext.Provider
      value={{
        permissions,
        loading,
        hasPermission,
        refreshPermissions,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};
