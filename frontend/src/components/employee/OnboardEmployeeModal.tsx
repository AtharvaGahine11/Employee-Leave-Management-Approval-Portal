import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { employeeApi, departmentApi } from '../../api';
import { Department } from '../../types';
import { X, UserPlus, Shield, User, Mail, Lock, Building2, Briefcase, Phone, ShieldCheck } from 'lucide-react';
import { validateWorkEmail } from '../../utils/workEmailSecurity';
import { validateAndProvisionWorkEmailWithFirebase } from '../../config/firebase';
import { DEFAULT_DEPARTMENTS } from '../../constants/departments';

interface OnboardEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const OnboardEmployeeModal: React.FC<OnboardEmployeeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();

  const [departments, setDepartments] = useState<Department[]>(DEFAULT_DEPARTMENTS);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Welcome@2026');
  const [departmentId, setDepartmentId] = useState<string>(
    user?.role === 'MANAGER' && user.department?.id ? user.department.id : DEFAULT_DEPARTMENTS[0].id
  );
  const [designation, setDesignation] = useState('');
  const [role, setRole] = useState<'EMPLOYEE' | 'MANAGER' | 'HR'>('EMPLOYEE');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      departmentApi.getDepartments().then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setDepartments(data);
          // If Manager, default to their department
          if (user?.role === 'MANAGER' && user.department?.id) {
            setDepartmentId(user.department.id);
          } else if (!departmentId || !data.some((d) => d.id === departmentId)) {
            setDepartmentId(data[0].id);
          }
        }
      }).catch((err) => console.warn('Using default departments list:', err));
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const isHr = user?.role === 'HR';

  const handleUsernameChange = (val: string) => {
    // Format username: lowercase letters, numbers, underscores, and dots only (Instagram style)
    const formatted = val.toLowerCase().replace(/[^a-z0-9_.]/g, '');
    setUsername(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !username.trim() || !email.trim() || !password || !departmentId || !designation.trim()) {
      showError('Please fill in all mandatory fields.');
      return;
    }

    if (username.length < 3) {
      showError('Username must be at least 3 characters long.');
      return;
    }

    if (password.length < 6) {
      showError('Initial password must be at least 6 characters long.');
      return;
    }

    // 1. Work Email Security Validation
    const emailValidation = validateWorkEmail(email, isHr ? role : 'EMPLOYEE');
    if (!emailValidation.isValid) {
      showError(emailValidation.error || 'Please enter a valid work email.');
      return;
    }

    try {
      setIsSubmitting(true);
      let firebaseUid: string | undefined = undefined;
      let emailVerificationSent = false;

      // 2. Validate and provision user in Firebase Auth service
      try {
        const fbResult = await validateAndProvisionWorkEmailWithFirebase(
          email.trim(),
          password,
          name.trim()
        );
        firebaseUid = fbResult.uid;
        emailVerificationSent = fbResult.emailVerificationSent;
      } catch (fbErr: any) {
        if (fbErr?.code === 'auth/email-already-in-use') {
          showError(`Work email '${email}' is already registered in Firebase Auth.`);
          setIsSubmitting(false);
          return;
        } else if (fbErr?.code === 'auth/invalid-email') {
          showError(`Firebase Auth rejected '${email}' as an invalid email address.`);
          setIsSubmitting(false);
          return;
        } else {
          console.warn('Firebase provisioning notice:', fbErr?.message || fbErr);
        }
      }

      // 3. Register employee in ELAP database with matching firebaseUid
      await employeeApi.createEmployee({
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
        departmentId,
        designation: designation.trim(),
        role: isHr ? role : 'EMPLOYEE',
        phone: phone.trim() || undefined,
        firebaseUid,
      });

      showSuccess(
        `Employee ${name} (@${username}) onboarded! ${
          emailVerificationSent
            ? 'Firebase verification link dispatched to work email.'
            : 'Work account active.'
        }`
      );
      // Reset form
      setName('');
      setUsername('');
      setEmail('');
      setPassword('Welcome@2026');
      setDesignation('');
      setPhone('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to onboard employee. Check uniqueness of username/email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-[28px] border border-slate-200/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 sm:px-7 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-950 text-white flex items-center justify-center shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-950">Onboard New Employee</h3>
              <p className="text-3xs font-medium text-slate-500">
                {isHr ? 'HR Administrator Authority' : 'Manager Team Provisioning'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4 overflow-y-auto flex-1">
          {/* Full Name */}
          <div>
            <label className="block text-3xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Full Name *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ananya Verma"
                required
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-950"
              />
            </div>
          </div>

          {/* Username & Email Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Username */}
            <div>
              <label className="block text-3xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Username (@handle) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                  @
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="ananya_v"
                  required
                  className="w-full pl-7 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-950 font-mono"
                />
              </div>
            </div>

            {/* Work Email Address with Security Validation */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-3xs font-bold uppercase tracking-wider text-slate-600">
                  Work Email *
                </label>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3 text-indigo-600" /> Firebase Auth
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-950"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                A verification link will be dispatched to this inbox via Firebase Authentication.
              </p>
            </div>
          </div>

          {/* Initial Temporary Password */}
          <div>
            <label className="block text-3xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Initial Password * (Employee can change later)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Initial password"
                required
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-950 font-mono"
              />
            </div>
          </div>

          {/* Department & Designation Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-3xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Department *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  disabled={!isHr}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-950 disabled:bg-slate-100 disabled:text-slate-500"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-3xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Job Designation *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Briefcase className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Software Engineer"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-950"
                />
              </div>
            </div>
          </div>

          {/* Role (HR only) & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-3xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Role Authority *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Shield className="w-4 h-4" />
                </div>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  disabled={!isHr}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-950 disabled:bg-slate-100 disabled:text-slate-500"
                >
                  <option value="EMPLOYEE">Standard Employee</option>
                  {isHr && <option value="MANAGER">Department Manager</option>}
                  {isHr && <option value="HR">HR Lead (Admin)</option>}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-3xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-950"
                />
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-3xs text-indigo-900 leading-relaxed">
            💡 Standard leave quotas (12 Casual, 12 Sick, 15 Earned) will be automatically allocated upon account creation.
          </div>

          {/* Actions */}
          <div className="pt-3 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? 'Provisioning...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
