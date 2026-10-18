import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, AlertCircle, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

export const LoginPage: React.FC = () => {
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('maraayn_remember_me') === 'true';
  });
  const [identifier, setIdentifier] = useState(() => {
    const isRemembered = localStorage.getItem('maraayn_remember_me') === 'true';
    return isRemembered ? (localStorage.getItem('maraayn_saved_identifier') || '') : '';
  });
  const [password, setPassword] = useState(() => {
    const isRemembered = localStorage.getItem('maraayn_remember_me') === 'true';
    return isRemembered ? (localStorage.getItem('maraayn_saved_password') || '') : '';
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRememberToggle = (checked: boolean) => {
    setRememberMe(checked);
    if (!checked) {
      localStorage.removeItem('maraayn_remember_me');
      localStorage.removeItem('maraayn_saved_identifier');
      localStorage.removeItem('maraayn_saved_password');
    } else {
      localStorage.setItem('maraayn_remember_me', 'true');
      if (identifier.trim()) {
        localStorage.setItem('maraayn_saved_identifier', identifier.trim());
      }
      if (password) {
        localStorage.setItem('maraayn_saved_password', password);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please enter your email or username and password');
      return;
    }

    if (rememberMe) {
      localStorage.setItem('maraayn_remember_me', 'true');
      if (identifier.trim()) localStorage.setItem('maraayn_saved_identifier', identifier.trim());
      if (password) localStorage.setItem('maraayn_saved_password', password);
    } else {
      localStorage.removeItem('maraayn_remember_me');
      localStorage.removeItem('maraayn_saved_identifier');
      localStorage.removeItem('maraayn_saved_password');
    }

    setError(null);
    setLoading(true);

    try {
      const { user } = await login(identifier.trim(), password);
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
    <div className="relative min-h-[100dvh] w-full bg-gradient-to-br from-[#0a1626] via-[#10223d] to-[#162f55] flex flex-col items-center justify-center p-2.5 sm:p-6 lg:p-8 login-playfair font-playfair overflow-hidden">
      
      {/* ================= ANIMATED BACKGROUND ELEMENTS ================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Subtle Ambient Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.08]" 
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.45) 1px, transparent 1px)`,
            backgroundSize: '28px 28px'
          }}
        />

        {/* Ambient Glowing Orb 1 - Golden Amber (Top Left) */}
        <div className="absolute -top-20 -left-20 w-80 sm:w-[440px] h-80 sm:h-[440px] rounded-full bg-gradient-to-br from-[#E6AE43]/30 via-[#f59e0b]/20 to-transparent blur-[80px] sm:blur-[110px] animate-blob-1" />

        {/* Ambient Glowing Orb 2 - Deep Royal/Electric Blue (Bottom Right) */}
        <div className="absolute -bottom-24 -right-20 w-80 sm:w-[500px] h-80 sm:h-[500px] rounded-full bg-gradient-to-tl from-[#1d4ed8]/35 via-[#3b82f6]/25 to-transparent blur-[90px] sm:blur-[120px] animate-blob-2" />

        {/* Ambient Glowing Orb 3 - Soft Cyan/Teal (Center Left) */}
        <div className="absolute top-1/3 left-1/4 -translate-x-1/2 w-64 sm:w-[360px] h-64 sm:h-[360px] rounded-full bg-[#06b6d4]/15 blur-[70px] sm:blur-[100px] animate-blob-3" />

        {/* Ambient Glowing Orb 4 - Pulsing Gold Accent (Bottom Center) */}
        <div className="absolute bottom-10 left-1/3 w-60 sm:w-80 h-60 sm:h-80 rounded-full bg-[#E6AE43]/15 blur-[80px] animate-pulse-glow" />

        {/* Gentle Floating Light Particles */}
        <div className="absolute top-1/4 left-1/5 w-2 h-2 rounded-full bg-[#E6AE43]/50 blur-[1px] animate-particle-1" />
        <div className="absolute top-2/3 right-1/4 w-2.5 h-2.5 rounded-full bg-cyan-300/50 blur-[1px] animate-particle-2" />
        <div className="absolute bottom-1/4 left-1/2 w-1.5 h-1.5 rounded-full bg-white/60 blur-[1px] animate-particle-3" />
        <div className="absolute top-1/3 right-1/6 w-2 h-2 rounded-full bg-blue-300/40 blur-[1px] animate-particle-1" />
      </div>

      {/* Outer Card with Rounded Corners & Deep Drop Shadow */}
      <div className="w-full max-w-4xl bg-white/98 backdrop-blur-xl rounded-2xl sm:rounded-3xl md:rounded-[32px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.55)] overflow-hidden flex flex-col md:flex-row relative border border-white/20 md:my-auto z-10">
        
        {/* ================= LEFT SIDE: Brand Hero (Navy/Blue Gradient) ================= */}
        <div className="w-full md:w-[42%] bg-gradient-to-br from-[#142746] via-[#173868] to-[#1f4a88] text-white p-5 sm:p-7 md:p-10 flex flex-col justify-between items-center text-center relative overflow-hidden shrink-0">
          
          {/* Subtle Background Stars / Ambient Circles */}
          <div className="absolute top-4 left-6 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-6 right-6 w-40 h-40 bg-[#E6AE43]/10 rounded-full blur-2xl pointer-events-none" />

          {/* Top spacer for desktop balance */}
          <div className="hidden md:block h-2" />

          {/* Centered Brand Content */}
          <div className="relative z-10 flex flex-col items-center max-w-xs my-auto">
            {/* Top Label */}
            <span className="text-[10px] md:text-xs uppercase tracking-widest text-slate-200 font-semibold opacity-90 mb-1.5 md:mb-5">
              Welcome to
            </span>

            {/* Circular White Badge for Logo */}
            <div className="w-14 h-14 sm:w-18 sm:h-18 md:w-24 md:h-24 rounded-full bg-white flex items-center justify-center shadow-xl shadow-black/20 p-2.5 md:p-4 border-2 md:border-4 border-white/80 transition-transform duration-300 hover:scale-105">
              <img
                src="/logo.png"
                alt="Maraayn Logo"
                className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 object-contain"
              />
            </div>

            {/* Brand Title */}
            <h1 className="mt-2.5 md:mt-5 text-base sm:text-xl md:text-2xl font-extrabold tracking-tight text-white leading-snug">
              Maraayn Management System
            </h1>

            {/* Brief Description */}
            <p className="mt-1 md:mt-3 text-[10px] sm:text-xs text-slate-200/80 leading-relaxed line-clamp-2 md:line-clamp-none">
              Multi-tenant management system for retail shops, pharmacies, supermarkets, cafés, and wholesale businesses.
            </p>
          </div>

          {/* Developer Credit - Desktop only inside left panel */}
          <div className="hidden md:block relative z-10 pt-4 text-[11px] text-slate-200/90 font-medium tracking-wider">
            <span>Developer By </span>
            <a
              href="https://anazabdiwahid.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#E6AE43] font-bold hover:text-[#F8C76A] hover:underline underline-offset-2 transition-colors cursor-pointer"
              title="Visit Anas Abdiwahid Portfolio"
            >
              Anas Abdiwahid
            </a>
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
            className="md:hidden absolute left-0 right-0 -bottom-[1px] w-full h-6 pointer-events-none z-20"
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
        <div className="w-full md:w-[58%] bg-white p-5 sm:p-8 md:p-12 lg:p-14 flex flex-col justify-center relative">
          
          <div className="max-w-md w-full mx-auto">
            {/* Brand Logo - Visible on desktop only to avoid mobile duplication */}
            <div className="hidden md:flex mb-5 items-center">
              <img
                src="/logo.png"
                alt="Maraayn Management System"
                className="h-12 w-auto object-contain"
              />
            </div>

            {/* Header */}
            <div className="mb-4 sm:mb-6 md:mb-8">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#142746] tracking-tight">
                Sign in to your account
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
                Enter your Maraayn credentials to proceed
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 sm:mb-6 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} autoComplete="off" className="space-y-3.5 sm:space-y-5">
              {/* Email / Username Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 tracking-wide">
                  E-mail Address or Username
                </label>
                <div className="group relative rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 focus-within:bg-white focus-within:border-[#142746] focus-within:ring-4 focus-within:ring-[#142746]/10 transition-all duration-200 shadow-sm flex items-center px-3.5 sm:px-4 py-2.5 sm:py-3">
                  <div className="text-slate-400 group-focus-within:text-[#142746] transition-colors mr-3 shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="loginIdentifier"
                    name="loginIdentifier"
                    type="text"
                    autoComplete="off"
                    value={identifier}
                    onChange={(e) => {
                      const val = e.target.value;
                      setIdentifier(val);
                      if (rememberMe) {
                        if (val.trim()) {
                          localStorage.setItem('maraayn_saved_identifier', val.trim());
                        } else {
                          localStorage.removeItem('maraayn_saved_identifier');
                        }
                      }
                    }}
                    placeholder="Enter your email or username"
                    required
                    className="w-full bg-transparent text-base md:text-sm text-slate-800 focus:outline-none placeholder-slate-400 font-medium"
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
                <div className="group relative rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 focus-within:bg-white focus-within:border-[#142746] focus-within:ring-4 focus-within:ring-[#142746]/10 transition-all duration-200 shadow-sm flex items-center px-3.5 sm:px-4 py-2.5 sm:py-3">
                  <div className="text-slate-400 group-focus-within:text-[#142746] transition-colors mr-3 shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="loginPassword"
                    name="loginPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPassword(val);
                      if (rememberMe) {
                        if (val) {
                          localStorage.setItem('maraayn_saved_password', val);
                        } else {
                          localStorage.removeItem('maraayn_saved_password');
                        }
                      }
                    }}
                    placeholder="Enter your password"
                    required
                    className="w-full bg-transparent text-base md:text-sm text-slate-800 focus:outline-none placeholder-slate-400 font-medium tracking-wide"
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
                    checked={rememberMe}
                    onChange={(e) => handleRememberToggle(e.target.checked)}
                    className="rounded border-slate-300 text-[#142746] focus:ring-[#142746] mr-2 w-4 h-4 cursor-pointer"
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

      {/* Developer Credit - Mobile only at bottom of screen below card */}
      <div className="md:hidden relative z-10 mt-3 mb-3 text-center text-xs text-slate-200 font-medium tracking-wider select-none">
        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 shadow-sm">
          <span>Developer By&nbsp;</span>
          <a
            href="https://anazabdiwahid.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#E6AE43] font-bold hover:text-[#F8C76A] hover:underline underline-offset-2 transition-colors cursor-pointer"
            title="Visit Anas Abdiwahid Portfolio"
          >
            Anas Abdiwahid
          </a>
        </div>
      </div>
    </div>
  );
};

