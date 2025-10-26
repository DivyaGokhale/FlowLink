import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Spinner from "./ui/Spinner";

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, hydrated } = useAuth();
  const location = useLocation();

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-gray-600">
          <Spinner />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // If the first path segment looks like a shop slug, send the user to
    // that shop's account login route so we can preserve the slug context.
    const firstSeg = location.pathname.split('/').filter(Boolean)[0] || '';
    const RESERVED = new Set([
      'login','signup','product','addToCart','payment','shop','orders','order','profile','category','cart','review','order-confirmed','account'
    ]);
    const shopSlug = firstSeg && !RESERVED.has(firstSeg) ? firstSeg : '';
    const loginPath = shopSlug ? `/${shopSlug}/account` : '/login';
    return <Navigate to={loginPath} replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;
