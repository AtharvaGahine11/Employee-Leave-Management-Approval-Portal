"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  Briefcase,
  ChevronRight,
  Shield,
  Layers,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { dataStore } from "@/lib/data/store";
import { Department, Employee, LeaveRequest } from "@/types";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);

  useEffect(() => {
    setDepartments(dataStore.getDepartments());
    setEmployees(dataStore.getEmployees());
    setRequests(dataStore.getLeaveRequests());
  }, []);

  return (
    <AppShell
      title="Business Departments"
      subtitle="Complete organizational view across all 8 enterprise functional units"
    >
      <div className="space-y-6">
        {/* Department Grid in Dark Glass Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {departments.map((dept) => {
            const deptEmps = employees.filter((e) => e.departmentId === dept.id || e.departmentName === dept.name);
            const deptReqs = requests.filter((r) => r.departmentName === dept.name);
            const pendingReqs = deptReqs.filter((r) => r.status === "PENDING_MANAGER" || r.status === "PENDING_HR");
            const approvedReqs = deptReqs.filter((r) => r.status === "APPROVED");

            return (
              <div
                key={dept.id}
                className="p-5 rounded-3xl border border-white/[0.08] bg-[#121826]/60 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:border-sky-400/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/20">
                      {dept.code}
                    </span>
                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {deptEmps.length} Staff
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-white mt-3.5 tracking-tight group-hover:text-sky-300 transition-colors">
                    {dept.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {dept.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">Pending Review:</span>
                    <span className={`font-semibold ${pendingReqs.length > 0 ? "text-amber-400" : "text-slate-400"}`}>
                      {pendingReqs.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Approved Leaves:</span>
                    <span className="font-semibold text-emerald-400">{approvedReqs.length}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Department Matrix Table */}
        <Card>
          <CardHeader>
            <CardTitle>Department Matrix & Leave Governance</CardTitle>
            <CardDescription>
              Real-time synchronization across statutory leave requirements for all 8 departments
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/[0.02] text-xs text-slate-400 font-semibold uppercase tracking-wider border-b border-white/[0.06]">
                  <tr>
                    <th className="px-6 py-3.5">Code</th>
                    <th className="px-6 py-3.5">Department Name</th>
                    <th className="px-6 py-3.5">Functional Scope</th>
                    <th className="px-6 py-3.5">Headcount</th>
                    <th className="px-6 py-3.5">Active Pipeline</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {departments.map((dept) => {
                    const deptEmps = employees.filter((e) => e.departmentId === dept.id || e.departmentName === dept.name);
                    const deptReqs = requests.filter((r) => r.departmentName === dept.name);
                    const pendingCount = deptReqs.filter((r) => r.status === "PENDING_MANAGER" || r.status === "PENDING_HR").length;

                    return (
                      <tr key={dept.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-xs text-sky-400">
                          {dept.code}
                        </td>
                        <td className="px-6 py-4 font-semibold text-white">
                          {dept.name}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400 max-w-md">
                          {dept.description}
                        </td>
                        <td className="px-6 py-4 font-semibold text-white">
                          {deptEmps.length} Employees
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            pendingCount > 0 ? "bg-amber-500/10 text-amber-300 border border-amber-500/20" : "bg-white/[0.04] text-slate-400"
                          }`}>
                            {pendingCount} Pending
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="success">Active</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
