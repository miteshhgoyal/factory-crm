import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

const Sidebar = ({ isOpen, onToggle, navigationLinks, systemName }) => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [hoverSubmenu, setHoverSubmenu] = useState(null);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileNow = window.innerWidth < 768;
      setIsMobile(isMobileNow);

      if (isMobileNow) {
        setOpenSubmenu(null);
        setHoverSubmenu(null);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    const handleClickOutside = (event) => {
      if (
        !event.target.closest(".submenu-container") &&
        !event.target.closest(".menu-item")
      ) {
        setOpenSubmenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("resize", checkMobile);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const isActiveLink = (href) => {
    return location.pathname === href;
  };

  const isParentActive = (item) => {
    if (!item.subItems) return false;
    return item.subItems.some((subItem) => location.pathname === subItem.href);
  };

  const handleMainItemClick = (item, e) => {
    if (item.subItems && item.subItems.length > 0) {
      e.preventDefault();

      if (isMobile) {
        if (!isOpen) {
          onToggle();
          setTimeout(() => {
            setOpenSubmenu(item.name);
          }, 100);
        } else {
          setOpenSubmenu(openSubmenu === item.name ? null : item.name);
        }
      } else {
        if (isOpen) {
          setOpenSubmenu(openSubmenu === item.name ? null : item.name);
        }
      }
    } else {
      setOpenSubmenu(null);
      if (isMobile) onToggle();
    }
  };

  const handleSubitemClick = () => {
    setOpenSubmenu(null);
    setHoverSubmenu(null);
    if (isMobile) onToggle();
  };

  const handleMouseEnter = (item) => {
    if (!isMobile && !isOpen && item.subItems) {
      setHoverSubmenu(item.name);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile && !isOpen) {
      setHoverSubmenu(null);
    }
  };

  const renderMenuItem = (item) => {
    const Icon = item.icon;
    const active = isActiveLink(item.href) || isParentActive(item);
    const hasSubitems = item.subItems && item.subItems.length > 0;
    const isSubmenuOpen = openSubmenu === item.name;
    const isHovered = hoverSubmenu === item.name;

    const buttonContent = (
      <>
        {/* Active background glow */}
        {active && (
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-gray-900/10 to-transparent rounded-xl"></div>
        )}

        <Icon
          className={`relative flex-shrink-0 w-5 h-5 transition-all duration-300 ${
            active
              ? "text-black scale-110"
              : "text-gray-600 group-hover:text-black group-hover:scale-110"
          }`}
        />

        {isOpen && (
          <span className="relative ml-3 transition-all duration-300 truncate">
            {item.name}
          </span>
        )}

        {/* Submenu indicator */}
        {isOpen && hasSubitems && (
          <ChevronDown
            className={`ml-auto w-4 h-4 transition-transform duration-300 ${
              isSubmenuOpen ? "rotate-180" : ""
            }`}
          />
        )}

        {/* Collapsed state submenu indicator */}
        {!isOpen && hasSubitems && (
          <div className="absolute -right-1 -top-1 w-2 h-2 bg-black/80 rounded-full"></div>
        )}

        {/* Active indicator */}
        {active && isOpen && !hasSubitems && (
          <div className="relative ml-auto w-2 h-2 bg-black rounded-full shadow-lg animate-pulse"></div>
        )}

        {/* Hover glow effect */}
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 bg-gradient-to-r from-gray-100/50 via-transparent to-transparent transition-opacity duration-300"></div>
      </>
    );

    const buttonClasses = `group relative flex items-center w-full px-3 py-3 text-sm font-medium rounded-xl transition-all duration-300 ease-out ${
      active
        ? "bg-gradient-to-r from-gray-100 to-gray-200 text-black border border-gray-300 shadow-lg"
        : "text-gray-700 hover:bg-gray-100 hover:text-black hover:shadow-lg"
    }`;

    const itemElement = hasSubitems ? (
      <button
        onClick={(e) => handleMainItemClick(item, e)}
        onMouseEnter={() => handleMouseEnter(item)}
        onMouseLeave={handleMouseLeave}
        className={buttonClasses}
      >
        {buttonContent}
      </button>
    ) : (
      <Link
        to={item.href}
        onClick={(e) => handleMainItemClick(item, e)}
        className={buttonClasses}
      >
        {buttonContent}
      </Link>
    );

    return (
      <div className="submenu-container">
        {itemElement}

        {/* Desktop collapsed sidebar hover submenu */}
        {!isMobile && !isOpen && isHovered && item.subItems && (
          <div className="absolute left-full top-20 ml-2 w-48 bg-white/95 backdrop-blur-xl shadow-2xl border border-gray-200 rounded-xl overflow-hidden z-[70] transition-all duration-200 animate-in slide-in-from-left-2">
            <div className="p-1 space-y-1">
              {item.subItems.map((subItem) => (
                <Link
                  key={subItem.name}
                  to={subItem.href}
                  onClick={handleSubitemClick}
                  className={`block w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-200 ${
                    isActiveLink(subItem.href)
                      ? "bg-gradient-to-r from-gray-100 to-gray-200 text-black"
                      : "text-gray-700 hover:bg-gray-100 hover:text-black"
                  }`}
                >
                  {subItem.name}
                  {isActiveLink(subItem.href) && (
                    <div className="ml-2 inline-block w-2 h-2 bg-black rounded-full shadow-lg animate-pulse"></div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Desktop expanded sidebar inline submenu */}
        {!isMobile && isOpen && isSubmenuOpen && item.subItems && (
          <div className="mt-2 ml-6 space-y-1 animate-in slide-in-from-top-2 duration-200">
            {item.subItems.map((subItem) => (
              <Link
                key={subItem.name}
                to={subItem.href}
                onClick={handleSubitemClick}
                className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  isActiveLink(subItem.href)
                    ? "bg-gradient-to-r from-gray-100 to-gray-200 text-black border-l-2 border-black"
                    : "text-gray-600 hover:bg-gray-100 hover:text-black border-l-2 border-gray-300 hover:border-gray-400"
                }`}
              >
                {subItem.name}
                {isActiveLink(subItem.href) && (
                  <div className="ml-2 inline-block w-2 h-2 bg-black rounded-full shadow-lg animate-pulse"></div>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Mobile inline submenu */}
        {isMobile && isOpen && isSubmenuOpen && item.subItems && (
          <div className="mt-2 ml-6 space-y-1 animate-in slide-in-from-top-2 duration-200">
            {item.subItems.map((subItem) => (
              <Link
                key={subItem.name}
                to={subItem.href}
                onClick={handleSubitemClick}
                className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  isActiveLink(subItem.href)
                    ? "bg-gradient-to-r from-gray-100 to-gray-200 text-black border-l-2 border-black"
                    : "text-gray-600 hover:bg-gray-100 hover:text-black border-l-2 border-gray-300 hover:border-gray-400"
                }`}
              >
                {subItem.name}
                {isActiveLink(subItem.href) && (
                  <div className="ml-2 inline-block w-2 h-2 bg-black rounded-full shadow-lg animate-pulse"></div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={onToggle}
        />
      )}

      <aside
        className={`fixed left-0 md:left-4 top-16 md:top-24 h-[calc(100vh-4rem)] md:h-[calc(100vh-7rem)] bg-white/95 backdrop-blur-xl shadow-2xl border border-gray-200 z-50 transition-all duration-300 ease-in-out ${
          isOpen ? "w-64" : isMobile ? "w-16" : "w-16"
        } ${isMobile ? "rounded-r-2xl" : "rounded-2xl"} ${
          isMobile && !isOpen
            ? "-translate-x-full opacity-0"
            : "translate-x-0 opacity-100"
        }`}
      >
        {/* Glass Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 via-transparent to-gray-100/30 rounded-2xl"></div>

        {/* Toggle Button */}
        <button
          onClick={onToggle}
          className={`absolute top-20 w-8 h-8 bg-gradient-to-br from-gray-900 to-black rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-10 group ${
            isMobile ? (isOpen ? "-right-3" : "right-4") : "-right-3"
          }`}
        >
          {isOpen ? (
            <ChevronLeft className="w-4 h-4 text-white transition-transform duration-300 group-hover:scale-110" />
          ) : (
            <ChevronRight className="w-4 h-4 text-white transition-transform duration-300 group-hover:scale-110" />
          )}
        </button>

        {/* Sidebar Content */}
        <div className="relative flex flex-col h-full">
          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
            {navigationLinks.map((item) => (
              <div key={item.name} className="menu-item">
                {renderMenuItem(item)}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50/50 to-gray-100/50 rounded-b-2xl">
            {isOpen && (
              <div className="transition-all duration-300">
                <p className="text-xs text-gray-600 text-center">
                  © {new Date().getFullYear()} {systemName || "System"}
                </p>
                <p className="text-xs text-gray-500 text-center mt-1">
                  Dashboard
                </p>
              </div>
            )}

            {/* Collapsed state indicator */}
            {!isOpen && (
              <div className="flex justify-center">
                <div className="w-6 h-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center border border-gray-300">
                  <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
