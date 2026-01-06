import React from "react";
import { Link, useLocation } from "react-router-dom";

interface FooterSidebarProps {
  activePage?: string;
}

const FooterSidebar: React.FC<FooterSidebarProps> = ({ activePage }) => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return activePage ? activePage === path : location.pathname === path;
  };

  const navItems = [
    { path: "/about", label: "About Us" },
    { path: "/contact", label: "Contact" },
    { path: "/privacy-policy", label: "Privacy Policy" },
    { path: "/cookie-policy", label: "Cookie Policy" },
  ];

  return (
    <div className="flex flex-col">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`py-3 px-4 text-sm font-medium transition-colors duration-200 ${
            isActive(item.path)
              ? "bg-green-50 text-green-700 border-r-2 border-green-600"
              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
};

export default FooterSidebar;