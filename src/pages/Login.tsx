import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import Header from "../components/Header";
import { toast } from "react-toastify";
import { apiService } from "../lib/api";
import 'react-toastify/dist/ReactToastify.css';

const Login: React.FC = () => {
  const { isAuthenticated, login, loginWithGoogle, loginWithMicrosoft } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as any;
  const { shop } = useParams<{ shop?: string }>();
  const redirectTo = location.state?.from?.pathname || "/";

  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [lockUntil, setLockUntil] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<string>("");
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Countdown timer ref
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);

  // Check for stored lock data on component mount to persist across refreshes
  useEffect(() => {
    const storedLockData = localStorage.getItem('accountLockData');
    if (storedLockData) {
      try {
        const { email: storedEmail, lockUntil: storedLockUntil } = JSON.parse(storedLockData);
        const lockUntilDate = new Date(storedLockUntil);
        const now = new Date();
        
        // Check if lock has expired
        if (lockUntilDate > now) {
          // Account is still locked, set up the countdown
          setIsBlocked(true);
          setLockUntil(lockUntilDate);
          setEmail(storedEmail); // Set the email that was locked
          
          // Start countdown
          setCountdown(calculateCountdown(lockUntilDate));
          if (countdownInterval.current) {
            clearInterval(countdownInterval.current);
          }
          countdownInterval.current = setInterval(() => {
            setCountdown(prev => {
              if (lockUntilDate) {
                const newCountdown = calculateCountdown(lockUntilDate);
                if (newCountdown === "00:00") {
                  // Timer has expired, clear the interval and localStorage
                  if (countdownInterval.current) {
                    clearInterval(countdownInterval.current);
                    countdownInterval.current = null;
                  }
                  setIsBlocked(false);
                  setLockUntil(null);
                  localStorage.removeItem('accountLockData'); // Clear stored data
                  return newCountdown;
                }
                return newCountdown;
              }
              return prev;
            });
          }, 1000);
        } else {
          // Lock has expired, remove stored data
          localStorage.removeItem('accountLockData');
        }
      } catch (err) {
        console.error('Error parsing stored lock data:', err);
        localStorage.removeItem('accountLockData');
      }
    }
  }, []);

  const computeNextPath = (fallbackSlug?: string) => {
    const from: string | undefined = location.state?.from?.pathname;
    const isInvalidFrom = !from || /\/(login|signup|account)(\/|$)/i.test(from);
    if (!isInvalidFrom) return from!;
    const stored = (() => { try { return localStorage.getItem('shopSlug') || ''; } catch { return ''; } })();
    const slug = (shop || fallbackSlug || stored || '').trim();
    return slug ? `/${slug}` : "/";
  };

  // Function to calculate and format countdown
  const calculateCountdown = (lockUntilDate: Date) => {
    const now = new Date();
    const diff = lockUntilDate.getTime() - now.getTime();
    
    if (diff <= 0) {
      // Timer has expired
      setIsBlocked(false);
      setLockUntil(null);
      localStorage.removeItem('accountLockData'); // Clear stored data
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
        countdownInterval.current = null;
      }
      return "00:00";
    }
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Check if account is blocked
  useEffect(() => {
    const checkAccountStatus = async () => {
      if (email && email.includes('@')) { // Only check if it looks like an email
        try {
          const response = await apiService.checkLock(email);
          if (response.locked) {
            const lockUntilDate = new Date(response.lockUntil);
            setIsBlocked(true);
            setLockUntil(lockUntilDate);
            
            // Store lock data in localStorage to persist across refreshes
            localStorage.setItem('accountLockData', JSON.stringify({
              email: email,
              lockUntil: lockUntilDate.toISOString()
            }));
            
            // Start countdown
            setCountdown(calculateCountdown(lockUntilDate));
            if (countdownInterval.current) {
              clearInterval(countdownInterval.current);
            }
            countdownInterval.current = setInterval(() => {
              setCountdown(prev => {
                if (lockUntilDate) {
                  const newCountdown = calculateCountdown(lockUntilDate);
                  if (newCountdown === "00:00") {
                    // Timer has expired, clear the interval and localStorage
                    if (countdownInterval.current) {
                      clearInterval(countdownInterval.current);
                      countdownInterval.current = null;
                    }
                    setIsBlocked(false);
                    setLockUntil(null);
                    localStorage.removeItem('accountLockData'); // Clear stored data
                    return newCountdown;
                  }
                  return newCountdown;
                }
                return prev;
              });
            }, 1000);
          } else {
            setIsBlocked(false);
            setLockUntil(null);
            // Clear stored data if account is no longer locked
            const storedLockData = localStorage.getItem('accountLockData');
            if (storedLockData) {
              try {
                const { email: storedEmail } = JSON.parse(storedLockData);
                if (storedEmail === email) {
                  localStorage.removeItem('accountLockData');
                }
              } catch (err) {
                console.error('Error parsing stored lock data:', err);
              }
            }
            if (countdownInterval.current) {
              clearInterval(countdownInterval.current);
              countdownInterval.current = null;
            }
          }
        } catch (err) {
          console.error("Error checking account lock status:", err);
          // If there's an error checking, assume not blocked to not prevent login
          setIsBlocked(false);
          setLockUntil(null);
          localStorage.removeItem('accountLockData'); // Clear stored data on error
        }
      } else {
        // If email is empty or not valid, clear any existing countdown
        setIsBlocked(false);
        setLockUntil(null);
        if (countdownInterval.current) {
          clearInterval(countdownInterval.current);
          countdownInterval.current = null;
        }
        localStorage.removeItem('accountLockData'); // Clear stored data
      }
    };

    // Check immediately when component mounts or email changes
    checkAccountStatus();

    // Debounce subsequent checks to avoid too many API calls
    const timeoutId = setTimeout(() => {
      checkAccountStatus();
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
        countdownInterval.current = null;
      }
    };
  }, [email]);

  // Additional effect to initialize countdown when component mounts
  useEffect(() => {
    // Check account status on initial load regardless of email
    const initialCheck = async () => {
      if (location.state?.email) {
        setEmail(location.state.email);
      }
    };
    
    initialCheck();
  }, []); // Run once on mount

  useEffect(() => {
    if (isAuthenticated) {
      navigate(computeNextPath(), { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Basic validation
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (isBlocked) {
      setError("Account is temporarily locked. Please wait for the countdown to finish.");
      return;
    }

    setLoading(true);
    
    try {
      const result = await login(email, password);
      toast.success("Login successful!");
      const next = computeNextPath(result?.shopSlug);
      navigate(next, { replace: true });
    } catch (err: any) {
      const errorMessage = err.message || "Login failed";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordResetRequest = async () => {
    if (!resetEmail) {
      toast.error("Please enter your email address");
      return;
    }

    setResetLoading(true);
    try {
      await apiService.requestPasswordReset(resetEmail);
      setResetSuccess(true);
      toast.success("Password reset link sent! Check your email.");
      setTimeout(() => {
        setShowPasswordReset(false);
        setResetSuccess(false);
      }, 3000);
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset link");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <img src="/assets/flowlink-logo-black.png" alt="FlowLink Logo" className="mx-auto w-20 h-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
            <p className="text-gray-500 mt-2">Sign in to your account to continue</p>
          </div>

        {location.state?.justRegistered && (
          <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3">
            Account created. Please log in to continue.
          </div>
        )}
        
        {isBlocked && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">Too many failed attempts.</p>
            <p className="text-red-600">Try again in {countdown}</p>
          </div>
        )}
        
        {showPasswordReset ? (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Reset Your Password</h2>
            <p className="text-gray-600 mb-4">Enter your email to receive a password reset link</p>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  id="reset-email"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200"
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordReset(false)}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                  disabled={resetLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePasswordResetRequest}
                  disabled={resetLoading}
                  className={`flex-1 py-2.5 px-4 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 ${
                    resetLoading 
                      ? 'bg-green-400 text-white cursor-not-allowed' 
                      : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-600'
                  }`}
                >
                  {resetLoading ? 'Sending...' : 'Send Link'}
                </button>
              </div>
              
              {resetSuccess && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
                  Password reset link sent! Check your email.
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-6 mt-8">
              <div className="space-y-1">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email or phone number</label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200"
                    placeholder="Enter your email or phone"
                    required
                    disabled={isBlocked}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                  <button 
                    type="button" 
                    onClick={() => setShowPasswordReset(true)}
                    className="text-sm font-medium text-green-600 hover:text-green-500 transition"
                    disabled={isBlocked}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200"
                    placeholder="Enter your password"
                    required
                    disabled={isBlocked}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <button type="button" className="text-gray-400 hover:text-gray-500 focus:outline-none">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || isBlocked}
                className={`w-full py-3 px-4 flex items-center justify-center rounded-xl bg-green-600 text-white font-medium shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 transition-all duration-200 ${
                  loading || isBlocked ? 'opacity-75 cursor-wait' : ''
                }`}
                aria-busy={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </>
        )}
        <div className="text-xs text-gray-600">By continuing, you agree to FlowLink's Conditions of Use and Privacy Notice.</div>

        <div className="relative mt-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            type="button"
            onClick={async () => {
              setError(null)
              setLoading(true)
              try {
                await loginWithGoogle()
                navigate(computeNextPath(), { replace: true })
              } catch (e: any) {
                setError(e?.message || "Google sign-in failed")
              } finally {
                setLoading(false)
              }
            }}
            className="w-full flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
            disabled={loading || isBlocked}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" width="24" height="24">
              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.28426 53.749 C -8.52426 55.229 -9.21651 56.479 -10.0808 57.329 L -10.0808 60.609 L -6.27588 60.609 C -4.21504 58.739 -3.264 55.999 -3.264 51.509 Z"/>
                <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.80451 62.159 -6.82589 60.619 L -10.0623 57.339 C -11.0323 58.199 -12.3928 58.759 -13.8935 58.759 C -16.7159 58.759 -19.0953 56.869 -19.8277 54.269 L -23.7415 54.269 L -23.7415 57.619 C -21.7915 61.539 -18.2943 63.239 -14.754 63.239 Z"/>
                <path fill="#FBBC05" d="M -19.8277 54.269 C -20.0877 53.429 -20.2279 52.539 -20.2279 51.619 C -20.2279 50.699 -20.0877 49.809 -19.8277 48.969 L -19.8277 45.619 L -23.9036 45.619 C -24.9936 47.769 -25.544 50.169 -25.544 52.619 C -25.544 55.069 -24.9936 57.469 -23.9036 59.619 L -19.8277 54.269 Z"/>
                <path fill="#EA4335" d="M -13.9138 46.479 C -12.694 46.479 -11.5344 46.819 -10.5586 47.439 L -6.93695 43.819 C -8.55695 42.489 -11.094 41.759 -13.9138 41.759 C -18.324 41.759 -22.004 44.489 -23.9036 48.369 L -19.8277 53.719 C -18.7177 50.599 -16.004 46.479 -13.9138 46.479 Z"/>
              </g>
            </svg>
            Google
          </button>
          <button
            type="button"
            onClick={async () => {
              setError(null)
              setLoading(true)
              try {
                await loginWithMicrosoft()
                navigate(computeNextPath(), { replace: true })
              } catch (e: any) {
                setError(e?.message || "Microsoft sign-in failed")
              } finally {
                setLoading(false)
              }
            }}
            className="w-full flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
            disabled={loading || isBlocked}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.5 11.5652C22.5 10.6935 22.425 9.84783 22.2935 9.02826H11.5V13.7717H17.8587C17.663 14.9011 17.0174 15.8614 16.0543 16.5217V19.3511H19.1848C21.1965 17.4924 22.5 14.7533 22.5 11.5652Z" fill="#4285F4"/>
              <path d="M11.5 23C14.4293 23 16.9359 21.9891 18.8087 20.2587L15.913 17.7748C14.9989 18.4783 13.8152 18.9565 12.5 18.9565C9.66304 18.9565 7.27609 17.0565 6.46087 14.5H3.23913V17.4783C5.10217 21.0652 8.98913 23 11.5 23Z" fill="#34A853"/>
              <path d="M6.46087 14.5C6.16304 13.663 6 12.75 6 11.75C6 10.75 6.16304 9.83696 6.45652 9L3.24457 6.02174C2.25 7.81522 1.5 10.0435 1.5 12.25C1.5 14.4565 2.25 16.6848 3.23913 18.4783L6.46087 14.5Z" fill="#FBBC05"/>
              <path d="M11.5 4.54348C13.1685 4.54348 14.6848 5.1087 15.9239 6.20109L18.8859 3.25C16.9326 1.48913 14.4261 0.5 11.5 0.5C8.98913 0.5 5.10217 2.42391 3.24457 6.02174L6.45652 9C7.27174 6.45652 9.66304 4.54348 11.5 4.54348Z" fill="#EA4335"/>
            </svg>
            Microsoft
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-green-600 hover:text-green-600 transition-colors">
              Sign up now
            </Link>
          </p>
          <p className="mt-4 text-xs text-gray-500">
            By continuing, you agree to FlowLink's{' '}
            <a href="#" className="text-green-600 hover:text-green-700 hover:underline">Privacy Policy</a>.
          </p>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Login;