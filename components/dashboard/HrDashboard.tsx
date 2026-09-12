"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  CheckCircle2,
  Clock,
  Calendar,
  Filter,
  Search,
  Eye,
  Check,
  X,
  FileClock,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { dataStore } from "@/lib/data/store";
import { formatDate, getLeaveTypeLabel } from "@/lib/utils";
import { Department, Employee, LeaveRequest } from "@/types";

export function HrDashboard({ hrId, hrName }: { hrId: string; hrName: string }) {
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);

  // Filter state
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal actions
  const [selectedReq, setSelectedReq] = useState<LeaveRequest | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = () => {
    setDepartments(dataStore.getDepartments());
    setEmployees(dataStore.getEmployees());
    setRequests(dataStore.getLeaveRequests());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("elap_data_updated", loadData);
    return () => window.removeEventListener("elap_data_updated", loadData);
  }, []);

  // Summary counts
  const totalEmployees = employees.length;
  const pendingHrCount = requests.filter((r) => r.status === "PENDING_HR").length;
  const pendingManagerCount = requests.filter((r) => r.status === "PENDING_MANAGER").length;
  const totalPending = pendingHrCount + pendingManagerCount;
  const approvedTotal = requests.filter((r) => r.status === "APPROVED").length;
  const onLeaveTodayCount = 2;

  // Department aggregate metrics
  const departmentStats = departments.map((dept) => {
    const deptEmployees = employees.filter((e) => e.departmentId === dept.id || e.departmentName === dept.name);
    const deptRequests = requests.filter((r) => r.departmentName === dept.name);
    const pending = deptRequests.filter((r) => r.status === "PENDING_HR" || r.status === "PENDING_MANAGER").length;
    const approved = deptRequests.filter((r) => r.status === "APPROVED").length;
    const onLeave = dept.code === "ENG" ? 1 : dept.code === "PROD" ? 1 : 0;

    return {
      department: dept,
      employeeCount: deptEmployees.length,
      onLeave,
      pending,
      approved,
    };
  });

  // Filtered requests list
  const filteredRequests = requests.filter((r) => {
    if (deptFilter !== "ALL" && r.departmentName !== deptFilter) return false;
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = r.employeeName.toLowerCase().includes(q);
      const matchReqId = r.requestId.toLowerCase().includes(q);
      if (!matchName && !matchReqId) return false;
    }
    return true;
  });

  const handleHrApprove = (req: LeaveRequest) => {
    setIsProcessing(true);
    const res = dataStore.hrReview({
      requestId: req.id,
      hrId,
      hrName,
      approved: true,
      remarks: "Final HR approval granted. Balance deducted.",
    });
    setIsProcessing(false);

    if (res.success) {
      toast({
        type: "success",
        title: "Leave Approved by HR",
        message: `Request ${req.requestId} approved. Employee balance updated.`,
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

  const handleConfirmHrReject = () => {
    if (!selectedReq) return;
    if (!rejectionReason.trim()) {
      toast({
        type: "error",
        title: "Reason Required",
        message: "Please enter a justification for HR rejection.",
      });
      return;
    }

    setIsProcessing(true);
    const res = dataStore.hrReview({
      requestId: selectedReq.id,
      hrId,
      hrName,
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
    <div className="space-y-8">
      {/* Title & Organization Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-8 rounded-3xl border border-white/[0.08] bg-gradient-to-r from-purple-950/80 via-[#0e1424]/80 to-[#121826]/70 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.1] text-purple-300 text-xs font-semibold mb-3 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" /> HR Executive Visibility · 8 Business Units
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">HR Dashboard</h2>
          <p className="text-slate-400 text-xs mt-1">
            Organization-wide leave management, department compliance, and final tier authorizations.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <Link href="/audit">
            <Button size="md" variant="secondary" className="rounded-full px-4">
              <FileClock className="w-4 h-4 mr-2" /> Audit Trail
            </Button>
          </Link>
          <Link href="/employees">
            <Button size="md" className="bg-purple-600 hover:bg-purple-500 rounded-full px-4 shadow-[0_0_20px_rgba(168,85,247,0.35)]">
              <Users className="w-4 h-4 mr-2" /> Directory
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl border border-white/[0.08] bg-[#121826]/60 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Headcount
            </span>
            <span className="p-2 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/20">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{totalEmployees}</span>
            <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
              8 Departments
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Active staff in portal</p>
        </div>

        <div className="p-5 rounded-3xl border border-white/[0.08] bg-[#121826]/60 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Pending Approvals
            </span>
            <span className="p-2 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{totalPending}</span>
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
              {pendingHrCount} for HR
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Across all approval tiers</p>
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
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{onLeaveTodayCount}</span>
            <span className="text-xs text-slate-400">Employees</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Active time-off today</p>
        </div>

        <div className="p-5 rounded-3xl border border-white/[0.08] bg-[#121826]/60 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Business Units
            </span>
            <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">8</span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              100% Configured
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">BRD Department scope</p>
        </div>
      </div>

      {/* Department Breakdown Table & Aura-Style Glowing Spline Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Table (2 cols) */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Organization Overview (8 Departments)</CardTitle>
                <CardDescription>
                  Headcount, pending approvals, and approved leave distribution
                </CardDescription>
              </div>
              <Link href="/departments" className="text-xs font-semibold text-sky-400 hover:text-sky-300">
                View All Departments →
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/[0.02] text-xs text-slate-400 font-semibold uppercase tracking-wider border-b border-white/[0.06]">
                    <tr>
                      <th className="px-6 py-3.5">Department</th>
                      <th className="px-6 py-3.5">Headcount</th>
                      <th className="px-6 py-3.5">On Leave</th>
                      <th className="px-6 py-3.5">Pending</th>
                      <th className="px-6 py-3.5">Approved</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {departmentStats.map((stat) => (
                      <tr key={stat.department.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-3.5">
                          <span className="font-semibold text-white block">
                            {stat.department.name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {stat.department.code}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-slate-300 font-medium">
                          {stat.employeeCount}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            stat.onLeave > 0 ? "bg-sky-500/10 text-sky-300 border border-sky-500/20" : "text-slate-400"
                          }`}>
                            {stat.onLeave}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                            stat.pending > 0 ? "bg-amber-500/10 text-amber-300 border border-amber-500/20" : "text-slate-400"
                          }`}>
                            {stat.pending}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-slate-300 font-medium">
                          {stat.approved}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Aura-style Spending/Leave Chart */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Leave Volume Chart</CardTitle>
                  <CardDescription>Monthly trend & velocity</CardDescription>
                </div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  +22.9%
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Glowing SVG Spline Curve (Matching Aura screenshot) */}
              <div className="h-32 w-full relative">
                <svg viewBox="0 0 300 100" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="glow" />
                      <feComposite in="SourceGraphic" in2="glow" operator="over" />
                    </filter>
                  </defs>
                  {/* Fill Area */}
                  <path
                    d="M 10,80 Q 70,20 130,55 T 250,25 T 290,75 L 290,100 L 10,100 Z"
                    fill="url(#curveGradient)"
                  />
                  {/* Stroke Line */}
                  <path
                    d="M 10,80 Q 70,20 130,55 T 250,25 T 290,75"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3"
                    filter="url(#glow)"
                  />
                  {/* Glowing Points */}
                  <circle cx="10" cy="80" r="3" fill="#38bdf8" />
                  <circle cx="70" cy="20" r="4" fill="#ffffff" stroke="#38bdf8" strokeWidth="2" />
                  <circle cx="130" cy="55" r="3" fill="#38bdf8" />
                  <circle cx="250" cy="25" r="4" fill="#ffffff" stroke="#38bdf8" strokeWidth="2" />
                  <circle cx="290" cy="75" r="3" fill="#38bdf8" />
                </svg>
              </div>

              <div className="flex justify-between text-[11px] font-mono text-slate-400 px-2">
                <span>Mo</span>
                <span>13</span>
                <span>Wd</span>
                <span>11</span>
                <span>Sat</span>
              </div>

              <div className="pt-3 border-t border-white/[0.06] text-xs text-slate-400 leading-relaxed">
                <span className="font-semibold text-slate-300">Policy Compliance:</span> 98.4% of leave requests resolved within 24hr SLA across both approval tiers.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Organization-Wide Leave Activity & Approvals */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Organization Leave Activity & Authorizations</CardTitle>
            <CardDescription>
              Filter and process leave requests across all business units
            </CardDescription>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employee / ID..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-full glass-input text-white placeholder:text-slate-500"
              />
            </div>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-full glass-input text-slate-300"
            >
              <option value="ALL" className="bg-[#0e1424]">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name} className="bg-[#0e1424]">
                  {d.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-full glass-input text-slate-300"
            >
              <option value="ALL" className="bg-[#0e1424]">All Statuses</option>
              <option value="PENDING_HR" className="bg-[#0e1424]">Pending HR Sign-off</option>
              <option value="PENDING_MANAGER" className="bg-[#0e1424]">Pending Manager</option>
              <option value="APPROVED" className="bg-[#0e1424]">Approved</option>
              <option value="REJECTED_BY_MANAGER" className="bg-[#0e1424]">Rejected by Manager</option>
              <option value="REJECTED_BY_HR" className="bg-[#0e1424]">Rejected by HR</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
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
                  <th className="px-6 py-3.5 text-right">Action</th>
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
                      <td className="px-6 py-4 text-slate-300 text-xs font-medium">
                        {req.departmentName}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-slate-200">{typeInfo.label}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-300 text-xs">
                        {formatDate(req.startDate)} – {formatDate(req.endDate)}
                      </td>
                      <td className="px-6 py-4 font-bold text-white">
                        {req.totalDays} {req.totalDays === 1 ? "day" : "days"}
                      </td>
                      <td className="px-6 py-4">
                        <Badge status={req.status} />
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
                                onClick={() => handleOpenRejectModal(req)}
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
        </CardContent>
      </Card>

      {/* View Request Details Modal */}
      {selectedReq && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title="Leave Request Details (HR View)"
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
                  {formatDate(selectedReq.startDate)} to {formatDate(selectedReq.endDate)} ({selectedReq.totalDays} days)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Status:</span>
                <Badge status={selectedReq.status} />
              </div>
              {selectedReq.managerRemarks && (
                <div className="pt-2 border-t border-white/[0.08]">
                  <span className="text-xs font-semibold text-slate-300 block">Reporting Manager Endorsement:</span>
                  <p className="text-xs text-slate-400 italic mt-0.5">"{selectedReq.managerRemarks}"</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Reason Stated by Employee
              </label>
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.08] text-sm text-slate-300 italic">
                "{selectedReq.reason}"
              </div>
            </div>

            {selectedReq.status === "PENDING_HR" && (
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                <Button
                  variant="danger"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handleOpenRejectModal(selectedReq);
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

      {/* Reject Request Modal */}
      {selectedReq && (
        <Modal
          isOpen={isRejectModalOpen}
          onClose={() => setIsRejectModalOpen(false)}
          title="Reject Leave Request (HR Decision)"
          description={`Enter justification for HR rejection of ${selectedReq.employeeName}'s request.`}
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
                placeholder="e.g. Leave quota exhausted, policy non-compliance, blacked-out period..."
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
                onClick={handleConfirmHrReject}
              >
                Confirm HR Rejection
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
