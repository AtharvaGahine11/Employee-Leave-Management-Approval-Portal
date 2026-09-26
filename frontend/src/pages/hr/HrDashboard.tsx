import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { StatCard } from '../../components/common/StatCard';
import { DepartmentChart } from '../../components/charts/DepartmentChart';
import { LeaveTypeChart } from '../../components/charts/LeaveTypeChart';
import { OnboardEmployeeModal } from '../../components/employee/OnboardEmployeeModal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { RejectModal } from '../../components/common/RejectModal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { reportApi, approvalApi, departmentApi, cronApi } from '../../api';
import { LeaveRequest, Department } from '../../types';
import { Link } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Building2,
  Calendar,
  FileText,
  UserPlus,
  Play,
  RotateCw,
  Eye,
  CheckCircle,
  ShieldAlert,
} from 'lucide-react';

export const HrDashboard: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [reportData, setReportData] = useState<any>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isRunningSla, setIsRunningSla] = useState<boolean>(false);
  const [showOnboardModal, setShowOnboardModal] = useState<boolean>(false);

  // Quick Action Modal states
  const [selectedReq, setSelectedReq] = useState<LeaveRequest | null>(null);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  const fetchReports = async (deptId?: string) => {
    try {
      setIsLoading(true);
      const data = await reportApi.getLeaveSummaryReport({
        departmentId: deptId && deptId !== 'ALL' ? deptId : undefined,
      });
      setReportData(data);
    } catch (err) {
      console.error('Failed to load HR reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingActions = async () => {
    try {
      // Fetch both PENDING_HR and ESCALATED requests needing HR attention
      const [pendingHr, escalated] = await Promise.all([
        approvalApi.getHrLeaves({ status: 'PENDING_HR' as any }),
        approvalApi.getHrLeaves({ status: 'ESCALATED' as any }),
      ]);
      setPendingLeaves([...pendingHr, ...escalated]);
    } catch (err) {
      console.error('Failed to load pending HR actions:', err);
    }
  };

  useEffect(() => {
    departmentApi.getDepartments().then(setDepartments).catch(console.error);
    fetchPendingActions();
  }, []);

  useEffect(() => {
    fetchReports(selectedDept);
  }, [selectedDept]);

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const blob = await reportApi.exportLeavesCSV({
        departmentId: selectedDept !== 'ALL' ? selectedDept : undefined,
      });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `ELAP_HR_Leave_Report_${selectedDept !== 'ALL' ? selectedDept + '_' : ''}${new Date().toISOString().split('T')[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      showSuccess('CSV Leave Report downloaded successfully!');
    } catch (err) {
      showError('Failed to generate CSV report download.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRunSlaCheck = async () => {
    try {
      setIsRunningSla(true);
      const res = await cronApi.triggerSlaCheck();
      const { reminderCount, escalationCount } = res.data;
      showSuccess(
        `SLA Inaction Check executed: ${reminderCount} Reminders sent to managers, ${escalationCount} Requests escalated to HR.`
      );
      fetchReports(selectedDept);
      fetchPendingActions();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to execute SLA check.');
    } finally {
      setIsRunningSla(false);
    }
  };

  const handleHrApproveConfirm = async () => {
    if (!selectedReq) return;
    try {
      await approvalApi.hrApprove(selectedReq.id);
      showSuccess(`Final HR Approval granted for ${selectedReq.requestId}. Balance deducted & notification emails sent!`);
      fetchReports(selectedDept);
      fetchPendingActions();
    } catch (err: any) {
      showError(err.response?.data?.message || 'HR Approval failed.');
    }
  };

  const handleHrRejectConfirm = async (comment: string) => {
    if (!selectedReq) return;
    try {
      await approvalApi.hrReject(selectedReq.id, comment);
      showSuccess(`Request ${selectedReq.requestId} rejected by HR.`);
      fetchReports(selectedDept);
      fetchPendingActions();
    } catch (err: any) {
      showError(err.response?.data?.message || 'HR Rejection failed.');
    }
  };

  const metrics = reportData?.metrics || {
    totalEmployees: 0,
    totalRequests: 0,
    pendingManager: 0,
    pendingHr: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    escalated: 0,
    totalApprovedDays: 0,
  };

  return (
    <Layout
      title="HR Command Center"
      subtitle="Organization-wide leave management, real-time analytics, SLA escalations, and policy governance"
    >
      <div className="space-y-8">
        {/* Banner with Executive Actions */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border border-indigo-900/30">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-3xs font-extrabold uppercase bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 tracking-wider">
                Sprint 3 Review Center
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-3xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Live Supabase DB
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight mt-2">Organization-Wide Leave Command Center</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
              Monitoring 8 corporate departments. Execute automated SLA checks (48h reminders &amp; 72h escalations), review audit logs, and export executive CSV reports.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleRunSlaCheck}
              disabled={isRunningSla}
              className="px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 flex-shrink-0 disabled:opacity-50"
              title="Executes the automated 48h manager reminder and 72h HR escalation job"
            >
              <RotateCw className={`w-4 h-4 ${isRunningSla ? 'animate-spin' : ''}`} />
              <span>{isRunningSla ? 'Checking SLA...' : 'Run SLA Check'}</span>
            </button>

            <button
              onClick={() => setShowOnboardModal(true)}
              className="px-4 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 flex-shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Onboard Employee</span>
            </button>

            <button
              onClick={handleExportCSV}
              disabled={isExporting}
              className="px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 flex-shrink-0 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        </div>

        {/* Department Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>Filter Analytics by Department:</span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full sm:w-64 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Departments (Organization-Wide)</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
            {selectedDept !== 'ALL' && (
              <button
                onClick={() => setSelectedDept('ALL')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline whitespace-nowrap"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <OnboardEmployeeModal
          isOpen={showOnboardModal}
          onClose={() => setShowOnboardModal(false)}
          onSuccess={() => fetchReports(selectedDept)}
        />

        {/* Primary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Active Employees"
            value={metrics.totalEmployees}
            subtitle={selectedDept === 'ALL' ? 'Across 8 Departments' : 'In Selected Department'}
            icon={Users}
            iconColor="text-indigo-600"
            bgColor="bg-indigo-50"
          />
          <StatCard
            title="Pending Manager Review"
            value={metrics.pendingManager}
            subtitle="Tier 1 Approval Queue"
            icon={Clock}
            iconColor="text-amber-600"
            bgColor="bg-amber-50"
          />
          <StatCard
            title="Pending HR Approval"
            value={metrics.pendingHr}
            subtitle="Tier 2 Final Action Required"
            icon={FileText}
            iconColor="text-sky-600"
            bgColor="bg-sky-50"
          />
          <StatCard
            title="Escalated Requests"
            value={metrics.escalated}
            subtitle="Manager Inaction > 72h"
            icon={AlertTriangle}
            iconColor="text-rose-600"
            bgColor="bg-rose-100"
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard
            title="Approved Leaves"
            value={metrics.approved}
            subtitle="Final HR Granted & Deducted"
            icon={CheckCircle2}
            iconColor="text-emerald-600"
            bgColor="bg-emerald-50"
          />
          <StatCard
            title="Rejected Requests"
            value={metrics.rejected}
            subtitle="Manager or HR Rejected"
            icon={XCircle}
            iconColor="text-rose-600"
            bgColor="bg-rose-50"
          />
          <StatCard
            title="Total Approved Days"
            value={`${metrics.totalApprovedDays} Days`}
            subtitle="Absence Volume Total"
            icon={Calendar}
            iconColor="text-purple-600"
            bgColor="bg-purple-50"
          />
        </div>

        {/* Pending Actions Table (Urgent Approvals) */}
        {pendingLeaves.length > 0 && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">
                  Action Required: Pending HR Sign-off &amp; Escalations ({pendingLeaves.length})
                </h3>
              </div>
              <Link
                to="/hr/leaves"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                View All Organization Leaves &rarr;
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Request ID</th>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Quick Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingLeaves.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-bold text-indigo-600">
                        <Link to={`/employee/leaves/${req.id}`} className="hover:underline">
                          {req.requestId}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{req.employee.name}</div>
                        <div className="text-3xs text-slate-500">ID: {req.employee.employeeId}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
                          {req.employee.department.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800">{req.leaveType.name}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(req.startDate).toLocaleDateString()} &ndash; {new Date(req.endDate).toLocaleDateString()}
                        <span className="ml-1 text-3xs font-bold text-slate-900">({req.daysCount}d)</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={req.status} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/employee/leaves/${req.id}`}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Inspect Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analytics Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            <DepartmentChart data={reportData?.departmentBreakdown || []} />
          </div>
          <div className="lg:col-span-5">
            <LeaveTypeChart data={reportData?.leaveTypeBreakdown || []} />
          </div>
        </div>
      </div>

      {/* Quick Approval Modals */}
      {selectedReq && (
        <>
          <ConfirmModal
            isOpen={isApproveOpen}
            onClose={() => setIsApproveOpen(false)}
            onConfirm={handleHrApproveConfirm}
            title="Final HR Approval"
            message={`Grant final HR approval for request ${selectedReq.requestId} (${selectedReq.employee.name})? This will deduct ${selectedReq.daysCount} days from their quota and trigger automated email notifications to employee and manager.`}
            confirmLabel="Grant Final Approval"
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
