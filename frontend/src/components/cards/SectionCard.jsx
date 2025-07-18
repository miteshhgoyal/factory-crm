import React from "react";

const SectionCard = ({
  title,
  icon: Icon,
  children,
  className = "",
  headerColor = "gray",
  loading = false,
  actions,
}) => {
  const getIconColorClasses = (color) => {
    const colorMap = {
      gray: "from-gray-100 to-gray-200 text-gray-600",
      blue: "from-blue-100 to-blue-200 text-blue-600",
      green: "from-green-100 to-green-200 text-green-600",
      red: "from-red-100 to-red-200 text-red-600",
      purple: "from-purple-100 to-purple-200 text-purple-600",
      orange: "from-orange-100 to-orange-200 text-orange-600",
      yellow: "from-yellow-100 to-yellow-200 text-yellow-600",
    };
    return colorMap[color] || colorMap.gray;
  };

  if (loading) {
    return (
      <div
        className={`bg-white rounded-2xl p-6 shadow-lg border border-gray-200 animate-pulse ${className}`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="w-32 h-6 bg-gray-200 rounded"></div>
          <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="w-24 h-4 bg-gray-200 rounded"></div>
              <div className="w-16 h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-2xl p-6 shadow-lg border border-gray-200 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <div className="flex items-center gap-2">
          {actions && <div className="flex items-center gap-2">{actions}</div>}
          {Icon && (
            <div
              className={`w-8 h-8 bg-gradient-to-br ${getIconColorClasses(
                headerColor
              )} rounded-lg flex items-center justify-center`}
            >
              <Icon className="w-5 h-5" />
            </div>
          )}
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
};

export default SectionCard;
