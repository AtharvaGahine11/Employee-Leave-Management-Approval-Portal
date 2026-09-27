import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  ArrowRight,
  ArrowDown,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Zap,
  FileSpreadsheet,
  Paperclip,
  MessageSquare,
  Users,
  Search,
  Bell,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'home' | 'features' | 'about'>('home');

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'HR') return '/hr/dashboard';
    if (user.role === 'MANAGER') return '/manager/dashboard';
    return '/employee/dashboard';
  };

  return (
    <div className="min-h-screen bg-[#fbfcff] text-slate-900 selection:bg-blue-600 selection:text-white font-sans antialiased relative overflow-x-hidden">
      {/* ============================================================== */}
      {/* 1. TOP NAVBAR (Identical to Reference Image) */}
      {/* ============================================================== */}
      <header className="w-full bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Brand Logo & Tagline */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group">
              {/* Geometric Apex Delta/A Logo */}
              <div className="relative flex items-center justify-center">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600 transition-transform group-hover:scale-105" viewBox="0 0 36 36" fill="none">
                  <path
                    d="M6 30L18 6L30 30"
                    stroke="#1E40AF"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 22L24 22"
                    stroke="#3B82F6"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Apex Typography */}
              <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-slate-950 font-sans">
                Apex
              </span>
            </Link>

            {/* Separator & Tagline */}
            <div className="hidden sm:flex items-center gap-3 pl-2 border-l border-slate-200">
              <span className="text-xs text-slate-400 font-medium tracking-wide">
                People. Process. Progress.
              </span>
            </div>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a
              href="#home"
              onClick={() => setActiveTab('home')}
              className={`transition-colors py-1 relative ${
                activeTab === 'home'
                  ? 'text-slate-950 font-bold'
                  : 'text-slate-500 hover:text-slate-950'
              }`}
            >
              Home
              {activeTab === 'home' && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-slate-950 rounded-full" />
              )}
            </a>
            <a
              href="#features"
              onClick={() => setActiveTab('features')}
              className="text-slate-500 hover:text-slate-950 transition-colors py-1"
            >
              Features
            </a>
            <a
              href="#about"
              onClick={() => setActiveTab('about')}
              className="text-slate-500 hover:text-slate-950 transition-colors py-1"
            >
              About
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <button
                onClick={() => navigate(getDashboardPath())}
                className="bg-slate-950 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-xs transition-all flex items-center gap-1.5 sm:gap-2 hover:translate-x-0.5"
              >
                <span>Dashboard ({user.name.split(' ')[0]})</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full border border-slate-200/90 hover:border-slate-300 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-950 bg-white/70 hover:bg-white transition-all shadow-2xs"
                >
                  Sign In
                </Link>
                <Link
                  to="/login?mode=register"
                  className="bg-slate-950 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-xs transition-all flex items-center gap-1.5 hover:translate-x-0.5"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. HERO SECTION (Faithful to Reference Mockup) */}
      {/* ============================================================== */}
      <section id="home" className="relative pt-6 sm:pt-10 pb-16 lg:pb-24 overflow-hidden">
        {/* Soft Ambient Radial Backdrop */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-blue-100/50 via-indigo-50/30 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-8 items-center min-h-[580px]">
            {/* Left Column: Headline & Value Proposition */}
            <div className="lg:col-span-6 xl:col-span-5 space-y-5 sm:space-y-6 text-left">
              {/* Eyebrow Label */}
              <div className="inline-flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-blue-600/90">
                  HR MADE SIMPLE
                </span>
              </div>

              {/* Main Powerful Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-black text-slate-950 tracking-[-0.03em] leading-[1.12] sm:leading-[1.08]">
                Empower People.
                <br />
                Simplify Leaves.
                <br />
                Build a{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700">
                  Stronger Tomorrow.
                </span>
              </h1>

              {/* Supporting Subtitle */}
              <p className="text-sm sm:text-base text-slate-500 font-normal leading-relaxed max-w-md">
                A modern leave management and approval system for growing organizations.
              </p>

              {/* Hero Action CTA Group */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3.5 pt-2">
                <Link
                  to="/login?mode=register"
                  className="bg-slate-950 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm px-6 sm:px-7 py-3 rounded-full shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 group"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  to="/login"
                  className="px-6 sm:px-7 py-3 rounded-full border border-slate-200/90 hover:border-slate-300 text-xs sm:text-sm font-semibold text-slate-800 bg-white hover:bg-slate-50 transition-all shadow-2xs text-center"
                >
                  Sign Up
                </Link>
              </div>

              {/* Simple • Transparent • Efficient Micro-tagline */}
              <div className="pt-6">
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400 flex items-center gap-2">
                  <span className="w-5 h-[1.5px] bg-slate-300 inline-block" />
                  SIMPLE • TRANSPARENT • EFFICIENT
                </p>
              </div>
            </div>

            {/* Right Column: High-End Office Desk with Live Laptop Dashboard UI */}
            <div className="lg:col-span-6 xl:col-span-7 relative flex items-center justify-center lg:justify-end">
              {/* Background Workspace Ambience Card */}
              <div className="relative w-full max-w-[620px] aspect-[16/11] rounded-3xl bg-gradient-to-tr from-slate-100 via-slate-50 to-blue-50/40 p-3 sm:p-5 shadow-[0_30px_70px_rgba(0,0,0,0.07)] border border-slate-200/70 overflow-hidden">
                {/* Window city blur backdrop simulation */}
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-multiply pointer-events-none"
                  style={{ backgroundImage: `url('/images/apex_hero_workspace.jpg')` }}
                />

                {/* Vertical Branding Strip on far right */}
                <div className="absolute top-6 right-5 text-right hidden sm:block pointer-events-none z-10">
                  <div className="text-[9px] font-bold text-slate-400 tracking-[0.25em] uppercase leading-tight space-y-0.5">
                    <div>WORK</div>
                    <div>PEOPLE</div>
                    <div>GROW</div>
                    <div>TOGETHER</div>
                  </div>
                  <div className="w-4 h-[1px] bg-slate-300 ml-auto mt-2" />
                </div>

                {/* Laptop Physical Shell */}
                <div className="relative z-10 w-full h-full flex flex-col justify-between pt-2">
                  {/* Laptop Display Bezel */}
                  <div className="w-full bg-slate-950 rounded-2xl p-2.5 shadow-2xl border border-slate-800 flex-1 flex flex-col">
                    {/* Laptop Camera dot */}
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700 mx-auto mb-1.5 opacity-80" />

                    {/* Inside Laptop: The Apex Portal Live UI */}
                    <div className="bg-white rounded-xl flex-1 p-3.5 flex flex-col justify-between text-left overflow-hidden border border-slate-100">
                      {/* Dashboard Top Header Bar */}
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center text-white text-[10px] font-black">
                            A
                          </div>
                          <span className="font-extrabold text-xs text-slate-900">Apex</span>
                        </div>

                        {/* Search Input Simulation */}
                        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/70 text-[10px] text-slate-400 w-44">
                          <Search className="w-3 h-3 text-slate-400" />
                          <span>Search leaves, team...</span>
                        </div>

                        {/* User Profile */}
                        <div className="flex items-center gap-2">
                          <Bell className="w-3.5 h-3.5 text-slate-400" />
                          <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-[9px] flex items-center justify-center shadow-xs">
                            SR
                          </div>
                        </div>
                      </div>

                      {/* Greeting Banner */}
                      <div className="pt-2 flex items-center justify-between">
                        <div>
                          <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                            Good Morning,
                          </h4>
                          <p className="text-[10px] text-slate-400">Here's your leave overview.</p>
                        </div>
                        <span className="text-[9px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                          Mon, 25 Aug 2026
                        </span>
                      </div>

                      {/* 4 Overview Metric Cards */}
                      <div className="grid grid-cols-4 gap-2 pt-2">
                        <div className="bg-slate-50/80 rounded-xl p-2 border border-slate-200/60 text-center">
                          <Calendar className="w-3.5 h-3.5 text-blue-600 mx-auto mb-1" />
                          <div className="text-xs sm:text-sm font-extrabold text-slate-900">12</div>
                          <div className="text-[8px] sm:text-[9px] text-slate-400 font-medium">Total Leaves</div>
                        </div>

                        <div className="bg-amber-50/60 rounded-xl p-2 border border-amber-200/60 text-center">
                          <Clock className="w-3.5 h-3.5 text-amber-600 mx-auto mb-1" />
                          <div className="text-xs sm:text-sm font-extrabold text-amber-900">2</div>
                          <div className="text-[8px] sm:text-[9px] text-amber-700 font-semibold">Pending</div>
                        </div>

                        <div className="bg-emerald-50/60 rounded-xl p-2 border border-emerald-200/60 text-center">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mx-auto mb-1" />
                          <div className="text-xs sm:text-sm font-extrabold text-emerald-900">9</div>
                          <div className="text-[8px] sm:text-[9px] text-emerald-700 font-semibold">Approved</div>
                        </div>

                        <div className="bg-rose-50/60 rounded-xl p-2 border border-rose-200/60 text-center">
                          <XCircle className="w-3.5 h-3.5 text-rose-600 mx-auto mb-1" />
                          <div className="text-xs sm:text-sm font-extrabold text-rose-900">1</div>
                          <div className="text-[8px] sm:text-[9px] text-rose-700 font-semibold">Rejected</div>
                        </div>
                      </div>

                      {/* Split Lower View: Recent Requests & Balance */}
                      <div className="grid grid-cols-2 gap-2.5 pt-2 pb-1">
                        {/* Recent Requests */}
                        <div className="bg-slate-50/60 rounded-xl p-2.5 border border-slate-200/60 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-700">Recent Requests</span>
                            <span className="text-[9px] font-semibold text-blue-600">View All →</span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between bg-white px-2 py-1 rounded-lg border border-slate-100 text-[9px]">
                              <div>
                                <span className="font-bold text-slate-800">Casual Leave</span>
                                <span className="text-slate-400 block text-[8px]">12-14 Aug 2026</span>
                              </div>
                              <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                                Pending
                              </span>
                            </div>
                            <div className="flex items-center justify-between bg-white px-2 py-1 rounded-lg border border-slate-100 text-[9px]">
                              <div>
                                <span className="font-bold text-slate-800">Sick Leave</span>
                                <span className="text-slate-400 block text-[8px]">3 Aug 2026</span>
                              </div>
                              <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                Approved
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Leave Balance Bars */}
                        <div className="bg-slate-50/60 rounded-xl p-2.5 border border-slate-200/60 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-700">Leave Balance</span>
                            <span className="text-[9px] font-semibold text-blue-600">Details →</span>
                          </div>
                          <div className="space-y-1.5">
                            <div>
                              <div className="flex justify-between text-[8px] font-semibold text-slate-600 mb-0.5">
                                <span>CL (Casual)</span>
                                <span>8 / 12 days</span>
                              </div>
                              <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600 rounded-full w-[66%]" />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-[8px] font-semibold text-slate-600 mb-0.5">
                                <span>SL (Sick)</span>
                                <span>10 / 12 days</span>
                              </div>
                              <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full w-[83%]" />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-[8px] font-semibold text-slate-600 mb-0.5">
                                <span>EL (Earned)</span>
                                <span>14 / 15 days</span>
                              </div>
                              <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-600 rounded-full w-[93%]" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Laptop Base Stand / Hinge */}
                  <div className="w-full h-3 bg-gradient-to-b from-slate-300 via-slate-200 to-slate-400 rounded-b-xl shadow-md border-t border-slate-400/40 relative flex justify-center">
                    <div className="w-16 h-1 bg-slate-500/50 rounded-b-sm" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll to Explore Anchor Indicator */}
          <div className="pt-10 flex flex-col items-center justify-center text-center">
            <a
              href="#features"
              className="group inline-flex flex-col items-center gap-1.5 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <div className="w-[1px] h-8 bg-slate-200 group-hover:bg-slate-400 transition-colors" />
              <span className="text-[10px] font-extrabold uppercase tracking-[0.25em]">
                SCROLL TO EXPLORE
              </span>
              <ArrowDown className="w-3.5 h-3.5 animate-bounce text-slate-400 group-hover:text-slate-700" />
            </a>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. CORE FEATURES SECTION (#features) */}
      {/* ============================================================== */}
      <section id="features" className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Enterprise Features
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Engineered for Modern Teams
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Everything your organization needs to eliminate leave friction, maintain compliance, and delight employees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-7 rounded-2xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:shadow-sm transition-all group">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Instant Leave Requests</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Self-serve requests in seconds with real-time balance validation, automated weekend exclusion, and calendar previews.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-7 rounded-2xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:shadow-sm transition-all group">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">2-Tier Approvals</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Streamlined multi-level approval pipeline with Manager recommendations followed by HR final sign-off.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-7 rounded-2xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:shadow-sm transition-all group">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">SLA Reminders & Escalations</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Automated 48-hour reminders to inactive managers and 72-hour automated escalations to HR leadership.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-7 rounded-2xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:shadow-sm transition-all group">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Paperclip className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Cloud Attachments</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Seamless uploads for medical certificates and supporting leave documents stored securely in Supabase storage.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-7 rounded-2xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:shadow-sm transition-all group">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">1-Click CSV Exports</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Export department leave data, team attendance, and historical audit logs directly into formatted spreadsheets.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-7 rounded-2xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:shadow-sm transition-all group">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Activity & Notes Trail</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Integrated note-taking and comment threads on every request with real-time text searching and filtering.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. WORKFLOW / ROLES SECTION (#about) */}
      {/* ============================================================== */}
      <section id="about" className="py-20 bg-slate-50/60 border-t border-slate-200/70">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Designed for Every Stakeholder
            </h2>
            <p className="text-sm text-slate-500">
              Tailored workspaces engineered specifically for Employees, Managers, and HR Leaders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Employee Card */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-xs space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-600">For Employees</div>
              <h3 className="text-lg font-bold text-slate-950">Self-Serve Leave Portal</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Track personal balances (Casual, Sick, Earned), apply for time off with document attachments, and receive real-time approval email notifications.
              </p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
                >
                  <span>Explore Employee View</span>
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Manager Card */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-xs space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-600">For Managers</div>
              <h3 className="text-lg font-bold text-slate-950">Team Approval Hub</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Review pending team requests with 1-click approvals, detect schedule conflicts, and forward sign-offs seamlessly to HR with full comment trails.
              </p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 group"
                >
                  <span>Explore Manager View</span>
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* HR Card */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-xs space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">For HR Leaders</div>
              <h3 className="text-lg font-bold text-slate-950">Organization Oversight</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Department filters, comprehensive audit logs, manual and automated SLA escalation checks, and instant CSV reports for executive reviews.
              </p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
                >
                  <span>Explore HR Dashboard</span>
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 5. CALL TO ACTION BANNER */}
      {/* ============================================================== */}
      <section className="py-16 sm:py-20 bg-slate-950 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-medium border border-white/10">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Enterprise SLA & Role-Based Security</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
            Simplify Leaves with Team Apex Today.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Provision your employee, manager, or HR account in under 30 seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-3.5 pt-4">
            <Link
              to="/login?mode=register"
              className="bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs sm:text-sm px-7 py-3 rounded-full shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="px-7 py-3 rounded-full border border-white/20 hover:border-white/40 text-xs sm:text-sm font-semibold text-white transition-all text-center"
            >
              Sign In to Workspace
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 6. CLEAN MINIMAL FOOTER */}
      {/* ============================================================== */}
      <footer className="w-full bg-white border-t border-slate-200/80 py-8 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <svg className="w-5 h-5 text-blue-600" viewBox="0 0 36 36" fill="none">
                <path d="M6 30L18 6L30 30" stroke="#1E40AF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 22L24 22" stroke="#3B82F6" strokeWidth="3.5" strokeLinecap="round" />
              </svg>
              <span>Apex</span>
            </div>
            <span className="text-slate-300">|</span>
            <span className="text-slate-400">People. Process. Progress.</span>
          </div>

          <div className="text-center sm:text-right text-slate-400 text-[11px]">
            <span>Powered by ELAP Leave Management Engine • Sprint 3 Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
