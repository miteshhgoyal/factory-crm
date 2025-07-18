import React from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

const FormInput = ({
  icon: Icon,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  error,
  showPassword,
  onTogglePassword,
  readOnly = false,
  label,
  theme = "white",
  ...props
}) => {
  const isWhiteTheme = theme === "white";

  return (
    <div className="space-y-1">
      {label && (
        <label
          className={`block text-sm font-medium ${
            isWhiteTheme ? "text-gray-700" : "text-white"
          }`}
        >
          {label}
        </label>
      )}
      <div className="relative group">
        <input
          type={
            showPassword !== undefined
              ? showPassword
                ? "text"
                : "password"
              : type
          }
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`w-full px-4 py-3 pl-11 ${
            type === "password" || showPassword !== undefined ? "pr-11" : ""
          } transition-all duration-200 rounded-xl text-sm focus:outline-none focus:ring-2 ${
            isWhiteTheme
              ? `bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 text-gray-900 placeholder-gray-500 
                 focus:ring-black/10 focus:border-black group-hover:border-gray-300 focus:from-white focus:to-gray-50
                 ${readOnly ? "cursor-not-allowed opacity-75" : ""}
                 ${error ? "border-red-300 from-red-50 to-red-100" : ""}`
              : `bg-white/10 border border-white/20 text-white placeholder-white/60 
                 focus:ring-yellow-400/20 focus:border-yellow-400 hover:border-white/30
                 ${readOnly ? "cursor-not-allowed opacity-75" : ""}`
          }`}
          {...props}
        />
        <div className="absolute left-3.5 top-1/2 transform -translate-y-1/2">
          <Icon
            className={`w-4 h-4 transition-colors ${
              isWhiteTheme
                ? "text-gray-500 group-hover:text-gray-700"
                : "text-yellow-400"
            }`}
          />
        </div>
        {onTogglePassword && (
          <button
            type="button"
            onClick={onTogglePassword}
            className={`absolute right-3.5 top-1/2 transform -translate-y-1/2 transition-colors ${
              isWhiteTheme
                ? "text-gray-500 hover:text-gray-700"
                : "text-yellow-400 hover:text-yellow-300"
            }`}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p
          className={`text-xs font-medium flex items-center gap-1 mt-1 ${
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

export default FormInput;
