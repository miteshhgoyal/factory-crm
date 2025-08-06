import React from "react";
import { ArrowDownCircle, ArrowUpCircle, Building, User } from "lucide-react";
import { formatDate } from "../../utils/dateUtils";

const StockActivityCard = ({ activity }) => {
  const isIncoming = activity.type === "IN";

  return (
    <div className="@container bg-white border border-gray-100 rounded-2xl p-3 @[280px]:p-4 transition-all duration-300 hover:border-gray-200">
      {/* Header */}
      <div className="flex flex-col @[320px]:flex-row @[320px]:items-start @[320px]:justify-between gap-2 @[320px]:gap-3 mb-3">
        <div className="flex items-center gap-2 @[320px]:gap-3 min-w-0 flex-1">
          <div
            className={`w-10 h-10 @[280px]:w-12 @[280px]:h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              isIncoming
                ? "bg-gradient-to-br from-green-100 to-green-200 text-green-700 shadow-green-200/50"
                : "bg-gradient-to-br from-red-100 to-red-200 text-red-700 shadow-red-200/50"
            } shadow-lg`}
          >
            {isIncoming ? (
              <ArrowDownCircle className="w-5 h-5 @[280px]:w-6 @[280px]:h-6" />
            ) : (
              <ArrowUpCircle className="w-5 h-5 @[280px]:w-6 @[280px]:h-6" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-gray-900 text-sm @[280px]:text-base truncate mb-1">
              {activity.productName}
            </h3>
            <span
              className={`inline-flex items-center px-2 @[280px]:px-3 py-1 text-xs @[280px]:text-xs font-semibold rounded-full border ${
                isIncoming
                  ? "bg-green-50 text-green-800 border-green-200"
                  : "bg-red-50 text-red-800 border-red-200"
              }`}
            >
              {isIncoming ? "Stock In" : "Stock Out"}
            </span>
          </div>
        </div>

        <div className="text-left @[320px]:text-right flex-shrink-0">
          <div className="font-bold text-lg @[280px]:text-xl @[400px]:text-2xl text-gray-900">
            ₹{activity.amount?.toLocaleString()}
          </div>
          <div className="text-xs @[280px]:text-sm text-gray-500 font-medium">
            {formatDate(activity.date)}
          </div>
        </div>
      </div>

      {/* Quantity/Rate Layout */}
      <div className="grid grid-cols-1 @[200px]:grid-cols-2 gap-2 @[280px]:gap-3 mb-3 p-2 @[280px]:p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
        <div className="bg-white p-2 rounded-lg shadow-sm border border-indigo-100">
          <span className="text-xs @[280px]:text-sm text-indigo-600 font-semibold block mb-1">
            Quantity
          </span>
          <div className="font-bold text-indigo-900 text-sm @[280px]:text-base truncate">
            {activity.quantity} {activity.unit}
          </div>
        </div>
        <div className="bg-white p-2 rounded-lg shadow-sm border border-purple-100">
          <span className="text-xs @[280px]:text-sm text-purple-600 font-semibold block mb-1">
            Rate
          </span>
          <div className="font-bold text-purple-900 text-sm @[280px]:text-base">
            ₹{activity.rate}/{activity.unit}
          </div>
        </div>
      </div>

      {/* Client Info */}
      <div className="space-y-1 @[240px]:space-y-0 @[240px]:flex @[240px]:items-center @[240px]:gap-2 mb-3 p-2 @[280px]:p-3 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl border border-gray-100">
        <div className="flex items-center gap-2 text-xs @[280px]:text-sm text-gray-700 min-w-0">
          <div className="w-7 h-7 bg-gradient-to-br from-teal-100 to-teal-200 text-teal-700 rounded-lg flex items-center justify-center">
            <Building className="w-3.5 h-3.5 @[280px]:w-4 @[280px]:h-4" />
          </div>
          <span className="truncate font-semibold">{activity.clientName}</span>
        </div>
        <div className="text-xs @[280px]:text-sm text-gray-700 @[240px]:flex-shrink-0 font-semibold bg-white px-2 py-1 rounded-lg border border-gray-200">
          <span className="@[240px]:hidden">Invoice: </span>
          <span className="hidden @[240px]:inline @[400px]:hidden">Inv: </span>
          <span className="hidden @[400px]:inline">Invoice: </span>
          {activity.invoiceNo}
        </div>
      </div>

      {/* Notes */}
      {activity.notes && (
        <div className="mb-3 p-2 @[280px]:p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 rounded-r-xl shadow-sm">
          <p className="text-sm @[280px]:text-sm text-blue-900 line-clamp-2 font-medium">
            {activity.notes}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="pt-2 @[280px]:pt-3 border-t border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
          <div className="w-5 h-5 bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 rounded-md flex items-center justify-center">
            <User className="w-3 h-3" />
          </div>
          <span className="truncate">
            Created by {activity.createdBy?.username}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StockActivityCard;
