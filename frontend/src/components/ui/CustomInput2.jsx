import React from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

const CustomInput2 = ({
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
  required = false,
  className = "",
  ...props
}) => {
  const baseInputClasses = `
    w-full px-4 py-3 pl-12 pr-4 text-gray-900 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 
    rounded-xl shadow-sm transition-all duration-200 placeholder-gray-400
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    hover:border-gray-300 font-medium
    ${readOnly ? "bg-gray-200 cursor-not-allowed opacity-75" : ""}
    ${
      error
        ? "border-red-300 bg-red-200 focus:ring-red-500 focus:border-red-500"
        : ""
    }
    ${className}
  `;

  const passwordToggleClasses = `
    absolute right-3 top-1/2 transform -translate-y-1/2 
    text-gray-400 hover:text-gray-600 cursor-pointer transition-colors
  `;

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
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
          required={required}
          className={baseInputClasses}
          style={
            type === "password" || showPassword !== undefined
              ? { paddingRight: "3rem" }
              : {}
          }
          {...props}
        />

        {Icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <Icon className="w-5 h-5 text-gray-400" />
          </div>
        )}

        {onTogglePassword && (
          <button
            type="button"
            onClick={onTogglePassword}
            className={passwordToggleClasses}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1 font-medium">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
};

export default CustomInput2;
