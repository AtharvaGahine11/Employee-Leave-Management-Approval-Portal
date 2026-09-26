import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { leaveApi, approvalApi } from '../../api';
import { LeaveRequest, LeaveBalance } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ApprovalTimeline } from '../../components/approval/ApprovalTimeline';
import { CommentThread } from '../../components/leave/CommentThread';
import { AttachmentUploader } from '../../components/leave/AttachmentUploader';
import { AuditTimeline } from '../../components/audit/AuditTimeline';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { RejectModal } from '../../components/common/RejectModal';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { ArrowLeft, Ban, CheckCircle, XCircle, Calendar, User, Building2 } from 'lucide-react';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';

export const RequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasRole, refreshBalances } = useAuth();
  const { showSuccess, showError } = useToast();

  const [leaveRequest, setLeaveRequest] = useState<LeaveRequest | null>(null);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  const fetchDetails = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const res = await leaveApi.getLeaveDetails(id);
      setLeaveRequest(res.leaveRequest);
      setBalances(res.balances);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to load request details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  if (isLoading || !leaveRequest) {
    return (
      <Layout title="Leave Request Detail" subtitle="Loading details...">
        <TableSkeleton rows={4} />
      </Layout>
    );
  }

  // Eligibility logic
  const isApplicant = leaveRequest.employeeId === user?.id;
  const isManager = hasRole('MANAGER') && leaveRequest.employee.managerId === user?.id;
  const isHR = hasRole('HR');

  const canCancel =
    (isApplicant || isHR) &&
    leaveRequest.status !== 'APPROVED' &&
    leaveRequest.status !== 'REJECTED_BY_MANAGER' &&
    leaveRequest.status !== 'REJECTED_BY_HR' &&
    leaveRequest.status !== 'CANCELLED';

  const isPending =
    leaveRequest.status === 'PENDING_MANAGER' ||
    leaveRequest.status === 'PENDING_HR' ||
    leaveRequest.status === 'ESCALATED';

  // Manager action (Tier 1): for reporting managers on PENDING_MANAGER or ESCALATED requests
  const canManagerAction =
    isManager && !isHR && (leaveRequest.status === 'PENDING_MANAGER' || leaveRequest.status === 'ESCALATED');

  // HR action (Tier 2 Final Sign-Off): HR can grant direct Final HR Approval on any pending request
  const canHrAction = isHR && isPending;

  const handleCancelConfirm = async () => {
    if (!id) return;
    try {
      await leaveApi.cancelLeave(id);
      showSuccess('Leave request cancelled successfully.');
      await refreshBalances();
      fetchDetails();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to cancel request.');
    }
  };

  const handleManagerApprove = async () => {
    if (!id) return;
    try {
      await approvalApi.managerApprove(id);
      showSuccess('Request approved and forwarded to HR.');
      fetchDetails();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Approval failed.');
    }
  };

  const handleManagerReject = async (comment: string) => {
    if (!id) return;
    await approvalApi.managerReject(id, comment);
    showSuccess('Request rejected.');
    fetchDetails();
  };

  const handleHrApprove = async () => {
    if (!id) return;
    try {
      await approvalApi.hrApprove(id);
      showSuccess('Final HR Approval Granted. Leave balance finalized!');
      fetchDetails();
    } catch (err: any) {
      showError(err.response?.data?.message || 'HR Approval failed.');
    }
  };

  const handleHrReject = async (comment: string) => {
    if (!id) return;
    await approvalApi.hrReject(id, comment);
    showSuccess('Request rejected by HR.');
    fetchDetails();
  };

  return (
    <Layout
      title={`Request: ${leaveRequest.requestId}`}
      subtitle={`Submitted by ${leaveRequest.employee.name} (${leaveRequest.employee.department.name})`}
    >
      <div className="space-y-8">
        {/* Top Header Controls */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex items-center gap-3">
            <StatusBadge status={leaveRequest.status} size="lg" />

            {canCancel && (
              <button
                onClick={() => setIsCancelModalOpen(true)}
                className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" /> Cancel Request
              </button>
            )}

            {/* Manager Actions */}
            {canManagerAction && (
              <>
                <button
                  onClick={() => setIsRejectModalOpen(true)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
                <button
                  onClick={() => setIsApproveModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Approve & Forward
                </button>
              </>
            )}

            {/* HR Actions */}
            {canHrAction && (
              <>
                <button
                  onClick={() => setIsRejectModalOpen(true)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" /> HR Reject
                </button>
                <button
                  onClick={handleHrApprove}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Final HR Approve
                </button>
              </>
            )}
          </div>
        </div>

        {/* Main Grid: Details + Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Details Card */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
              <div>
                <span className="text-3xs font-extrabold uppercase tracking-widest text-indigo-600">
                  {leaveRequest.leaveType.code} — {leaveRequest.leaveType.name}
                </span>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">
                  {leaveRequest.daysCount} {leaveRequest.daysCount === 1 ? 'Day' : 'Days'} Leave Request
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block mb-0.5">Start Date</span>
                  <span className="font-bold text-slate-900">
                    {new Date(leaveRequest.startDate).toLocaleDateString(undefined, {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block mb-0.5">End Date</span>
                  <span className="font-bold text-slate-900">
                    {new Date(leaveRequest.endDate).toLocaleDateString(undefined, {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Reason Provided</h4>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {leaveRequest.reason}
                </div>
              </div>

              {/* Applicant Card */}
              <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
                  {leaveRequest.employee.name.charAt(0)}
                </div>
                <div className="text-xs">
                  <h5 className="font-bold text-slate-900">{leaveRequest.employee.name}</h5>
                  <p className="text-slate-500">
                    {leaveRequest.employee.designation} • {leaveRequest.employee.department.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Comment Thread */}
            <CommentThread requestId={leaveRequest.id} initialComments={leaveRequest.comments || []} />

            {/* Attachment Uploader */}
            <AttachmentUploader
              requestId={leaveRequest.id}
              initialAttachments={leaveRequest.attachments || []}
              canUpload={isApplicant || isHR}
            />
          </div>

          {/* Right Column: Timeline & Audit */}
          <div className="lg:col-span-5 space-y-6">
            <ApprovalTimeline leaveRequest={leaveRequest} />
            <AuditTimeline logs={leaveRequest.auditLogs || []} />
          </div>
        </div>
      </div>

      {/* Confirmation & Rejection Modals */}
      <ConfirmModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancelConfirm}
        title="Cancel Leave Request"
        message="Are you sure you want to cancel this leave request? Your pending leave balance will be restored immediately."
        confirmLabel="Yes, Cancel Request"
        variant="danger"
      />

      <ConfirmModal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        onConfirm={handleManagerApprove}
        title="Approve Leave Request"
        message={`Are you sure you want to approve leave request ${leaveRequest.requestId}? It will be forwarded to HR for final approval.`}
        confirmLabel="Approve & Forward to HR"
        variant="primary"
      />

      <RejectModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={canManagerAction ? handleManagerReject : handleHrReject}
        title="Reject Leave Request"
        requestId={leaveRequest.requestId}
        employeeName={leaveRequest.employee.name}
      />
    </Layout>
  );
};
