import React from "react";
import { RefreshCw } from "lucide-react";

const HeaderComponent = ({
  header,
  subheader,
  onRefresh,
  loading,
  removeRefresh = false,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-200">
      <div className="flex flex-col gap-4 sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-black bg-clip-text text-transparent pb-0.5">
            {header}
          </h1>
          <p className="text-gray-600 mt-1 font-medium">{subheader}</p>
        </div>
        {!removeRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center px-4 py-2.5 bg-gradient-to-r from-gray-900 to-black text-white rounded-xl hover:from-gray-800 hover:to-gray-900 transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        )}
      </div>
    </div>
  );
};

export default HeaderComponent;
