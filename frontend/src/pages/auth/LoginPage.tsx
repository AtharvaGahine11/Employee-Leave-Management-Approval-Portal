import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { departmentApi } from '../../api';
import { Department } from '../../types';
import {
  Eye,
  EyeOff,
  ArrowRight,
  Lock,
  User as UserIcon,
  ShieldAlert,
  ShieldCheck,
  Building2,
  Briefcase,
  Mail,
  Crown,
  Sparkles,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, register, loginWithGoogle, loginWithApple } = useAuth();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>(
    searchParams.get('mode') === 'register' ? 'register' : 'login'
  );

  // Sign In states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Registration states
  const [departments, setDepartments] = useState<Department[]>([]);
  const [regRole, setRegRole] = useState<'EMPLOYEE' | 'MANAGER' | 'HR'>('EMPLOYEE');
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDepartmentId, setRegDepartmentId] = useState('');
  const [regDesignation, setRegDesignation] = useState('');

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [isAppleSubmitting, setIsAppleSubmitting] = useState(false);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const data = await departmentApi.getDepartments();
        const activeDepts = data.filter((d) => d.active);
        setDepartments(activeDepts);
        if (activeDepts.length > 0 && !regDepartmentId) {
          setRegDepartmentId(activeDepts[0].id);
        }
      } catch (err) {
        console.error('Failed to load departments:', err);
      }
    };
    fetchDepts();
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      showError('Please enter your username or email address.');
      return;
    }
    if (!password) {
      showError('Please enter your password.');
      return;
    }

    try {
      setIsSubmitting(true);
      await login(identifier, password);
      showSuccess('Signed in successfully!');
      navigate('/');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Invalid username/email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = regUsername.toLowerCase().trim().replace(/[^a-z0-9_.]/g, '');

    if (!regName.trim()) {
      showError('Please enter your full name.');
      return;
    }
    if (cleanUsername.length < 3) {
      showError('Username must be at least 3 characters (letters, numbers, underscores).');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      showError('Please enter a valid email address.');
      return;
    }
    if (regPassword.length < 6) {
      showError('Password must be at least 6 characters long.');
      return;
    }
    if (regRole === 'EMPLOYEE' && !regDepartmentId) {
      showError('Please select a department for the employee account.');
      return;
    }

    try {
      setIsSubmitting(true);
      await register({
        name: regName.trim(),
        username: cleanUsername,
        email: regEmail.toLowerCase().trim(),
        password: regPassword,
        role: regRole,
        departmentId: regRole === 'EMPLOYEE' ? regDepartmentId : undefined,
        designation: regDesignation.trim() || undefined,
      });

      showSuccess(`Account @${cleanUsername} (${regRole}) created successfully!`);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      showError(err.response?.data?.message || 'Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleSubmitting(true);
      await loginWithGoogle();
      showSuccess('Signed in with Google successfully!');
      navigate('/');
    } catch (err: any) {
      console.error(err);
      showError(
        err.response?.data?.message ||
          err.message ||
          'Google authentication failed or your email is not registered in the directory.'
      );
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setIsAppleSubmitting(true);
      await loginWithApple();
      showSuccess('Signed in with Apple ID successfully!');
      navigate('/');
    } catch (err: any) {
      console.error(err);
      showError(
        err.response?.data?.message ||
          err.message ||
          'Apple ID authentication failed or your email is not registered in the directory.'
      );
    } finally {
      setIsAppleSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8 selection:bg-slate-900 selection:text-white">
      {/* Top Floating Enterprise Header */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-xs">
        {/* Brand Emblem & Name */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center text-white font-black text-sm shadow-xs border border-white/10 ring-1 ring-slate-900/5 flex-shrink-0">
            <span className="tracking-tight text-white font-extrabold text-sm">E</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-950 text-sm tracking-tight">ELAP</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-100/80 tracking-wider">
                Portal
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Employee Leave & Approval Portal
            </p>
          </div>
        </div>

        {/* System & Security Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px]">
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-slate-600 font-medium hidden md:inline">System Active</span>
            <span className="text-slate-300 hidden md:inline">•</span>
            <span className="text-slate-700 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span className="hidden sm:inline">Enterprise</span> SSO & Auth
            </span>
          </div>
        </div>
      </header>

      {/* Center Auth Card */}
      <div className="w-full max-w-[460px] my-auto">
        <div className="bg-white rounded-[32px] border border-slate-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-6 sm:p-8 space-y-5">
          {/* Segmented Switcher (Sign In vs Create Account) */}
          <div className="flex p-1 bg-slate-100/80 rounded-2xl border border-slate-200/60">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                authMode === 'login'
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                authMode === 'register'
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* ============================================================ */}
          {/* TAB 1: SIGN IN FORM */}
          {/* ============================================================ */}
          {authMode === 'login' && (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                  Welcome Back
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Enter your credentials or use SSO to access your dashboard.
                </p>
              </div>

              {/* Social Auth (Google & Apple ID) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Google Sign-in */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleSubmitting || isAppleSubmitting || isSubmitting}
                  className="py-3 px-3 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-2.5 disabled:opacity-60"
                >
                  {isGoogleSubmitting ? (
                    <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-900 rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.14 0 9.99 0 12s.45 3.86 1.24 5.42l4.04-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                  )}
                  <span>Google</span>
                </button>

                {/* Apple ID Sign-in */}
                <button
                  type="button"
                  onClick={handleAppleSignIn}
                  disabled={isAppleSubmitting || isGoogleSubmitting || isSubmitting}
                  className="py-3 px-3 rounded-2xl bg-black hover:bg-slate-900 text-white text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-2.5 disabled:opacity-60"
                >
                  {isAppleSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 170 170">
                      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.61-7.8-11.73-14.14-5.46-8.34-9.76-18.06-12.9-29.17-3.14-11.1-4.71-21.72-4.71-31.85 0-14.13 3.69-25.75 11.08-34.86 7.39-9.11 16.58-13.78 27.56-14 4.58 0 9.87 1.25 15.86 3.75 6 2.5 10.15 3.79 12.46 3.86 1.85 0 6.13-1.34 12.86-4.02 6.72-2.68 12.27-3.89 16.63-3.63 12.63.63 22.42 5.37 29.38 14.21-11.09 6.71-16.54 15.86-16.34 27.46.2 9.07 3.66 16.75 10.38 23.03 6.73 6.28 14.88 9.87 24.47 10.77-2.15 6.42-4.72 12.96-7.71 19.63zM119.22 31.86c0-7.23 2.65-13.9 7.95-20.02 5.3-6.12 11.85-9.84 19.65-11.16.2 1.4.3 2.65.3 3.75 0 7.15-2.73 13.9-8.19 20.25-5.46 6.35-12.03 9.94-19.71 10.77z" />
                    </svg>
                  )}
                  <span>Apple ID</span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200/80 w-full" />
                <span className="bg-white px-3 text-3xs font-bold text-slate-400 uppercase tracking-widest absolute">
                  or credentials
                </span>
              </div>

              {/* Direct Credentials Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Username / Email Field */}
                <div>
                  <label className="block text-3xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Username or Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="e.g. rahul_sharma or employee@elap.com"
                      required
                      autoCapitalize="none"
                      autoCorrect="off"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-950 focus:border-slate-950 transition-all"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-3xs font-bold uppercase tracking-wider text-slate-600">
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-10 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-950 focus:border-slate-950 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || isGoogleSubmitting}
                  className="mt-2 w-full py-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all hover:translate-y-[-1px] active:translate-y-0 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Switch to Register */}
              <div className="text-center pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  New member?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('register')}
                    className="font-bold text-slate-950 hover:underline"
                  >
                    Create an account here
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: CREATE ACCOUNT FORM (HR, MANAGER, EMPLOYEE) */}
          {/* ============================================================ */}
          {authMode === 'register' && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-3xs font-extrabold uppercase tracking-wider mb-1">
                  <Sparkles className="w-3 h-3" />
                  Account Registration
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                  Join ELAP
                </h2>
                <p className="text-xs text-slate-500">
                  Select your role and enter your details to provision your account.
                </p>
              </div>

              {/* Role Selector: Employee, Manager, HR Lead */}
              <div>
                <label className="block text-3xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Account Type / Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Employee Button */}
                  <button
                    type="button"
                    onClick={() => setRegRole('EMPLOYEE')}
                    className={`p-2.5 rounded-2xl border text-center transition-all ${
                      regRole === 'EMPLOYEE'
                        ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 shadow-xs ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/60 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-base mb-0.5">💻</div>
                    <div className="text-xs font-bold">Employee</div>
                    <div className="text-[10px] text-slate-400">Leave Applicant</div>
                  </button>

                  {/* Manager Button */}
                  <button
                    type="button"
                    onClick={() => setRegRole('MANAGER')}
                    className={`p-2.5 rounded-2xl border text-center transition-all ${
                      regRole === 'MANAGER'
                        ? 'border-amber-600 bg-amber-50/60 text-amber-900 shadow-xs ring-2 ring-amber-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/60 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-base mb-0.5">👔</div>
                    <div className="text-xs font-bold">Manager</div>
                    <div className="text-[10px] text-slate-400">Team Approver</div>
                  </button>

                  {/* HR Lead Button */}
                  <button
                    type="button"
                    onClick={() => setRegRole('HR')}
                    className={`p-2.5 rounded-2xl border text-center transition-all ${
                      regRole === 'HR'
                        ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 shadow-xs ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/60 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-base mb-0.5">👑</div>
                    <div className="text-xs font-bold">HR Lead</div>
                    <div className="text-[10px] text-slate-400">Full Sign-off</div>
                  </button>
                </div>
              </div>

              {/* Registration Form */}
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                {/* Full Name & Username */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-3xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <UserIcon className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="e.g. John Doe"
                        required
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-950 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-3xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <span className="text-xs font-bold">@</span>
                      </div>
                      <input
                        type="text"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        placeholder="john_doe"
                        required
                        className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-950 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-3xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Work Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder={
                        regRole === 'HR'
                          ? 'hr@company.com'
                          : regRole === 'MANAGER'
                          ? 'manager@company.com'
                          : 'employee@company.com'
                      }
                      required
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-950 transition-all"
                    />
                  </div>
                </div>

                {/* CONDITIONAL DEPARTMENT DROPDOWN: ONLY WHEN ROLE IS EMPLOYEE */}
                {regRole === 'EMPLOYEE' && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-3xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                        Department Dropdown
                      </label>
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                        Required for Employee
                      </span>
                    </div>
                    <div className="relative">
                      <select
                        value={regDepartmentId}
                        onChange={(e) => setRegDepartmentId(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50/30 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all appearance-none cursor-pointer"
                      >
                        <option value="" disabled>
                          Select your department...
                        </option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            🏢 {dept.name} ({dept.code})
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-emerald-700">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}

                {/* Job Title / Designation */}
                <div>
                  <label className="block text-3xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Designation / Title
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Briefcase className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      value={regDesignation}
                      onChange={(e) => setRegDesignation(e.target.value)}
                      placeholder={
                        regRole === 'HR'
                          ? 'e.g. HR Lead / People Partner'
                          : regRole === 'MANAGER'
                          ? 'e.g. Engineering Manager / Tech Lead'
                          : 'e.g. Software Engineer / Analyst'
                      }
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-950 transition-all"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-3xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Password (Min 6 Characters)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-950 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Submit Account Creation Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`mt-2 w-full py-3.5 rounded-2xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all hover:translate-y-[-1px] active:translate-y-0 disabled:opacity-60 ${
                    regRole === 'HR'
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : regRole === 'MANAGER'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-slate-950 hover:bg-slate-800'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Provisioning Account...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        Create {regRole === 'HR' ? 'HR Lead' : regRole === 'MANAGER' ? 'Manager' : 'Employee'} Account
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Switch back to Login */}
              <div className="text-center pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="font-bold text-slate-950 hover:underline"
                  >
                    Sign in here
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="pt-2 flex items-start gap-2 text-3xs text-slate-400 leading-relaxed border-t border-slate-100/80">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
            <span>
              Enterprise Directory: Accounts provisioned here receive immediate role credentials, quota allocation, and directory access.
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <footer className="w-full max-w-4xl mx-auto py-3 px-2 flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
        <span className="font-medium">ELAP Leave Management & Approval Portal • v2.0</span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          Secured with JWT, Role-Based Access & Supabase
        </span>
      </footer>
    </div>
  );
};

