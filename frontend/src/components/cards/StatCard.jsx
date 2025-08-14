import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

const StatCard = ({
  title,
  value,
  change,
  icon: Icon,
  color = "gray",
  trend,
  loading = false,
  onClick,
  className = "",
}) => {
  const getColorClasses = (color) => {
    const colorMap = {
      gray: "from-gray-100 to-gray-200 text-gray-700",
      blue: "from-blue-100 to-blue-200 text-blue-700",
      green: "from-green-100 to-green-200 text-green-700",
      red: "from-red-100 to-red-200 text-red-700",
      purple: "from-purple-100 to-purple-200 text-purple-700",
      orange: "from-orange-100 to-orange-200 text-orange-700",
      yellow: "from-yellow-100 to-yellow-200 text-yellow-700",
    };
    return colorMap[color] || colorMap.gray;
  };

  const formatValueWithAutoUnit = (value, decimalPlaces = 2) => {
    // Handle null, undefined, or empty values
    if (value === null || value === undefined || value === "") {
      return "0";
    }

    // Convert to string for processing
    const str = String(value).trim();

    // Updated regex to handle numbers with commas
    // Matches: optional minus, digits with optional commas, optional decimal part, then unit
    const match = str.match(/(-?[\d,]+\.?\d*)\s*(.*)$/);

    if (!match) {
      return "0";
    }

    const [, numberPart, unitPart] = match;

    // Remove commas from the number part before parsing
    const cleanNumberPart = numberPart.replace(/,/g, "");
    const num = parseFloat(cleanNumberPart);

    // Check if it's a valid number
    if (isNaN(num)) {
      return "0";
    }

    // Format number with specified decimal places
    const formatted = num.toFixed(decimalPlaces);

    // Return with unit (add space if unit exists)
    return unitPart ? `${formatted} ${unitPart.trim()}` : formatted;
  };

  if (loading) {
    return (
      <div
        className={`bg-white rounded-2xl p-6 shadow-lg border border-gray-200 animate-pulse ${className}`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
          <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
        </div>
        <div className="w-24 h-8 bg-gray-200 rounded mb-1"></div>
        <div className="w-32 h-4 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 ${
        onClick ? "cursor-pointer hover:scale-105" : ""
      } ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-12 h-12 bg-gradient-to-br ${getColorClasses(
            color
          )} rounded-xl flex items-center justify-center`}
        >
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              trend > 0
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {trend > 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">
        {formatValueWithAutoUnit(value)}
      </h3>
      <p className="text-gray-600 text-sm">{title}</p>
      {change && <p className="text-xs text-gray-500 mt-2">{change}</p>}
    </div>
  );
};

export default StatCard;
