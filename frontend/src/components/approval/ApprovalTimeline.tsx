import React from 'react';
import { LeaveRequest } from '../../types';
import { CheckCircle2, Clock, XCircle, AlertTriangle, ShieldCheck, UserCheck } from 'lucide-react';

interface ApprovalTimelineProps {
  leaveRequest: LeaveRequest;
}

export const ApprovalTimeline: React.FC<ApprovalTimelineProps> = ({ leaveRequest }) => {
  const { status, approvals = [], employee, submittedAt } = leaveRequest;

  const managerApproval = approvals.find((a) => a.tier === 'MANAGER');
  const hrApproval = approvals.find((a) => a.tier === 'HR');

  const steps = [
    {
      title: 'Submitted by Employee',
      actor: employee.name,
      time: submittedAt ? new Date(submittedAt).toLocaleString() : 'Draft',
      status: 'completed',
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-100',
    },
    {
      title: 'Tier 1: Reporting Manager Review',
      actor: employee.manager?.name || 'Assigned Manager',
      time: managerApproval ? new Date(managerApproval.actedAt).toLocaleString() : 'Pending',
      comment: managerApproval?.comment,
      status:
        status === 'REJECTED_BY_MANAGER'
          ? 'rejected'
          : managerApproval
          ? 'completed'
          : status === 'CANCELLED'
          ? 'cancelled'
          : 'current',
      icon: status === 'REJECTED_BY_MANAGER' ? XCircle : managerApproval ? UserCheck : Clock,
      color:
        status === 'REJECTED_BY_MANAGER'
          ? 'text-rose-600 bg-rose-100'
          : managerApproval
          ? 'text-emerald-600 bg-emerald-100'
          : 'text-amber-600 bg-amber-100',
    },
    {
      title: 'Tier 2: HR Final Approval',
      actor: hrApproval ? hrApproval.approver.name : 'HR Team',
      time: hrApproval ? new Date(hrApproval.actedAt).toLocaleString() : 'Awaiting Tier 1',
      comment: hrApproval?.comment,
      status:
        status === 'REJECTED_BY_HR'
          ? 'rejected'
          : status === 'APPROVED'
          ? 'completed'
          : status === 'PENDING_HR' || status === 'ESCALATED'
          ? 'current'
          : 'pending',
      icon:
        status === 'REJECTED_BY_HR'
          ? XCircle
          : status === 'APPROVED'
          ? ShieldCheck
          : status === 'ESCALATED'
          ? AlertTriangle
          : Clock,
      color:
        status === 'REJECTED_BY_HR'
          ? 'text-rose-600 bg-rose-100'
          : status === 'APPROVED'
          ? 'text-emerald-600 bg-emerald-100'
          : status === 'ESCALATED'
          ? 'text-rose-600 bg-rose-100'
          : status === 'PENDING_HR'
          ? 'text-sky-600 bg-sky-100'
          : 'text-slate-400 bg-slate-100',
    },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
      <h3 className="text-base font-bold text-slate-900 mb-6">2-Tier Approval Workflow Timeline</h3>
      <div className="relative pl-6 space-y-8 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={idx} className="relative flex items-start gap-4">
              <div
                className={`absolute -left-[24px] w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-xs z-10 ${step.color}`}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900">{step.title}</h4>
                  <span className="text-xs text-slate-500">{step.time}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Actor: <span className="font-medium text-slate-800">{step.actor}</span>
                </p>
                {step.comment && (
                  <div className="mt-2.5 p-2.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 italic">
                    "{step.comment}"
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
