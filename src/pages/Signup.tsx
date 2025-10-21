import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";

const Signup: React.FC = () => {
  const { register, loginWithGoogle, loginWithMicrosoft } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await register({ name, email, password });
      // If token not returned, user will still be unauthenticated and should log in.
      navigate("/login", { replace: true, state: { justRegistered: true, email } });
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-start justify-center min-h-screen bg-gray-50 px-4 py-10 animate-fade-in-up">
      <div className="w-full max-w-sm p-6 space-y-6 bg-white rounded-md border border-gray-200 shadow-sm">
        <div className="text-center">
          <img src="/assets/flowlink-logo-black.png" alt="FlowLink Logo" className="mx-auto w-[72px] h-[48px] object-contain" />
        </div>
        <h1 className="text-2xl font-semibold">Create account</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm mb-1 text-gray-700" htmlFor="name">Your name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/30"
              placeholder="First and last name"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-700" htmlFor="email">Email</label>
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
          <div>
            <label className="block text-sm mb-1 text-gray-700" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/30"
              placeholder="At least 6 characters"
              required
              minLength={6}
            />
            <p className="text-xs text-gray-500 mt-1">i.e., a mix of letters and numbers</p>
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-700" htmlFor="confirm">Re-enter password</label>
            <input
              id="confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/30"
              placeholder="Re-enter password"
              required
              minLength={6}
            />
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex items-start gap-2">
            <input id="terms" type="checkbox" className="mt-1 w-4 h-4 accent-[hsl(var(--primary))] border-gray-300 rounded focus:ring-[hsl(var(--primary))]/40" required />
            <label htmlFor="terms" className="block text-sm text-gray-900">I agree to the Terms of Service and Privacy Policy</label>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-[hsl(var(--primary))] text-white rounded-full hover:brightness-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]/30 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99] font-medium shadow-button"
          >
            {loading ? "Creating account..." : "Create your FlowLink account"}
          </button>
        </form>

        <div className="relative flex items-center">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-3 text-xs text-gray-500">Or continue with</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={async () => {
              try {
                await loginWithGoogle();
                navigate("/", { replace: true });
              } catch (e) {}
            }}
            className="flex items-center justify-center w-full h-10 border border-gray-300 rounded-sm hover:bg-gray-50 transition"
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google Logo" className="w-5 h-5 mr-2" />
            Google
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                await loginWithMicrosoft();
                navigate("/", { replace: true });
              } catch (e) {}
            }}
            className="flex items-center justify-center w-full h-10 border border-gray-300 rounded-sm hover:bg-gray-50 transition"
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="Microsoft Logo" className="w-5 h-5 mr-2" />
            Microsoft
          </button>
        </div>

        <div className="text-xs text-gray-600">
          Already have an account? <Link to="/login" className="text-blue-700 hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
