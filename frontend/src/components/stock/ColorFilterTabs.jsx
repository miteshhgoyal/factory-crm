import React from "react";
import { CheckCircle } from "lucide-react";
import { STOCK_COLORS } from "../../constants";

const ColorFilterTabs = ({
  selectedColor,
  onColorChange,
  colorCounts = {},
  showAll = true,
}) => {
  const allOption = {
    value: "all",
    label: "All",
    bgClass: "bg-gradient-to-r from-gray-600 to-gray-700",
    count: 0,
  };

  const colorsWithCounts = STOCK_COLORS.map((color) => ({
    ...color,
    count: colorCounts[color.value] || 0,
  }));

  // Calculate total count for "All" option
  if (showAll) {
    allOption.count = Object.values(colorCounts).reduce(
      (sum, count) => sum + count,
      0
    );
  }

  const colorOptions = showAll
    ? [allOption, ...colorsWithCounts]
    : colorsWithCounts;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Filter by Color Category
      </h3>
      <div
        className={`grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-${
          showAll ? "9" : "8"
        } gap-2`}
      >
        {colorOptions.map((colorOption) => {
          const isSelected =
            selectedColor === colorOption.value ||
            (!selectedColor && colorOption.value === "all");

          return (
            <button
              key={colorOption.value}
              onClick={() =>
                onColorChange(
                  colorOption.value === "all" ? "" : colorOption.value
                )
              }
              className={`
                relative flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all duration-200
                ${
                  isSelected
                    ? "border-gray-900 shadow-md transform scale-105"
                    : "border-gray-200 hover:border-gray-400 hover:shadow-sm"
                }
              `}
            >
              <div
                className={`
                  w-6 h-6 rounded-full ${colorOption.bgClass} 
                  ${isSelected ? "ring-2 ring-offset-1 ring-gray-900" : ""}
                `}
              />
              <div className="text-center">
                <span
                  className={`text-xs font-medium block ${
                    isSelected ? "text-gray-900" : "text-gray-600"
                  }`}
                >
                  {colorOption.label}
                </span>
                <span className="text-xs text-gray-500">
                  ({colorOption.count})
                </span>
              </div>
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ColorFilterTabs;
