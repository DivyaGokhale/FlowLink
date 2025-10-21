import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import BackButton from "../components/BackButton";
import { useAuth } from "../components/AuthContext";
import { useNavigate, useParams } from "react-router-dom";

const Profile: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { shop } = useParams<{ shop?: string }>();

  const email = user?.email || "not-set@example.com";
  const name = user?.name || (email !== "not-set@example.com" ? email.split("@")[0] : "Guest");
  const phone = (user as any)?.phone || "Not provided";
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const go = (path: string) => navigate(shop ? `/${shop}${path}` : path);

  return (
    <>
      <Header />
      <BackButton fallbackPath={shop ? `/${shop}` : "/"} />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Top Card: Greeting */}
          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-card mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xl font-semibold">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-semibold truncate">Hello, {name}</h1>
                <p className="text-sm text-gray-600 truncate">{email}</p>
                <p className="text-sm text-gray-600">{phone}</p>
              </div>
              {isAuthenticated && (
                <button
                  onClick={logout}
                  className="h-9 px-4 rounded-full border border-gray-300 hover:bg-gray-50 text-sm"
                >
                  Sign out
                </button>
              )}
            </div>
          </div>

          {/* Grid like Amazon Account page */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Your Orders */}
            <section className="bg-white border border-gray-100 rounded-xl p-5 shadow-card">
              <h2 className="text-base font-semibold mb-1">Your Orders</h2>
              <p className="text-sm text-gray-600 mb-3">Track, return, or buy things again.</p>
              <button
                onClick={() => go("/orders")}
                className="h-9 px-4 rounded-full bg-[hsl(var(--primary))] text-white hover:brightness-95 text-sm shadow-button"
              >
                View Orders
              </button>
            </section>

            {/* Login & Security */}
            <section className="bg-white border border-gray-100 rounded-xl p-5 shadow-card">
              <h2 className="text-base font-semibold mb-1">Login & Security</h2>
              <p className="text-sm text-gray-600 mb-3">Edit login, name, and mobile number.</p>
              <button
                disabled
                className="h-9 px-4 rounded-full border border-gray-300 text-sm text-gray-500 cursor-not-allowed"
              >
                Manage
              </button>
            </section>

            {/* Addresses */}
            <section className="bg-white border border-gray-100 rounded-xl p-5 shadow-card">
              <h2 className="text-base font-semibold mb-1">Your Addresses</h2>
              <p className="text-sm text-gray-600 mb-3">Edit addresses for orders and gifts.</p>
              <button
                onClick={() => go("/addToCart")}
                className="h-9 px-4 rounded-full border border-gray-300 hover:bg-gray-50 text-sm"
              >
                Manage Addresses
              </button>
            </section>

            {/* Payment options */}
            <section className="bg-white border border-gray-100 rounded-xl p-5 shadow-card">
              <h2 className="text-base font-semibold mb-1">Payment Options</h2>
              <p className="text-sm text-gray-600 mb-3">Add or edit payment methods.</p>
              <button
                onClick={() => go("/payment")}
                className="h-9 px-4 rounded-full border border-gray-300 hover:bg-gray-50 text-sm"
              >
                Manage Payments
              </button>
            </section>

            {/* Contact Preferences */}
            <section className="bg-white border border-gray-100 rounded-xl p-5 shadow-card">
              <h2 className="text-base font-semibold mb-1">Contact Preferences</h2>
              <p className="text-sm text-gray-600 mb-3">Choose what we contact you about.</p>
              <button
                disabled
                className="h-9 px-4 rounded-full border border-gray-300 text-sm text-gray-500 cursor-not-allowed"
              >
                Manage Preferences
              </button>
            </section>

            {/* Prime-like badge (informational) */}
            <section className="bg-white border border-gray-100 rounded-xl p-5 shadow-card">
              <h2 className="text-base font-semibold mb-1">Membership</h2>
              <p className="text-sm text-gray-600 mb-3">View your benefits and offers.</p>
              <button
                disabled
                className="h-9 px-4 rounded-full border border-gray-300 text-sm text-gray-500 cursor-not-allowed"
              >
                View Details
              </button>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Profile;
