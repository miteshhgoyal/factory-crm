import React from "react";
import { Receipt, User, ExternalLink, CheckCircle, Clock } from "lucide-react";
import { formatDate } from "../../utils/dateUtils";

const ExpenseActivityCard = ({ activity }) => {
  return (
    <div className="@container bg-white border border-gray-100 rounded-2xl p-3 @[280px]:p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-gray-200">
      {/* Header */}
      <div className="flex flex-col @[320px]:flex-row @[320px]:items-start @[320px]:justify-between gap-2 @[320px]:gap-3 mb-3">
        <div className="flex items-center gap-2 @[320px]:gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 @[280px]:w-12 @[280px]:h-12 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700 shadow-lg shadow-purple-200/50 flex items-center justify-center flex-shrink-0">
            <Receipt className="w-5 h-5 @[280px]:w-6 @[280px]:h-6" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-gray-900 text-sm @[280px]:text-base truncate mb-1">
              {activity.category}
            </h3>
            <div className="flex flex-wrap items-center gap-1 @[280px]:gap-2 mt-1">
              <span
                className={`inline-flex items-center gap-1.5 px-2 @[280px]:px-3 py-1 text-xs @[280px]:text-xs font-semibold rounded-full border ${
                  activity.isApproved
                    ? "bg-green-50 text-green-800 border-green-200"
                    : "bg-yellow-50 text-yellow-800 border-yellow-200"
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
                <span className="px-2 @[280px]:px-3 py-1 text-xs @[280px]:text-xs font-semibold rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                  <span className="@[300px]:hidden">Mgr</span>
                  <span className="hidden @[300px]:inline">Manager</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-left @[320px]:text-right flex-shrink-0">
          <div className="font-bold text-lg @[280px]:text-xl @[400px]:text-2xl text-red-600">
            -₹{activity.amount?.toLocaleString()}
          </div>
          <div className="text-xs @[280px]:text-sm text-gray-500 font-medium">
            {formatDate(activity.date)}
          </div>
        </div>
      </div>

      {/* Employee and Bill Info */}
      <div className="mb-3 p-2 @[280px]:p-3 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl border border-gray-100">
        <div className="flex flex-col @[240px]:flex-row @[240px]:items-center gap-2 @[240px]:gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-700 rounded-lg flex items-center justify-center">
              <User className="w-3.5 h-3.5 @[280px]:w-4 @[280px]:h-4" />
            </div>
            <span className="text-sm @[280px]:text-sm font-semibold text-gray-800 truncate">
              {activity.employeeName}
            </span>
          </div>

          {activity.billNo && (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 bg-gradient-to-br from-green-100 to-green-200 text-green-700 rounded-lg flex items-center justify-center">
                <Receipt className="w-3.5 h-3.5 @[280px]:w-4 @[280px]:h-4" />
              </div>
              <span className="text-sm @[280px]:text-sm text-gray-700 font-semibold truncate">
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
        <div className="mb-3 p-2 @[280px]:p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 rounded-r-xl shadow-sm">
          <p className="text-sm @[280px]:text-sm text-blue-900 break-words line-clamp-2 font-medium">
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
            className="inline-flex items-center justify-center gap-2 w-full @[280px]:w-auto px-3 @[280px]:px-4 py-2 text-xs @[280px]:text-sm font-semibold text-blue-700 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-200 border border-blue-200 hover:shadow-lg"
          >
            <ExternalLink className="w-4 h-4 @[280px]:w-5 @[280px]:h-5" />
            <span className="@[200px]:hidden">Receipt</span>
            <span className="hidden @[200px]:inline">View Receipt</span>
          </a>
        </div>
      )}

      {/* Footer */}
      <div className="pt-2 @[280px]:pt-3 border-t border-gray-200">
        <div className="flex flex-col @[300px]:flex-row @[300px]:items-center @[300px]:justify-between gap-1 @[300px]:gap-0 text-sm text-gray-600 font-medium">
          <span>Created by {activity.createdBy?.username}</span>
          {activity.approvedBy && (
            <span className="flex items-center gap-1.5 text-green-700 bg-green-50 px-2 py-1 rounded-full border border-green-200">
              <CheckCircle className="w-3.5 h-3.5" />
              <span className="@[350px]:hidden font-semibold">Approved</span>
              <span className="hidden @[350px]:inline font-semibold">
                Approved by admin
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseActivityCard;
