import React, { useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  User,
  Mail,
  Building2,
  UserCheck,
  Calendar,
  ShieldCheck,
  Phone,
  AtSign,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, changePassword } = useAuth();
  const { showSuccess, showError } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      showError('Please fill in all password fields.');
      return;
    }
    if (newPassword.length < 6) {
      showError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showError('New password and confirmation do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      await changePassword(currentPassword, newPassword);
      showSuccess('Your password has been changed successfully!');
      setPasswordChanged(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordChanged(false), 5000);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to change password. Please verify your current password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout
      title="My Employee Profile"
      subtitle="View your official employee identity and manage security credentials"
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Card */}
        <div className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
            <div className="w-20 h-20 rounded-full bg-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1 flex-wrap">
                <h2 className="text-2xl font-bold text-slate-900">{user?.name}</h2>
                {user?.username && (
                  <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100/80">
                    @{user.username}
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full text-3xs font-extrabold uppercase bg-indigo-100 text-indigo-800 border border-indigo-200">
                  {user?.role}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-500">{user?.designation}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-3xs font-bold rounded-full border border-emerald-200">
                ● Active Account
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white text-indigo-600 border border-slate-200 flex items-center justify-center flex-shrink-0">
                <AtSign className="w-5 h-5" />
              </div>
              <div>
                <span className="text-3xs font-bold uppercase text-slate-400">Username Handle</span>
                <p className="text-sm font-bold text-slate-900">
                  {user?.username ? `@${user.username}` : 'Not assigned'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white text-indigo-600 border border-slate-200 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-3xs font-bold uppercase text-slate-400">Employee ID</span>
                <p className="text-sm font-bold text-slate-900">{user?.employeeId}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white text-indigo-600 border border-slate-200 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <span className="text-3xs font-bold uppercase text-slate-400">Email Address</span>
                <p className="text-sm font-bold text-slate-900">{user?.email}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white text-indigo-600 border border-slate-200 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-3xs font-bold uppercase text-slate-400">Department</span>
                <p className="text-sm font-bold text-slate-900">
                  {user?.department?.name} ({user?.department?.code})
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white text-indigo-600 border border-slate-200 flex items-center justify-center flex-shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-3xs font-bold uppercase text-slate-400">Reporting Manager</span>
                <p className="text-sm font-bold text-slate-900">
                  {user?.manager ? `${user.manager.name} (${user.manager.designation})` : 'N/A (Top Management)'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white text-indigo-600 border border-slate-200 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-3xs font-bold uppercase text-slate-400">Joining Date</span>
                <p className="text-sm font-bold text-slate-900">
                  {user?.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Password Reset Card */}
        <div className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Security Credentials</h3>
              <p className="text-xs text-slate-500">
                Update your login password. You can sign in using your username (@{user?.username || 'handle'}) or email address.
              </p>
            </div>
          </div>

          {passwordChanged && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Password successfully updated. Please use your new password for future sign-ins.</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-xs font-medium text-slate-900 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-xs font-medium text-slate-900 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-xs font-medium text-slate-900 transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Updating Password...' : 'Update Password'}</span>
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

