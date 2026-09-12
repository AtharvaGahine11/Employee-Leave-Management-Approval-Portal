"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  UserCheck,
  FileClock,
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { Logo } from "@/components/ui/Logo";

export default function LoginPage() {
  const router = useRouter();
  const { login, switchUserRole } = useAuth();
  const { toast } = useToast();

  const [selectedRole, setSelectedRole] = useState<"EMPLOYEE" | "MANAGER" | "HR">("EMPLOYEE");
  const [email, setEmail] = useState("employee@elap.demo");
  const [password, setPassword] = useState("employee123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const personas = [
    {
      role: "EMPLOYEE" as const,
      name: "Sneha Kulkarni",
      designation: "Senior Software Engineer",
      department: "Engineering",
      email: "employee@elap.demo",
      pass: "employee123",
      accent: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.2)]",
      glowDot: "bg-emerald-400",
      badge: "Employee",
    },
    {
      role: "MANAGER" as const,
      name: "Rahul Nair",
      designation: "Engineering Lead",
      department: "Engineering",
      email: "manager@elap.demo",
      pass: "manager123",
      accent: "text-sky-400 border-sky-500/40 bg-sky-500/10 shadow-[0_0_20px_rgba(56,189,248,0.2)]",
      glowDot: "bg-sky-400",
      badge: "Manager",
    },
    {
      role: "HR" as const,
      name: "Priya Patel",
      designation: "HR Operations Lead",
      department: "Human Resources",
      email: "hr@elap.demo",
      pass: "hr123",
      accent: "text-purple-400 border-purple-500/40 bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.2)]",
      glowDot: "bg-purple-400",
      badge: "HR Admin",
    },
  ];

  const handleSelectPersona = (p: typeof personas[0]) => {
    setSelectedRole(p.role);
    setEmail(p.email);
    setPassword(p.pass);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      toast({
        type: "success",
        title: "Authenticated Successfully",
        message: `Welcome to ELAP workspace. Signed in as ${selectedRole}.`,
      });
      router.push("/dashboard");
    } else {
      toast({
        type: "error",
        title: "Authentication Failed",
        message: result.error || "Please verify your email and password.",
      });
    }
  };

  const handleQuickLaunch = async (p: typeof personas[0]) => {
    handleSelectPersona(p);
    setIsLoading(true);
    await switchUserRole(p.email);
    setIsLoading(false);
    toast({
      type: "success",
      title: `Switched to ${p.role}`,
      message: `Welcome, ${p.name}!`,
    });
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans selection:bg-sky-500/30 selection:text-sky-200">
      {/* Ambient Diffused Cyan & Indigo Glowing Clouds */}
      <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-cyan-500/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/2 -left-48 w-[500px] h-[500px] bg-teal-500/12 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 right-1/4 w-[550px] h-[550px] bg-indigo-600/12 rounded-full blur-[160px] pointer-events-none" />

      {/* Main Glass Console Card (Balanced Equal Spacing) */}
      <div className="w-full max-w-5xl rounded-3xl border border-white/[0.1] bg-[#0c1222]/70 backdrop-blur-2xl shadow-[0_25px_80px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col lg:flex-row relative z-10 my-auto">
        {/* Left Showcase & Overview Column */}
        <div className="lg:w-1/2 p-6 sm:p-9 lg:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/[0.08] relative">
          <div>
            {/* Logo */}
            <div className="flex items-center justify-between">
              <Logo size="md" linkHref="" />
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-white/[0.04] text-slate-400 border border-white/[0.08]">
                v1.0 MVP
              </span>
            </div>

            {/* Tag Badge */}
            <div className="mt-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-sky-300 text-xs font-semibold mb-4 backdrop-blur-md">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                <span>Enterprise HR Governance</span>
              </div>

              {/* Headline */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Leave Management &{" "}
                <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(56,189,248,0.3)]">
                  Approval Portal.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                Centralized corporate workflow replacing email trails with real-time manager endorsements, final HR verification, and live balance sync.
              </p>
            </div>
          </div>

          {/* Value Pillar Chips (Equal Spacing) */}
          <div className="mt-8 space-y-3">
            <div className="p-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-md flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-semibold text-slate-200">Two-Tier Role Hierarchy</h4>
                <p className="text-[11px] text-slate-400 truncate">Manager endorsement followed by final HR authorization.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-md flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/30">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-semibold text-slate-200">Live Quota Deduction</h4>
                <p className="text-[11px] text-slate-400 truncate">Casual, Sick, & Earned balances updated in real-time.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-md flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30">
                <FileClock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-semibold text-slate-200">Immutable Audit Trail</h4>
                <p className="text-[11px] text-slate-400 truncate">Chronological transition log across all 8 departments.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sign-In Console Column */}
        <div className="lg:w-1/2 p-6 sm:p-9 lg:p-10 flex flex-col justify-between bg-black/25 relative">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                  Sign In to ELAP
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Select a demo persona below or enter credentials.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20">
                Demo Auth
              </span>
            </div>

            {/* 1-Click Persona Switcher */}
            <div className="mb-6">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                <span>Demo Personas (1-Click Fill)</span>
                <span className="text-[10px] text-sky-400 font-normal">Click to auto-fill</span>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {personas.map((p) => {
                  const isSelected = selectedRole === p.role;
                  return (
                    <button
                      key={p.role}
                      type="button"
                      onClick={() => handleSelectPersona(p)}
                      className={`p-3 rounded-2xl border text-left transition-all relative ${
                        isSelected
                          ? p.accent
                          : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold capitalize">
                          {p.badge}
                        </span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isSelected ? p.glowDot : "bg-slate-600"
                          }`}
                        />
                      </div>
                      <div className="text-xs font-semibold text-white truncate leading-tight">
                        {p.name.split(" ")[0]}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">
                        {p.department}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Corporate Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@elap.demo"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Password
                  </label>
                  <span className="text-[10px] text-sky-400">
                    Demo Password Active
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl glass-input text-sm focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-sky-500 focus:ring-0"
                  />
                  <span className="text-xs text-slate-400">Remember session</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const p = personas.find((x) => x.role === selectedRole) || personas[0];
                    handleQuickLaunch(p);
                  }}
                  className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
                >
                  <Zap className="w-3.5 h-3.5 text-sky-400 fill-sky-400" />
                  1-Click Fast Enter →
                </button>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm text-black bg-gradient-to-r from-sky-400 via-cyan-300 to-sky-400 hover:from-sky-300 hover:to-cyan-200 shadow-[0_0_25px_rgba(56,189,248,0.4)] transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to ELAP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Bottom Card Footer */}
          <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              System Online
            </span>
            <span>FY 2026-2027</span>
          </div>
        </div>
      </div>
    </div>
  );
}
