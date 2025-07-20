import React from "react";
import { TrendingUp, TrendingDown, User, CreditCard } from "lucide-react";
import { formatDate } from "../../utils/dateUtils";

const CashFlowActivityCard = ({ activity }) => {
  const isIncoming = activity.type === "IN";

  return (
    <div className="@container bg-white border border-gray-100 rounded-2xl p-3 @[280px]:p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-gray-200">
      {/* Header */}
      <div className="flex flex-col @[320px]:flex-row @[320px]:items-start @[320px]:justify-between gap-2 @[320px]:gap-3 mb-3">
        <div className="flex items-center gap-2 @[320px]:gap-3 min-w-0 flex-1">
          <div
            className={`w-10 h-10 @[280px]:w-12 @[280px]:h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              isIncoming
                ? "bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700 shadow-emerald-200/50"
                : "bg-gradient-to-br from-orange-100 to-orange-200 text-orange-700 shadow-orange-200/50"
            } shadow-lg`}
          >
            {isIncoming ? (
              <TrendingUp className="w-5 h-5 @[280px]:w-6 @[280px]:h-6" />
            ) : (
              <TrendingDown className="w-5 h-5 @[280px]:w-6 @[280px]:h-6" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-gray-900 text-sm @[280px]:text-base truncate mb-1">
              {activity.category}
            </h3>
            <span
              className={`inline-flex items-center px-2 @[280px]:px-3 py-1 text-xs @[280px]:text-xs font-semibold rounded-full ${
                isIncoming
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-orange-50 text-orange-800 border border-orange-200"
              }`}
            >
              {isIncoming ? "Income" : "Expense"}
            </span>
          </div>
        </div>

        <div className="text-left @[320px]:text-right flex-shrink-0">
          <div
            className={`font-bold text-lg @[280px]:text-xl @[400px]:text-2xl ${
              isIncoming ? "text-emerald-600" : "text-orange-600"
            }`}
          >
            {isIncoming ? "+" : "-"}₹{activity.amount?.toLocaleString()}
          </div>
          <div className="text-xs @[280px]:text-sm text-gray-500 font-medium">
            {formatDate(activity.date)}
          </div>
        </div>
      </div>

      {/* Payment Info */}
      <div className="mb-3 p-2 @[280px]:p-3 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl border border-gray-100">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <CreditCard className="w-3.5 h-3.5 @[280px]:w-4 @[280px]:h-4 text-gray-600" />
            </div>
            <span className="text-sm @[280px]:text-sm font-semibold text-gray-800 truncate">
              {activity.paymentMode}
            </span>
          </div>
          {activity.isOnline && (
            <span className="px-2 py-1 text-xs @[280px]:text-xs bg-blue-50 text-blue-700 rounded-full border border-blue-200 font-semibold flex-shrink-0">
              Online
            </span>
          )}
        </div>
      </div>

      {/* Employee Info */}
      <div className="flex items-center gap-2 mb-3 p-1 @[280px]:p-2 bg-purple-50 rounded-lg border border-purple-100">
        <div className="w-7 h-7 bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700 rounded-lg flex items-center justify-center">
          <User className="w-3.5 h-3.5 @[280px]:w-4 @[280px]:h-4" />
        </div>
        <span className="text-sm @[280px]:text-sm text-purple-800 font-semibold truncate">
          {activity.employeeName}
        </span>
      </div>

      {/* Description */}
      {activity.description && (
        <div className="mb-3 p-2 @[280px]:p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 rounded-r-xl shadow-sm">
          <p className="text-sm @[280px]:text-sm text-blue-900 break-words line-clamp-2 font-medium">
            {activity.description}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="pt-2 @[280px]:pt-3 border-t border-gray-200">
        <div className="text-sm text-gray-600 font-medium">
          <span>Created by {activity.createdBy?.username}</span>
        </div>
      </div>
    </div>
  );
};

export default CashFlowActivityCard;
