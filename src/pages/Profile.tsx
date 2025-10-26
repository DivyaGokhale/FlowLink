import React from "react";
import { useAuth } from "../components/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag, ShieldCheck, MapPin, CreditCard, Crown, LogOut, Mail, Phone, ArrowRight } from "lucide-react";
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

  return (
    <div className="min-h-screen">
      {/* <BackButton fallbackPath={shop ? `/${shop}` : "/"} /> */}
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Hero / Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 via-emerald-600 to-cyan-500 text-white p-6 md:p-8 shadow-xl"
          >
            {/* Decorative background */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -left-12 bottom-0 h-40 w-40 rounded-full bg-black/10 blur-2xl" />

            {isLoading ? (
              <div className="flex items-center gap-5">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-72" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <div className="hidden md:flex gap-3">
                  <Skeleton className="h-10 w-36 rounded-full" />
                  <Skeleton className="h-10 w-28 rounded-full" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row md:items-center gap-5">
                {/* Avatar */}
                <div className="relative">
                  <div className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-white/15 ring-2 ring-white/30 flex items-center justify-center text-2xl md:text-3xl font-semibold">
                    {initials}
                  </div>
                  {vipEligible && (
                    <div className="absolute -bottom-1 -right-1 inline-flex items-center gap-1 rounded-full bg-white/90 text-teal-700 px-2 py-0.5 text-xs font-medium shadow">
                      <Crown size={14} /> VIP
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl md:text-3xl font-semibold tracking-tight flex items-center gap-2">
                    Hello, {name}
                    {vipEligible && (
                      <span className="hidden md:inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium">
                        <Crown size={14} /> VIP Member
                      </span>
                    )}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-white/90 text-sm">
                    <span className="inline-flex items-center gap-2"><Mail size={16} /> {email}</span>
                    <span className="inline-flex items-center gap-2"><Phone size={16} /> {phone}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate(shop ? `/${shop}/account/login-security` : '/account/login-security')}
                    className="h-10 px-4 rounded-full bg-white text-teal-700 hover:bg-white/90 font-medium shadow-button transition"
                  >
                    Manage Account
                  </button>
                  {isAuthenticated && (
                    <button
                      onClick={logout}
                      className="h-10 px-4 rounded-full border border-white/40 text-white hover:bg-white/10 font-medium transition inline-flex items-center gap-2"
                    >
                      <LogOut size={18} /> Sign out
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>

          {/* Quick actions grid */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white/90 backdrop-blur border border-gray-100 rounded-xl p-5 shadow-card">
                  <Skeleton className="h-10 w-10 rounded-lg mb-3" />
                  <Skeleton className="h-5 w-2/3 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))
            ) : (
              <>
                {/* Orders */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.35 }}
                  className="group bg-white/90 backdrop-blur border border-gray-100 rounded-xl p-5 shadow-card hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-700 inline-flex items-center justify-center">
                      <ShoppingBag size={20} />
                    </div>
                  </div>
                  <h2 className="mt-3 text-base font-semibold">Your Orders</h2>
                  <p className="mt-1 text-sm text-gray-600">Track, return, or reorder your items.</p>
                  <button
                    onClick={() => go('/orders')}
                    className="mt-4 inline-flex items-center gap-2 h-9 px-3 rounded-full border border-gray-300 hover:bg-gray-50 text-sm"
                  >
                    View Orders <ArrowRight size={16} />
                  </button>
                </motion.div>

                {/* Login & Security */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.4, delay: 0.05 }}
                  className="group bg-white/90 backdrop-blur border border-gray-100 rounded-xl p-5 shadow-card hover:shadow-lg transition-all"
                >
                  <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-700 inline-flex items-center justify-center">
                    <ShieldCheck size={20} />
                  </div>
                  <h2 className="mt-3 text-base font-semibold">Login & Security</h2>
                  <p className="mt-1 text-sm text-gray-600">Manage sign-in, name, and mobile number.</p>
                  <button
                    onClick={() => navigate(shop ? `/${shop}/account/login-security` : '/account/login-security')}
                    className="mt-4 inline-flex items-center gap-2 h-9 px-3 rounded-full border border-gray-300 hover:bg-gray-50 text-sm"
                  >
                    Manage <ArrowRight size={16} />
                  </button>
                </motion.div>

                {/* Addresses */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.45, delay: 0.1 }}
                  className="group bg-white/90 backdrop-blur border border-gray-100 rounded-xl p-5 shadow-card hover:shadow-lg transition-all"
                >
                  <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-700 inline-flex items-center justify-center">
                    <MapPin size={20} />
                  </div>
                  <h2 className="mt-3 text-base font-semibold">Your Addresses</h2>
                  <p className="mt-1 text-sm text-gray-600">Add, edit, or remove delivery addresses.</p>
                  <button
                    onClick={() => go('/account/addresses')}
                    className="mt-4 inline-flex items-center gap-2 h-9 px-3 rounded-full border border-gray-300 hover:bg-gray-50 text-sm"
                  >
                    Manage Addresses <ArrowRight size={16} />
                  </button>
                </motion.div>

                {/* Payment Options */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                  className="group bg-white/90 backdrop-blur border border-gray-100 rounded-xl p-5 shadow-card hover:shadow-lg transition-all"
                >
                  <div className="h-10 w-10 rounded-lg bg-rose-50 text-rose-700 inline-flex items-center justify-center">
                    <CreditCard size={20} />
                  </div>
                  <h2 className="mt-3 text-base font-semibold">Payment Options</h2>
                  <p className="mt-1 text-sm text-gray-600">Add or edit your payment methods.</p>
                  <button
                    onClick={() => navigate(shop ? `/${shop}/account/payments` : '/account/payments')}
                    className="mt-4 inline-flex items-center gap-2 h-9 px-3 rounded-full border border-gray-300 hover:bg-gray-50 text-sm"
                  >
                    Manage Payments <ArrowRight size={16} />
                  </button>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
