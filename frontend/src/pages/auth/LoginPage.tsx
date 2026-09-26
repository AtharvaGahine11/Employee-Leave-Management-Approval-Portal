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
  ShieldCheck,
  Building2,
  Briefcase,
  Mail,
  UserCheck,
} from 'lucide-react';
import { validateWorkEmail } from '../../utils/workEmailSecurity';
import { DEFAULT_DEPARTMENTS } from '../../constants/departments';
import { getDashboardPathForRole } from '../../routes/AppRoutes';
import {
  auth,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signInWithEmailAndPassword,
} from '../../config/firebase';
import { EmailVerificationCard } from '../../components/auth/EmailVerificationCard';

export const LoginPage: React.FC = () => {
  const { user, login, completeRegistration, loginWithGoogle, loginWithApple } = useAuth();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate(getDashboardPathForRole(user.role), { replace: true });
    }
  }, [user, navigate]);

  // Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>(
    searchParams.get('mode') === 'register' ? 'register' : 'login'
  );

  // Sign In states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Registration states
  const [departments, setDepartments] = useState<Department[]>(DEFAULT_DEPARTMENTS);
  const [regRole, setRegRole] = useState<'EMPLOYEE' | 'MANAGER' | 'HR'>('EMPLOYEE');
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDepartmentId, setRegDepartmentId] = useState<string>(DEFAULT_DEPARTMENTS[0].id);
  const [regDesignation, setRegDesignation] = useState('');

  // Email verification state
  const [pendingVerification, setPendingVerification] = useState<any | null>(null);

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [isAppleSubmitting, setIsAppleSubmitting] = useState(false);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const data = await departmentApi.getDepartments();
        if (Array.isArray(data) && data.length > 0) {
          const activeDepts = data.filter((d) => d.active);
          setDepartments(activeDepts);
          if (!regDepartmentId || !activeDepts.some((d) => d.id === regDepartmentId)) {
            setRegDepartmentId(activeDepts[0].id);
          }
        }
      } catch (err) {
        console.warn('Using default departments list:', err);
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
      const loggedUser = await login(identifier, password);
      showSuccess('Signed in successfully!');
      navigate(getDashboardPathForRole(loggedUser?.role));
    } catch (err: any) {
      if (err.code === 'EMAIL_NOT_VERIFIED' || err.message === 'EMAIL_NOT_VERIFIED') {
        setPendingVerification({
          email: identifier.trim(),
          isExistingLogin: true,
        });
        showError('Please authorize your email link first before accessing your dashboard.');
        return;
      }
      showError(err.response?.data?.message || err.message || 'Invalid username/email or password.');
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
      showError('Please enter a valid work email address.');
      return;
    }

    const emailCheck = validateWorkEmail(regEmail, regRole);
    if (!emailCheck.isValid) {
      showError(emailCheck.error || 'Please enter an authorized work email address.');
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

      // 1. Create or retrieve user in Firebase Auth and dispatch email verification link
      let firebaseUid = '';
      try {
        const cred = await createUserWithEmailAndPassword(auth, regEmail.toLowerCase().trim(), regPassword);
        firebaseUid = cred.user.uid;
        if (regName.trim()) {
          await updateProfile(cred.user, { displayName: regName.trim() });
        }
        await sendEmailVerification(cred.user);
      } catch (fbErr: any) {
        if (fbErr.code === 'auth/email-already-in-use') {
          // If already in Firebase, check verification status or resend verification link
          try {
            const cred = await signInWithEmailAndPassword(auth, regEmail.toLowerCase().trim(), regPassword);
            firebaseUid = cred.user.uid;
            if (!cred.user.emailVerified) {
              await sendEmailVerification(cred.user);
            } else {
              // Email already verified in Firebase! Direct activate
              const newUser = await completeRegistration({
                name: regName.trim(),
                username: cleanUsername,
                email: regEmail.toLowerCase().trim(),
                password: regPassword,
                role: regRole,
                departmentId: regRole === 'EMPLOYEE' ? regDepartmentId : undefined,
                designation: regDesignation.trim() || undefined,
                firebaseUid,
              });
              showSuccess(`Account @${cleanUsername} verified! Welcome to ELAP.`);
              navigate(getDashboardPathForRole(newUser?.role));
              return;
            }
          } catch {
            throw new Error('This email address is already registered. If it is yours, please sign in.');
          }
        } else {
          throw fbErr;
        }
      }

      // 2. Set pending verification state - DO NOT redirect until user verifies email!
      setPendingVerification({
        name: regName.trim(),
        username: cleanUsername,
        email: regEmail.toLowerCase().trim(),
        password: regPassword,
        role: regRole,
        departmentId: regRole === 'EMPLOYEE' ? regDepartmentId : undefined,
        designation: regDesignation.trim() || undefined,
        firebaseUid,
      });

      showSuccess(`Authorization link sent to ${regEmail.trim()}. Please verify your email to activate your account.`);
    } catch (err: any) {
      console.error(err);
      showError(err.response?.data?.message || err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleSubmitting(true);
      const loggedUser = await loginWithGoogle();
      showSuccess('Signed in with Google successfully!');
      navigate(getDashboardPathForRole(loggedUser?.role));
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
      const loggedUser = await loginWithApple();
      showSuccess('Signed in with Apple ID successfully!');
      navigate(getDashboardPathForRole(loggedUser?.role));
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
    <div className="min-h-screen bg-slate-50/70 flex flex-col justify-between selection:bg-slate-900 selection:text-white">
      {/* Sleek Enterprise Top Navbar */}
      <header className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-950 flex items-center justify-center text-white font-black text-sm shadow-xs">
              E
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-sm tracking-tight">ELAP</span>
              <span className="text-slate-300">/</span>
              <span className="text-xs text-slate-500 font-medium">Leave & Approvals</span>
            </div>
          </div>

          {/* Operational Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/70 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-slate-600 font-medium text-[11px]">System Online</span>
          </div>
        </div>
      </header>

      {/* Main Authentication Area */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-[460px]">
          {pendingVerification ? (
            <EmailVerificationCard
              email={pendingVerification.email}
              userName={pendingVerification.name}
              onVerified={async () => {
                if (pendingVerification.isExistingLogin) {
                  try {
                    setIsSubmitting(true);
                    const loggedUser = await login(identifier, password);
                    showSuccess('Email verified! Signed in successfully.');
                    navigate(getDashboardPathForRole(loggedUser?.role));
                  } catch (err: any) {
                    showError(err.response?.data?.message || err.message || 'Error signing in.');
                  } finally {
                    setIsSubmitting(false);
                  }
                } else {
                  const newUser = await completeRegistration(pendingVerification);
                  showSuccess(`Account @${pendingVerification.username} activated! Welcome to ELAP.`);
                  navigate(getDashboardPathForRole(newUser?.role));
                }
              }}
              onCancel={() => {
                setPendingVerification(null);
              }}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
            {/* Segmented Switcher (Sign In vs Create Account) */}
            <div className="grid grid-cols-2 p-1 bg-slate-100/90 rounded-xl mb-6 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`py-2 rounded-lg transition-all ${
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
                className={`py-2 rounded-lg transition-all ${
                  authMode === 'register'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* ============================================================ */}
            {/* TAB 1: SIGN IN */}
            {/* ============================================================ */}
            {authMode === 'login' && (
              <div className="space-y-5">
                <div className="text-center">
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    Welcome back
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Sign in with SSO or enter your credentials
                  </p>
                </div>

                {/* Social SSO (Google & Apple ID) */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Google Sign-in */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleSubmitting || isAppleSubmitting || isSubmitting}
                    className="py-2.5 px-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-2xs"
                  >
                    {isGoogleSubmitting ? (
                      <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-slate-900 rounded-full animate-spin" />
                    ) : (
                      <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24">
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
                    className="py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-900 text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-2xs"
                  >
                    {isAppleSubmitting ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg className="w-3.5 h-3.5 fill-current flex-shrink-0" viewBox="0 0 170 170">
                        <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.61-7.8-11.73-14.14-5.46-8.34-9.76-18.06-12.9-29.17-3.14-11.1-4.71-21.72-4.71-31.85 0-14.13 3.69-25.75 11.08-34.86 7.39-9.11 16.58-13.78 27.56-14 4.58 0 9.87 1.25 15.86 3.75 6 2.5 10.15 3.79 12.46 3.86 1.85 0 6.13-1.34 12.86-4.02 6.72-2.68 12.27-3.89 16.63-3.63 12.63.63 22.42 5.37 29.38 14.21-11.09 6.71-16.54 15.86-16.34 27.46.2 9.07 3.66 16.75 10.38 23.03 6.73 6.28 14.88 9.87 24.47 10.77-2.15 6.42-4.72 12.96-7.71 19.63zM119.22 31.86c0-7.23 2.65-13.9 7.95-20.02 5.3-6.12 11.85-9.84 19.65-11.16.2 1.4.3 2.65.3 3.75 0 7.15-2.73 13.9-8.19 20.25-5.46 6.35-12.03 9.94-19.71 10.77z" />
                      </svg>
                    )}
                    <span>Apple ID</span>
                  </button>
                </div>

                {/* Divider */}
                <div className="relative flex items-center justify-center my-3">
                  <div className="border-t border-slate-200 w-full" />
                  <span className="bg-white px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider absolute">
                    or continue with
                  </span>
                </div>

                {/* Form */}
                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Username or Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="e.g. rahul_sharma or employee@elap.com"
                        required
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || isGoogleSubmitting}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-60 mt-4"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Signing In...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>

                <div className="text-center pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    Need an account?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthMode('register')}
                      className="font-semibold text-slate-900 hover:underline"
                    >
                      Create account here
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* TAB 2: CREATE ACCOUNT (CLEAN, NO EMOJIS, PERFECT SPACING) */}
            {/* ============================================================ */}
            {authMode === 'register' && (
              <div className="space-y-4">
                <div className="text-center mb-1">
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    Create your account
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Select your role to configure workspace permissions
                  </p>
                </div>

                {/* Role Selector with Professional Vector Icons */}
                <div>
                  <label className="block text-2xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Select Role
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Employee Card */}
                    <button
                      type="button"
                      onClick={() => setRegRole('EMPLOYEE')}
                      className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                        regRole === 'EMPLOYEE'
                          ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <UserCheck className={`w-4 h-4 ${regRole === 'EMPLOYEE' ? 'text-white' : 'text-slate-500'}`} />
                      <span className="text-xs font-semibold leading-none">Employee</span>
                      <span className={`text-3xs ${regRole === 'EMPLOYEE' ? 'text-slate-300' : 'text-slate-400'}`}>
                        Applicant
                      </span>
                    </button>

                    {/* Manager Card */}
                    <button
                      type="button"
                      onClick={() => setRegRole('MANAGER')}
                      className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                        regRole === 'MANAGER'
                          ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Briefcase className={`w-4 h-4 ${regRole === 'MANAGER' ? 'text-white' : 'text-slate-500'}`} />
                      <span className="text-xs font-semibold leading-none">Manager</span>
                      <span className={`text-3xs ${regRole === 'MANAGER' ? 'text-slate-300' : 'text-slate-400'}`}>
                        Approver
                      </span>
                    </button>

                    {/* HR Lead Card */}
                    <button
                      type="button"
                      onClick={() => setRegRole('HR')}
                      className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                        regRole === 'HR'
                          ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <ShieldCheck className={`w-4 h-4 ${regRole === 'HR' ? 'text-white' : 'text-slate-500'}`} />
                      <span className="text-xs font-semibold leading-none">HR Lead</span>
                      <span className={`text-3xs ${regRole === 'HR' ? 'text-slate-300' : 'text-slate-400'}`}>
                        Sign-off
                      </span>
                    </button>
                  </div>
                </div>

                {/* Form Fields */}
                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  {/* Full Name & Username */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                          placeholder="John Doe"
                          required
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Username
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <span className="text-xs font-bold text-slate-400">@</span>
                        </div>
                        <input
                          type="text"
                          value={regUsername}
                          onChange={(e) => setRegUsername(e.target.value)}
                          placeholder="john_doe"
                          required
                          className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Work Email with Security Validation */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Work Email
                      </label>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-full">
                        <ShieldCheck className="w-3 h-3 text-indigo-600" /> Firebase Auth Validated
                      </span>
                    </div>
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
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      A Firebase email verification link will be sent to secure your work account.
                    </p>
                  </div>

                  {/* CONDITIONAL DEPARTMENT DROPDOWN: ONLY FOR EMPLOYEE */}
                  {regRole === 'EMPLOYEE' && (
                    <div className="animate-in fade-in duration-200">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Department
                        </label>
                        <span className="text-3xs text-slate-400 font-medium">Required for Employee</span>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Building2 className="w-3.5 h-3.5" />
                        </div>
                        <select
                          value={regDepartmentId}
                          onChange={(e) => setRegDepartmentId(e.target.value)}
                          required
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all cursor-pointer"
                        >
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.id} className="text-slate-900 py-1">
                              {dept.name} ({dept.code})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Designation */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                            : 'e.g. Software Engineer'
                        }
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password (min 6 characters)
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
                        className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
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

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-60 mt-3"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <span>
                          Create {regRole === 'HR' ? 'HR Lead' : regRole === 'MANAGER' ? 'Manager' : 'Employee'} Account
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>

                {/* Back to sign in */}
                <div className="text-center pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className="font-semibold text-slate-900 hover:underline"
                    >
                      Sign in here
                    </button>
                  </p>
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      </main>

      {/* Clean Minimal Footer */}
      <footer className="w-full border-t border-slate-200/80 py-4 px-6 text-center text-xs text-slate-400">
        <span>ELAP Leave Management & Approval Portal • Enterprise Edition</span>
      </footer>
    </div>
  );
};
