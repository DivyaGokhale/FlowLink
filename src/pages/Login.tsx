import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import Header from "../components/Header";

const Login: React.FC = () => {
  const { isAuthenticated, login, loginWithGoogle, loginWithMicrosoft } = useAuth();
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
    <>
    <Header />
    <div className="flex items-start justify-center min-h-[calc(100vh-64px)] bg-gray-50 px-4 py-10 animate-fade-in-up">
      <div className="w-full max-w-sm p-6 space-y-6 bg-white rounded-md border border-gray-200 shadow-sm">
        <div className="text-center">
          <img src="/assets/flowlink-logo-black.png" alt="FlowLink Logo" className="mx-auto w-[72px] h-[48px] object-contain" />
        </div>
        <h1 className="text-2xl font-semibold">Sign in</h1>

        {location.state?.justRegistered && (
          <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3">
            Account created. Please log in to continue.
          </div>
        )}
        {error && <p className="text-red-600 text-sm">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <label htmlFor="email" className="block mb-1 text-sm text-gray-700">Email or mobile phone number</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/30"
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="relative">
            <label htmlFor="password" className="block mb-1 text-sm text-gray-700">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/30"
              placeholder="••••••••"
              required
            />
          </div>
          <div className="text-right -mt-1">
            <a href="#" className="text-xs text-blue-700 hover:underline">Forgot Password?</a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 text-white bg-green-600 hover:bg-green-500 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99] font-medium shadow-button"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <div className="text-xs text-gray-600">By continuing, you agree to FlowLink's Conditions of Use and Privacy Notice.</div>

        <div className="relative flex items-center">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-3 text-xs text-gray-500">Or continue with</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={async () => {
              setError(null)
              setLoading(true)
              try {
                await loginWithGoogle()
                navigate(redirectTo, { replace: true })
              } catch (e: any) {
                setError(e?.message || "Google sign-in failed")
              } finally {
                setLoading(false)
              }
            }}
            className="flex items-center justify-center w-full h-10 border border-gray-300 rounded-sm hover:bg-gray-50 transition"
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google Logo" className="w-5 h-5 mr-2" />
            Google
          </button>
          <button
            type="button"
            onClick={async () => {
              setError(null)
              setLoading(true)
              try {
                await loginWithMicrosoft()
                navigate(redirectTo, { replace: true })
              } catch (e: any) {
                setError(e?.message || "Microsoft sign-in failed")
              } finally {
                setLoading(false)
              }
            }}
            className="flex items-center justify-center w-full h-10 border border-gray-300 rounded-sm hover:bg-gray-50 transition"
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="Microsoft Logo" className="w-5 h-5 mr-2" />
            Microsoft
          </button>
        </div>

        <div className="text-xs text-gray-600 border-t pt-4">
          <span className="mr-1">New to FlowLink?</span>
          <Link to="/signup" className="text-xs inline-block mt-2 w-full text-center h-9 leading-9 border border-gray-300 rounded-full hover:bg-gray-50">Create your FlowLink account</Link>
        </div>
      </div>
    </div>
    </>
  );
};

export default Login;
