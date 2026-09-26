import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { approvalApi, departmentApi, reportApi } from '../../api';
import { LeaveRequest, Department, LeaveStatus } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { RejectModal } from '../../components/common/RejectModal';
import { Link } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { Search, Filter, Download, Eye, CheckCircle, XCircle } from 'lucide-react';

export const HrLeavesPage: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Filters State
  const [departmentId, setDepartmentId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [leaveTypeCode, setLeaveTypeCode] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Request for HR actions
  const [selectedReq, setSelectedReq] = useState<LeaveRequest | null>(null);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  const fetchHrLeaves = async () => {
    try {
      setIsLoading(true);
      const data = await approvalApi.getHrLeaves({
        departmentId: departmentId === 'ALL' ? undefined : departmentId,
        status: statusFilter === 'ALL' ? undefined : (statusFilter as LeaveStatus),
        search: searchQuery.trim() || undefined,
      });
      setRequests(data);
    } catch (err) {
      console.error('Failed to load HR organization leaves:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const depts = await departmentApi.getDepartments();
        setDepartments(depts);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDepts();
  }, []);

  useEffect(() => {
    fetchHrLeaves();
  }, [departmentId, statusFilter, leaveTypeCode]);

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const blob = await reportApi.exportLeavesCSV({
        departmentId: departmentId === 'ALL' ? undefined : departmentId,
        status: statusFilter === 'ALL' ? undefined : (statusFilter as LeaveStatus),
      });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ELAP_Filtered_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showSuccess('Filtered CSV report exported.');
    } catch (err) {
      showError('Failed to export CSV.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleHrApproveConfirm = async () => {
    if (!selectedReq) return;
    try {
      await approvalApi.hrApprove(selectedReq.id);
      showSuccess(`Final HR Approval granted for request ${selectedReq.requestId}. Balance deducted.`);
      fetchHrLeaves();
    } catch (err: any) {
      showError(err.response?.data?.message || 'HR Approval failed.');
    }
  };

  const handleHrRejectConfirm = async (comment: string) => {
    if (!selectedReq) return;
    await approvalApi.hrReject(selectedReq.id, comment);
    showSuccess(`Request ${selectedReq.requestId} rejected by HR.`);
    fetchHrLeaves();
  };

  return (
    <Layout
      title="All Organization Leaves"
      subtitle="Organization-wide leave records, department filters, and final HR sign-off"
    >
      <div className="space-y-6">
        {/* Search & Filter Controls */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchHrLeaves();
              }}
              className="relative flex-1 w-full"
            >
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Employee ID, Name, or Request ID..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
              />
            </form>

            <button
              onClick={handleExportCSV}
              disabled={isExporting}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Exporting...' : 'Export Filtered CSV'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-3xs font-bold uppercase text-slate-500 mb-1">Department</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800"
              >
                <option value="ALL">All 8 Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-3xs font-bold uppercase text-slate-500 mb-1">Leave Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING_HR">Pending HR Final Approval</option>
                <option value="PENDING_MANAGER">Pending Manager</option>
                <option value="ESCALATED">Escalated to HR</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED_BY_MANAGER">Rejected by Manager</option>
                <option value="REJECTED_BY_HR">Rejected by HR</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-3xs font-bold uppercase text-slate-500 mb-1">Leave Type</label>
              <select
                value={leaveTypeCode}
                onChange={(e) => setLeaveTypeCode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800"
              >
                <option value="ALL">All Leave Types (CL, SL, EL)</option>
                <option value="CL">Casual Leave (CL)</option>
                <option value="SL">Sick Leave (SL)</option>
                <option value="EL">Earned Leave (EL)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Requests Table */}
        {isLoading ? (
          <TableSkeleton rows={6} />
        ) : requests.length === 0 ? (
          <EmptyState
            title="No Matching Leave Records"
            description="There are no leave requests matching your selected department, status, or search filters."
            icon="calendar"
          />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Request ID</th>
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Leave Type</th>
                    <th className="px-6 py-4">Dates</th>
                    <th className="px-6 py-4">Days</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {requests.map((req) => {
                    const isHrActionable = req.status === 'PENDING_HR' || req.status === 'ESCALATED';
                    return (
                      <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-bold text-indigo-600">{req.requestId}</td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{req.employee.name}</div>
                          <div className="text-3xs text-slate-500">ID: {req.employee.employeeId}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-700">
                            {req.employee.department.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900">{req.leaveType.name}</td>
                        <td className="px-6 py-4 text-slate-600">
                          {new Date(req.startDate).toLocaleDateString()} – {new Date(req.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900">{req.daysCount}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={req.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/employee/leaves/${req.id}`}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>

                            {isHrActionable && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedReq(req);
                                    setIsRejectOpen(true);
                                  }}
                                  className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg font-bold text-xs"
                                >
                                  Reject
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedReq(req);
                                    setIsApproveOpen(true);
                                  }}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-2xs"
                                >
                                  Final Approve
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Action Dialog Modals */}
      {selectedReq && (
        <>
          <ConfirmModal
            isOpen={isApproveOpen}
            onClose={() => setIsApproveOpen(false)}
            onConfirm={handleHrApproveConfirm}
            title="Final HR Approval"
            message={`Are you sure you want to grant final HR approval for request ${selectedReq.requestId}? Leave balance will be permanently deducted.`}
            confirmLabel="Grant Final HR Approval"
            variant="success"
          />

          <RejectModal
            isOpen={isRejectOpen}
            onClose={() => setIsRejectOpen(false)}
            onConfirm={handleHrRejectConfirm}
            title="HR Rejection"
            requestId={selectedReq.requestId}
            employeeName={selectedReq.employee.name}
          />
        </>
      )}
    </Layout>
  );
};
