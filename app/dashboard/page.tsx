"use client";

import React from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { EmployeeDashboard } from "@/components/dashboard/EmployeeDashboard";
import { ManagerDashboard } from "@/components/dashboard/ManagerDashboard";
import { HrDashboard } from "@/components/dashboard/HrDashboard";

export default function DashboardPage() {
  const { user, role } = useAuth();

  const currentRole = role || "HR";

  const getTitleAndSubtitle = () => {
    switch (role) {
      case "MANAGER":
        return {
          title: "Manager Dashboard",
          subtitle: "Team leave status, pending approvals, and coverage",
        };
      case "HR":
        return {
          title: "HR Executive Dashboard",
          subtitle: "Organization-wide leave management across 8 departments",
        };
      case "EMPLOYEE":
      default:
        return {
          title: "Employee Dashboard",
          subtitle: "Your leave balances, applications, and status history",
        };
    }
  };

  const { title, subtitle } = getTitleAndSubtitle();

  return (
    <AppShell title={title} subtitle={subtitle}>
      {user && role === "EMPLOYEE" && (
        <EmployeeDashboard employeeId={user.employeeId} employeeName={user.name} />
      )}
      {user && role === "MANAGER" && (
        <ManagerDashboard managerId={user.employeeId} managerName={user.name} />
      )}
      {user && role === "HR" && (
        <HrDashboard hrId={user.employeeId} hrName={user.name} />
      )}
    </AppShell>
  );
}
