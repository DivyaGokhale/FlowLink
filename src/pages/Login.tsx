import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";

const Login: React.FC = () => {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as any;
  const redirectTo = location.state?.from?.pathname || "/";

  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md mt-12 mb-4">
        <div className="text-center">
          <img src="/assets/flowlink-logo-black.png" alt="FlowLink Logo" className="mx-auto w-[72px] h-[48px] object-contain" />
          <h1 className="text-2xl font-bold text-gray-800 mt-2">FlowLink</h1>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold">Welcome Back</h2>
          <p className="text-gray-500">Sign in to your account</p>
        </div>

        {location.state?.justRegistered && (
          <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3">
            Account created. Please log in to continue.
          </div>
        )}
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <label htmlFor="email" className="block mb-2 text-sm font-medium text-left text-gray-700">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="relative">
            <label htmlFor="password" className="block mb-2 text-sm font-medium text-left text-gray-700">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="••••••••"
              required
            />
          </div>
          <div className="text-right">
            <a href="#" className="text-sm text-gray-600 hover:underline">Forgot Password?</a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-sm text-center text-gray-600">Don't have an account? <Link to="/signup" className="font-medium text-green-700 hover:underline">Sign Up</Link></p>

        <div className="relative flex items-center">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="flex-shrink mx-4 text-sm text-gray-500">Or continue with</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <div className="flex space-x-4">
          <button type="button" className="flex items-center justify-center w-full py-2 border rounded-lg hover:bg-gray-50">
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google Logo" className="w-5 h-5 mr-2" />
            Google
          </button>
          <button type="button" className="flex items-center justify-center w-full py-2 border rounded-lg hover:bg-gray-50">
            <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="Microsoft Logo" className="w-5 h-5 mr-2" />
            Microsoft
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
