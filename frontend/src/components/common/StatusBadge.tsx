import React from 'react';
import { LeaveStatus } from '../../types';
import { Clock, CheckCircle2, XCircle, AlertTriangle, FileEdit, Ban } from 'lucide-react';

interface StatusBadgeProps {
  status: LeaveStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  const getStatusConfig = (s: LeaveStatus) => {
    switch (s) {
      case 'DRAFT':
        return {
          label: 'Draft',
          icon: FileEdit,
          className: 'bg-slate-100 text-slate-700 border-slate-200',
        };
      case 'PENDING_MANAGER':
        return {
          label: 'Pending Manager',
          icon: Clock,
          className: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      case 'PENDING_HR':
        return {
          label: 'Pending HR',
          icon: Clock,
          className: 'bg-sky-50 text-sky-800 border-sky-200',
        };
      case 'ESCALATED':
        return {
          label: 'Escalated to HR',
          icon: AlertTriangle,
          className: 'bg-rose-100 text-rose-800 border-rose-300 font-semibold animate-pulse',
        };
      case 'APPROVED':
        return {
          label: 'Approved',
          icon: CheckCircle2,
          className: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-medium',
        };
      case 'REJECTED_BY_MANAGER':
        return {
          label: 'Rejected by Manager',
          icon: XCircle,
          className: 'bg-rose-50 text-rose-800 border-rose-200',
        };
      case 'REJECTED_BY_HR':
        return {
          label: 'Rejected by HR',
          icon: XCircle,
          className: 'bg-rose-50 text-rose-800 border-rose-200',
        };
      case 'CANCELLED':
        return {
          label: 'Cancelled',
          icon: Ban,
          className: 'bg-slate-100 text-slate-500 border-slate-200',
        };
      default:
        return {
          label: s,
          icon: Clock,
          className: 'bg-slate-100 text-slate-700 border-slate-200',
        };
    }
  };

  const config = getStatusConfig(status);
  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border shadow-2xs whitespace-nowrap ${
        sizeClasses[size]
      } ${config.className}`}
    >
      <IconComponent className={iconSizes[size]} />
      {config.label}
    </span>
  );
};
