"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  User,
  CalendarPlus,
  History,
  CheckSquare,
  Users,
  Building2,
  FileClock,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  ArrowRightLeft,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { dataStore } from "@/lib/data/store";
import { Logo, LogoIcon } from "@/components/ui/Logo";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: ("EMPLOYEE" | "MANAGER" | "HR")[];
  badgeCount?: number;
}

export function AppShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  const { user, role, logout, switchUserRole, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    dataStore.init();
    const updateCounts = () => {
      const all = dataStore.getLeaveRequests();
      if (role === "MANAGER") {
        setPendingCount(all.filter((r) => r.status === "PENDING_MANAGER").length);
      } else if (role === "HR") {
        setPendingCount(all.filter((r) => r.status === "PENDING_HR").length);
      } else {
        setPendingCount(0);
      }
    };

    updateCounts();
    window.addEventListener("elap_data_updated", updateCounts);
    return () => window.removeEventListener("elap_data_updated", updateCounts);
  }, [role]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-slate-300">
        <Logo size="lg" linkHref="" />
        <p className="text-xs text-slate-500 mt-4 font-medium tracking-wide animate-pulse">
          Launching ELAP Dark Glass Portal...
        </p>
      </div>
    );
  }

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["EMPLOYEE", "MANAGER", "HR"],
    },
    {
      label: "My Profile",
      href: "/profile",
      icon: User,
      roles: ["EMPLOYEE", "MANAGER"],
    },
    {
      label: "Apply for Leave",
      href: "/leave/apply",
      icon: CalendarPlus,
      roles: ["EMPLOYEE"],
    },
    {
      label: "Approvals",
      href: "/approvals",
      icon: CheckSquare,
      roles: ["MANAGER"],
      badgeCount: pendingCount,
    },
    {
      label: "Team Roster",
      href: "/team",
      icon: Users,
      roles: ["MANAGER"],
    },
    {
      label: "Employees",
      href: "/employees",
      icon: Users,
      roles: ["HR"],
    },
    {
      label: "Departments",
      href: "/departments",
      icon: Building2,
      roles: ["HR"],
    },
    {
      label: "Leave Requests",
      href: "/leave-requests",
      icon: CheckSquare,
      roles: ["HR"],
      badgeCount: pendingCount,
    },
    {
      label: "Leave History",
      href: "/leave/history",
      icon: History,
      roles: ["EMPLOYEE", "MANAGER", "HR"],
    },
    {
      label: "Audit Trail",
      href: "/audit",
      icon: FileClock,
      roles: ["HR"],
    },
  ];

  const visibleNavItems = navItems.filter((item) => role && item.roles.includes(role));

  const roleGlowColors = {
    EMPLOYEE: "from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30",
    MANAGER: "from-indigo-500/20 to-sky-500/20 text-indigo-300 border-indigo-500/30",
    HR: "from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30",
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 flex p-3 sm:p-4 lg:p-6 gap-5 selection:bg-sky-500/30 selection:text-sky-200">
      {/* Desktop Floating Glass Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 rounded-3xl border border-white/[0.08] bg-[#0e1424]/70 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] shrink-0 select-none overflow-hidden relative">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-sky-500/10 to-transparent pointer-events-none" />

        {/* Brand Header */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-white/[0.06] relative z-10">
          <Logo size="md" />
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/[0.06] text-slate-400 border border-white/[0.08]">
            v1.0
          </span>
        </div>

        {/* Current Role Indicator */}
        <div className="px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.01]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1.5 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              Role Mode
            </span>
            <span
              className={cn(
                "px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border bg-gradient-to-r shadow-xs",
                role ? roleGlowColors[role] : ""
              )}
            >
              {role}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3.5 py-4 space-y-1.5 overflow-y-auto relative z-10">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
            Menu
          </div>
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-white/[0.1] text-white font-semibold border border-white/[0.12] shadow-[0_0_20px_rgba(56,189,248,0.15)]"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "p-1.5 rounded-lg transition-colors",
                      isActive
                        ? "bg-sky-500 text-white shadow-[0_0_12px_rgba(56,189,248,0.5)]"
                        : "bg-white/[0.04] text-slate-400 group-hover:text-white group-hover:bg-white/[0.08]"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{item.label}</span>
                </div>
                {item.badgeCount && item.badgeCount > 0 ? (
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold",
                      isActive
                        ? "bg-sky-500 text-white shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                        : "bg-white/10 text-slate-300"
                    )}
                  >
                    {item.badgeCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* Quick Role Switcher (Frosted Glass Pills) */}
        <div className="p-3 mx-3 mb-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] relative z-10 backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <ArrowRightLeft className="w-3 h-3 text-sky-400" /> Demo Switch
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => switchUserRole("employee@elap.demo")}
              className={cn(
                "py-1.5 text-[11px] rounded-lg font-medium transition-all text-center",
                role === "EMPLOYEE"
                  ? "bg-emerald-500 text-white font-bold shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                  : "bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]"
              )}
            >
              Emp
            </button>
            <button
              onClick={() => switchUserRole("manager@elap.demo")}
              className={cn(
                "py-1.5 text-[11px] rounded-lg font-medium transition-all text-center",
                role === "MANAGER"
                  ? "bg-indigo-500 text-white font-bold shadow-[0_0_12px_rgba(99,102,241,0.4)]"
                  : "bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]"
              )}
            >
              Mgr
            </button>
            <button
              onClick={() => switchUserRole("hr@elap.demo")}
              className={cn(
                "py-1.5 text-[11px] rounded-lg font-medium transition-all text-center",
                role === "HR"
                  ? "bg-purple-500 text-white font-bold shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                  : "bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]"
              )}
            >
              HR
            </button>
          </div>
        </div>

        {/* User Footer with Floating Bubble */}
        <div className="p-3.5 border-t border-white/[0.06] bg-white/[0.02] flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-[0_0_12px_rgba(56,189,248,0.3)] shrink-0 border border-white/20">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate leading-tight">
                {user.name}
              </p>
              <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">
                {user.department}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="text-slate-400 hover:text-rose-400 p-2 rounded-xl hover:bg-white/[0.06] transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Unique Floating Glass Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-[#070a11]/80 backdrop-blur-md animate-in fade-in"
            onClick={() => setMobileOpen(false)}
          />
          {/* Floating Rounded Console Panel */}
          <div className="fixed left-3 top-3 bottom-3 w-72 rounded-3xl border border-white/[0.12] bg-[#0e1424]/95 backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] flex flex-col z-10 overflow-hidden animate-in slide-in-from-left duration-300">
            <div className="h-16 px-6 flex items-center justify-between border-b border-white/[0.08]">
              <Logo size="sm" linkHref="" />
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 border-b border-white/[0.08] bg-white/[0.02]">
              <span
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold border uppercase inline-block",
                  role ? roleGlowColors[role] : ""
                )}
              >
                {role} Mode
              </span>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all",
                      isActive
                        ? "bg-white/[0.1] text-white font-semibold border border-white/[0.15]"
                        : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-sky-400" />
                      <span>{item.label}</span>
                    </div>
                    {item.badgeCount && item.badgeCount > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500 text-white">
                        {item.badgeCount}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-white/[0.08]">
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl border border-rose-500/20 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Glass Shell Container */}
      <div className="flex-1 flex flex-col min-w-0 rounded-3xl border border-white/[0.08] bg-[#0e1424]/50 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Top Floating Header */}
        <header className="h-20 px-6 sm:px-8 border-b border-white/[0.06] flex items-center justify-between sticky top-0 z-30 bg-[#0e1424]/80 backdrop-blur-xl">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.08]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-slate-400 hidden sm:block truncate leading-tight mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right Header Navigation Elements (Aura style) */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Search Pill Input */}
            <div className="relative hidden md:block w-48 lg:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-400 focus:bg-white/[0.06] transition-all"
              />
            </div>

            {/* Quick Action Button for Employee */}
            {role === "EMPLOYEE" && pathname !== "/leave/apply" && (
              <Link href="/leave/apply">
                <Button size="sm" className="hidden sm:inline-flex rounded-full text-xs">
                  <CalendarPlus className="w-3.5 h-3.5 mr-1" /> Apply Leave
                </Button>
              </Link>
            )}

            {/* Notification Bell with Glowing Indicator */}
            <div className="relative">
              <button
                className="p-2.5 rounded-full text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors relative"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {pendingCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]" />
                )}
              </button>
            </div>

            <div className="h-6 w-px bg-white/[0.08] hidden sm:block" />

            {/* User Avatar & Name */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-400 via-blue-500 to-indigo-600 p-[1.5px] shadow-[0_0_12px_rgba(56,189,248,0.3)]">
                <div className="w-full h-full rounded-full bg-[#0e1424] flex items-center justify-center text-xs font-bold text-white">
                  {user.name.charAt(0)}
                </div>
              </div>
              <div className="hidden md:block text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white tracking-tight">{user.name}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </div>
                <span className="text-[10px] text-slate-400 block leading-tight font-mono">{user.employeeId}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
