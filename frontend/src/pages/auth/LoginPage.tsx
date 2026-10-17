import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, AlertCircle, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

export const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please enter your email or username and password');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { user } = await login(identifier, password);
      if (user.platformRole === 'SUPER_ADMIN' || user.platformRole === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/business');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Invalid email/username or password. Please check your credentials.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#DDE3EA] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      {/* Outer Card with Rounded Corners & Deep Drop Shadow */}
      <div className="w-full max-w-4xl bg-white rounded-[32px] shadow-2xl shadow-slate-400/30 overflow-hidden flex flex-col md:flex-row relative border border-slate-200/60 min-h-[540px]">
        
        {/* ================= LEFT SIDE: Brand Hero (Navy/Blue Gradient) ================= */}
        <div className="w-full md:w-[42%] bg-gradient-to-br from-[#142746] via-[#173868] to-[#1f4a88] text-white p-8 sm:p-10 flex flex-col justify-center items-center text-center relative overflow-hidden shrink-0">
          
          {/* Subtle Background Stars / Ambient Circles */}
          <div className="absolute top-4 left-6 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-6 right-6 w-40 h-40 bg-[#E6AE43]/10 rounded-full blur-2xl pointer-events-none" />

          {/* Centered Brand Content (Raised to optical center) */}
          <div className="relative z-10 flex flex-col items-center max-w-xs -mt-4">
            {/* Top Label */}
            <span className="text-xs uppercase tracking-widest text-slate-200 font-semibold opacity-90 mb-5">
              Welcome to
            </span>

            {/* Circular White Badge for Logo */}
            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-xl shadow-black/20 p-4 border-4 border-white/80 transition-transform duration-300 hover:scale-105">
              <img
                src="/logo.png"
                alt="Maraayn Logo"
                className="w-16 h-16 object-contain"
              />
            </div>

            {/* Brand Title */}
            <h1 className="mt-5 text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-snug">
              Maraayn Management System
            </h1>

            {/* Brief Description */}
            <p className="mt-3 text-[11px] sm:text-xs text-slate-200/80 leading-relaxed">
              Multi-tenant management system for retail shops, pharmacies, supermarkets, cafés, and wholesale businesses.
            </p>
          </div>

          {/* Desktop Cloud Scallop Divider (Right Edge of Left Panel) */}
          <svg
            className="hidden md:block absolute -right-[1px] top-0 bottom-0 h-full w-14 pointer-events-none z-20"
            viewBox="0 0 50 540"
            preserveAspectRatio="none"
            fill="none"
          >
            {/* Deep Translucent Cloud Layer 1 */}
            <path
              d="M 50,0 C 25,20 20,60 38,85 C 15,115 10,165 35,195 C 8,230 10,290 34,320 C 12,355 16,410 38,440 C 22,470 25,510 50,540 L 50,540 Z"
              fill="rgba(255, 255, 255, 0.2)"
            />
            {/* Middle Translucent Cloud Layer 2 */}
            <path
              d="M 50,0 C 32,25 28,65 44,90 C 22,120 18,170 40,200 C 16,235 18,295 40,325 C 20,360 24,415 44,445 C 30,475 32,515 50,540 L 50,540 Z"
              fill="rgba(255, 255, 255, 0.45)"
            />
            {/* Solid White Front Cloud Layer */}
            <path
              d="M 50,0 C 38,30 35,70 48,95 C 28,125 25,175 45,205 C 24,240 26,300 46,330 C 28,365 32,420 48,450 C 36,480 38,520 50,540 L 50,540 Z"
              fill="#FFFFFF"
            />
          </svg>

          {/* Mobile Cloud Scallop Divider (Bottom Edge of Left Panel) */}
          <svg
            className="md:hidden absolute left-0 right-0 -bottom-[1px] w-full h-10 pointer-events-none z-20"
            viewBox="0 0 540 50"
            preserveAspectRatio="none"
            fill="none"
          >
            <path
              d="M 0,50 C 20,25 60,20 85,38 C 115,15 165,10 195,35 C 230,8 290,10 320,34 C 355,12 410,16 440,38 C 470,22 510,25 540,50 Z"
              fill="#FFFFFF"
            />
          </svg>
        </div>

        {/* ================= RIGHT SIDE: Login Form (White Background) ================= */}
        <div className="w-full md:w-[58%] bg-white p-8 sm:p-12 lg:p-14 flex flex-col justify-center relative">
          
          <div className="max-w-md w-full mx-auto">
            {/* Brand Logo */}
            <div className="mb-5 flex items-center">
              <img
                src="/logo.png"
                alt="Maraayn Management System"
                className="h-12 w-auto object-contain"
              />
            </div>

            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#142746] tracking-tight">
                Sign in to your account
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your Maraayn credentials to proceed
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email / Username Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 tracking-wide">
                  E-mail Address or Username
                </label>
                <div className="group relative rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 focus-within:bg-white focus-within:border-[#142746] focus-within:ring-4 focus-within:ring-[#142746]/10 transition-all duration-200 shadow-sm flex items-center px-4 py-3">
                  <div className="text-slate-400 group-focus-within:text-[#142746] transition-colors mr-3 shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter your email or username"
                    required
                    className="w-full bg-transparent text-xs sm:text-sm text-slate-800 focus:outline-none placeholder-slate-400 font-medium"
                  />
                  {identifier && (
                    <div className="ml-2 shrink-0">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 tracking-wide">
                    Password
                  </label>
                  <a
                    href="#"
                    className="text-[11px] font-semibold text-[#142746] hover:text-[#E6AE43] hover:underline transition-colors"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="group relative rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 focus-within:bg-white focus-within:border-[#142746] focus-within:ring-4 focus-within:ring-[#142746]/10 transition-all duration-200 shadow-sm flex items-center px-4 py-3">
                  <div className="text-slate-400 group-focus-within:text-[#142746] transition-colors mr-3 shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full bg-transparent text-xs sm:text-sm text-slate-800 focus:outline-none placeholder-slate-400 font-medium tracking-wide"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="ml-2 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-all shrink-0"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Terms / Remember me Checkbox */}
              <div className="flex items-center text-xs pt-0.5">
                <label className="flex items-center text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-slate-300 text-[#142746] focus:ring-[#142746] mr-2 w-4 h-4"
                  />
                  <span>Remember me on this device</span>
                </label>
              </div>

              {/* Action Buttons (Pill shaped) */}
              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-[#142746] via-[#1a3868] to-[#1f4a88] hover:from-[#0f2038] hover:to-[#173a6d] text-white font-bold text-xs sm:text-sm py-3 px-8 rounded-full shadow-lg shadow-[#142746]/25 hover:shadow-xl transition-all disabled:opacity-50 flex items-center space-x-1.5"
                >
                  {loading ? (
                    <span>Signing In...</span>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setError('Please contact your administrator to register a new market or user.');
                  }}
                  className="border border-slate-300 hover:border-slate-400 text-slate-600 hover:text-slate-800 font-semibold text-xs py-3 px-6 rounded-full hover:bg-slate-50 transition-colors"
                >
                  Sign Up
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

