import React from "react";
import { ArrowDownCircle, ArrowUpCircle, Building, User } from "lucide-react";
import { formatDate } from "../../utils/dateUtils";

const StockActivityCard = ({ activity }) => {
  const isIncoming = activity.type === "IN";

  return (
    <div className="@container bg-white border border-gray-200 rounded-lg p-3 hover:shadow-lg transition-all duration-300 hover:border-gray-300">
      {/* Flexible Header - Stacks when container is narrow */}
      <div className="flex flex-col @[320px]:flex-row @[320px]:items-start @[320px]:justify-between gap-2 @[320px]:gap-3 mb-3">
        <div className="flex items-center gap-2 @[320px]:gap-3 min-w-0 flex-1">
          <div
            className={`w-8 h-8 @[280px]:w-10 @[280px]:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              isIncoming
                ? "bg-green-50 text-green-600 border-2 border-green-200"
                : "bg-red-50 text-red-600 border-2 border-red-200"
            }`}
          >
            {isIncoming ? (
              <ArrowDownCircle className="w-4 h-4 @[280px]:w-5 @[280px]:h-5" />
            ) : (
              <ArrowUpCircle className="w-4 h-4 @[280px]:w-5 @[280px]:h-5" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 text-sm @[280px]:text-base truncate">
              {activity.productName}
            </h3>
            <span
              className={`inline-block px-2 @[280px]:px-3 py-1 text-xs @[280px]:text-sm font-medium rounded-full mt-1 ${
                isIncoming
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {isIncoming ? "In" : "Out"}
            </span>
          </div>
        </div>

        <div className="text-left @[320px]:text-right flex-shrink-0">
          <div className="font-bold text-base @[280px]:text-lg @[400px]:text-xl text-gray-900">
            ₹{activity.amount?.toLocaleString()}
          </div>
          <div className="text-xs @[280px]:text-sm text-gray-500">
            {formatDate(activity.date)}
          </div>
        </div>
      </div>

      {/* Adaptive Quantity/Rate Layout */}
      <div className="grid grid-cols-1 @[200px]:grid-cols-2 gap-2 @[280px]:gap-3 mb-3 p-2 @[280px]:p-3 bg-gray-50 rounded-lg">
        <div>
          <span className="text-xs text-gray-500 block">Qty</span>
          <div className="font-semibold text-gray-900 text-xs @[280px]:text-sm truncate">
            {activity.quantity} {activity.unit}
          </div>
        </div>
        <div>
          <span className="text-xs text-gray-500 block">Rate</span>
          <div className="font-semibold text-gray-900 text-xs @[280px]:text-sm">
            ₹{activity.rate}/{activity.unit}
          </div>
        </div>
      </div>

      {/* Client Info - Adaptive layout */}
      <div className="space-y-1 @[240px]:space-y-0 @[240px]:flex @[240px]:items-center @[240px]:gap-3 mb-3">
        <div className="flex items-center gap-2 text-xs @[280px]:text-sm text-gray-600 min-w-0">
          <Building className="w-3 h-3 @[280px]:w-4 @[280px]:h-4 text-gray-400 flex-shrink-0" />
          <span className="truncate">{activity.clientName}</span>
        </div>
        <div className="text-xs @[280px]:text-sm text-gray-600 @[240px]:flex-shrink-0">
          <span className="@[240px]:hidden">Invoice: </span>
          <span className="hidden @[240px]:inline @[400px]:hidden">Inv: </span>
          <span className="hidden @[400px]:inline">Invoice: </span>
          {activity.invoiceNo}
        </div>
      </div>

      {/* Notes - Always full width */}
      {activity.notes && (
        <div className="mb-3 p-2 @[280px]:p-3 bg-blue-50 border-l-4 border-blue-200 rounded-r">
          <p className="text-xs @[280px]:text-sm text-blue-800 line-clamp-2">
            {activity.notes}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="pt-2 @[280px]:pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <User className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">by {activity.createdBy?.username}</span>
        </div>
      </div>
    </div>
  );
};

export default StockActivityCard;
