import React, { ReactNode } from "react";
import { Link } from "react-router-dom";

interface FooterLayoutProps {
  children: ReactNode;
  activePage: string;
}

const FooterLayout: React.FC<FooterLayoutProps> = ({ children, activePage }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-1/4 xl:w-1/5">
              <div className="sticky top-24">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <nav className="space-y-1">
                    <div className="flex flex-col">
                      <Link
                        to="/about"
                        className={`py-3 px-4 text-sm font-medium transition-colors duration-200 ${
                          activePage === "/about"
                            ? "bg-green-50 text-green-700 border-r-2 border-green-600"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        About Us
                      </Link>
                      <Link
                        to="/contact"
                        className={`py-3 px-4 text-sm font-medium transition-colors duration-200 ${
                          activePage === "/contact"
                            ? "bg-green-50 text-green-700 border-r-2 border-green-600"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        Contact
                      </Link>
                      <Link
                        to="/privacy-policy"
                        className={`py-3 px-4 text-sm font-medium transition-colors duration-200 ${
                          activePage === "/privacy-policy"
                            ? "bg-green-50 text-green-700 border-r-2 border-green-600"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        Privacy Policy
                      </Link>
                      <Link
                        to="/cookie-policy"
                        className={`py-3 px-4 text-sm font-medium transition-colors duration-200 ${
                          activePage === "/cookie-policy"
                            ? "bg-green-50 text-green-700 border-r-2 border-green-600"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        Cookie Policy
                      </Link>
                    </div>
                  </nav>
                </div>
              </div>
            </div>
            <div className="lg:w-3/4 xl:w-4/5">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
                {children}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FooterLayout;