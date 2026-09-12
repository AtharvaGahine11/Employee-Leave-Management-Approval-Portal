"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Mail,
  Phone,
  Calendar,
  Eye,
  CheckCircle2,
  Clock,
  ChevronRight,
  Shield,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/lib/auth/AuthContext";
import { dataStore } from "@/lib/data/store";
import { formatDate } from "@/lib/utils";
import { Employee, LeaveRequest } from "@/types";

export default function TeamPage() {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<Employee[]>([]);
  const [teamRequests, setTeamRequests] = useState<LeaveRequest[]>([]);
  const [selectedMember, setSelectedMember] = useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const emps = dataStore.getEmployees();
    const team = emps.filter(
      (e) => e.managerId === "emp-2" || e.departmentName === "Engineering"
    );
    setTeamMembers(team);

    const allReqs = dataStore.getLeaveRequests();
    const reqs = allReqs.filter(
      (r) => r.departmentName === "Engineering" || r.managerName?.includes("Rahul")
    );
    setTeamRequests(reqs);
  }, [user]);

  return (
    <AppShell
      title="Team Roster & Capacity"
      subtitle="Direct reports in Engineering under your supervision"
    >
      <div className="space-y-6">
        {/* Team Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-3xl border border-white/[0.08] bg-[#121826]/60 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Direct Team Members
            </span>
            <div className="mt-2 text-3xl font-extrabold text-white">{teamMembers.length}</div>
            <p className="text-[11px] text-slate-400 mt-1">Engineering Department</p>
          </div>

          <div className="p-5 rounded-3xl border border-white/[0.08] bg-[#121826]/60 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Pending Approvals
            </span>
            <div className="mt-2 text-3xl font-extrabold text-amber-400">
              {teamRequests.filter((r) => r.status === "PENDING_MANAGER").length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Requiring your review</p>
          </div>

          <div className="p-5 rounded-3xl border border-white/[0.08] bg-[#121826]/60 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Approved Leave Days
            </span>
            <div className="mt-2 text-3xl font-extrabold text-emerald-400">
              {teamRequests.filter((r) => r.status === "APPROVED").reduce((acc, r) => acc + r.totalDays, 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Recorded this year</p>
          </div>
        </div>

        {/* Team Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {teamMembers.map((member) => {
            const cl = member.balances.CASUAL_LEAVE;
            const sl = member.balances.SICK_LEAVE;
            const el = member.balances.EARNED_LEAVE;

            const clAvail = cl.annualQuota - cl.usedDays - cl.pendingDays;
            const slAvail = sl.annualQuota - sl.usedDays - sl.pendingDays;
            const elAvail = el.annualQuota - el.usedDays - el.pendingDays;

            return (
              <div
                key={member.id}
                className="p-5 rounded-3xl border border-white/[0.08] bg-[#121826]/60 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col justify-between hover:border-sky-400/40 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-600 text-white font-bold text-sm flex items-center justify-center border border-white/20 shadow-xs">
                      {member.name.charAt(0)}
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {member.employeeId}
                    </Badge>
                  </div>

                  <h3 className="font-bold text-base text-white mt-3.5 tracking-tight group-hover:text-sky-300 transition-colors">
                    {member.name}
                  </h3>
                  <p className="text-xs text-slate-400">{member.designation}</p>
                  <p className="text-xs text-sky-400 font-mono mt-0.5">{member.email}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Available Quota:</span>
                    <span className="font-bold text-white">
                      {clAvail + slAvail + elAvail} Days
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-[11px] text-center pt-1">
                    <div className="bg-sky-500/10 py-1 rounded-lg border border-sky-500/20 font-semibold text-sky-300">
                      {clAvail} CL
                    </div>
                    <div className="bg-emerald-500/10 py-1 rounded-lg border border-emerald-500/20 font-semibold text-emerald-300">
                      {slAvail} SL
                    </div>
                    <div className="bg-purple-500/10 py-1 rounded-lg border border-purple-500/20 font-semibold text-purple-300">
                      {elAvail} EL
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
