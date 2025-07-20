import React from "react";
import { Receipt, User, ExternalLink, CheckCircle, Clock } from "lucide-react";
import { formatDate } from "../../utils/dateUtils";

const ExpenseActivityCard = ({ activity }) => {
  return (
    <div className="@container bg-white border border-gray-200 rounded-lg p-3 hover:shadow-lg transition-all duration-300 hover:border-gray-300">
      {/* Flexible Header */}
      <div className="flex flex-col @[320px]:flex-row @[320px]:items-start @[320px]:justify-between gap-2 @[320px]:gap-3 mb-3">
        <div className="flex items-center gap-2 @[320px]:gap-3 min-w-0 flex-1">
          <div className="w-8 h-8 @[280px]:w-10 @[280px]:h-10 rounded-full bg-purple-50 text-purple-600 border-2 border-purple-200 flex items-center justify-center flex-shrink-0">
            <Receipt className="w-4 h-4 @[280px]:w-5 @[280px]:h-5" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 text-sm @[280px]:text-base truncate">
              {activity.category}
            </h3>
            <div className="flex flex-wrap items-center gap-1 @[280px]:gap-2 mt-1">
              <span
                className={`inline-flex items-center gap-1 px-2 @[280px]:px-3 py-1 text-xs @[280px]:text-sm font-medium rounded-full ${
                  activity.isApproved
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {activity.isApproved ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <Clock className="w-3 h-3" />
                )}
                <span className="@[200px]:hidden">
                  {activity.isApproved ? "✓" : "⏳"}
                </span>
                <span className="hidden @[200px]:inline">
                  {activity.isApproved ? "Approved" : "Pending"}
                </span>
              </span>

              {activity.isManagerExpense && (
                <span className="px-2 @[280px]:px-3 py-1 text-xs @[280px]:text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                  <span className="@[300px]:hidden">Mgr</span>
                  <span className="hidden @[300px]:inline">Manager</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-left @[320px]:text-right flex-shrink-0">
          <div className="font-bold text-base @[280px]:text-lg @[400px]:text-xl text-red-600">
            -₹{activity.amount?.toLocaleString()}
          </div>
          <div className="text-xs @[280px]:text-sm text-gray-500">
            {formatDate(activity.date)}
          </div>
        </div>
      </div>

      {/* Employee and Bill Info */}
      <div className="mb-3 p-2 @[280px]:p-3 bg-gray-50 rounded-lg">
        <div className="flex flex-col @[240px]:flex-row @[240px]:items-center gap-2 @[240px]:gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <User className="w-3 h-3 @[280px]:w-4 @[280px]:h-4 text-gray-400 flex-shrink-0" />
            <span className="text-xs @[280px]:text-sm font-medium text-gray-700 truncate">
              {activity.employeeName}
            </span>
          </div>

          {activity.billNo && (
            <div className="flex items-center gap-2 min-w-0">
              <Receipt className="w-3 h-3 @[280px]:w-4 @[280px]:h-4 text-gray-400 flex-shrink-0" />
              <span className="text-xs @[280px]:text-sm text-gray-600 truncate">
                <span className="@[300px]:hidden">#{activity.billNo}</span>
                <span className="hidden @[300px]:inline">
                  Bill: {activity.billNo}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {activity.description && (
        <div className="mb-3 p-2 @[280px]:p-3 bg-blue-50 border-l-4 border-blue-200 rounded-r">
          <p className="text-xs @[280px]:text-sm text-blue-800 break-words line-clamp-2">
            {activity.description}
          </p>
        </div>
      )}

      {/* Receipt Link */}
      {activity.receiptUrl && (
        <div className="mb-3">
          <a
            href={activity.receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full @[280px]:w-auto px-3 @[280px]:px-4 py-2 text-xs @[280px]:text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <ExternalLink className="w-3 h-3 @[280px]:w-4 @[280px]:h-4" />
            <span className="@[200px]:hidden">Receipt</span>
            <span className="hidden @[200px]:inline">View Receipt</span>
          </a>
        </div>
      )}

      {/* Footer */}
      <div className="pt-2 @[280px]:pt-3 border-t border-gray-100">
        <div className="flex flex-col @[300px]:flex-row @[300px]:items-center @[300px]:justify-between gap-1 @[300px]:gap-0 text-xs text-gray-500">
          <span>by {activity.createdBy?.username}</span>
          {activity.approvedBy && (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-3 h-3" />
              <span className="@[350px]:hidden">Approved</span>
              <span className="hidden @[350px]:inline">Approved by admin</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseActivityCard;
