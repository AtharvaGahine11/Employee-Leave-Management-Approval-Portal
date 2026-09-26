import React, { useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { leaveApi } from '../../api';
import { useNavigate } from 'react-router-dom';
import { Calendar, AlertCircle, FileText, CheckCircle, Save, Send } from 'lucide-react';

export const ApplyLeavePage: React.FC = () => {
  const { balances, refreshBalances } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [leaveTypeId, setLeaveTypeId] = useState(balances[0]?.leaveTypeId || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected Leave Balance
  const selectedBalance = balances.find((b) => b.leaveTypeId === leaveTypeId) || balances[0];

  // Calculated Days
  const calculatedDays =
    startDate && endDate && new Date(endDate) >= new Date(startDate)
      ? Math.ceil(
          Math.abs(new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
        ) + 1
      : 0;

  // Validation Warnings
  const isPastDate = Boolean(startDate && new Date(startDate) < new Date(new Date().setHours(0, 0, 0, 0)));
  const isInsufficient = Boolean(selectedBalance && calculatedDays > selectedBalance.availableDays);
  const isClExceeded = Boolean(
    selectedBalance?.code === 'CL' && selectedBalance.maxConsecutive && calculatedDays > selectedBalance.maxConsecutive
  );
  const isSlMedicalRequired = Boolean(selectedBalance?.code === 'SL' && calculatedDays >= 3);

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();
    if (!leaveTypeId) {
      showError('Please select a leave type.');
      return;
    }
    if (!startDate || !endDate) {
      showError('Please select start and end dates.');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      showError('End date cannot be before start date.');
      return;
    }
    if (isPastDate) {
      showError('Leave start date cannot be in the past.');
      return;
    }
    if (!reason.trim() || reason.trim().length < 5) {
      showError('Please provide a valid leave reason (minimum 5 characters).');
      return;
    }
    if (!isDraft && isInsufficient) {
      showError(`Insufficient leave balance. You have ${selectedBalance?.availableDays} days available.`);
      return;
    }
    if (!isDraft && isClExceeded) {
      showError(`Casual Leave (CL) cannot exceed ${selectedBalance?.maxConsecutive} consecutive days.`);
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await leaveApi.createLeave({
        leaveTypeId,
        startDate,
        endDate,
        reason: reason.trim(),
        isDraft,
      });

      await refreshBalances();
      showSuccess(
        isDraft
          ? 'Leave request saved as Draft.'
          : `Leave request ${created.requestId} submitted successfully to your manager!`
      );
      navigate(`/employee/leaves/${created.id}`);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to submit leave request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout
      title="Apply For Leave"
      subtitle="Submit a new leave application or save a draft for later"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Form */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
          <form className="space-y-6">
            {/* 1. Select Leave Type */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Select Leave Type <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {balances.map((b) => (
                  <div
                    key={b.leaveTypeId}
                    onClick={() => setLeaveTypeId(b.leaveTypeId)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      (leaveTypeId || balances[0]?.leaveTypeId) === b.leaveTypeId
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-sm text-slate-900">{b.code}</span>
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                        {b.availableDays} Left
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{b.name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Select Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Start Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 text-sm font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  End Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 text-sm font-medium text-slate-900"
                />
              </div>
            </div>

            {/* Calculated Days Pill */}
            {calculatedDays > 0 && (
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-bold text-indigo-900">
                    Calculated Total Duration: {calculatedDays} {calculatedDays === 1 ? 'Day' : 'Days'}
                  </span>
                </div>
                {selectedBalance && (
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      isInsufficient ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {selectedBalance.availableDays - calculatedDays} Days Remaining After
                  </span>
                )}
              </div>
            )}

            {/* Validation Alerts */}
            {isClExceeded && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>
                  Casual Leave (CL) cannot exceed <strong>{selectedBalance.maxConsecutive} consecutive days</strong>. Please reduce duration or select Earned Leave.
                </span>
              </div>
            )}

            {isSlMedicalRequired && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  Sick Leave (SL) for 3 or more consecutive days requires attaching a Medical Certificate after creation.
                </span>
              </div>
            )}

            {/* 3. Reason */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Reason for Leave <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                required
                placeholder="State your reason clearly for your reporting manager..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 text-sm text-slate-900 placeholder-slate-400 resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={isSubmitting}
                className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> Save as Draft
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, false)}
                disabled={isSubmitting || isInsufficient || isClExceeded}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" /> Submit Request
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: Policy Rules & Selected Balance Box */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4">Selected Entitlement Info</h3>
            {selectedBalance && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                  <span className="text-2xs font-extrabold uppercase text-indigo-700 tracking-wider">
                    {selectedBalance.code} — {selectedBalance.name}
                  </span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {selectedBalance.availableDays} Days Available
                  </div>
                  <span className="text-xs text-slate-500">Out of {selectedBalance.openingBalance} Days Annual Entitlement</span>
                </div>

                <div className="text-xs space-y-2 text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span>Approved / Used:</span>
                    <strong className="text-emerald-600">{selectedBalance.approvedDays} days</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending Approval:</span>
                    <strong className="text-amber-600">{selectedBalance.pendingDays} days</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Carry Forward:</span>
                    <strong>{selectedBalance.carryForward ? 'Yes' : 'No'}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-md space-y-3 text-xs leading-relaxed">
            <h4 className="font-bold text-sm text-indigo-300">Policy Reminders</h4>
            <p>• Pending requests temporarily deduct from Available Balance.</p>
            <p>• Final deduction happens only upon HR final approval.</p>
            <p>• Rejections or cancellations immediately restore your available balance.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};
