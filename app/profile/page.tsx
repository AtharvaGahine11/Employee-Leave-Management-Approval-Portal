"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Building,
  Calendar,
  Shield,
  Briefcase,
  Phone,
  CheckCircle2,
  Clock,
  Award,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/lib/auth/AuthContext";
import { dataStore } from "@/lib/data/store";
import { formatDate } from "@/lib/utils";
import { Employee } from "@/types";

export default function ProfilePage() {
  const { user, role } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    if (user) {
      const emp = dataStore.getEmployeeById(user.employeeId);
      if (emp) setEmployee(emp);
    }
  }, [user]);

  if (!user || !employee) {
    return (
      <AppShell title="My Profile">
        <div className="text-center py-12 text-slate-500">Loading profile...</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Employee Profile" subtitle="Your organizational records, reporting manager, and access rights">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header Card */}
        <div className="p-6 sm:p-8 rounded-3xl border border-white/[0.08] bg-gradient-to-r from-sky-950/40 via-[#0e1424]/80 to-indigo-950/40 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-sky-400 via-blue-600 to-indigo-600 text-white font-black text-3xl flex items-center justify-center shadow-[0_0_30px_rgba(56,189,248,0.4)] border border-white/20">
                {employee.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-white tracking-tight">{employee.name}</h2>
                  <Badge variant="success" className="text-[10px]">
                    Active
                  </Badge>
                </div>
                <p className="text-sm font-medium text-slate-300 mt-0.5">{employee.designation}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2.5">
                  <span className="font-mono bg-white/[0.06] px-2.5 py-0.5 rounded-full text-sky-300 font-semibold border border-white/[0.08]">
                    {employee.employeeId}
                  </span>
                  <span>•</span>
                  <span>{employee.departmentName}</span>
                  <span>•</span>
                  <span className="capitalize">{employee.role.toLowerCase()} Level</span>
                </div>
              </div>
            </div>

            <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 pt-4 sm:pt-0 border-white/[0.08]">
              <span className="text-xs text-slate-400">Tenure</span>
              <span className="text-sm font-bold text-white">Since {formatDate(employee.joiningDate)}</span>
            </div>
          </div>
        </div>

        {/* 2 Detail Cards: Personal & Hierarchy */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-sky-400" /> Personal Information
              </CardTitle>
              <CardDescription>Primary identity and communication details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                <span className="text-slate-400 text-xs">Full Legal Name</span>
                <span className="font-semibold text-white">{employee.name}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                <span className="text-slate-400 text-xs">Corporate Email</span>
                <span className="font-semibold text-sky-300 font-mono text-xs">{employee.email}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                <span className="text-slate-400 text-xs">Official Employee ID</span>
                <span className="font-semibold text-white font-mono text-xs">{employee.employeeId}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-400 text-xs">Contact Phone</span>
                <span className="font-semibold text-white">{employee.phone || "+91 98200 00000"}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Building className="w-4 h-4 text-purple-400" /> Organizational Hierarchy
              </CardTitle>
              <CardDescription>Reporting line and business unit assignment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                <span className="text-slate-400 text-xs">Department</span>
                <span className="font-semibold text-white">{employee.departmentName}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                <span className="text-slate-400 text-xs">Reporting Manager</span>
                <div className="text-right">
                  <span className="font-semibold text-white block">
                    {employee.managerName || "Rahul Nair (Engineering Lead)"}
                  </span>
                  <span className="text-[11px] text-sky-400">First-tier Approver</span>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                <span className="text-slate-400 text-xs">Joining Date</span>
                <span className="font-semibold text-white">{formatDate(employee.joiningDate)}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-400 text-xs">Office Location</span>
                <span className="font-semibold text-white">Headquarters (Floor 4)</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Access Rights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-emerald-400" /> Access & Security Permissions
            </CardTitle>
            <CardDescription>Authentication method, system roles, and account status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                <span className="text-xs text-slate-400 block">Portal Role</span>
                <span className="font-bold text-white text-base mt-1 block">{employee.role}</span>
                <p className="text-[11px] text-slate-400 mt-1">Granted role-based navigation & permissions</p>
              </div>

              <div className="p-4 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                <span className="text-xs text-slate-400 block">Account Status</span>
                <span className="font-bold text-emerald-400 text-base mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Active & Verified
                </span>
                <p className="text-[11px] text-slate-400 mt-1">Eligible for leave approvals</p>
              </div>

              <div className="p-4 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                <span className="text-xs text-slate-400 block">Authentication Layer</span>
                <span className="font-bold text-sky-400 text-base mt-1 block">Local Demo Provider</span>
                <p className="text-[11px] text-slate-400 mt-1">Modular architecture ready for Supabase/Auth.js</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
