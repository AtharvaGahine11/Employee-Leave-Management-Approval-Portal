"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  PlusCircle,
  ArrowUpRight,
  Sparkles,
  CalendarCheck,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Wifi,
  Layers,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { dataStore } from "@/lib/data/store";
import { formatDate, getLeaveTypeLabel } from "@/lib/utils";
import { Employee, LeaveRequest } from "@/types";

export function EmployeeDashboard({ employeeId, employeeName }: { employeeId: string; employeeName: string }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);

  const loadData = () => {
    const emp = dataStore.getEmployeeById(employeeId);
    if (emp) setEmployee({ ...emp });
    const allReqs = dataStore.getLeaveRequests();
    const ownReqs = allReqs.filter((r) => r.employeeId === employeeId || r.employeeEmail === "employee@elap.demo");
    setRequests([...ownReqs]);
  };

  useEffect(() => {
    loadData();
    window.addEventListener("elap_data_updated", loadData);
    return () => window.removeEventListener("elap_data_updated", loadData);
  }, [employeeId]);

  if (!employee) return null;

  const clBalance = employee.balances.CASUAL_LEAVE;
  const slBalance = employee.balances.SICK_LEAVE;
  const elBalance = employee.balances.EARNED_LEAVE;

  const clAvailable = clBalance.annualQuota - clBalance.usedDays - clBalance.pendingDays;
  const slAvailable = slBalance.annualQuota - slBalance.usedDays - slBalance.pendingDays;
  const elAvailable = elBalance.annualQuota - elBalance.usedDays - elBalance.pendingDays;
  const totalAvailable = clAvailable + slAvailable + elAvailable;

  const pendingCount = requests.filter((r) => r.status === "PENDING_MANAGER" || r.status === "PENDING_HR").length;
  const approvedCount = requests.filter((r) => r.status === "APPROVED").length;
  const rejectedCount = requests.filter((r) => r.status === "REJECTED_BY_MANAGER" || r.status === "REJECTED_BY_HR").length;

  const upcomingLeaves = requests.filter((r) => {
    if (r.status !== "APPROVED" && r.status !== "PENDING_HR" && r.status !== "PENDING_MANAGER") return false;
    const endDate = new Date(r.endDate);
    return endDate >= new Date("2026-08-01");
  });

  return (
    <div className="space-y-6">
      {/* BENTO ROW 1: Hero Metric (8 cols) + Reporting Line (4 cols) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Bento Hero Box */}
        <div className="md:col-span-8 p-6 sm:p-8 rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#101626]/85 via-[#0a0f1d]/80 to-[#141226]/75 backdrop-blur-2xl shadow-[0_12px_40px_0_rgba(0,0,0,0.7)] relative overflow-hidden flex flex-col justify-between group">
          <div className="absolute -top-16 -right-16 w-72 h-72 bg-sky-500/15 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5" /> Portal Active · FY 2026-2027
              </span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Good morning, {employeeName}
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1.5 max-w-xl">
              Centralized leave governance portal. Total statutory & annual leave allocation available for utilization.
            </p>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 relative z-10 pt-4 border-t border-white/[0.06]">
            <div>
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                Total Available Quota
              </span>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                  {totalAvailable}
                </span>
                <span className="text-sm font-semibold text-slate-400">/ 39 Days</span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                  Available
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Link href="/leave/apply">
                <Button size="md" className="rounded-full px-5 text-xs shadow-[0_0_24px_rgba(56,189,248,0.4)]">
                  <PlusCircle className="w-4 h-4 mr-2" /> Apply for Leave
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Bento Reporting Line & Status Card */}
        <div className="md:col-span-4 p-6 sm:p-7 rounded-3xl border border-sky-500/20 bg-gradient-to-br from-sky-500/10 via-[#0a0f1d]/85 to-[#121826]/75 backdrop-blur-2xl shadow-[0_12px_40px_0_rgba(0,0,0,0.7)] flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Reporting Manager
              </span>
              <Badge variant="info">Tier 1</Badge>
            </div>

            <div className="flex items-center gap-3.5 my-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-400 via-blue-600 to-indigo-600 text-white font-black text-base flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.4)] border border-white/20">
                {employee.managerName ? employee.managerName.charAt(0) : "R"}
              </div>
              <div>
                <h4 className="font-bold text-base text-white">{employee.managerName || "Rahul Nair"}</h4>
                <p className="text-xs text-slate-400">Engineering Lead · Engineering</p>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-xs text-slate-300 leading-relaxed">
              Requests require manager recommendation before proceeding to HR.
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
            <span>Pending Requests:</span>
            <span className="font-bold text-amber-400">{pendingCount} in review</span>
          </div>
        </div>
      </div>

      {/* BENTO ROW 2: 3 Credit-Style Frosted Leave Cards (Aura style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Bento Card 1: Casual Leave */}
        <div className="bento-card bento-card-glow-cyan p-6 bg-gradient-to-br from-white/[0.08] via-[#121826]/75 to-[#080d18]/80 group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300 font-bold text-xs shadow-xs">
                CL
              </div>
              <span className="font-bold text-sm text-white tracking-wide">ELAP Infinite</span>
            </div>
            <Wifi className="w-5 h-5 text-slate-500 rotate-90" />
          </div>

          <div className="my-6">
            <span className="text-[11px] font-mono text-slate-400 tracking-wider block uppercase">
              Casual Leave Quota
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {clAvailable}
              </span>
              <span className="text-xs text-slate-400 font-medium">/ {clBalance.annualQuota} Days</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
            <div className="text-[11px] font-mono text-slate-400 tracking-widest">
              ••• 4158 ••• CL
            </div>
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full bg-sky-500/60 backdrop-blur-xs shadow-sm" />
              <div className="w-6 h-6 rounded-full bg-indigo-500/60 backdrop-blur-xs shadow-sm" />
            </div>
          </div>
        </div>

        {/* Bento Card 2: Sick Leave */}
        <div className="bento-card bento-card-glow-emerald p-6 bg-gradient-to-br from-white/[0.08] via-[#102022]/75 to-[#081518]/80 group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 font-bold text-xs shadow-xs">
                SL
              </div>
              <span className="font-bold text-sm text-white tracking-wide">ELAP Medical</span>
            </div>
            <Wifi className="w-5 h-5 text-slate-500 rotate-90" />
          </div>

          <div className="my-6">
            <span className="text-[11px] font-mono text-slate-400 tracking-wider block uppercase">
              Sick Leave Quota
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {slAvailable}
              </span>
              <span className="text-xs text-slate-400 font-medium">/ {slBalance.annualQuota} Days</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
            <div className="text-[11px] font-mono text-slate-400 tracking-widest">
              ••• 7930 ••• SL
            </div>
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500/60 backdrop-blur-xs shadow-sm" />
              <div className="w-6 h-6 rounded-full bg-teal-500/60 backdrop-blur-xs shadow-sm" />
            </div>
          </div>
        </div>

        {/* Bento Card 3: Earned Leave */}
        <div className="bento-card bento-card-glow-purple p-6 bg-gradient-to-br from-white/[0.08] via-[#1c142b]/75 to-[#100b1c]/80 group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 font-bold text-xs shadow-xs">
                EL
              </div>
              <span className="font-bold text-sm text-white tracking-wide">ELAP Privilege</span>
            </div>
            <Wifi className="w-5 h-5 text-slate-500 rotate-90" />
          </div>

          <div className="my-6">
            <span className="text-[11px] font-mono text-slate-400 tracking-wider block uppercase">
              Earned Leave Quota
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {elAvailable}
              </span>
              <span className="text-xs text-slate-400 font-medium">/ {elBalance.annualQuota} Days</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
            <div className="text-[11px] font-mono text-slate-400 tracking-widest">
              ••• 9921 ••• EL
            </div>
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full bg-purple-500/60 backdrop-blur-xs shadow-sm" />
              <div className="w-6 h-6 rounded-full bg-pink-500/60 backdrop-blur-xs shadow-sm" />
            </div>
          </div>
        </div>
      </div>

      {/* BENTO ROW 3: Recent Activity (8 cols) + Upcoming Leave (4 cols) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Recent Applications Bento Table (8 cols) */}
        <div className="md:col-span-8 bento-card p-0">
          <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Recent Leave Applications</h3>
              <p className="text-xs text-slate-400 mt-0.5">Live status across Manager and HR authorization tiers</p>
            </div>
            <Link href="/leave/history" className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            {requests.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Calendar className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p className="text-sm font-medium text-slate-300">No leave requests found</p>
                <p className="text-xs text-slate-500 mt-1">Apply for leave using the button above.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-white/[0.02] text-xs text-slate-400 font-semibold uppercase tracking-wider border-b border-white/[0.06]">
                  <tr>
                    <th className="px-6 py-3.5">Leave Type</th>
                    <th className="px-6 py-3.5">Dates</th>
                    <th className="px-6 py-3.5">Days</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Submitted On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {requests.slice(0, 5).map((req) => {
                    const typeInfo = getLeaveTypeLabel(req.leaveType);
                    return (
                      <tr key={req.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-semibold text-white">{typeInfo.label}</span>
                          <span className="text-xs text-slate-400 block font-mono mt-0.5">{req.requestId}</span>
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
                        <td className="px-6 py-4 text-slate-400 text-xs">
                          {formatDate(req.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Upcoming Leave Bento Card (4 cols) */}
        <div className="md:col-span-4 bento-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CalendarCheck className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white">Scheduled Time-Off</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">Upcoming approved and pending leaves</p>

            <div className="space-y-3">
              {upcomingLeaves.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No upcoming leaves scheduled.
                </div>
              ) : (
                upcomingLeaves.slice(0, 3).map((u) => (
                  <div
                    key={u.id}
                    className="p-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-md flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-semibold text-white">
                        {getLeaveTypeLabel(u.leaveType).label}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {formatDate(u.startDate)} – {formatDate(u.endDate)}
                      </p>
                    </div>
                    <Badge status={u.status} />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/[0.06]">
            <Link href="/leave/history" className="w-full">
              <Button size="sm" variant="secondary" className="w-full rounded-xl text-xs">
                View All Records
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
