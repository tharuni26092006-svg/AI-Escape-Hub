import React, { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  Mail,
  Smartphone,
  Lock,
  User,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Send,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { authService } from '../services/authService';
import { sound } from '../services/soundEngine';
import { UserAccount, AvatarCustomization } from '../types';
import { AVATAR_PRESETS } from '../game/catalog';
import { AvatarFigurePreview } from './AvatarFigurePreview';

interface CountryCode {
  code: string;
  dial: string;
  name: string;
  flag: string;
}

const COUNTRY_CODES: CountryCode[] = [
  { code: 'IN', dial: '+91', name: 'India', flag: '🇮🇳' },
  { code: 'US', dial: '+1', name: 'USA / Canada', flag: '🇺🇸' },
  { code: 'GB', dial: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'AE', dial: '+971', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'AU', dial: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: 'SG', dial: '+65', name: 'Singapore', flag: '🇸🇬' },
  { code: 'MY', dial: '+60', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'SA', dial: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'LK', dial: '+94', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: 'NP', dial: '+977', name: 'Nepal', flag: '🇳🇵' },
  { code: 'BD', dial: '+880', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'PK', dial: '+92', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'DE', dial: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', dial: '+33', name: 'France', flag: '🇫🇷' },
  { code: 'JP', dial: '+81', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', dial: '+82', name: 'South Korea', flag: '🇰🇷' },
  { code: 'ID', dial: '+62', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'PH', dial: '+63', name: 'Philippines', flag: '🇵🇭' },
  { code: 'ZA', dial: '+27', name: 'South Africa', flag: '🇿🇦' },
  { code: 'BR', dial: '+55', name: 'Brazil', flag: '🇧🇷' },
  { code: 'NG', dial: '+234', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'KE', dial: '+254', name: 'Kenya', flag: '🇰🇪' },
  { code: 'NZ', dial: '+64', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'IT', dial: '+39', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', dial: '+34', name: 'Spain', flag: '🇪🇸' },
];

interface AuthViewProps {
  onAuthenticated: (user: UserAccount) => void;
  initialMode?: 'signin' | 'signup';
}

type AuthMode =
  | 'signin'
  | 'signup'
  | 'signup_otp'
  | 'forgot_email'
  | 'forgot_otp'
  | 'forgot_new_password';

export const AuthView: React.FC<AuthViewProps> = ({ onAuthenticated, initialMode = 'signin' }) => {
  // Navigation Mode
  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Common Form States
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Sign Up Specific States
  const [contactType, setContactType] = useState<'email' | 'mobile'>('email');
  const [contactValue, setContactValue] = useState<string>('');
  const [selectedDialCode, setSelectedDialCode] = useState<string>('+91');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [gender, setGender] = useState<'male' | 'female'>('female');
  const [selectedAvatarPresetId, setSelectedAvatarPresetId] = useState<string>('female_cyan_aesthetic');
  const [signupOtpCode, setSignupOtpCode] = useState<string>('');

  // Forgot Password / OTP States
  const [resetEmail, setResetEmail] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState<boolean>(false);

  // Google Account Chooser Modal
  const [showGoogleModal, setShowGoogleModal] = useState<boolean>(false);
  const [googleCustomEmail, setGoogleCustomEmail] = useState<string>('');

  // Feedback Messages
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Auto-clear success banner after 6 seconds
  useEffect(() => {
    if (successBanner) {
      const t = setTimeout(() => setSuccessBanner(null), 6000);
      return () => clearTimeout(t);
    }
  }, [successBanner]);

  // 1. Handle Sign In
  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playUiClick();
    setError(null);

    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    const res = authService.signIn(username, password);
    if (res.success && res.user) {
      sound.playKeyPickup();
      onAuthenticated(res.user);
    } else {
      setError(res.message);
    }
  };

  // 2. Handle Sign Up -> Step 1: Send OTP to Email/Mobile
  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playUiClick();
    setError(null);

    const cleanUser = username.trim();
    if (!cleanUser || cleanUser.length < 2) {
      setError('Username must be at least 2 characters.');
      return;
    }

    const cleanContact = contactValue.trim();
    if (!cleanContact) {
      setError(`Please enter your ${contactType === 'email' ? 'Gmail / Email address' : 'Mobile number'}.`);
      return;
    }

    if (contactType === 'mobile' && cleanContact.replace(/[^0-9]/g, '').length < 7) {
      setError('Please enter a valid mobile number (at least 7 to 10 digits).');
      return;
    }

    if (!password || password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your password check.');
      return;
    }

    const target = contactType === 'email' ? cleanContact : `${selectedDialCode} ${cleanContact}`;
    const otpRes = authService.requestSignupOtp(target, cleanUser);
    if (otpRes.success) {
      sound.playUiClick();
      setSuccessBanner(
        `Verification code sent to ${target}! Please check your ${contactType === 'email' ? 'email inbox' : 'SMS'} to verify and complete registration.`
      );
      setMode('signup_otp');
      setSignupOtpCode('');
    } else {
      setError(otpRes.message);
    }
  };

  // 2b. Handle Sign Up -> Step 2: Verify OTP and finalize Registration -> Go to Sign In
  const handleVerifySignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playUiClick();
    setError(null);

    const cleanContact = contactValue.trim();
    const target = contactType === 'email' ? cleanContact : `${selectedDialCode} ${cleanContact}`;
    const verifyRes = await authService.verifySignupOtp(target, signupOtpCode);

    if (!verifyRes.success) {
      setError(verifyRes.message);
      return;
    }

    // OTP Verified! Register user and redirect to Sign In
    const cleanUser = username.trim();
    const chosenPreset = AVATAR_PRESETS.find((p) => p.id === selectedAvatarPresetId);
    const chosenAvatar = chosenPreset ? { ...chosenPreset.avatar, gender: gender } : undefined;

    const res = authService.signUp({
      username: cleanUser,
      name: cleanUser,
      email: contactType === 'email' ? cleanContact : undefined,
      phone: contactType === 'mobile' ? `${selectedDialCode} ${cleanContact}` : undefined,
      password: password,
      gender: gender,
      avatar: chosenAvatar,
      autoLogin: false, // Redirect to Sign In page upon successful registration
    });

    if (res.success) {
      sound.playKeyPickup();
      setSuccessBanner(`Account verified & registered successfully for "${cleanUser}"! Please sign in with your credentials.`);
      setMode('signin');
      setPassword('');
      setConfirmPassword('');
      setSignupOtpCode('');
      setError(null);
    } else {
      setError(res.message);
    }
  };

  // 3. Handle Forgot Password - Step 1: Send OTP to Email
  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playUiClick();
    setError(null);

    if (!resetEmail.trim()) {
      setError('Please enter your registered Gmail or Email address.');
      return;
    }

    const res = authService.requestPasswordResetOtp(resetEmail);
    if (res.success && res.otp) {
      sound.playUiClick();
      setSuccessBanner(`Verification OTP sent to ${res.email || resetEmail}! Please check your email inbox.`);
      setMode('forgot_otp');
      setOtpCode('');
    } else {
      setError(res.message);
    }
  };

  // 4. Handle Forgot Password - Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playUiClick();
    setError(null);

    if (!otpCode.trim()) {
      setError('Please enter the 6-digit OTP verification code.');
      return;
    }

    const res = await authService.verifyResetOtp(resetEmail, otpCode);
    if (res.success) {
      sound.playKeyPickup();
      setSuccessBanner('OTP Code verified! Please set your new password.');
      setMode('forgot_new_password');
      setNewPassword('');
      setConfirmNewPassword('');
    } else {
      setError(res.message);
    }
  };

  // 5. Handle Forgot Password - Step 3: Set New Password -> Redirects to Sign In
  const handleResetNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playUiClick();
    setError(null);

    if (!newPassword || newPassword.length < 4) {
      setError('New password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match. Please verify your new password check.');
      return;
    }

    const res = authService.resetPassword(resetEmail, newPassword);
    if (res.success) {
      sound.playKeyPickup();
      setSuccessBanner('Password updated successfully! Please sign in with your new password.');
      if (res.username) {
        setUsername(res.username);
      }
      setPassword('');
      setMode('signin');
      setError(null);
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-4 select-none font-sans relative overflow-hidden">
      {/* Ambient background glow accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="text-center mb-6 z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-900/30 border border-blue-500/30 rounded-full text-blue-400 text-xs font-bold mb-3 shadow-inner">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI ESCAPE ROOM HUB</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          3D Voxel Room Platform
        </h1>
      </div>

      {/* Central Interactive Card */}
      <div
        id="auth-card-container"
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-7 sm:p-9 border border-slate-200/80 relative z-10"
      >
        {/* Global Success Banner */}
        {successBanner && (
          <div
            id="auth-success-banner"
            className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-start gap-2.5 shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successBanner}</span>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div
            id="auth-error-banner"
            className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl flex items-start gap-2.5 shadow-sm"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* 1. SIGN IN MODE (Default Landing)                         */}
        {/* ========================================================= */}
        {mode === 'signin' && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                Sign In
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Enter your username & password to enter your escape journey
              </p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-4">
              {/* Username field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Username</label>
                <div className="relative">
                  <input
                    id="signin-username-input"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
                    required
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">Password</label>
                  {/* Blue Forgot Password? Tag */}
                  <button
                    id="forgot-password-link"
                    type="button"
                    onClick={() => {
                      sound.playUiClick();
                      setError(null);
                      setSuccessBanner(null);
                      setResetEmail(username.includes('@') ? username : '');
                      setMode('forgot_email');
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="signin-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Sign In Submit Button */}
              <div className="pt-2 space-y-2.5">
                <button
                  id="signin-submit-button"
                  type="submit"
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-sm rounded-xl shadow-lg shadow-blue-600/25 transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Sign In</span>
                </button>

                {/* Direct Google Sign In Button */}
                <button
                  id="google-signin-button"
                  type="button"
                  onClick={() => {
                    sound.playUiClick();
                    setShowGoogleModal(true);
                  }}
                  className="w-full py-3 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </div>

              {/* Blue "New user?" Tag */}
              <div className="text-center pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-500 mr-1.5">New user?</span>
                <button
                  id="new-user-register-link"
                  type="button"
                  onClick={() => {
                    sound.playUiClick();
                    setError(null);
                    setSuccessBanner(null);
                    setMode('signup');
                  }}
                  className="text-xs font-black text-blue-600 hover:text-blue-700 hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  Register here
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* 2. SIGN UP MODE                                           */}
        {/* ========================================================= */}
        {mode === 'signup' && (
          <div>
            <div className="text-center mb-5">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                Create Account
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Fill in your details to register as a new player
              </p>
            </div>

            <form onSubmit={handleSignUp} className="space-y-3.5">
              {/* 1. Username */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Username</label>
                <div className="relative">
                  <input
                    id="signup-username-input"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a unique username"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
                    required
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* 2. Email / Mobile Number Option Toggle */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    {contactType === 'email' ? 'Gmail / Email Address' : 'Mobile Number'}
                  </label>
                  <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => {
                        sound.playUiClick();
                        setContactType('email');
                      }}
                      className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all ${
                        contactType === 'email'
                          ? 'bg-white text-blue-600 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Email
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playUiClick();
                        setContactType('mobile');
                      }}
                      className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all ${
                        contactType === 'mobile'
                          ? 'bg-white text-blue-600 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Mobile
                    </button>
                  </div>
                </div>

                {contactType === 'email' ? (
                  <div className="relative">
                    <input
                      id="signup-contact-input"
                      type="email"
                      value={contactValue}
                      onChange={(e) => setContactValue(e.target.value)}
                      placeholder="e.g. yourname@gmail.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
                      required
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all">
                    {/* Country Code Prefix Dropdown */}
                    <div className="relative shrink-0">
                      <select
                        id="signup-country-code-select"
                        value={selectedDialCode}
                        onChange={(e) => {
                          sound.playUiClick();
                          setSelectedDialCode(e.target.value);
                        }}
                        className="appearance-none bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold py-1.5 pl-2.5 pr-6 rounded-lg cursor-pointer focus:outline-none transition-all shadow-xs"
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code} value={c.dial}>
                            {c.flag} {c.dial} ({c.name})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Mobile Number Local Input */}
                    <div className="relative flex-1">
                      <input
                        id="signup-mobile-input"
                        type="tel"
                        value={contactValue}
                        onChange={(e) => setContactValue(e.target.value.replace(/[^0-9\s-]/g, ''))}
                        placeholder="e.g. 98765 43210"
                        className="w-full py-1.5 px-2 bg-transparent text-slate-800 text-sm focus:outline-none placeholder:text-slate-400 font-medium"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Password */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Password</label>
                <div className="relative">
                  <input
                    id="signup-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password (min. 4 chars)"
                    className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 4. Password Check / Confirm Password */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Password Check</label>
                <div className="relative">
                  <input
                    id="signup-confirm-password-input"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password to verify"
                    className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
                    required
                  />
                  <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Character Model & Preset Selector */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">Choose Character Model</label>
                  <span className="text-[10px] font-bold text-blue-600">
                    {gender === 'female' ? 'Female Preset' : 'Male Preset'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playUiClick();
                      setGender('female');
                      const firstFemale = AVATAR_PRESETS.find((p) => p.gender === 'female');
                      if (firstFemale) setSelectedAvatarPresetId(firstFemale.id);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      gender === 'female'
                        ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>👩</span>
                    <span>Female Model</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playUiClick();
                      setGender('male');
                      const firstMale = AVATAR_PRESETS.find((p) => p.gender === 'male');
                      if (firstMale) setSelectedAvatarPresetId(firstMale.id);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      gender === 'male'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>👨</span>
                    <span>Male Model</span>
                  </button>
                </div>

                {/* Avatar Style Presets Grid with Real Live Previews */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-slate-500 block">Select Starting Outfit & Style:</span>
                  <div className="grid grid-cols-3 gap-2">
                    {AVATAR_PRESETS.filter((p) => p.gender === gender).slice(0, 3).map((preset) => {
                      const isSelected = selectedAvatarPresetId === preset.id;
                      return (
                        <div
                          key={preset.id}
                          onClick={() => {
                            sound.playUiClick();
                            setSelectedAvatarPresetId(preset.id);
                          }}
                          className={`flex flex-col items-center p-2 rounded-xl border-2 transition-all cursor-pointer text-center relative overflow-hidden group ${
                            isSelected
                              ? 'bg-blue-50/90 border-blue-600 shadow-md scale-[1.02]'
                              : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/80'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-blue-600 rounded-full flex items-center justify-center z-20">
                              <span className="text-white text-[7px] font-black">✓</span>
                            </div>
                          )}
                          <div className="w-12 h-14 relative flex items-center justify-center scale-90">
                            <AvatarFigurePreview avatar={preset.avatar} size="mini" />
                          </div>
                          <span className="text-[10px] font-black text-slate-800 line-clamp-1 mt-1">
                            {preset.name.split(' ')[0]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Submit Registration */}
              <div className="pt-2">
                <button
                  id="signup-submit-button"
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-sm rounded-xl shadow-lg shadow-blue-600/25 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Verification Code & Continue</span>
                </button>
              </div>

              {/* Return to Sign In */}
              <div className="text-center pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-500 mr-1.5">Already registered?</span>
                <button
                  id="back-to-signin-from-signup"
                  type="button"
                  onClick={() => {
                    sound.playUiClick();
                    setError(null);
                    setSuccessBanner(null);
                    setMode('signin');
                  }}
                  className="text-xs font-black text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* 2b. SIGN UP - STEP 2: VERIFY OTP BEFORE PROCEEDING TO SIGN IN */}
        {/* ========================================================= */}
        {mode === 'signup_otp' && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  sound.playUiClick();
                  setError(null);
                  setMode('signup');
                }}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                title="Back to Sign Up form"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">
                Verify Your {contactType === 'email' ? 'Email' : 'Mobile'}
              </h2>
            </div>

            <div className="p-3 bg-blue-50/80 border border-blue-100 rounded-2xl mb-5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                {contactType === 'email' ? <Mail className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
              </div>
              <div className="text-xs">
                <p className="text-slate-600 font-medium">
                  A 6-digit verification code has been dispatched to:
                </p>
                <p className="text-blue-700 font-bold font-mono text-sm mt-0.5">
                  {contactType === 'email' ? contactValue : `${selectedDialCode} ${contactValue}`}
                </p>
              </div>
            </div>

            <form onSubmit={handleVerifySignupOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Enter 6-Digit OTP Code</label>
                <div className="relative">
                  <input
                    id="signup-otp-input"
                    type="text"
                    maxLength={6}
                    value={signupOtpCode}
                    onChange={(e) => setSignupOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="• • • • • •"
                    className="w-full text-center tracking-[0.4em] font-mono text-xl py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-400 placeholder:tracking-normal"
                    autoFocus
                    required
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="pt-2">
                <button
                  id="signup-verify-otp-button"
                  type="submit"
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-sm rounded-xl shadow-lg shadow-blue-600/25 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify OTP & Complete Sign Up</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    sound.playUiClick();
                    const cleanUser = username.trim();
                    const cleanContact = contactValue.trim();
                    const target = contactType === 'email' ? cleanContact : `${selectedDialCode} ${cleanContact}`;
                    const res = authService.requestSignupOtp(target, cleanUser);
                    if (res.success) {
                      setSuccessBanner(`New 6-digit OTP resent to your ${contactType === 'email' ? 'email' : 'mobile phone'}!`);
                    }
                  }}
                  className="text-blue-600 hover:underline cursor-pointer"
                >
                  Resend Code
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.playUiClick();
                    setMode('signup');
                  }}
                  className="text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Change {contactType === 'email' ? 'Email' : 'Number'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* 3. FORGOT PASSWORD - STEP 1: ENTER REGISTERED EMAIL       */}
        {/* ========================================================= */}
        {mode === 'forgot_email' && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  sound.playUiClick();
                  setError(null);
                  setMode('signin');
                }}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                title="Back to Sign In"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">
                Forgot Password
              </h2>
            </div>

            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Enter your registered Gmail or email address. We will send a 6-digit OTP verification code to reset your password.
            </p>

            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Registered Gmail / Email</label>
                <div className="relative">
                  <input
                    id="forgot-email-input"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="e.g. tharu@gmail.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
                    required
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="pt-2">
                <button
                  id="send-otp-submit-button"
                  type="submit"
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-sm rounded-xl shadow-lg shadow-blue-600/25 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Send OTP Verification Code</span>
                </button>
              </div>

              <div className="text-center pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    sound.playUiClick();
                    setError(null);
                    setMode('signin');
                  }}
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Remembered your password? Sign In
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* 4. FORGOT PASSWORD - STEP 2: ENTER OTP                    */}
        {/* ========================================================= */}
        {mode === 'forgot_otp' && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  sound.playUiClick();
                  setError(null);
                  setMode('forgot_email');
                }}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">
                Enter Verification OTP
              </h2>
            </div>

            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Please enter the 6-digit OTP sent to <strong className="text-slate-800">{resetEmail}</strong>.
            </p>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">6-Digit OTP Code</label>
                <div className="relative">
                  <input
                    id="otp-verification-input"
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="• • • • • •"
                    className="w-full text-center tracking-[0.4em] font-mono text-xl py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-400 placeholder:tracking-normal"
                    required
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="pt-2">
                <button
                  id="verify-otp-submit-button"
                  type="submit"
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-sm rounded-xl shadow-lg shadow-blue-600/25 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify OTP</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    sound.playUiClick();
                    const res = authService.requestPasswordResetOtp(resetEmail);
                    if (res.success && res.otp) {
                      setSuccessBanner('New 6-digit OTP code has been dispatched to your email inbox!');
                    }
                  }}
                  className="text-blue-600 hover:underline cursor-pointer"
                >
                  Resend OTP Code
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playUiClick();
                    setMode('forgot_email');
                  }}
                  className="text-slate-500 hover:text-slate-800"
                >
                  Change Email
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* 5. FORGOT PASSWORD - STEP 3: NEW PASSWORD & CHECK         */}
        {/* ========================================================= */}
        {mode === 'forgot_new_password' && (
          <div>
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                Set New Password
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Create a new password for your account
              </p>
            </div>

            <form onSubmit={handleResetNewPassword} className="space-y-4">
              {/* New Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">New Password</label>
                <div className="relative">
                  <input
                    id="reset-new-password-input"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 4 chars)"
                    className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    title={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Check / Confirm New Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Password Check</label>
                <div className="relative">
                  <input
                    id="reset-confirm-new-password-input"
                    type={showConfirmNewPassword ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter new password to verify"
                    className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
                    required
                  />
                  <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    title={showConfirmNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  id="reset-password-submit-button"
                  type="submit"
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-sm rounded-xl shadow-lg shadow-blue-600/25 transition-all active:scale-[0.99] cursor-pointer"
                >
                  Save New Password & Continue to Sign In
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Google Account Selector Popup Modal */}
      {showGoogleModal && (
        <div
          id="google-account-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowGoogleModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 animate-scaleUp text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Google Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="text-sm font-black text-slate-700">Sign in with Google</span>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold px-2 py-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Choose an account to continue to <strong>AI Escape Room</strong>:
            </p>

            {/* Account List */}
            <div className="space-y-2 mb-4">
              {/* Primary User Email */}
              <button
                type="button"
                onClick={() => {
                  sound.playKeyPickup();
                  setShowGoogleModal(false);
                  const googleUser = authService.guestLogin('female');
                  googleUser.name = 'Tharuni';
                  googleUser.email = 'tharuni26092006@gmail.com';
                  googleUser.username = 'tharuni_google';
                  googleUser.coins = 0;
                  authService.saveUser(googleUser);
                  onAuthenticated(googleUser);
                }}
                className="w-full p-3 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all flex items-center gap-3 text-left cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-md">
                  T
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-black text-slate-800 group-hover:text-blue-600">
                    Tharuni
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    tharuni26092006@gmail.com
                  </div>
                </div>
              </button>

              {/* Player Account Alternative */}
              <button
                type="button"
                onClick={() => {
                  sound.playKeyPickup();
                  setShowGoogleModal(false);
                  const googleUser = authService.guestLogin('male');
                  googleUser.name = 'Escape Gamer';
                  googleUser.email = 'gamer.escape@gmail.com';
                  googleUser.username = 'escapemaster';
                  googleUser.coins = 0;
                  authService.saveUser(googleUser);
                  onAuthenticated(googleUser);
                }}
                className="w-full p-3 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all flex items-center gap-3 text-left cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-md">
                  G
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-black text-slate-800 group-hover:text-blue-600">
                    Escape Gamer
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    gamer.escape@gmail.com
                  </div>
                </div>
              </button>
            </div>

            {/* Custom Google Email input */}
            <div className="pt-3 border-t border-slate-100">
              <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                Use another Google Account:
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={googleCustomEmail}
                  onChange={(e) => setGoogleCustomEmail(e.target.value)}
                  placeholder="your.email@gmail.com"
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!googleCustomEmail || !googleCustomEmail.includes('@')) {
                      return;
                    }
                    sound.playKeyPickup();
                    setShowGoogleModal(false);
                    const namePart = googleCustomEmail.split('@')[0];
                    const googleUser = authService.guestLogin('female');
                    googleUser.name = namePart.charAt(0).toUpperCase() + namePart.slice(1);
                    googleUser.email = googleCustomEmail.trim();
                    googleUser.username = namePart;
                    googleUser.coins = 0;
                    authService.saveUser(googleUser);
                    onAuthenticated(googleUser);
                  }}
                  className="px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 cursor-pointer"
                >
                  Select
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
