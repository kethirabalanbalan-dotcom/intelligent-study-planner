import React, { useState } from 'react';
import {
  BrainCircuit,
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  Zap,
  BookOpen,
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type AuthMode = 'login' | 'signup' | 'forgot';

export const AuthView: React.FC = () => {
  const {
    login,
    register,
    forgotPassword,
    resetPasswordWithEmail,
    users
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Forgot password specific fields
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState('');
  const [showResetDirectly, setShowResetDirectly] = useState(false);

  // State feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Switch mode helper
  const handleSwitchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrorMessage('');
    setSuccessMessage('');
    setForgotSuccessMessage('');
    setShowResetDirectly(false);
  };

  // Quick Demo Account Selector
  const handleSelectDemoUser = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage('');
  };

  // Handle Login Submit
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(email, password, rememberMe);
      if (!res.success) {
        setErrorMessage(res.error || 'Invalid email or password.');
      }
    } catch {
      setErrorMessage('An unexpected error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Sign Up Submit
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage('Full Name is required (minimum 2 characters).');
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await register(name, email, password);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to create account.');
      } else {
        setSuccessMessage(`Account created successfully! Welcome, ${name.trim()}.`);
      }
    } catch {
      setErrorMessage('An unexpected error occurred during sign up.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Forgot Password Submit
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setForgotSuccessMessage('');

    if (!forgotEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await forgotPassword(forgotEmail);
      if (res.success) {
        setForgotSuccessMessage(res.message);
        setShowResetDirectly(true);
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage('Could not process forgot password request.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle direct reset from forgot flow
  const handleDirectPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await resetPasswordWithEmail(forgotEmail, newPassword);
      if (res.success) {
        setSuccessMessage(res.message);
        setEmail(forgotEmail);
        setPassword(newPassword);
        setTimeout(() => {
          handleSwitchMode('login');
        }, 1500);
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage('Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Left Side: Product Showcase & Value Props */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-2xl space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400 mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Intelligent Exam Scheduling Engine
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
                <BrainCircuit className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold font-display text-white tracking-tight">
                  StudyPlanner
                </h1>
                <span className="text-xs text-slate-400 font-medium">Smart Examination AI</span>
              </div>
            </div>

            <h2 className="text-xl font-bold font-display text-slate-200 leading-snug mt-4">
              Prioritize Hard Subjects, Balance Urgency & Never Fall Behind.
            </h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Log in to access your personal study roadmap, day-wise preparation blocks, task completion tracking, and automatic missed-day replanning.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="space-y-3.5 pt-4 border-t border-slate-800/80 text-xs">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/40 border border-slate-800/60 text-slate-300">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong className="text-white">Smart Priority Algorithm:</strong> Evaluates syllabus difficulty & exam dates dynamically.
              </span>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/40 border border-slate-800/60 text-slate-300">
              <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                <strong className="text-white">Day-Wise Study Calendar:</strong> Enforces daily study limits with structured break intervals.
              </span>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/40 border border-slate-800/60 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong className="text-white">Isolated Student Accounts:</strong> Your study schedules and subjects stay private to your login.
              </span>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-500">
            Intelligent Study Planner © 2026 • Personalized for Every Student
          </div>
        </div>

        {/* Right Side: Auth Forms (Login / Sign Up / Forgot Password) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-md">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 lg:hidden">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-display font-bold text-lg text-white">StudyPlanner</span>
                </div>
              </div>

              {/* Mode Toggle Pills */}
              <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 ml-auto text-xs">
                <button
                  type="button"
                  id="auth-toggle-login-btn"
                  onClick={() => handleSwitchMode('login')}
                  className={`px-3.5 py-1.5 rounded-lg font-bold transition ${
                    mode === 'login'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Log In
                </button>
                <button
                  type="button"
                  id="auth-toggle-signup-btn"
                  onClick={() => handleSwitchMode('signup')}
                  className={`px-3.5 py-1.5 rounded-lg font-bold transition ${
                    mode === 'signup'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>
            </div>

            <div className="mt-4">
              <h2 className="text-2xl font-bold font-display text-white">
                {mode === 'login' && 'Welcome Back'}
                {mode === 'signup' && 'Create Your Student Account'}
                {mode === 'forgot' && 'Reset Your Password'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {mode === 'login' && 'Sign in to access your personalized exam study schedule and progress.'}
                {mode === 'signup' && 'Register to build an intelligent study plan tailored to your exam schedule.'}
                {mode === 'forgot' && 'Enter your registered email to reset your account password.'}
              </p>
            </div>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div
              id="auth-error-alert"
              className="mb-5 p-3.5 rounded-2xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-150"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Alert */}
          {successMessage && (
            <div
              id="auth-success-alert"
              className="mb-5 p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-150"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Quick Demo Credentials for Fast Testing */}
          {mode === 'login' && (
            <div className="mb-6 p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-900/50 space-y-2">
              <div className="flex items-center justify-between text-xs text-indigo-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> One-Click Demo Accounts:
                </span>
                <span className="text-[11px] text-indigo-400/80 font-normal">Click to fill</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  id="demo-user-karthik-btn"
                  onClick={() => handleSelectDemoUser('karthik@example.com', 'password123')}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-indigo-500/30 hover:border-indigo-500 text-left transition flex items-center gap-2"
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                    K
                  </div>
                  <div className="truncate">
                    <div className="font-bold text-white text-[11px] truncate">Karthik</div>
                    <div className="text-[10px] text-slate-400 truncate">karthik@example.com</div>
                  </div>
                </button>

                <button
                  type="button"
                  id="demo-user-priya-btn"
                  onClick={() => handleSelectDemoUser('priya@example.com', 'password123')}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-pink-500/30 hover:border-pink-500 text-left transition flex items-center gap-2"
                >
                  <div className="w-6 h-6 rounded-full bg-pink-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                    P
                  </div>
                  <div className="truncate">
                    <div className="font-bold text-white text-[11px] truncate">Priya</div>
                    <div className="text-[10px] text-slate-400 truncate">priya@example.com</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* 1. LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="login-email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. karthik@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  <span>Password</span>
                  <button
                    type="button"
                    id="login-forgot-password-link"
                    onClick={() => {
                      setForgotEmail(email);
                      handleSwitchMode('forgot');
                    }}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 normal-case tracking-normal transition"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                    required
                  />
                  <button
                    type="button"
                    id="login-toggle-password-visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300">
                  <input
                    id="login-remember-me-checkbox"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded-md border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                  />
                  <span>Remember Me</span>
                </label>
              </div>

              <button
                type="submit"
                id="login-submit-btn"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Log In to Study Planner</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-slate-400 pt-3">
                Don't have an account?{' '}
                <button
                  type="button"
                  id="login-go-to-signup-link"
                  onClick={() => handleSwitchMode('signup')}
                  className="font-bold text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                >
                  Create an account
                </button>
              </p>
            </form>
          )}

          {/* 2. SIGN UP / CREATE ACCOUNT FORM */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-name-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Karthik"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                    required
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  This name will be displayed on your dashboard & study roadmap.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Email Address *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. karthik@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="signup-password-input"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                      required
                    />
                    <button
                      type="button"
                      id="signup-toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="signup-confirm-password-input"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                      required
                    />
                    <button
                      type="button"
                      id="signup-toggle-confirm-password"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                id="signup-submit-btn"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 mt-3"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Create Account & Start Planning</span>
                  </>
                )}
              </button>

              <p className="text-center text-xs text-slate-400 pt-3">
                Already have an account?{' '}
                <button
                  type="button"
                  id="signup-go-to-login-link"
                  onClick={() => handleSwitchMode('login')}
                  className="font-bold text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                >
                  Log In instead
                </button>
              </p>
            </form>
          )}

          {/* 3. FORGOT PASSWORD FLOW */}
          {mode === 'forgot' && (
            <div className="space-y-4">
              {!showResetDirectly ? (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Account Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="forgot-email-input"
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="e.g. karthik@example.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="forgot-submit-btn"
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>Find Account & Reset Password</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleDirectPasswordReset} className="space-y-4 animate-in fade-in duration-150">
                  {forgotSuccessMessage && (
                    <div className="p-3.5 rounded-2xl bg-indigo-950/60 border border-indigo-800 text-indigo-200 text-xs flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-indigo-400 mt-0.5" />
                      <span>{forgotSuccessMessage}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Enter New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="forgot-new-password-input"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter at least 6 characters"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="forgot-update-password-btn"
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Save New Password & Go to Login</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              <div className="text-center pt-2">
                <button
                  type="button"
                  id="forgot-back-to-login-btn"
                  onClick={() => handleSwitchMode('login')}
                  className="text-xs text-slate-400 hover:text-white transition"
                >
                  ← Back to Login
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
