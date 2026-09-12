"use client";

import React, { useState, useEffect } from "react";
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  AlertCircle,
  ShieldCheck,
  Building,
  Calendar,
  Search,
  Filter,
  Check,
  X,
  FileClock,
  Sparkles,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth/AuthContext";
import { dataStore } from "@/lib/data/store";
import { formatDate, getLeaveTypeLabel } from "@/lib/utils";
import { LeaveRequest, Department } from "@/types";

export default function HrLeaveRequestsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [activeTab, setActiveTab] = useState<"PENDING_HR" | "PENDING_MANAGER" | "ALL">("PENDING_HR");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [selectedReq, setSelectedReq] = useState<LeaveRequest | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = () => {
    setRequests(dataStore.getLeaveRequests());
    setDepartments(dataStore.getDepartments());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("elap_data_updated", loadData);
    return () => window.removeEventListener("elap_data_updated", loadData);
  }, []);

  if (!user) return null;

  const pendingHrRequests = requests.filter((r) => r.status === "PENDING_HR");
  const pendingManagerRequests = requests.filter((r) => r.status === "PENDING_MANAGER");
  const approvedTotal = requests.filter((r) => r.status === "APPROVED").length;

  const filteredRequests = requests.filter((r) => {
    // Tab filter
    if (activeTab === "PENDING_HR" && r.status !== "PENDING_HR") return false;
    if (activeTab === "PENDING_MANAGER" && r.status !== "PENDING_MANAGER") return false;

    // Dept filter
    if (deptFilter !== "ALL" && r.departmentName !== deptFilter) return false;

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = r.employeeName.toLowerCase().includes(q);
      const matchId = r.requestId.toLowerCase().includes(q);
      const matchDept = r.departmentName.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchDept) return false;
    }

    return true;
  });

  const handleHrApprove = (req: LeaveRequest) => {
    setIsProcessing(true);
    const res = dataStore.hrReview({
      requestId: req.id,
      hrId: user?.employeeId || "EMP-1001",
      hrName: user?.name || "HR Admin",
      approved: true,
      remarks: "Final HR authorization granted. Leave quota deducted.",
    });
    setIsProcessing(false);

    if (res.success) {
      toast({
        type: "success",
        title: "Final HR Approval Granted",
        message: `${req.employeeName}'s leave request is authorized and quota deducted.`,
      });
      setIsViewModalOpen(false);
      loadData();
    } else {
      toast({
        type: "error",
        title: "Action Failed",
        message: res.error || "Unable to approve request",
      });
    }
  };

  const handleOpenReject = (req: LeaveRequest) => {
    setSelectedReq(req);
    setRejectionReason("");
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = () => {
    if (!selectedReq) return;
    if (!rejectionReason.trim()) {
      toast({
        type: "error",
        title: "Reason Required",
        message: "Please enter a mandatory justification for HR rejection.",
      });
      return;
    }

    setIsProcessing(true);
    const res = dataStore.hrReview({
      requestId: selectedReq.id,
      hrId: user?.employeeId || "EMP-1001",
      hrName: user?.name || "HR Admin",
      approved: false,
      remarks: rejectionReason.trim(),
    });
    setIsProcessing(false);

    if (res.success) {
      toast({
        type: "info",
        title: "Leave Request Rejected by HR",
        message: `Request ${selectedReq.requestId} has been rejected by HR.`,
      });
      setIsRejectModalOpen(false);
      setIsViewModalOpen(false);
      setSelectedReq(null);
      loadData();
    } else {
      toast({
        type: "error",
        title: "Action Failed",
        message: res.error || "Unable to reject request",
      });
    }
  };

  return (
    <AppShell
      title="Leave Requests Management"
      subtitle="Organization-wide authorization queue and two-tier review pipeline"
    >
      <div className="space-y-6">
        {/* Bento KPI Summary Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl border border-white/[0.08] bg-[#121826]/60 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Pending HR Sign-Off
            </span>
            <div className="mt-2 text-3xl font-extrabold text-white flex items-center gap-2">
              <span>{pendingHrRequests.length}</span>
              {pendingHrRequests.length > 0 && (
                <span className="text-xs font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full">
                  Action Required
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Manager-endorsed requests</p>
          </div>

          <div className="p-5 rounded-3xl border border-white/[0.08] bg-[#121826]/60 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Pending Manager Review
            </span>
            <div className="mt-2 text-3xl font-extrabold text-amber-400">
              {pendingManagerRequests.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Tier-1 pending applications</p>
          </div>

          <div className="p-5 rounded-3xl border border-white/[0.08] bg-[#121826]/60 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Approved Applications
            </span>
            <div className="mt-2 text-3xl font-extrabold text-emerald-400">
              {approvedTotal}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Finalized & balance deducted</p>
          </div>

          <div className="p-5 rounded-3xl border border-white/[0.08] bg-[#121826]/60 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Recorded
            </span>
            <div className="mt-2 text-3xl font-extrabold text-white">
              {requests.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Across all 8 departments</p>
          </div>
        </div>

        {/* Tab Switcher & Filter Bar */}
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.08] w-fit">
                <button
                  onClick={() => setActiveTab("PENDING_HR")}
                  className={`px-4 py-2 text-xs rounded-xl font-semibold transition-all ${
                    activeTab === "PENDING_HR"
                      ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Pending HR Review ({pendingHrRequests.length})
                </button>
                <button
                  onClick={() => setActiveTab("PENDING_MANAGER")}
                  className={`px-4 py-2 text-xs rounded-xl font-semibold transition-all ${
                    activeTab === "PENDING_MANAGER"
                      ? "bg-amber-600 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Pending Manager ({pendingManagerRequests.length})
                </button>
                <button
                  onClick={() => setActiveTab("ALL")}
                  className={`px-4 py-2 text-xs rounded-xl font-semibold transition-all ${
                    activeTab === "ALL"
                      ? "bg-white/[0.1] text-white border border-white/[0.12]"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  All Requests ({requests.length})
                </button>
              </div>

              {/* Search and Dept Filter */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 sm:w-56">
                  <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search applicant / ID..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-full glass-input text-white placeholder:text-slate-500"
                  />
                </div>

                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="px-3.5 py-1.5 text-xs rounded-full glass-input text-slate-300"
                >
                  <option value="ALL" className="bg-[#0e1424]">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.name} className="bg-[#0e1424]">
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requests Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>
                {activeTab === "PENDING_HR"
                  ? `Pending HR Authorization Queue (${filteredRequests.length})`
                  : activeTab === "PENDING_MANAGER"
                  ? `Pending Manager Endorsement Queue (${filteredRequests.length})`
                  : `Organization Leave Applications (${filteredRequests.length})`}
              </CardTitle>
              <CardDescription>
                Review applicant quotas, duration, and manager comments before authorizing deductions
              </CardDescription>
            </div>
            <Badge variant="info">{filteredRequests.length} Applications</Badge>
          </CardHeader>
          <CardContent className="p-0">
            {filteredRequests.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
                <p className="text-sm font-semibold text-white">No requests in this view</p>
                <p className="text-xs text-slate-400 mt-1">
                  All requests have been processed or try clearing your search query.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/[0.02] text-xs text-slate-400 font-semibold uppercase tracking-wider border-b border-white/[0.06]">
                    <tr>
                      <th className="px-6 py-3.5">Employee</th>
                      <th className="px-6 py-3.5">Department</th>
                      <th className="px-6 py-3.5">Leave Type</th>
                      <th className="px-6 py-3.5">Dates</th>
                      <th className="px-6 py-3.5">Days</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Manager Endorsement</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredRequests.map((req) => {
                      const typeInfo = getLeaveTypeLabel(req.leaveType);
                      return (
                        <tr key={req.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-semibold text-white block">{req.employeeName}</span>
                            <span className="text-xs text-slate-400 block font-mono">{req.requestId}</span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-300 font-medium">
                            {req.departmentName}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-medium text-slate-200">{typeInfo.label}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-300 text-xs whitespace-nowrap">
                            {formatDate(req.startDate)} – {formatDate(req.endDate)}
                          </td>
                          <td className="px-6 py-4 font-bold text-white">
                            {req.totalDays} {req.totalDays === 1 ? "day" : "days"}
                          </td>
                          <td className="px-6 py-4">
                            <Badge status={req.status} />
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-300 max-w-xs truncate">
                            {req.managerRemarks ? (
                              <div>
                                <span className="font-semibold text-white block">
                                  {req.managerName || "Manager"}
                                </span>
                                <span className="italic text-slate-400">"{req.managerRemarks}"</span>
                              </div>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedReq(req);
                                  setIsViewModalOpen(true);
                                }}
                                className="text-xs rounded-lg"
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" /> View
                              </Button>

                              {req.status === "PENDING_HR" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() => handleHrApprove(req)}
                                    className="bg-purple-600 hover:bg-purple-500 text-xs rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                                  >
                                    <Check className="w-3.5 h-3.5 mr-1" /> Final Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="danger"
                                    onClick={() => handleOpenReject(req)}
                                    className="text-xs rounded-lg"
                                  >
                                    <X className="w-3.5 h-3.5 mr-1" /> Reject
                                  </Button>
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
            )}
          </CardContent>
        </Card>

        {/* View Details Modal */}
        {selectedReq && (
          <Modal
            isOpen={isViewModalOpen}
            onClose={() => setIsViewModalOpen(false)}
            title="Leave Request Details"
            description={`Request ID: ${selectedReq.requestId}`}
          >
            <div className="space-y-4 text-sm">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Applicant:</span>
                  <span className="font-semibold text-white">{selectedReq.employeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Department:</span>
                  <span className="font-semibold text-white">{selectedReq.departmentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Leave Type:</span>
                  <span className="font-semibold text-white">
                    {getLeaveTypeLabel(selectedReq.leaveType).label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Duration:</span>
                  <span className="font-semibold text-white">
                    {formatDate(selectedReq.startDate)} to {formatDate(selectedReq.endDate)} ({selectedReq.totalDays} days)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Status:</span>
                  <Badge status={selectedReq.status} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Applicant Reason
                </label>
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.08] text-sm text-slate-300 italic">
                  "{selectedReq.reason}"
                </div>
              </div>

              {selectedReq.managerRemarks && (
                <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs">
                  <span className="font-semibold text-indigo-300 block">Reporting Manager Remarks:</span>
                  <p className="text-slate-300 mt-0.5">{selectedReq.managerRemarks}</p>
                </div>
              )}

              {selectedReq.status === "PENDING_HR" && (
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                  <Button
                    variant="danger"
                    onClick={() => {
                      setIsViewModalOpen(false);
                      handleOpenReject(selectedReq);
                    }}
                  >
                    Reject Request
                  </Button>
                  <Button
                    variant="primary"
                    className="bg-purple-600 hover:bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.35)]"
                    onClick={() => handleHrApprove(selectedReq)}
                  >
                    <Check className="w-4 h-4 mr-1.5" /> Grant Final HR Approval
                  </Button>
                </div>
              )}
            </div>
          </Modal>
        )}

        {/* Reject Modal */}
        {selectedReq && (
          <Modal
            isOpen={isRejectModalOpen}
            onClose={() => setIsRejectModalOpen(false)}
            title="Provide Rejection Reason (HR Decision)"
            description={`Enter mandatory justification for HR rejection of ${selectedReq.employeeName}'s application.`}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  HR Rejection Reason <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide detailed feedback or policy justification..."
                  className="w-full p-3.5 text-sm rounded-xl glass-input text-white focus:border-rose-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                <Button
                  variant="outline"
                  onClick={() => setIsRejectModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  isLoading={isProcessing}
                  onClick={handleConfirmReject}
                >
                  Confirm HR Rejection
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AppShell>
  );
}
