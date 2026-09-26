import React from 'react';
import { LeaveBalance } from '../../types';
import { Calendar } from 'lucide-react';

interface LeaveBalanceCardProps {
  balance: LeaveBalance;
}

export const LeaveBalanceCard: React.FC<LeaveBalanceCardProps> = ({ balance }) => {
  const percentUsed = Math.min(
    100,
    Math.round(((balance.approvedDays + balance.pendingDays) / balance.openingBalance) * 100)
  );

  const getBadgeColor = (code: string) => {
    switch (code) {
      case 'CL':
        return 'bg-indigo-50 border-indigo-200 text-indigo-700';
      case 'SL':
        return 'bg-teal-50 border-teal-200 text-teal-700';
      case 'EL':
        return 'bg-purple-50 border-purple-200 text-purple-700';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  const getProgressColor = (code: string) => {
    switch (code) {
      case 'CL':
        return 'bg-indigo-600';
      case 'SL':
        return 'bg-teal-600';
      case 'EL':
        return 'bg-purple-600';
      default:
        return 'bg-slate-600';
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold border tracking-wide uppercase ${getBadgeColor(
            balance.code
          )}`}
        >
          {balance.code} — {balance.name}
        </span>
        <Calendar className="w-5 h-5 text-slate-400" />
      </div>

      <div className="flex items-baseline gap-2 mb-2 font-tabular">
        <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {balance.availableDays}
        </span>
        <span className="text-xs font-medium text-slate-500">
          / {balance.openingBalance} Days Remaining
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full transition-all duration-500 rounded-full ${getProgressColor(balance.code)}`}
          style={{ width: `${percentUsed}%` }}
        ></div>
      </div>

      {/* Simplified 3 Metrics Breakdown: Total Quota | Taken | Remaining */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center font-tabular">
        <div>
          <span className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">Total Quota</span>
          <span className="text-xs sm:text-sm font-bold text-slate-800">{balance.openingBalance} Days</span>
        </div>
        <div>
          <span className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">Taken</span>
          <span className="text-xs sm:text-sm font-bold text-emerald-600">{balance.approvedDays} Days</span>
        </div>
        <div>
          <span className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">Remaining</span>
          <span className="text-xs sm:text-sm font-bold text-indigo-600">{balance.availableDays} Days</span>
        </div>
      </div>

      {/* Rules Pill */}
      <div className="mt-3 pt-2 text-3xs text-slate-400 flex items-center justify-between border-t border-slate-50">
        {balance.maxConsecutive ? (
          <span>Max {balance.maxConsecutive} consecutive days</span>
        ) : (
          <span>No consecutive limit</span>
        )}
        {balance.carryForward ? (
          <span className="text-purple-600 font-medium">Carry Forward: Yes</span>
        ) : (
          <span>No Carry Forward</span>
        )}
      </div>
    </div>
  );
};
