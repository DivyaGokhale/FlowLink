import React from "react";
import { useAuth } from "../components/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag, ShieldCheck, MapPin, CreditCard, Crown, LogOut, Mail, Phone } from "lucide-react";
import Skeleton from "../components/ui/Skeleton";

const Profile: React.FC = () => {
  const { user, isAuthenticated, logout, hydrated, vipEligible } = useAuth();
  const navigate = useNavigate();
  const { shop } = useParams<{ shop?: string }>();

  const isLoading = !hydrated;
  const email = user?.email || "not-set@example.com";
  const name = user?.name || (email !== "not-set@example.com" ? email.split("@")[0] : "Guest");
  const phone = user?.phone || "Not provided";
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const go = (path: string) => navigate(shop ? `/${shop}${path}` : path);

  // SVG User Silhouette Icon
  const UserSilhouette = () => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className="w-full h-full"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  );

  // Account sections data
  const accountSections = [
    {
      id: "orders",
      title: "Your Orders",
      description: "Track, return, or reorder your items",
      icon: ShoppingBag,
      path: "/orders",
      color: "bg-blue-50",
      iconColor: "text-blue-600"
    },
    {
      id: "security",
      title: "Login & Security",
      description: "Manage sign-in, name, and mobile number",
      icon: ShieldCheck,
      path: "/account/login-security",
      color: "bg-purple-50",
      iconColor: "text-purple-600"
    },
    {
      id: "addresses",
      title: "Your Addresses",
      description: "Add, edit, or remove delivery addresses",
      icon: MapPin,
      path: "/account/addresses",
      color: "bg-green-50",
      iconColor: "text-green-600"
    },
    {
      id: "payments",
      title: "Payment Options",
      description: "Add or edit your payment methods",
      icon: CreditCard,
      path: "/account/payments",
      color: "bg-yellow-50",
      iconColor: "text-yellow-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="min-h-screen py-8">
        {/* Main content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {/* Modernized Profile Summary Card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100 hover:shadow-xl transition-shadow duration-300"
            >
              {isLoading ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-full flex-shrink-0 bg-gray-200" />
                  <div className="flex-1 space-y-2 min-w-0">
                    <Skeleton className="h-6 w-40 bg-gray-200" />
                    <Skeleton className="h-4 w-64 bg-gray-200" />
                    <Skeleton className="h-4 w-48 bg-gray-200" />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <Skeleton className="h-11 w-full sm:w-36 rounded-lg bg-gray-200" />
                    <Skeleton className="h-11 w-full sm:w-28 rounded-lg bg-gray-200" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6">
                  {/* Modern Avatar with SVG Silhouette */}
                  <div className="relative flex-shrink-0">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center border border-green-200">
                      <div className="h-8 w-8 text-green-700">
                        <UserSilhouette />
                      </div>
                    </div>
                    {vipEligible && (
                      <div className="absolute -bottom-1 -right-1 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-0.5 text-xs font-medium shadow-lg">
                        <Crown size={12} /> VIP
                      </div>
                    )}
                  </div>

                  {/* Info with Modern Typography */}
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl md:text-2xl font-bold text-green-800 mb-2 font-sans">
                      Hello, {name}
                      {vipEligible && (
                        <span className="ml-2 hidden sm:inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 px-2 py-0.5 text-xs font-medium">
                          <Crown size={12} /> VIP Member
                        </span>
                      )}
                    </h1>
                    <div className="flex flex-col gap-1.5 text-sm text-green-700">
                      <span className="inline-flex items-center gap-2">
                        <Mail size={16} />
                        {email}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Phone size={16} />
                        {phone}
                      </span>
                    </div>
                  </div>

                  {/* Actions with Improved Spacing */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
                    <button
                      onClick={() => navigate(shop ? `/${shop}/account/login-security` : '/account/login-security')}
                      className="min-h-[44px] px-4 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 text-white border border-white hover:from-green-600 hover:to-emerald-600 font-medium transition-all shadow-md text-sm sm:text-base"
                    >
                      Manage Account
                    </button>
                    {isAuthenticated && (
                      <button
                        onClick={logout}
                        className="min-h-[44px] px-4 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 text-white border border-white hover:from-green-700 hover:to-emerald-700 font-medium transition-all shadow-md inline-flex items-center justify-center gap-2 text-sm sm:text-base"
                      >
                        <LogOut size={18} /> Sign out
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
            {/* End of motion.div */}
            <div className="mt-10">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 px-2">Account Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {accountSections.map((section) => (
                  <div 
                    key={section.id}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => go(section.path)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${section.color}`}>
                        <section.icon className={`w-6 h-6 ${section.iconColor}`} />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{section.title}</h3>
                        <p className="text-sm text-gray-500">{section.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;