import React, { useState } from "react";
import {
  User,
  Lock,
  RotateCcw,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { authAPI } from "../services/api";

// Import reusable components
import FormInput from "../components/ui/FormInput";
import CustomCheckbox from "../components/ui/CustomCheckbox";
import { CONFIG } from "../constants";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const [formData, setFormData] = useState({
    userInput: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.userInput.trim()) {
      newErrors.userInput = "Username or Email is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;
    if (!validateForm()) return;

    setIsLoading(true);
    setSuccessMessage("");
    setErrors({});

    try {
      const response = await authAPI.login({
        userInput: formData.userInput,
        password: formData.password,
        rememberMe: rememberMe,
      });

      setSuccessMessage("Login successful! Redirecting...");

      if (response.data.token) login(response.data);

      setTimeout(() => {
        navigate(from, { replace: true });
      }, 1000);
    } catch (error) {
      setErrors({
        submit:
          error.response?.data?.message ||
          "Invalid credentials. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      userInput: "",
      password: "",
    });
    setRememberMe(false);
    setErrors({});
    setSuccessMessage("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black rounded-xl rotate-3 shadow-lg opacity-20"></div>
            <div className="relative w-full h-full bg-gradient-to-br from-gray-900 to-black rounded-xl flex items-center justify-center shadow-xl">
              <Shield className="w-8 h-8 text-white" strokeWidth={2} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {CONFIG.systemName}
          </h1>
          <p className="text-gray-600 text-sm">Secure Access Portal</p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 backdrop-blur-sm">
          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl flex items-center gap-2">
              <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-emerald-800 text-sm font-medium">
                {successMessage}
              </span>
            </div>
          )}

          {/* Error Message */}
          {errors.submit && (
            <div className="mb-4 p-3 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl flex items-center gap-2">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
              <span className="text-red-800 text-sm font-medium">
                {errors.submit}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <FormInput
              icon={User}
              name="userInput"
              value={formData.userInput}
              onChange={handleInputChange}
              placeholder="Username or Email"
              error={errors.userInput}
              autoComplete="username"
              theme="white"
            />

            {/* Password Input */}
            <FormInput
              icon={Lock}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Password"
              error={errors.password}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
              autoComplete="current-password"
              theme="white"
            />

            {/* Remember Me Checkbox */}
            <div className="pt-1">
              <CustomCheckbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                theme="white"
              >
                Remember me
              </CustomCheckbox>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 border border-gray-200 shadow-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-gray-900 to-black hover:from-gray-800 hover:to-gray-900 text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
