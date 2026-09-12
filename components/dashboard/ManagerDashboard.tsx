"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckSquare,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Shield,
  FileText,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { dataStore } from "@/lib/data/store";
import { formatDate, getLeaveTypeLabel } from "@/lib/utils";
import { Employee, LeaveRequest } from "@/types";

export function ManagerDashboard({ managerId, managerName }: { managerId: string; managerName: string }) {
  const { toast } = useToast();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [teamMembers, setTeamMembers] = useState<Employee[]>([]);

  // Modal states
  const [selectedReq, setSelectedReq] = useState<LeaveRequest | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = () => {
    const allReqs = dataStore.getLeaveRequests();
    setRequests([...allReqs]);

    const emps = dataStore.getEmployees();
    const team = emps.filter((e) => e.managerId === "emp-2" || e.departmentName === "Engineering");
    setTeamMembers(team);
  };

  useEffect(() => {
    loadData();
    window.addEventListener("elap_data_updated", loadData);
    return () => window.removeEventListener("elap_data_updated", loadData);
  }, []);

  const pendingApprovals = requests.filter((r) => r.status === "PENDING_MANAGER");
  const approvedThisMonth = requests.filter((r) => r.status === "APPROVED" || r.status === "PENDING_HR").length;
  const onLeaveToday = 1;

  const handleApprove = (req: LeaveRequest) => {
    setIsProcessing(true);
    const res = dataStore.managerReview({
      requestId: req.id,
      managerId,
      managerName,
      approved: true,
      remarks: "Approved by Reporting Manager. Forwarded to HR.",
    });
    setIsProcessing(false);

    if (res.success) {
      toast({
        type: "success",
        title: "Leave Request Endorsed",
        message: `${req.employeeName}'s request moved to PENDING_HR for final sign-off.`,
      });
      loadData();
      setIsViewModalOpen(false);
    } else {
      toast({
        type: "error",
        title: "Action Failed",
        message: res.error || "Unable to approve request",
      });
    }
  };

  const handleOpenRejectModal = (req: LeaveRequest) => {
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
        message: "Please enter a justification for rejecting the leave request.",
      });
      return;
    }

    setIsProcessing(true);
    const res = dataStore.managerReview({
      requestId: selectedReq.id,
      managerId,
      managerName,
      approved: false,
      remarks: rejectionReason.trim(),
    });
    setIsProcessing(false);

    if (res.success) {
      toast({
        type: "info",
        title: "Leave Request Rejected",
        message: `Request ${selectedReq.requestId} has been rejected. This decision is final.`,
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
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-8 rounded-3xl border border-white/[0.08] bg-gradient-to-r from-indigo-950/80 via-[#0e1424]/80 to-[#121826]/70 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.1] text-indigo-300 text-xs font-semibold mb-3 backdrop-blur-md">
            <Shield className="w-3.5 h-3.5 text-indigo-400" /> Tier 1 Manager Authorization
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Manager Dashboard</h2>
          <p className="text-slate-400 text-xs mt-1">
            Review and endorse leave applications from your direct engineering reports before HR sign-off.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <Link href="/team">
            <Button size="md" variant="secondary" className="rounded-full px-5">
              <Users className="w-4 h-4 mr-2" /> Team Roster ({teamMembers.length})
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards (Aura style) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl border border-white/[0.08] bg-[#121826]/60 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Pending Review
            </span>
            <span className="p-2 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{pendingApprovals.length}</span>
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
              Action Needed
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Team requests awaiting sign-off</p>
        </div>

        <div className="p-5 rounded-3xl border border-white/[0.08] bg-[#121826]/60 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Endorsed / Approved
            </span>
            <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{approvedThisMonth}</span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              This Month
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Processed through pipeline</p>
        </div>

        <div className="p-5 rounded-3xl border border-white/[0.08] bg-[#121826]/60 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Direct Reports
            </span>
            <span className="p-2 rounded-xl bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{teamMembers.length}</span>
            <span className="text-xs text-slate-400">Engineers</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Under your reporting line</p>
        </div>

        <div className="p-5 rounded-3xl border border-white/[0.08] bg-[#121826]/60 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              On Leave Today
            </span>
            <span className="p-2 rounded-xl bg-sky-500/15 text-sky-300 border border-sky-500/20">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{onLeaveToday}</span>
            <span className="text-xs text-sky-400">Aarav S.</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Engineering capacity normal</p>
        </div>
      </div>

      {/* Main Section: Pending Leave Approvals */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Pending Leave Approvals</CardTitle>
            <CardDescription>
              Direct reports requiring manager endorsement before forwarding to HR
            </CardDescription>
          </div>
          <Badge variant="warning">{pendingApprovals.length} Pending</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {pendingApprovals.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
              <p className="text-sm font-semibold text-white">All caught up!</p>
              <p className="text-xs text-slate-400 mt-1">No pending team leave requests require your review.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/[0.02] text-xs text-slate-400 font-semibold uppercase tracking-wider border-b border-white/[0.06]">
                  <tr>
                    <th className="px-6 py-3.5">Employee</th>
                    <th className="px-6 py-3.5">Leave Type</th>
                    <th className="px-6 py-3.5">Dates</th>
                    <th className="px-6 py-3.5">Days</th>
                    <th className="px-6 py-3.5">Submitted</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {pendingApprovals.map((req) => {
                    const typeInfo = getLeaveTypeLabel(req.leaveType);
                    return (
                      <tr key={req.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                              {req.employeeName.charAt(0)}
                            </div>
                            <div>
                              <span className="font-semibold text-white block">{req.employeeName}</span>
                              <span className="text-xs text-slate-400 block font-mono">{req.departmentName}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-white">{typeInfo.label}</span>
                          <span className="text-xs text-slate-400 block font-mono">{req.requestId}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-300 text-xs">
                          {formatDate(req.startDate)} – {formatDate(req.endDate)}
                        </td>
                        <td className="px-6 py-4 font-bold text-white">
                          {req.totalDays} {req.totalDays === 1 ? "day" : "days"}
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-xs">
                          {formatDate(req.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <Badge status={req.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
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
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleApprove(req)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-xs rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleOpenRejectModal(req)}
                              className="text-xs rounded-lg"
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                            </Button>
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

      {/* View Request Details Modal */}
      {selectedReq && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title="Leave Request Details"
          description={`Reference ID: ${selectedReq.requestId}`}
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-2.5 text-sm">
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
                  {formatDate(selectedReq.startDate)} to {formatDate(selectedReq.endDate)} ({selectedReq.totalDays} working days)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <Badge status={selectedReq.status} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Reason Stated by Employee
              </label>
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.08] text-sm text-slate-300 italic">
                "{selectedReq.reason}"
              </div>
            </div>

            {selectedReq.status === "PENDING_MANAGER" && (
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                <Button
                  variant="danger"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handleOpenRejectModal(selectedReq);
                  }}
                >
                  <XCircle className="w-4 h-4 mr-1.5" /> Reject Request
                </Button>
                <Button
                  variant="primary"
                  className="bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                  onClick={() => handleApprove(selectedReq)}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve & Forward to HR
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Reject Request Modal */}
      {selectedReq && (
        <Modal
          isOpen={isRejectModalOpen}
          onClose={() => setIsRejectModalOpen(false)}
          title="Reject Leave Request"
          description={`Please provide a mandatory reason for rejecting ${selectedReq.employeeName}'s request.`}
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>
                <strong>Important Policy Rule:</strong> Manager rejection is final. The request will not proceed to HR, and the applicant will be notified immediately.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Rejection Reason / Comments <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Critical release milestone, sprint deadline conflict, or team capacity constraint..."
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
                Confirm Final Rejection
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
