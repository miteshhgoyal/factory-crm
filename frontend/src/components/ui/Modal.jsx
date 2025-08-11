import React, { useEffect } from "react";
import { X } from "lucide-react";

const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = "default",
  showCloseButton = true,
  closeOnOverlayClick = true,
  headerIcon,
  headerColor = "blue",
  maxHeight = "90vh",
}) => {
  // Size variants
  const sizeClasses = {
    sm: "max-w-md",
    default: "max-w-xl", // Basic default
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
    full: "max-w-[95vw]",
  };

  // Header color variants
  const headerColors = {
    blue: "from-blue-50 to-indigo-50",
    green: "from-green-50 to-emerald-50",
    red: "from-red-50 to-pink-50",
    orange: "from-orange-50 to-red-50",
    purple: "from-purple-50 to-pink-50",
    yellow: "from-yellow-50 to-orange-50",
    gray: "from-gray-50 to-white",
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden"; // Prevent background scroll
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div
        className="fixed inset-0"
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      <div
        className={`
          relative bg-white rounded-3xl shadow-2xl border border-gray-100 
          ${sizeClasses[size]} w-full overflow-hidden
        `}
        style={{ maxHeight }}
      >
        {/* Fixed Header */}
        <div
          className={`
            sticky top-0 bg-gradient-to-r ${headerColors[headerColor]} 
            px-6 py-4 border-b border-gray-100 z-10
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {headerIcon && (
                <div
                  className={`w-10 h-10 bg-${headerColor}-100 rounded-xl flex items-center justify-center`}
                >
                  {React.cloneElement(headerIcon, {
                    className: `w-5 h-5 text-${headerColor}-600`,
                  })}
                </div>
              )}
              <div>
                {title && (
                  <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                )}
                {subtitle && (
                  <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
                )}
              </div>
            </div>

            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/80 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>
        </div>

        {/* Modal Content */}
        <div
          className="p-6 overflow-y-auto"
          style={{ maxHeight: "calc(90vh - 100px)" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
