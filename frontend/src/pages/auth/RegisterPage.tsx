import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Mail,
  Building2,
  Briefcase,
  Phone,
  ShieldCheck,
  Sparkles,
  AtSign,
  UserCheck,
} from 'lucide-react';
import { validateWorkEmail } from '../../utils/workEmailSecurity';
import { DEFAULT_DEPARTMENTS } from '../../constants/departments';
import { getDashboardPathForRole } from '../../routes/AppRoutes';

export const RegisterPage: React.FC = () => {
  const { user, register } = useAuth();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate(getDashboardPathForRole(user.role), { replace: true });
    }
  }, [user, navigate]);

  const [role, setRole] = useState<'EMPLOYEE' | 'MANAGER' | 'HR'>('EMPLOYEE');
  const [departments, setDepartments] = useState<Department[]>(DEFAULT_DEPARTMENTS);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [departmentId, setDepartmentId] = useState<string>(DEFAULT_DEPARTMENTS[0].id);
  const [designation, setDesignation] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const data = await departmentApi.getDepartments();
        if (Array.isArray(data) && data.length > 0) {
          const activeDepts = data.filter((d) => d.active);
          setDepartments(activeDepts);
          if (!departmentId || !activeDepts.some((d) => d.id === departmentId)) {
            setDepartmentId(activeDepts[0].id);
          }
        }
      } catch (err) {
        console.warn('Using default departments list:', err);
      }
    };
    fetchDepts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_.]/g, '');

    if (!name.trim()) {
      showError('Please enter your full name.');
      return;
    }
    if (cleanUsername.length < 3) {
      showError('Username must be at least 3 characters (letters, numbers, underscores).');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      showError('Please enter a valid work email address.');
      return;
    }

    const emailCheck = validateWorkEmail(email, role);
    if (!emailCheck.isValid) {
      showError(emailCheck.error || 'Please enter an authorized work email address.');
      return;
    }

    if (password.length < 6) {
      showError('Password must be at least 6 characters.');
      return;
    }
    if (role === 'EMPLOYEE' && !departmentId) {
      showError('Please select your department.');
      return;
    }

    try {
      setIsSubmitting(true);
      const newUser = await register({
        name: name.trim(),
        username: cleanUsername,
        email: email.toLowerCase().trim(),
        password,
        role,
        departmentId: role === 'EMPLOYEE' ? departmentId : undefined,
        designation: designation.trim() || undefined,
        phone: phone.trim() || undefined,
      });

      showSuccess(`Account @${cleanUsername} (${role}) created! A Firebase Auth verification link was dispatched to ${email.trim()}.`);
      navigate(getDashboardPathForRole(newUser?.role));
    } catch (err: any) {
      console.error(err);
      showError(err.response?.data?.message || 'Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
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
            <span className="text-slate-600 font-medium hidden md:inline">Directory Online</span>
            <span className="text-slate-300 hidden md:inline">•</span>
            <span className="text-slate-700 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span className="hidden sm:inline">Self-Onboarding</span>
            </span>
          </div>
        </div>
      </header>

      {/* Center Register Card */}
      <div className="w-full max-w-[500px] my-6">
        <div className="bg-white rounded-[32px] border border-slate-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-7 sm:p-9 space-y-6">
          {/* Card Header */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-3xs font-extrabold uppercase border border-indigo-100 mb-1">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              <span>Create Workspace Profile</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              Join the Workspace
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Select your role and create your handle to access your ELAP portal.
            </p>
          </div>

          {/* Role Selector: Employee, Manager, HR Lead */}
          <div>
            <label className="block text-2xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Select Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* Employee Button */}
              <button
                type="button"
                onClick={() => setRole('EMPLOYEE')}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                  role === 'EMPLOYEE'
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <UserCheck className={`w-4 h-4 ${role === 'EMPLOYEE' ? 'text-white' : 'text-slate-500'}`} />
                <span className="text-xs font-semibold leading-none">Employee</span>
                <span className={`text-3xs ${role === 'EMPLOYEE' ? 'text-slate-300' : 'text-slate-400'}`}>
                  Applicant
                </span>
              </button>

              {/* Manager Button */}
              <button
                type="button"
                onClick={() => setRole('MANAGER')}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                  role === 'MANAGER'
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Briefcase className={`w-4 h-4 ${role === 'MANAGER' ? 'text-white' : 'text-slate-500'}`} />
                <span className="text-xs font-semibold leading-none">Manager</span>
                <span className={`text-3xs ${role === 'MANAGER' ? 'text-slate-300' : 'text-slate-400'}`}>
                  Approver
                </span>
              </button>

              {/* HR Lead Button */}
              <button
                type="button"
                onClick={() => setRole('HR')}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                  role === 'HR'
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ShieldCheck className={`w-4 h-4 ${role === 'HR' ? 'text-white' : 'text-slate-500'}`} />
                <span className="text-xs font-semibold leading-none">HR Lead</span>
                <span className={`text-3xs ${role === 'HR' ? 'text-slate-300' : 'text-slate-400'}`}>
                  Sign-off
                </span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-3xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-950 focus:border-slate-950 transition-all"
                />
              </div>
            </div>

            {/* Username Handle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-3xs font-bold uppercase tracking-wider text-slate-600">
                  Username *
                </label>
                {username && (
                  <span className="text-3xs font-semibold text-indigo-600 font-mono">
                    @{username.toLowerCase().replace(/[^a-z0-9_.]/g, '')}
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <AtSign className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. rahul_sharma"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-950 focus:border-slate-950 transition-all"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Min. 3 characters: lowercase letters, numbers, underscores, periods.
              </p>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-3xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Email Address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    role === 'HR'
                      ? 'hr@company.com'
                      : role === 'MANAGER'
                      ? 'manager@company.com'
                      : 'employee@company.com'
                  }
                  required
                  autoCapitalize="none"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-950 focus:border-slate-950 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-3xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Create Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-950 focus:border-slate-950 transition-all"
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

            {/* CONDITIONAL DEPARTMENT DROPDOWN: ONLY WHEN ROLE IS EMPLOYEE */}
            {role === 'EMPLOYEE' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-3xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    Department Dropdown *
                  </label>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    Required for Employee
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-emerald-300 bg-white text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all cursor-pointer"
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id} className="text-slate-900 py-1">
                        🏢 {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Designation / Role */}
            <div>
              <label className="block text-3xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Designation / Job Title
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Briefcase className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder={
                    role === 'HR'
                      ? 'e.g. HR Lead / People Operations'
                      : role === 'MANAGER'
                      ? 'e.g. Engineering Manager / Tech Lead'
                      : 'e.g. Senior Software Engineer'
                  }
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-950 focus:border-slate-950 transition-all"
                />
              </div>
            </div>

            {/* Optional Phone */}
            <div>
              <label className="block text-3xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-950 focus:border-slate-950 transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full py-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all hover:translate-y-[-1px] active:translate-y-0 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Registering Profile...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Back to Sign In Link */}
          <div className="text-center pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Already have an employee account?{' '}
              <Link to="/login" className="font-bold text-slate-950 hover:underline">
                Sign In
              </Link>
            </p>
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
