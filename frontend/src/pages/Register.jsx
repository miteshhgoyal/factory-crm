import React, { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Lock,
  RotateCcw,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { authAPI } from "../services/api";

// Import reusable components
import FormInput from "../components/ui/FormInput";
import CustomCheckbox from "../components/ui/CustomCheckbox";
import { CONFIG } from "../constants";

const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "subadmin", // Default role
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
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

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 4) {
      newErrors.username = "Username must be at least 4 characters";
    }

    if (!formData.name.trim()) newErrors.name = "Full name is required";

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?[\d\s-()]{10,}$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else {
      const hasLetter = /[a-zA-Z]/.test(formData.password);
      const hasDigit = /\d/.test(formData.password);
      const hasSpecial = /[@#$%^&*]/.test(formData.password);
      const validLength = formData.password.length >= 6;
      const validChars = /^[A-Za-z\d@#$%^&*]+$/.test(formData.password);

      if (!(hasLetter && hasDigit && hasSpecial && validLength && validChars)) {
        newErrors.password =
          "Password must be atleast 6 characters with letters, numbers, and special characters (@#$%^&*)";
      }
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!acceptTerms)
      newErrors.terms = "Please accept the terms and conditions";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const response = await authAPI.register({
        name: formData.name,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
      });

      setSuccessMessage("Registration successful! Redirecting...");

      // Login user and redirect based on role
      if (response.data.token) {
        login({
          ...response.data,
          rememberMe: true,
        });

        setTimeout(() => {
          // Navigate based on user role
          const userRole = response.data.user.role;
          if (
            userRole === "superadmin" ||
            userRole === "admin" ||
            userRole === "subadmin"
          ) {
            navigate("/admin/dashboard", { replace: true });
          } else {
            navigate("/user/dashboard", { replace: true });
          }
        }, 1000);
      }
    } catch (error) {
      setErrors({
        submit: error.response?.data?.message || "Registration failed",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: "",
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      role: "subadmin",
    });
    setAcceptTerms(false);
    setErrors({});
    setSuccessMessage("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
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
          <p className="text-gray-600 text-sm">Create Your Account</p>
        </div>

        {/* Register Form Card */}
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

          <form className="space-y-4">
            {/* Two column layout for desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                icon={User}
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Username"
                error={errors.username}
                theme="white"
              />

              <FormInput
                icon={User}
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Full Name"
                error={errors.name}
                theme="white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                icon={Mail}
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email Address"
                error={errors.email}
                theme="white"
              />

              <FormInput
                icon={Phone}
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Phone Number"
                error={errors.phone}
                theme="white"
              />
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all duration-200"
              >
                <option value="subadmin">Sub Admin</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>

            {/* Password Requirements */}
            <div className="text-xs text-gray-600 bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-xl text-center border border-gray-200">
              <span className="font-medium">Password Requirements:</span> 6+
              characters, letters + numbers + special characters (@,#,$,%,^,&,*)
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                icon={Lock}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Password"
                error={errors.password}
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword(!showPassword)}
                theme="white"
              />

              <FormInput
                icon={Lock}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm Password"
                error={errors.confirmPassword}
                showPassword={showConfirmPassword}
                onTogglePassword={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                theme="white"
              />
            </div>

            {/* Terms and Conditions */}
            <div className="pt-1">
              <CustomCheckbox
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                error={errors.terms}
                theme="white"
              >
                I agree to the{" "}
                <a href="#" className="text-black hover:underline font-medium">
                  Terms & Conditions
                </a>{" "}
                and{" "}
                <a href="#" className="text-black hover:underline font-medium">
                  Privacy Policy
                </a>
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
                type="button"
                disabled={isLoading}
                onClick={handleSubmit}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-gray-900 to-black hover:from-gray-800 hover:to-gray-900 text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Create Account
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-600 text-sm">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-black hover:text-gray-800 font-medium hover:underline transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
