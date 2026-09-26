import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RejectModal } from '../../components/common/RejectModal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { approvalApi } from '../../api';
import { LeaveRequest } from '../../types';
import { Link } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { Clock, CheckCircle2, XCircle, AlertTriangle, Users, ArrowRight, Eye } from 'lucide-react';

export const ManagerDashboard: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Selected request for modal actions
  const [selectedReq, setSelectedReq] = useState<LeaveRequest | null>(null);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  const fetchManagerLeaves = async () => {
    try {
      setIsLoading(true);
      const data = await approvalApi.getManagerLeaves();
      setRequests(data);
    } catch (err) {
      console.error('Failed to load manager team leaves:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchManagerLeaves();
  }, []);

  const pendingRequests = requests.filter(
    (r) => r.status === 'PENDING_MANAGER' || r.status === 'ESCALATED'
  );
  const approvedThisMonth = requests.filter((r) => r.status === 'APPROVED' || r.status === 'PENDING_HR').length;
  const rejectedCount = requests.filter((r) => r.status === 'REJECTED_BY_MANAGER').length;
  const escalatedCount = requests.filter((r) => r.status === 'ESCALATED').length;

  const handleApproveConfirm = async () => {
    if (!selectedReq) return;
    try {
      await approvalApi.managerApprove(selectedReq.id);
      showSuccess(`Approved leave request ${selectedReq.requestId} and forwarded to HR.`);
      fetchManagerLeaves();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Approval failed.');
    }
  };

  const handleRejectConfirm = async (comment: string) => {
    if (!selectedReq) return;
    await approvalApi.managerReject(selectedReq.id, comment);
    showSuccess(`Rejected leave request ${selectedReq.requestId}.`);
    fetchManagerLeaves();
  };

  return (
    <Layout
      title="Manager Action Desk"
      subtitle="Review pending team approvals, monitor team leaves, and action requests"
    >
      <div className="space-y-8">
        {/* Top Metric Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Pending Approvals"
            value={pendingRequests.length}
            subtitle="Requires your review"
            icon={Clock}
            iconColor="text-amber-600"
            bgColor="bg-amber-50"
          />
          <StatCard
            title="Approved Leaves"
            value={approvedThisMonth}
            subtitle="Approved or in Tier 2"
            icon={CheckCircle2}
            iconColor="text-emerald-600"
            bgColor="bg-emerald-50"
          />
          <StatCard
            title="Rejected Requests"
            value={rejectedCount}
            subtitle="Tier 1 Manager Rejections"
            icon={XCircle}
            iconColor="text-rose-600"
            bgColor="bg-rose-50"
          />
          <StatCard
            title="Escalated to HR"
            value={escalatedCount}
            subtitle="Inaction > 72 Hours"
            icon={AlertTriangle}
            iconColor="text-rose-600"
            bgColor="bg-rose-100"
          />
        </div>

        {/* Pending Approval Table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Pending Team Approvals ({pendingRequests.length})
              </h3>
              <p className="text-xs text-slate-500">Action requests directly or review full details</p>
            </div>
          </div>

          {isLoading ? (
            <TableSkeleton rows={5} />
          ) : pendingRequests.length === 0 ? (
            <EmptyState
              title="No Pending Approvals"
              description="Great job! All team leave requests have been processed."
              icon="inbox"
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Employee</th>
                      <th className="px-6 py-4">Leave Type</th>
                      <th className="px-6 py-4">Dates</th>
                      <th className="px-6 py-4">Days</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Reason</th>
                      <th className="px-6 py-4 text-right">Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {pendingRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{req.employee.name}</div>
                          <div className="text-3xs text-slate-500">
                            {req.employee.employeeId} • {req.employee.designation}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-indigo-700">{req.leaveType.name}</td>
                        <td className="px-6 py-4 text-slate-600">
                          {new Date(req.startDate).toLocaleDateString()} – {new Date(req.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900">{req.daysCount} days</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={req.status} />
                        </td>
                        <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{req.reason}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/employee/leaves/${req.id}`}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => {
                                setSelectedReq(req);
                                setIsRejectOpen(true);
                              }}
                              className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg font-bold text-xs transition-colors"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => {
                                setSelectedReq(req);
                                setIsApproveOpen(true);
                              }}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-2xs transition-colors"
                            >
                              Approve
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Dialog Modals */}
      {selectedReq && (
        <>
          <ConfirmModal
            isOpen={isApproveOpen}
            onClose={() => setIsApproveOpen(false)}
            onConfirm={handleApproveConfirm}
            title="Approve Team Leave Request"
            message={`Are you sure you want to approve request ${selectedReq.requestId} for ${selectedReq.employee.name}? It will be forwarded to HR.`}
            confirmLabel="Approve & Forward to HR"
            variant="primary"
          />

          <RejectModal
            isOpen={isRejectOpen}
            onClose={() => setIsRejectOpen(false)}
            onConfirm={handleRejectConfirm}
            title="Reject Team Leave Request"
            requestId={selectedReq.requestId}
            employeeName={selectedReq.employee.name}
          />
        </>
      )}
    </Layout>
  );
};
