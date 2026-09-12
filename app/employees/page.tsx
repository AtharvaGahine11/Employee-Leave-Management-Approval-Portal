"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  Building,
  Mail,
  Calendar,
  Shield,
  Phone,
  Eye,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { dataStore } from "@/lib/data/store";
import { formatDate } from "@/lib/utils";
import { Employee, Department } from "@/types";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");

  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setEmployees(dataStore.getEmployees());
    setDepartments(dataStore.getDepartments());
  }, []);

  const filteredEmployees = employees.filter((emp) => {
    if (deptFilter !== "ALL" && emp.departmentName !== deptFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = emp.name.toLowerCase().includes(q);
      const matchId = emp.employeeId.toLowerCase().includes(q);
      const matchEmail = emp.email.toLowerCase().includes(q);
      const matchRole = emp.designation.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchEmail && !matchRole) return false;
    }
    return true;
  });

  return (
    <AppShell
      title="Employee Directory"
      subtitle="Organization-wide employee database across all 8 business departments"
    >
      <div className="space-y-6">
        {/* Filter Controls */}
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, employee ID, or title..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-full glass-input text-white placeholder:text-slate-500"
                />
              </div>

              <div className="flex items-center gap-2.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="px-3.5 py-1.5 text-xs rounded-full glass-input text-slate-300"
                >
                  <option value="ALL" className="bg-[#0e1424]">All Departments (8)</option>
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

        {/* Employees Table Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Staff Records ({filteredEmployees.length})</CardTitle>
              <CardDescription>
                Enterprise staff roster with reporting relationships and leave allocations
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/[0.02] text-xs text-slate-400 font-semibold uppercase tracking-wider border-b border-white/[0.06]">
                  <tr>
                    <th className="px-6 py-3.5">Employee</th>
                    <th className="px-6 py-3.5">Department</th>
                    <th className="px-6 py-3.5">Designation</th>
                    <th className="px-6 py-3.5">Reporting Line</th>
                    <th className="px-6 py-3.5">Joined</th>
                    <th className="px-6 py-3.5">Leave Balance (CL / SL / EL)</th>
                    <th className="px-6 py-3.5 text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredEmployees.map((emp) => {
                    const cl = emp.balances.CASUAL_LEAVE;
                    const sl = emp.balances.SICK_LEAVE;
                    const el = emp.balances.EARNED_LEAVE;

                    const clLeft = cl.annualQuota - cl.usedDays - cl.pendingDays;
                    const slLeft = sl.annualQuota - sl.usedDays - sl.pendingDays;
                    const elLeft = el.annualQuota - el.usedDays - el.pendingDays;

                    return (
                      <tr key={emp.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 border border-white/20 shadow-xs">
                              {emp.name.charAt(0)}
                            </div>
                            <div>
                              <span className="font-semibold text-white block">{emp.name}</span>
                              <span className="text-xs text-slate-400 font-mono">{emp.employeeId}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-slate-300 text-xs">{emp.departmentName}</span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">
                          {emp.designation}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">
                          {emp.managerName || "—"}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">
                          {formatDate(emp.joiningDate)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 font-semibold border border-sky-500/20">
                              {clLeft} CL
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-semibold border border-emerald-500/20">
                              {slLeft} SL
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 font-semibold border border-purple-500/20">
                              {elLeft} EL
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedEmp(emp);
                              setIsModalOpen(true);
                            }}
                            className="text-xs rounded-lg"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> Profile
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Employee Detail Modal */}
        {selectedEmp && (
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Employee Record Profile"
            description={`ID: ${selectedEmp.employeeId}`}
          >
            <div className="space-y-4 text-sm">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Full Name:</span>
                  <span className="font-bold text-white">{selectedEmp.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Corporate Email:</span>
                  <span className="font-mono text-sky-300">{selectedEmp.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Department:</span>
                  <span className="font-semibold text-white">{selectedEmp.departmentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Designation:</span>
                  <span className="text-slate-300">{selectedEmp.designation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Reporting Manager:</span>
                  <span className="text-slate-300">{selectedEmp.managerName || "Direct Leadership"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Joining Date:</span>
                  <span className="text-slate-300">{formatDate(selectedEmp.joiningDate)}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Live Leave Balances
                </h4>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                    <span className="text-xs text-sky-400 font-bold block">CL</span>
                    <span className="text-lg font-bold text-white">
                      {selectedEmp.balances.CASUAL_LEAVE.annualQuota - selectedEmp.balances.CASUAL_LEAVE.usedDays} Days
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Casual Leave</span>
                  </div>
                  <div className="p-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                    <span className="text-xs text-emerald-400 font-bold block">SL</span>
                    <span className="text-lg font-bold text-white">
                      {selectedEmp.balances.SICK_LEAVE.annualQuota - selectedEmp.balances.SICK_LEAVE.usedDays} Days
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Sick Leave</span>
                  </div>
                  <div className="p-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                    <span className="text-xs text-purple-400 font-bold block">EL</span>
                    <span className="text-lg font-bold text-white">
                      {selectedEmp.balances.EARNED_LEAVE.annualQuota - selectedEmp.balances.EARNED_LEAVE.usedDays} Days
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Earned Leave</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-white/[0.08]">
                <Button variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl px-4">
                  Close
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AppShell>
  );
}
