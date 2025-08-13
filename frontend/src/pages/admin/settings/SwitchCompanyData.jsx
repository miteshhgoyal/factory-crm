import React, { useState, useEffect, useCallback } from "react";
import { Users, Building, Save, Loader2, Check } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { userAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";

const SwitchCompanyData = () => {
  const { user } = useAuth();

  // States
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [currentSelectedCompanyId, setCurrentSelectedCompanyId] =
    useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch assigned companies
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const companyResponse = await userAPI.getMyAssignedCompanies();
      if (companyResponse?.data?.success) {
        const companiesData = companyResponse.data.data || [];
        const currentSelected = companyResponse.data.currentSelectedCompany;

        setCompanies(companiesData);
        setCurrentSelectedCompanyId(currentSelected);

        // Pre-select the current selected company
        if (currentSelected) {
          setSelectedCompanyId(currentSelected.toString());
        }

        console.log("Assigned companies:", companiesData);
        console.log("Current selected company ID:", currentSelected);
      }
    } catch (error) {
      console.error("Failed to fetch companies:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle company selection save
  const handleSaveSelection = async () => {
    if (!selectedCompanyId) {
      return;
    }

    // Check if the selection has actually changed
    if (
      currentSelectedCompanyId &&
      selectedCompanyId === currentSelectedCompanyId.toString()
    ) {
      return;
    }

    try {
      setSaving(true);
      const response = await userAPI.updateSelectedCompany(selectedCompanyId);

      if (response?.data?.success) {
        // Refresh data to get the updated current selection
        fetchData();
      }
    } catch (error) {
      console.error("Failed to update selected company:", error);
    } finally {
      setSaving(false);
    }
  };

  // Get current selected company object for display
  const getCurrentSelectedCompany = () => {
    if (!currentSelectedCompanyId) return null;
    return companies.find(
      (company) => company._id === currentSelectedCompanyId.toString()
    );
  };

  const currentSelectedCompany = getCurrentSelectedCompany();

  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent header="Switch Company Data" subheader="Loading..." />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Loading companies...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <HeaderComponent
          header="Switch Company Data"
          subheader="Select a company to work with from your assigned companies"
          onRefresh={fetchData}
          loading={loading}
        />

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>Settings</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">Switch Company Data</span>
        </div>

        {/* Current Selection Info */}
        {currentSelectedCompany && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Currently Selected: {currentSelectedCompany.name}
                </p>
                <p className="text-xs text-blue-700">
                  This is your active company for all operations
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Company Selection */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Select Company
            </h3>
            <p className="text-sm text-gray-600">
              Choose the company you want to work with from your assigned
              companies.
            </p>
          </div>

          {companies.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {companies.map((company) => (
                  <label
                    key={company._id}
                    className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                      selectedCompanyId === company._id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="selectedCompany"
                      value={company._id}
                      checked={selectedCompanyId === company._id}
                      onChange={(e) => setSelectedCompanyId(e.target.value)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div className="flex items-center gap-3 flex-1">
                      <Building className="w-5 h-5 text-orange-600" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {company.name}
                          </span>
                          {currentSelectedCompanyId &&
                            company._id ===
                              currentSelectedCompanyId.toString() && (
                              <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                                Current
                              </span>
                            )}
                        </div>
                        {company.description && (
                          <div className="text-sm text-gray-500">
                            {company.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={handleSaveSelection}
                  disabled={
                    saving ||
                    !selectedCompanyId ||
                    (currentSelectedCompanyId &&
                      selectedCompanyId === currentSelectedCompanyId.toString())
                  }
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving
                    ? "Saving..."
                    : currentSelectedCompanyId &&
                      selectedCompanyId === currentSelectedCompanyId.toString()
                    ? "Already Selected"
                    : "Save Selection"}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                No Companies Assigned
              </h4>
              <p className="text-gray-500">
                You don't have any companies assigned to you yet. Contact your
                administrator to get access to companies.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SwitchCompanyData;
