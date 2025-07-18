import React from "react";
import { AlertCircle } from "lucide-react";

const CustomCheckbox = ({
  checked,
  onChange,
  children,
  error,
  theme = "white",
}) => {
  const isWhiteTheme = theme === "white";

  return (
    <div className="space-y-1">
      <label className="flex items-center cursor-pointer group">
        <div className="relative">
          <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="sr-only"
          />
          <div
            className={`w-5 h-5 rounded-md border-2 transition-all duration-200 ${
              isWhiteTheme
                ? checked
                  ? "bg-gradient-to-br from-gray-900 to-black border-black shadow-md"
                  : "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300 group-hover:border-gray-400 shadow-sm"
                : checked
                ? "bg-gradient-to-br from-yellow-400 to-yellow-500 border-yellow-400"
                : "bg-white/10 border-white/30 group-hover:border-yellow-400"
            }`}
          ></div>
        </div>
        <span
          className={`ml-2.5 text-sm font-medium select-none transition-colors ${
            isWhiteTheme
              ? "text-gray-700 group-hover:text-gray-900"
              : "text-white"
          }`}
        >
          {children}
        </span>
      </label>
      {error && (
        <p
          className={`text-xs font-medium flex items-center gap-1 ml-7 ${
            isWhiteTheme ? "text-red-600" : "text-red-300"
          }`}
        >
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
};

export default CustomCheckbox;
