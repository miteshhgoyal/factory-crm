import React from "react";
import { TrendingUp, TrendingDown, User, CreditCard } from "lucide-react";
import { formatDate } from "../../utils/dateUtils";

const CashFlowActivityCard = ({ activity }) => {
  const isIncoming = activity.type === "IN";

  return (
    <div className="@container bg-white border border-gray-200 rounded-lg p-3 hover:shadow-lg transition-all duration-300 hover:border-gray-300">
      {/* Flexible Header */}
      <div className="flex flex-col @[320px]:flex-row @[320px]:items-start @[320px]:justify-between gap-2 @[320px]:gap-3 mb-3">
        <div className="flex items-center gap-2 @[320px]:gap-3 min-w-0 flex-1">
          <div
            className={`w-8 h-8 @[280px]:w-10 @[280px]:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              isIncoming
                ? "bg-emerald-50 text-emerald-600 border-2 border-emerald-200"
                : "bg-orange-50 text-orange-600 border-2 border-orange-200"
            }`}
          >
            {isIncoming ? (
              <TrendingUp className="w-4 h-4 @[280px]:w-5 @[280px]:h-5" />
            ) : (
              <TrendingDown className="w-4 h-4 @[280px]:w-5 @[280px]:h-5" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 text-sm @[280px]:text-base truncate">
              {activity.category}
            </h3>
            <span
              className={`inline-block px-2 @[280px]:px-3 py-1 text-xs @[280px]:text-sm font-medium rounded-full mt-1 ${
                isIncoming
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-orange-100 text-orange-800"
              }`}
            >
              {isIncoming ? "Income" : "Expense"}
            </span>
          </div>
        </div>

        <div className="text-left @[320px]:text-right flex-shrink-0">
          <div
            className={`font-bold text-base @[280px]:text-lg @[400px]:text-xl ${
              isIncoming ? "text-emerald-600" : "text-orange-600"
            }`}
          >
            {isIncoming ? "+" : "-"}₹{activity.amount?.toLocaleString()}
          </div>
          <div className="text-xs @[280px]:text-sm text-gray-500">
            {formatDate(activity.date)}
          </div>
        </div>
      </div>

      {/* Payment Info - Responsive */}
      <div className="mb-3 p-2 @[280px]:p-3 bg-gray-50 rounded-lg">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <CreditCard className="w-3 h-3 @[280px]:w-4 @[280px]:h-4 text-gray-400 flex-shrink-0" />
            <span className="text-xs @[280px]:text-sm font-medium text-gray-700 truncate">
              {activity.paymentMode}
            </span>
          </div>
          {activity.isOnline && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full flex-shrink-0">
              Online
            </span>
          )}
        </div>
      </div>

      {/* Employee Info */}
      <div className="flex items-center gap-2 mb-3 text-xs @[280px]:text-sm text-gray-600">
        <User className="w-3 h-3 @[280px]:w-4 @[280px]:h-4 text-gray-400 flex-shrink-0" />
        <span className="truncate">{activity.employeeName}</span>
      </div>

      {/* Description */}
      {activity.description && (
        <div className="mb-3 p-2 @[280px]:p-3 bg-blue-50 border-l-4 border-blue-200 rounded-r">
          <p className="text-xs @[280px]:text-sm text-blue-800 break-words line-clamp-2">
            {activity.description}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="pt-2 @[280px]:pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          <span>by {activity.createdBy?.username}</span>
        </div>
      </div>
    </div>
  );
};

export default CashFlowActivityCard;
