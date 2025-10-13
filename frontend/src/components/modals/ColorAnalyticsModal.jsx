import React, { useState, useEffect } from "react";
import { PieChart, Package, Loader2, TrendingUp } from "lucide-react";
import { stockAPI } from "../../services/api";
import { STOCK_COLORS, getColorConfig } from "../../constants";
import Modal from "../ui/Modal";

const ColorAnalyticsModal = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [colorData, setColorData] = useState([]);
  const [totalStock, setTotalStock] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchColorData();
    }
  }, [isOpen]);

  const fetchColorData = async () => {
    try {
      setLoading(true);
      const response = await stockAPI.getRecentStockByColor();
      if (response.data?.success) {
        const data = response.data.data || [];
        setColorData(data);
        const total = data.reduce(
          (sum, item) => sum + (item.totalStock || 0),
          0
        );
        setTotalStock(total);
      }
    } catch (error) {
      console.error("Failed to fetch color data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPercentage = (value) => {
    return totalStock > 0 ? ((value / totalStock) * 100).toFixed(1) : 0;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Color-Based Stock Analytics"
      subtitle="Inventory distribution by color category"
      headerIcon={<PieChart />}
      headerColor="purple"
      size="lg"
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : (
        <>
          {/* Total Summary */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 mb-6 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-700 font-medium mb-1">
                  Total Stock Across All Colors
                </p>
                <p className="text-3xl font-bold text-purple-900">
                  {totalStock.toFixed(2)} kg
                </p>
              </div>
              <Package className="w-12 h-12 text-purple-600 opacity-50" />
            </div>
          </div>

          {/* Color Breakdown */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Stock Distribution
            </h3>

            {colorData.length > 0 ? (
              colorData.map((item) => {
                const colorConfig = getColorConfig(item.color);
                const percentage = getPercentage(item.totalStock);

                return (
                  <div
                    key={item.color}
                    className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <div
                        className={`w-10 h-10 rounded-full ${colorConfig.bgClass} flex-shrink-0`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-900">
                            {colorConfig.label}
                          </span>
                          <span className="text-sm font-medium text-gray-600">
                            {percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${colorConfig.bgClass}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-gray-200">
                      <div>
                        <p className="text-xs text-gray-500">Total Stock</p>
                        <p className="font-bold text-gray-900">
                          {item.totalStock.toFixed(2)} kg
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Products</p>
                        <p className="font-bold text-gray-900">
                          {item.productCount || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Recent Txns</p>
                        <p className="font-bold text-gray-900">
                          {item.recentTransactions?.length || 0}
                        </p>
                      </div>
                    </div>

                    {/* Recent Transactions Preview */}
                    {item.recentTransactions &&
                      item.recentTransactions.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs font-medium text-gray-600 mb-2">
                            Recent Activity
                          </p>
                          <div className="space-y-1">
                            {item.recentTransactions
                              .slice(0, 2)
                              .map((txn, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between text-xs"
                                >
                                  <span className="text-gray-700 truncate flex-1">
                                    {txn.productName}
                                  </span>
                                  <span
                                    className={`font-medium ${
                                      txn.type === "IN"
                                        ? "text-green-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    {txn.type === "IN" ? "+" : "-"}
                                    {txn.quantity} kg
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">
                  No color-coded stock available
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </Modal>
  );
};

export default ColorAnalyticsModal;
