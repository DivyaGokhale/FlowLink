import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";

const Signup: React.FC = () => {
  const { register } = useAuth();
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
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="w-full max-w-lg p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <img src="/assets/flowlink-logo-black.png" alt="FlowLink Logo" className="mx-auto w-[72px] h-[48px] object-contain" />
          <h1 className="text-2xl font-bold text-gray-800">Create Account</h1>
          <p className="text-sm text-gray-500">Join FlowLink and start connecting</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm mb-1" htmlFor="name">Full name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Your name"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="email">Email</label>
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
          <div>
            <label className="block text-sm mb-1" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Create a password"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="confirm">Confirm password</label>
            <input
              id="confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Re-enter password"
              required
              minLength={6}
            />
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex items-center">
            <input id="terms" type="checkbox" className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500" required />
            <label htmlFor="terms" className="block ml-2 text-sm text-gray-900">I agree to the Terms of Service and Privacy Policy</label>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg transition disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>
        <p className="text-sm text-center text-gray-600">Already have an account? <Link to="/login" className="font-medium text-green-700 hover:underline">Sign in here</Link></p>

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

export default Signup;
