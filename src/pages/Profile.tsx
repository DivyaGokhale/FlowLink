import React from "react";
import BackButton from "../components/BackButton";
import { useAuth } from "../components/AuthContext";
import { useNavigate, useParams } from "react-router-dom";

const Profile: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { shop } = useParams<{ shop?: string }>();

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
      <BackButton fallbackPath={shop ? `/${shop}` : "/"} />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Top Card: Greeting */}
          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-card mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-green-600 text-white flex items-center justify-center text-xl font-semibold">
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
                  className="h-9 px-4 rounded-full border border-gray-300 bg-green-500 hover:bg-green-600 text-black hover:brightness-95 text-sm shadow-button"
                >
                  Sign out
                </button>
              )}
            </div>
          </div>

          {/* Grid like Account page */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Your Orders */}
            <section className="bg-white border border-gray-100 rounded-xl p-5 shadow-card">
              <h2 className="text-base font-semibold mb-1">Your Orders</h2>
              <p className="text-sm text-gray-600 mb-3">Track, return, or buy things again.</p>
              <button
                onClick={() => go("/orders")}
                className="h-9 px-4 rounded-full bg-green-600 text-white hover:brightness-95 text-sm shadow-button"
              >
                View Orders
              </button>
            </section>

            {/* Login & Security */}
            <section className="bg-white border border-gray-100 rounded-xl p-5 shadow-card">
              <h2 className="text-base font-semibold mb-1">Login & Security</h2>
              <p className="text-sm text-gray-600 mb-3">Edit login, name, and mobile number.</p>
              <button
                onClick={() => navigate(shop ? `/${shop}/account/login-security` : '/account/login-security')}
                className="h-9 px-4 rounded-full bg-green-600 text-white hover:brightness-95 text-sm shadow-button"
              >
                Manage
              </button>
            </section>

            {/* Addresses */}
            <section className="bg-white border border-gray-100 rounded-xl p-5 shadow-card">
              <h2 className="text-base font-semibold mb-1">Your Addresses</h2>
              <p className="text-sm text-gray-600 mb-3">Edit addresses for orders and gifts.</p>
              <button
                onClick={() => go("/account/addresses")}
                className="h-9 px-4 rounded-full bg-green-600 text-white hover:brightness-95 text-sm shadow-button"
              >
                Manage Addresses
              </button>
            </section>

            {/* Payment options */}
            <section className="bg-white border border-gray-100 rounded-xl p-5 shadow-card">
              <h2 className="text-base font-semibold mb-1">Payment Options</h2>
              <p className="text-sm text-gray-600 mb-3">Add or edit payment methods.</p>
              <button
                onClick={() => navigate(shop ? `/${shop}/account/payments` : '/account/payments')}
                className="h-9 px-4 rounded-full bg-green-600 text-white hover:brightness-95 text-sm shadow-button"
              >
                Manage Payments
              </button>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
