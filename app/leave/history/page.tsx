"use client";

import React, { useState, useEffect } from "react";
import {
  History,
  Search,
  Filter,
  Calendar,
  Eye,
  XCircle,
  FileDown,
  ChevronRight,
  Sparkles,
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
import { LeaveRequest, LeaveType, LeaveStatus } from "@/types";

export default function LeaveHistoryPage() {
  const { user, role } = useAuth();
  const { toast } = useToast();

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedReq, setSelectedReq] = useState<LeaveRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = () => {
    if (!user) return;
    const all = dataStore.getLeaveRequests();
    if (role === "EMPLOYEE") {
      setRequests(all.filter((r) => r.employeeId === user.employeeId || r.employeeEmail === user.email));
    } else if (role === "MANAGER") {
      setRequests(all.filter((r) => r.departmentName === "Engineering" || r.managerName?.includes("Rahul")));
    } else {
      setRequests(all);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener("elap_data_updated", loadData);
    return () => window.removeEventListener("elap_data_updated", loadData);
  }, [user, role]);

  const handleCancelRequest = (req: LeaveRequest) => {
    if (!user) return;
    const res = dataStore.cancelLeaveRequest({
      requestId: req.id,
      employeeId: user.employeeId,
      employeeName: user.name,
    });

    if (res.success) {
      toast({
        type: "info",
        title: "Leave Request Cancelled",
        message: `Request ${req.requestId} has been revoked and balance released.`,
      });
      setIsModalOpen(false);
      loadData();
    } else {
      toast({
        type: "error",
        title: "Cancellation Failed",
        message: res.error || "Unable to cancel request.",
      });
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (typeFilter !== "ALL" && r.leaveType !== typeFilter) return false;
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = r.employeeName.toLowerCase().includes(q);
      const matchId = r.requestId.toLowerCase().includes(q);
      const matchReason = r.reason.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchReason) return false;
    }
    return true;
  });

  return (
    <AppShell
      title="Leave History & Records"
      subtitle={
        role === "EMPLOYEE"
          ? "Historical log of all your submitted leave requests"
          : role === "MANAGER"
          ? "Team leave history and past decisions"
          : "Organization-wide leave records and historical audit log"
      }
    >
      <div className="space-y-6">
        {/* Filters Header Card */}
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Request ID, employee, or keyword..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-full glass-input text-white placeholder:text-slate-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span>Filters:</span>
                </div>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-full glass-input text-slate-300"
                >
                  <option value="ALL" className="bg-[#0e1424]">All Types</option>
                  <option value="CASUAL_LEAVE" className="bg-[#0e1424]">Casual Leave (CL)</option>
                  <option value="SICK_LEAVE" className="bg-[#0e1424]">Sick Leave (SL)</option>
                  <option value="EARNED_LEAVE" className="bg-[#0e1424]">Earned Leave (EL)</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-full glass-input text-slate-300"
                >
                  <option value="ALL" className="bg-[#0e1424]">All Statuses</option>
                  <option value="PENDING_MANAGER" className="bg-[#0e1424]">Pending Manager</option>
                  <option value="PENDING_HR" className="bg-[#0e1424]">Pending HR</option>
                  <option value="APPROVED" className="bg-[#0e1424]">Approved</option>
                  <option value="REJECTED_BY_MANAGER" className="bg-[#0e1424]">Rejected by Manager</option>
                  <option value="REJECTED_BY_HR" className="bg-[#0e1424]">Rejected by HR</option>
                  <option value="CANCELLED" className="bg-[#0e1424]">Cancelled</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requests Table Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Leave Requests Log</CardTitle>
              <CardDescription>
                Showing {filteredRequests.length} of {requests.length} total recorded applications
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredRequests.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <History className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-white">No records found</p>
                <p className="text-xs text-slate-400 mt-1">Try clearing filters or search term.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/[0.02] text-xs text-slate-400 font-semibold uppercase tracking-wider border-b border-white/[0.06]">
                    <tr>
                      <th className="px-6 py-3.5">Request ID</th>
                      {role !== "EMPLOYEE" && <th className="px-6 py-3.5">Employee</th>}
                      <th className="px-6 py-3.5">Leave Type</th>
                      <th className="px-6 py-3.5">Dates</th>
                      <th className="px-6 py-3.5">Days</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Manager Tier</th>
                      <th className="px-6 py-3.5">HR Tier</th>
                      <th className="px-6 py-3.5">Submitted On</th>
                      <th className="px-6 py-3.5 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredRequests.map((req) => {
                      const typeMeta = getLeaveTypeLabel(req.leaveType);
                      return (
                        <tr key={req.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 font-mono text-xs font-semibold text-sky-400">
                            {req.requestId}
                          </td>
                          {role !== "EMPLOYEE" && (
                            <td className="px-6 py-4">
                              <span className="font-semibold text-white block">{req.employeeName}</span>
                              <span className="text-xs text-slate-400">{req.departmentName}</span>
                            </td>
                          )}
                          <td className="px-6 py-4">
                            <span className="font-medium text-slate-200">{typeMeta.label}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-300 text-xs whitespace-nowrap">
                            {formatDate(req.startDate)} – {formatDate(req.endDate)}
                          </td>
                          <td className="px-6 py-4 font-bold text-white">
                            {req.totalDays}d
                          </td>
                          <td className="px-6 py-4">
                            <Badge status={req.status} />
                          </td>
                          <td className="px-6 py-4 text-xs">
                            {req.managerActionAt ? (
                              <div>
                                <span className="text-slate-200 font-medium block">
                                  {req.status === "REJECTED_BY_MANAGER" ? "Rejected" : "Endorsed"}
                                </span>
                                <span className="text-slate-400 text-[10px]">
                                  {formatDate(req.managerActionAt)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Pending</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs">
                            {req.hrActionAt ? (
                              <div>
                                <span className="text-slate-200 font-medium block">
                                  {req.status === "APPROVED" ? "Approved" : "Rejected"}
                                </span>
                                <span className="text-slate-400 text-[10px]">
                                  {formatDate(req.hrActionAt)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-400 text-xs whitespace-nowrap">
                            {formatDate(req.createdAt)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedReq(req);
                                setIsModalOpen(true);
                              }}
                              className="text-xs rounded-lg"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" /> View
                            </Button>
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

        {/* Modal: Full Request View & Cancellation */}
        {selectedReq && (
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Leave Request Audit View"
            description={`Request ID: ${selectedReq.requestId}`}
          >
            <div className="space-y-4 text-sm">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-2.5">
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
                  <span className="text-slate-400">Current Status:</span>
                  <Badge status={selectedReq.status} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Reason
                </label>
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.08] text-slate-300 italic">
                  "{selectedReq.reason}"
                </div>
              </div>

              {selectedReq.managerRemarks && (
                <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs">
                  <span className="font-semibold text-indigo-300 block">Reporting Manager Remarks:</span>
                  <p className="text-slate-300 mt-0.5">{selectedReq.managerRemarks}</p>
                </div>
              )}

              {selectedReq.hrRemarks && (
                <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs">
                  <span className="font-semibold text-purple-300 block">HR Decision Remarks:</span>
                  <p className="text-slate-300 mt-0.5">{selectedReq.hrRemarks}</p>
                </div>
              )}

              {role === "EMPLOYEE" &&
                selectedReq.employeeEmail === user?.email &&
                (selectedReq.status === "PENDING_MANAGER" || selectedReq.status === "PENDING_HR") && (
                  <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
                    <span className="text-xs text-slate-400">Cancel unfinalized application?</span>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleCancelRequest(selectedReq)}
                      className="rounded-xl"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Cancel Application
                    </Button>
                  </div>
                )}
            </div>
          </Modal>
        )}
      </div>
    </AppShell>
  );
}
