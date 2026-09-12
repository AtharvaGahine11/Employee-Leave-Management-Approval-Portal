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
import { LeaveRequest } from "@/types";

export default function ApprovalsPage() {
  const { user, role } = useAuth();
  const { toast } = useToast();

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [selectedReq, setSelectedReq] = useState<LeaveRequest | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = () => {
    const all = dataStore.getLeaveRequests();
    setRequests([...all]);
  };

  useEffect(() => {
    loadData();
    window.addEventListener("elap_data_updated", loadData);
    return () => window.removeEventListener("elap_data_updated", loadData);
  }, []);

  if (!user) return null;

  const isManager = role === "MANAGER";
  const isHr = role === "HR";

  const pendingActionRequests = requests.filter((r) => {
    if (isManager) return r.status === "PENDING_MANAGER";
    if (isHr) return r.status === "PENDING_HR";
    return false;
  });

  const handleApprove = (req: LeaveRequest) => {
    setIsProcessing(true);
    let res;
    if (isManager) {
      res = dataStore.managerReview({
        requestId: req.id,
        managerId: user?.employeeId || "EMP-1002",
        managerName: user?.name || "Manager",
        approved: true,
        remarks: "Manager endorsement granted. Forwarded to HR.",
      });
      if (res.success) {
        toast({
          type: "success",
          title: "Manager Approval Granted",
          message: `${req.employeeName}'s request moved to PENDING_HR.`,
        });
      }
    } else {
      res = dataStore.hrReview({
        requestId: req.id,
        hrId: user?.employeeId || "EMP-1001",
        hrName: user?.name || "HR Lead",
        approved: true,
        remarks: "Final HR authorization granted. Leave balance deducted.",
      });
      if (res.success) {
        toast({
          type: "success",
          title: "Final HR Approval Granted",
          message: `${req.employeeName}'s leave has been authorized and quota updated.`,
        });
      }
    }
    setIsProcessing(false);

    if (res && !res.success) {
      toast({
        type: "error",
        title: "Action Failed",
        message: res.error || "Unable to approve request",
      });
    } else {
      setIsViewModalOpen(false);
      loadData();
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
        message: "Please enter a reason for rejection.",
      });
      return;
    }

    setIsProcessing(true);
    let res;
    if (isManager) {
      res = dataStore.managerReview({
        requestId: selectedReq.id,
        managerId: user?.employeeId || "EMP-1002",
        managerName: user?.name || "Manager",
        approved: false,
        remarks: rejectionReason.trim(),
      });
    } else {
      res = dataStore.hrReview({
        requestId: selectedReq.id,
        hrId: user?.employeeId || "EMP-1001",
        hrName: user?.name || "HR Lead",
        approved: false,
        remarks: rejectionReason.trim(),
      });
    }
    setIsProcessing(false);

    if (res && res.success) {
      toast({
        type: "info",
        title: "Leave Request Rejected",
        message: `Request ${selectedReq.requestId} has been rejected.`,
      });
      setIsRejectModalOpen(false);
      setIsViewModalOpen(false);
      setSelectedReq(null);
      loadData();
    } else {
      toast({
        type: "error",
        title: "Action Failed",
        message: res?.error || "Unable to reject request",
      });
    }
  };

  return (
    <AppShell
      title={isManager ? "Manager Approvals Queue" : "HR Authorizations Queue"}
      subtitle={
        isManager
          ? "Tier 1: Review and endorse applications from your reporting team"
          : "Tier 2: Grant final authorization across all departments and finalize leave deduction"
      }
    >
      <div className="space-y-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <span>Pending Your Action ({pendingActionRequests.length})</span>
              </CardTitle>
              <CardDescription>
                {isManager
                  ? "Applications awaiting manager review before proceeding to HR"
                  : "Manager-endorsed requests awaiting final HR sign-off"}
              </CardDescription>
            </div>
            <Badge variant={pendingActionRequests.length > 0 ? "warning" : "success"}>
              {pendingActionRequests.length} Pending
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            {pendingActionRequests.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
                <p className="text-sm font-semibold text-white">Queue is Clear!</p>
                <p className="text-xs text-slate-400 mt-1">
                  You have reviewed all applications requiring your tier authorization.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/[0.02] text-xs text-slate-400 font-semibold uppercase tracking-wider border-b border-white/[0.06]">
                    <tr>
                      <th className="px-6 py-3.5">Applicant</th>
                      <th className="px-6 py-3.5">Leave Type</th>
                      <th className="px-6 py-3.5">Dates</th>
                      <th className="px-6 py-3.5">Days</th>
                      <th className="px-6 py-3.5">Submitted</th>
                      {isHr && <th className="px-6 py-3.5">Manager Endorsement</th>}
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {pendingActionRequests.map((req) => {
                      const typeInfo = getLeaveTypeLabel(req.leaveType);
                      return (
                        <tr key={req.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-semibold text-white block">{req.employeeName}</span>
                            <span className="text-xs text-slate-400 block font-mono">
                              {req.requestId} · {req.departmentName}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-medium text-slate-200">{typeInfo.label}</span>
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
                          {isHr && (
                            <td className="px-6 py-4 text-xs text-slate-300 max-w-xs truncate">
                              <span className="font-semibold text-white block">
                                {req.managerName || "Manager"}
                              </span>
                              <span className="italic text-slate-400">"{req.managerRemarks}"</span>
                            </td>
                          )}
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
                                className={
                                  isHr
                                    ? "bg-purple-600 hover:bg-purple-500 text-xs rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                                    : "bg-emerald-600 hover:bg-emerald-500 text-xs rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                }
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                {isHr ? "Final Approve" : "Endorse"}
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleOpenReject(req)}
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

        {/* View Modal */}
        {selectedReq && (
          <Modal
            isOpen={isViewModalOpen}
            onClose={() => setIsViewModalOpen(false)}
            title="Leave Application Details"
            description={`Request ID: ${selectedReq.requestId}`}
          >
            <div className="space-y-4 text-sm">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Employee:</span>
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
                  <span className="font-semibold text-indigo-300 block">Manager Remarks:</span>
                  <p className="text-slate-300 mt-0.5">{selectedReq.managerRemarks}</p>
                </div>
              )}

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
                  className={isHr ? "bg-purple-600 hover:bg-purple-500" : "bg-emerald-600 hover:bg-emerald-500"}
                  onClick={() => handleApprove(selectedReq)}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  {isHr ? "Grant Final HR Approval" : "Approve & Send to HR"}
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Reject Modal */}
        {selectedReq && (
          <Modal
            isOpen={isRejectModalOpen}
            onClose={() => setIsRejectModalOpen(false)}
            title="Provide Rejection Reason"
            description={`Enter mandatory justification for rejecting ${selectedReq.employeeName}'s application.`}
          >
            <div className="space-y-4">
              {isManager && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>
                    <strong>Policy Reminder:</strong> Manager rejection is final. The request will not reach HR.
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Reason for Rejection <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide detailed feedback or operational reason for declining this request..."
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
                  Confirm Rejection
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AppShell>
  );
}
