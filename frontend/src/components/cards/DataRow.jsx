import React from "react";

const DataRow = ({
  label,
  value,
  valueColor = "text-gray-900",
  labelColor = "text-gray-600",
  className = "",
  bold = false,
}) => {
  return (
    <div className={`flex justify-between items-center ${className}`}>
      <span className={`text-sm ${labelColor} ${bold ? "font-medium" : ""}`}>
        {label}
      </span>
      <span className={`font-medium ${valueColor}`}>{value}</span>
    </div>
  );
};

export default DataRow;
