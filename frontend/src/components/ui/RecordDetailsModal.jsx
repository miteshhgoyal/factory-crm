// frontend/src/components/admin/RecordDetailsModal.jsx
import React from "react";
import Modal from "../ui/Modal";
import {
  User,
  Building,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  IndianRupee,
  Package,
  Clock,
  FileText,
  Users,
  Hash,
  Scale,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

const RecordDetailsModal = ({ isOpen, onClose, recordData, loading }) => {
  if (!recordData && !loading) return null;

  const { record, recordType } = recordData || {};

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    if (amount == null) return "N/A";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const renderEmployeeDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Employee Name</p>
              <p className="font-semibold">{record.name || "N/A"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Hash className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Employee ID</p>
              <p className="font-semibold">{record.employeeId || "N/A"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-semibold">{record.phone || "N/A"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Address</p>
              <p className="font-semibold">{record.address || "N/A"}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Payment Type</p>
              <p className="font-semibold capitalize">
                {record.paymentType || "N/A"}
              </p>
            </div>
          </div>

          {record.paymentType === "fixed" && (
            <div className="flex items-center gap-3">
              <IndianRupee className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Basic Salary</p>
                <p className="font-semibold">
                  {formatCurrency(record.basicSalary)}
                </p>
              </div>
            </div>
          )}

          {record.paymentType === "hourly" && (
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Hourly Rate</p>
                <p className="font-semibold">
                  {formatCurrency(record.hourlyRate)}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Join Date</p>
              <p className="font-semibold">{formatDate(record.joinDate)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Building className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Company</p>
              <p className="font-semibold">{record.companyId?.name || "N/A"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Details */}
      <div className="border-t pt-6">
        <h4 className="font-semibold mb-4">Additional Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Aadhar Number</p>
            <p className="font-semibold">{record.aadharNo || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">PAN Number</p>
            <p className="font-semibold">{record.panNo || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Working Days</p>
            <p className="font-semibold">{record.workingDays || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Working Hours</p>
            <p className="font-semibold">{record.workingHours || "N/A"}</p>
          </div>
        </div>
      </div>

      {/* Bank Details */}
      {record.bankAccount && (
        <div className="border-t pt-6">
          <h4 className="font-semibold mb-4">Bank Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Account Number</p>
              <p className="font-semibold">
                {record.bankAccount.accountNo || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">IFSC Code</p>
              <p className="font-semibold">
                {record.bankAccount.ifsc || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Bank Name</p>
              <p className="font-semibold">
                {record.bankAccount.bankName || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Branch</p>
              <p className="font-semibold">
                {record.bankAccount.branch || "N/A"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderClientDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Client Name</p>
              <p className="font-semibold">{record.name || "N/A"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-semibold">{record.phone || "N/A"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Address</p>
              <p className="font-semibold">{record.address || "N/A"}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Client Type</p>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  record.type === "Customer"
                    ? "bg-green-100 text-green-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {record.type}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <IndianRupee className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Current Balance</p>
              <p
                className={`font-semibold ${
                  record.currentBalance >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(record.currentBalance)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {record.isActive ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p
                className={`font-semibold ${
                  record.isActive ? "text-green-600" : "text-red-600"
                }`}
              >
                {record.isActive ? "Active" : "Inactive"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Building className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Company</p>
              <p className="font-semibold">{record.companyId?.name || "N/A"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <div className="flex items-center gap-3">
          <User className="w-5 h-5 text-gray-600" />
          <div>
            <p className="text-sm text-gray-600">Created By</p>
            <p className="font-semibold">{record.createdBy?.name || "N/A"}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStockDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Product Name</p>
              <p className="font-semibold">{record.productName || "N/A"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {record.type === "IN" ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )}
            <div>
              <p className="text-sm text-gray-600">Type</p>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  record.type === "IN"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                Stock {record.type}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Scale className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Quantity</p>
              <p className="font-semibold">
                {record.quantity} {record.unit}
              </p>
            </div>
          </div>

          {record.bags && (
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Bags</p>
                <p className="font-semibold">
                  {record.bags.count} bags ({record.bags.weight} kg)
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <IndianRupee className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Rate per {record.unit}</p>
              <p className="font-semibold">{formatCurrency(record.rate)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <IndianRupee className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="font-semibold text-lg">
                {formatCurrency(record.amount)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Date</p>
              <p className="font-semibold">{formatDate(record.date)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Building className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Company</p>
              <p className="font-semibold">{record.companyId?.name || "N/A"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Details */}
      <div className="border-t pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {record.clientName && (
            <div>
              <p className="text-sm text-gray-600">Client Name</p>
              <p className="font-semibold">{record.clientName}</p>
            </div>
          )}
          {record.invoiceNo && (
            <div>
              <p className="text-sm text-gray-600">Invoice Number</p>
              <p className="font-semibold">{record.invoiceNo}</p>
            </div>
          )}
          {record.notes && (
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Notes</p>
              <p className="font-semibold">{record.notes}</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <User className="w-5 h-5 text-gray-600" />
          <div>
            <p className="text-sm text-gray-600">Created By</p>
            <p className="font-semibold">{record.createdBy?.name || "N/A"}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCashFlowDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {record.type === "IN" ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )}
            <div>
              <p className="text-sm text-gray-600">Cash Flow Type</p>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  record.type === "IN"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                Cash {record.type}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <IndianRupee className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Amount</p>
              <p className="font-semibold text-lg">
                {formatCurrency(record.amount)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Category</p>
              <p className="font-semibold">{record.category || "N/A"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Description</p>
              <p className="font-semibold">{record.description || "N/A"}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Payment Mode</p>
              <p className="font-semibold">{record.paymentMode || "N/A"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Date</p>
              <p className="font-semibold">{formatDate(record.date)}</p>
            </div>
          </div>

          {record.employeeName && (
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Employee Name</p>
                <p className="font-semibold">{record.employeeName}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Building className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Company</p>
              <p className="font-semibold">{record.companyId?.name || "N/A"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <div className="flex items-center gap-3">
          <User className="w-5 h-5 text-gray-600" />
          <div>
            <p className="text-sm text-gray-600">Created By</p>
            <p className="font-semibold">{record.createdBy?.name || "N/A"}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderExpenseDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Category</p>
              <p className="font-semibold">{record.category || "N/A"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <IndianRupee className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Amount</p>
              <p className="font-semibold text-lg">
                {formatCurrency(record.amount)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Description</p>
              <p className="font-semibold">{record.description || "N/A"}</p>
            </div>
          </div>

          {record.billNo && (
            <div className="flex items-center gap-3">
              <Hash className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Bill Number</p>
                <p className="font-semibold">{record.billNo}</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Date</p>
              <p className="font-semibold">{formatDate(record.date)}</p>
            </div>
          </div>

          {record.employeeName && (
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Employee Name</p>
                <p className="font-semibold">{record.employeeName}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Building className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Company</p>
              <p className="font-semibold">{record.companyId?.name || "N/A"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Created By</p>
              <p className="font-semibold">{record.createdBy?.name || "N/A"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAttendanceDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Employee</p>
              <p className="font-semibold">
                {record.employeeId?.name || "N/A"}
                {record.employeeId?.employeeId &&
                  ` (${record.employeeId.employeeId})`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Date</p>
              <p className="font-semibold">{formatDate(record.date)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {record.isPresent ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <div>
              <p className="text-sm text-gray-600">Attendance Status</p>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  record.isPresent
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {record.isPresent ? "Present" : "Absent"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Hours Worked</p>
              <p className="font-semibold">{record.hoursWorked || 0} hours</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Marked By</p>
              <p className="font-semibold">{record.markedBy?.name || "N/A"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Building className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Company</p>
              <p className="font-semibold">{record.companyId?.name || "N/A"}</p>
            </div>
          </div>

          {record.notes && (
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Notes</p>
                <p className="font-semibold">{record.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderClientLedgerDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Client</p>
              <p className="font-semibold">
                {record.clientId?.name || "N/A"}
                {record.clientId?.phone && ` (${record.clientId.phone})`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Date</p>
              <p className="font-semibold">{formatDate(record.date)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Particulars</p>
              <p className="font-semibold">{record.particulars || "N/A"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Bags & Weight</p>
              <p className="font-semibold">
                {record.bags || 0} bags, {record.weight || 0} kg
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <IndianRupee className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Rate</p>
              <p className="font-semibold">{formatCurrency(record.rate)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Debit Amount</p>
              <p className="font-semibold text-green-600">
                {formatCurrency(record.debitAmount)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">Credit Amount</p>
              <p className="font-semibold text-red-600">
                {formatCurrency(record.creditAmount)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Scale className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Balance</p>
              <p
                className={`font-semibold text-lg ${
                  record.balance >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(record.balance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Created By</p>
              <p className="font-semibold">{record.createdBy?.name || "N/A"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Building className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Company</p>
              <p className="font-semibold">{record.companyId?.name || "N/A"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUserDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-semibold">{record.name || "N/A"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-semibold">{record.email || "N/A"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-semibold">{record.phone || "N/A"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Username</p>
              <p className="font-semibold">{record.username || "N/A"}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Role</p>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  record.role === "superadmin"
                    ? "bg-purple-100 text-purple-800"
                    : record.role === "admin"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {record.role}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {record.isActive ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  record.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {record.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {record.lastLogin && (
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Last Login</p>
                <p className="font-semibold">{formatDate(record.lastLogin)}</p>
              </div>
            </div>
          )}

          {record.createdBy && (
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Created By</p>
                <p className="font-semibold">
                  {record.createdBy?.name || "N/A"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Companies */}
      {record.companies && record.companies.length > 0 && (
        <div className="border-t pt-6">
          <h4 className="font-semibold mb-4">Associated Companies</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {record.companies.map((company, index) => (
              <div key={index} className="flex items-center gap-2">
                <Building className="w-4 h-4 text-gray-600" />
                <span className="text-sm">
                  {company.name}
                  {record.selectedCompany &&
                    record.selectedCompany._id === company._id && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        Selected
                      </span>
                    )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderCompanyDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Building className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Company Name</p>
              <p className="font-semibold">{record.name || "N/A"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Created Date</p>
              <p className="font-semibold">{formatDate(record.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const getRecordIcon = () => {
    switch (recordType) {
      case "Employee":
        return <User className="w-5 h-5" />;
      case "Client":
        return <Users className="w-5 h-5" />;
      case "Stock":
        return <Package className="w-5 h-5" />;
      case "CashFlow":
        return <IndianRupee className="w-5 h-5" />;
      case "Expense":
        return <FileText className="w-5 h-5" />;
      case "Attendance":
        return <Clock className="w-5 h-5" />;
      case "ClientLedger":
        return <Scale className="w-5 h-5" />;
      case "User":
        return <User className="w-5 h-5" />;
      case "Company":
        return <Building className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getRecordColor = () => {
    switch (recordType) {
      case "Employee":
        return "blue";
      case "Client":
        return "green";
      case "Stock":
        return "purple";
      case "CashFlow":
        return "orange";
      case "Expense":
        return "red";
      case "Attendance":
        return "yellow";
      case "ClientLedger":
        return "blue";
      case "User":
        return "gray";
      case "Company":
        return "blue";
      default:
        return "gray";
    }
  };

  const renderRecordDetails = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading record details...</p>
          </div>
        </div>
      );
    }

    switch (recordType) {
      case "Employee":
        return renderEmployeeDetails();
      case "Client":
        return renderClientDetails();
      case "Stock":
        return renderStockDetails();
      case "CashFlow":
        return renderCashFlowDetails();
      case "Expense":
        return renderExpenseDetails();
      case "Attendance":
        return renderAttendanceDetails();
      case "ClientLedger":
        return renderClientLedgerDetails();
      case "User":
        return renderUserDetails();
      case "Company":
        return renderCompanyDetails();
      default:
        return (
          <div className="text-center py-10">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              Unsupported record type: {recordType}
            </p>
          </div>
        );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${recordType} Details`}
      subtitle={
        record
          ? `View detailed information for this ${recordType.toLowerCase()} record`
          : "Loading..."
      }
      size="lg"
      headerIcon={getRecordIcon()}
      headerColor={getRecordColor()}
    >
      {renderRecordDetails()}
    </Modal>
  );
};

export default RecordDetailsModal;
