"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  AlertCircle,
  CheckCircle2,
  Info,
  Clock,
  ArrowLeft,
  CalendarPlus,
  ShieldCheck,
  Send,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth/AuthContext";
import { dataStore } from "@/lib/data/store";
import { calculateWorkingDays, getLeaveTypeLabel } from "@/lib/utils";
import { Employee, LeaveType } from "@/types";

export default function ApplyLeavePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [leaveType, setLeaveType] = useState<LeaveType>("CASUAL_LEAVE");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      const emp = dataStore.getEmployeeById(user.employeeId);
      if (emp) setEmployee(emp);
    }
  }, [user]);

  if (!user || !employee) {
    return (
      <AppShell title="Apply for Leave">
        <div className="text-center py-12 text-slate-500">Loading leave portal...</div>
      </AppShell>
    );
  }

  const calculatedDays = calculateWorkingDays(startDate, endDate);

  const selectedBalance = employee.balances[leaveType];
  const availableDays = selectedBalance.annualQuota - selectedBalance.usedDays - selectedBalance.pendingDays;
  const isBalanceExceeded = calculatedDays > availableDays;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      toast({
        type: "error",
        title: "Missing Dates",
        message: "Please choose valid start and end dates.",
      });
      return;
    }

    if (calculatedDays <= 0) {
      toast({
        type: "error",
        title: "Invalid Duration",
        message: "Leave duration must be at least 1 working day (Monday - Friday).",
      });
      return;
    }

    if (isBalanceExceeded) {
      toast({
        type: "error",
        title: "Quota Exceeded",
        message: `You only have ${availableDays} days of ${getLeaveTypeLabel(leaveType).label} remaining.`,
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        type: "error",
        title: "Reason Required",
        message: "Please provide a brief reason for your leave request.",
      });
      return;
    }

    setIsSubmitting(true);
    const result = dataStore.createLeaveRequest({
      employeeId: employee.id,
      leaveType,
      startDate,
      endDate,
      totalDays: calculatedDays,
      reason: reason.trim(),
    });
    setIsSubmitting(false);

    if (result.success && result.request) {
      toast({
        type: "success",
        title: "Leave Request Submitted Successfully",
        message: `Request ${result.request.requestId} is now PENDING_MANAGER for review.`,
      });
      router.push("/dashboard");
    } else {
      toast({
        type: "error",
        title: "Submission Failed",
        message: result.error || "Unable to submit leave request.",
      });
    }
  };

  return (
    <AppShell
      title="Apply for Leave"
      subtitle="Submit a leave request for manager recommendation and HR sign-off"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </button>
          <span className="text-xs font-mono text-slate-400 bg-white/[0.04] px-3 py-1 rounded-full border border-white/[0.08]">
            Step 1 of 2: Application Submission
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Form Side (2 cols) */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarPlus className="w-5 h-5 text-sky-400" /> Leave Application Form
                </CardTitle>
                <CardDescription>
                  Requests must be filed in advance as per company leave guidelines.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Leave Type Selector Pills */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Select Leave Type <span className="text-rose-400">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { type: "CASUAL_LEAVE" as LeaveType, code: "CL", label: "Casual Leave" },
                        { type: "SICK_LEAVE" as LeaveType, code: "SL", label: "Sick Leave" },
                        { type: "EARNED_LEAVE" as LeaveType, code: "EL", label: "Earned Leave" },
                      ].map((item) => {
                        const isSelected = leaveType === item.type;
                        const bal = employee.balances[item.type];
                        const avail = bal.annualQuota - bal.usedDays - bal.pendingDays;
                        return (
                          <button
                            key={item.type}
                            type="button"
                            onClick={() => setLeaveType(item.type)}
                            className={`p-3.5 rounded-2xl border text-left transition-all backdrop-blur-md ${
                              isSelected
                                ? "border-sky-400 bg-sky-500/15 shadow-[0_0_20px_rgba(56,189,248,0.3)] ring-1 ring-sky-400"
                                : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06]"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white">{item.code}</span>
                              <span className="text-[10px] font-semibold text-sky-300">{avail} left</span>
                            </div>
                            <p className="text-xs font-medium text-slate-300 mt-1 truncate">
                              {item.label}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dates Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Start Date <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input text-white [color-scheme:dark]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        End Date <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        min={startDate}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input text-white [color-scheme:dark]"
                      />
                    </div>
                  </div>

                  {/* Duration Calculation Banner */}
                  {startDate && endDate && (
                    <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between backdrop-blur-xl ${
                      isBalanceExceeded
                        ? "bg-rose-500/10 border-rose-500/30 text-rose-200"
                        : "bg-sky-500/10 border-sky-500/30 text-sky-200 shadow-[0_0_20px_rgba(56,189,248,0.15)]"
                    }`}>
                      <div className="flex items-center gap-3">
                        <Clock className={`w-5 h-5 shrink-0 ${isBalanceExceeded ? "text-rose-400" : "text-sky-400"}`} />
                        <div>
                          <p className="text-sm font-semibold text-white">
                            Calculated Duration: {calculatedDays} Working {calculatedDays === 1 ? "Day" : "Days"}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">Auto-excludes Saturday & Sunday</p>
                        </div>
                      </div>
                      {isBalanceExceeded && (
                        <span className="text-xs font-bold text-rose-300 bg-rose-500/20 px-2.5 py-1 rounded-full border border-rose-500/30">
                          Exceeds Available ({availableDays})
                        </span>
                      )}
                    </div>
                  )}

                  {/* Reason Field */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Reason for Leave <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g. Attending personal family commitment, doctor appointment, out-of-station travel..."
                      className="w-full p-3.5 text-sm rounded-xl glass-input text-white placeholder:text-slate-500"
                    />
                  </div>

                  {/* Warning if over balance */}
                  {isBalanceExceeded && (
                    <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-xs text-rose-300">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                      <div>
                        <strong>Insufficient Quota:</strong> You are requesting {calculatedDays} days, but only have {availableDays} days of {getLeaveTypeLabel(leaveType).label} available.
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/dashboard")}
                      className="rounded-xl px-5"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isBalanceExceeded || calculatedDays <= 0 || isSubmitting}
                      isLoading={isSubmitting}
                      className="rounded-xl px-6"
                    >
                      <Send className="w-4 h-4 mr-2" /> Submit Application
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Live Balance Side (1 col) */}
          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Available Leave Quota</CardTitle>
                <CardDescription>Live quota for {employee.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { type: "CASUAL_LEAVE" as LeaveType, label: "Casual Leave", code: "CL" },
                  { type: "SICK_LEAVE" as LeaveType, label: "Sick Leave", code: "SL" },
                  { type: "EARNED_LEAVE" as LeaveType, label: "Earned Leave", code: "EL" },
                ].map((item) => {
                  const b = employee.balances[item.type];
                  const avail = b.annualQuota - b.usedDays - b.pendingDays;
                  const isCurrent = leaveType === item.type;
                  return (
                    <div
                      key={item.type}
                      className={`p-3.5 rounded-2xl border transition-all backdrop-blur-md ${
                        isCurrent
                          ? "border-sky-500/50 bg-sky-500/10 shadow-[0_0_15px_rgba(56,189,248,0.2)]"
                          : "border-white/[0.06] bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">{item.label}</span>
                        <span className="text-sm font-bold text-sky-400">{avail} Days</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                        <span>Used: {b.usedDays}</span>
                        <span>Pending: {b.pendingDays}</span>
                        <span>Total: {b.annualQuota}</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Approval Hierarchy Card */}
            <Card className="border-sky-500/20 bg-gradient-to-br from-sky-500/10 via-[#0e1424]/80 to-[#121826]/70">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" /> Two-Tier Approval Flow
                </div>
                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold shrink-0 border border-sky-500/30">
                      1
                    </span>
                    <div>
                      <span className="font-semibold text-white">Reporting Manager:</span>
                      <p className="text-slate-400">{employee.managerName || "Rahul Nair"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold shrink-0 border border-purple-500/30">
                      2
                    </span>
                    <div>
                      <span className="font-semibold text-white">HR Operations:</span>
                      <p className="text-slate-400">Priya Patel (Final sign-off)</p>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 pt-2.5 border-t border-white/[0.08]">
                  Balances are deducted only after final HR authorization.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
