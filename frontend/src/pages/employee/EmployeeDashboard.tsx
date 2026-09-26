import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { LeaveDonutChart } from '../../components/dashboard/LeaveDonutChart';
import { leaveApi } from '../../api';
import { LeaveRequest } from '../../types';
import { Link } from 'react-router-dom';
import {
  Plus,
  CheckCircle2,
  Clock,
  Calendar,
  ArrowUpRight,
  ChevronRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';

export const EmployeeDashboard: React.FC = () => {
  const { user, balances } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [tabFilter, setTabFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL');
  const [timeFilter, setTimeFilter] = useState<string>('This Month');

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        setIsLoading(true);
        const data = await leaveApi.getLeaves();
        setLeaves(data);
      } catch (err) {
        console.error('Failed to fetch leaves:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaves();
  }, []);

  // 1. Time Filter Boundaries & Metadata
  const getTimeFilterMeta = (filter: string) => {
    const now = new Date();
    if (filter === 'Today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      const formatted = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      return { start, end, label: formatted, description: 'Leaves active or applied today' };
    }
    if (filter === 'This Week') {
      const currentDay = now.getDay();
      const distanceToMonday = (currentDay === 0 ? -6 : 1) - currentDay;
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + distanceToMonday, 0, 0, 0, 0);
      const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6, 23, 59, 59, 999);
      const startStr = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const endStr = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      return { start, end, label: `${startStr} – ${endStr}`, description: 'Leaves active or applied this week (Mon-Sun)' };
    }
    if (filter === 'This Month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const monthStr = now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      return { start, end, label: monthStr, description: 'Leaves active or applied this month' };
    }
    // All Time
    return { start: null, end: null, label: 'All Time (Annual)', description: 'All cumulative leave records' };
  };

  const filterMeta = getTimeFilterMeta(timeFilter);

  // Helper to determine if a leave falls within or overlaps with the selected date range
  const isLeaveInTimeRange = (l: LeaveRequest, start: Date | null, end: Date | null) => {
    if (!start || !end) return true;

    const leaveStart = new Date(l.startDate);
    const leaveEnd = new Date(l.endDate);
    const createdDate = new Date(l.createdAt || l.startDate);

    const s = new Date(leaveStart.getFullYear(), leaveStart.getMonth(), leaveStart.getDate());
    const e = new Date(leaveEnd.getFullYear(), leaveEnd.getMonth(), leaveEnd.getDate());
    const pStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const pEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    // Overlap: leave starts on or before period end AND ends on or after period start
    const overlaps = s <= pEnd && e >= pStart;
    // Or created during this window
    const createdInRange = createdDate >= start && createdDate <= end;

    return overlaps || createdInRange;
  };

  // Helper to calculate how many leave days fall within the period
  const calculateDaysInPeriod = (l: LeaveRequest, start: Date | null, end: Date | null): number => {
    if (!start || !end) return l.daysCount;

    const leaveStart = new Date(l.startDate);
    const leaveEnd = new Date(l.endDate);

    const s = new Date(leaveStart.getFullYear(), leaveStart.getMonth(), leaveStart.getDate());
    const e = new Date(leaveEnd.getFullYear(), leaveEnd.getMonth(), leaveEnd.getDate());
    const pStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const pEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    if (e < pStart || s > pEnd) {
      return 0;
    }

    const effStart = s < pStart ? pStart : s;
    const effEnd = e > pEnd ? pEnd : e;

    const diffDays = Math.round((effEnd.getTime() - effStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Math.min(l.daysCount, Math.max(1, diffDays));
  };

  // Annual Totals from Balance Quota
  const totalOpening = balances.reduce((acc, b) => acc + b.openingBalance, 0);
  const annualApproved = balances.reduce((acc, b) => acc + b.approvedDays, 0);
  const annualPending = balances.reduce((acc, b) => acc + b.pendingDays, 0);
  const totalAvailable = balances.reduce((acc, b) => acc + b.availableDays, 0);

  // Period Specific Computations
  const periodLeaves = leaves.filter((l) => isLeaveInTimeRange(l, filterMeta.start, filterMeta.end));
  const periodApprovedLeaves = periodLeaves.filter((l) => l.status === 'APPROVED');
  const periodPendingLeaves = periodLeaves.filter(
    (l) => l.status === 'PENDING_MANAGER' || l.status === 'PENDING_HR' || l.status === 'ESCALATED'
  );

  // Days taken in selected period:
  const periodTakenDays = timeFilter === 'All Time'
    ? annualApproved
    : periodApprovedLeaves.reduce((acc, l) => acc + calculateDaysInPeriod(l, filterMeta.start, filterMeta.end), 0);

  // Pending days in selected period:
  const periodPendingDays = timeFilter === 'All Time'
    ? annualPending
    : periodPendingLeaves.reduce((acc, l) => acc + calculateDaysInPeriod(l, filterMeta.start, filterMeta.end), 0);

  // Filtered leaves for the "My Leave Requests" list
  const filteredLeaves = periodLeaves.filter((l) => {
    if (tabFilter === 'PENDING') {
      return l.status === 'PENDING_MANAGER' || l.status === 'PENDING_HR' || l.status === 'ESCALATED';
    }
    if (tabFilter === 'APPROVED') {
      return l.status === 'APPROVED';
    }
    return true;
  });

  // Pastel theme mapping for leave items
  const getLeaveCardStyle = (code: string) => {
    switch (code) {
      case 'CL':
        return {
          bg: 'bg-[#fff7ed]', // Soft peach/orange
          border: 'border-orange-200/70',
          dot: 'bg-orange-500',
          text: 'text-orange-950',
          badge: 'bg-orange-100 text-orange-800',
        };
      case 'SL':
        return {
          bg: 'bg-[#f0f9ff]', // Fresh sky blue
          border: 'border-sky-200/70',
          dot: 'bg-sky-500',
          text: 'text-sky-950',
          badge: 'bg-sky-100 text-sky-800',
        };
      case 'EL':
        return {
          bg: 'bg-[#faf5ff]', // Soft lavender
          border: 'border-purple-200/70',
          dot: 'bg-purple-500',
          text: 'text-purple-950',
          badge: 'bg-purple-100 text-purple-800',
        };
      default:
        return {
          bg: 'bg-slate-50',
          border: 'border-slate-200',
          dot: 'bg-slate-500',
          text: 'text-slate-900',
          badge: 'bg-slate-100 text-slate-800',
        };
    }
  };

  return (
    <Layout
      title="Leave Dashboard"
      subtitle="Manage and track your leave requests"
      activeFilter={timeFilter}
      onFilterChange={setTimeFilter}
    >
      <div className="space-y-6 sm:space-y-7">
        {/* ==========================================
            DYNAMIC TIME-FILTERED STATS BANNER
            ========================================== */}
        <div className="space-y-3">
          {/* 4 Metrics Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* 1. Leave Taken */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between transition-all hover:shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Leave Taken</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-950">
                    {periodTakenDays}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {periodTakenDays === 1 ? 'Day' : 'Days'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 truncate">
                  {timeFilter}: {filterMeta.label}
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-3xs font-semibold text-slate-500">
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
                  {periodApprovedLeaves.length} Approved {periodApprovedLeaves.length === 1 ? 'Request' : 'Requests'}
                </span>
                <span>Finalized</span>
              </div>
            </div>

            {/* 2. Pending Approval */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between transition-all hover:shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Leaves</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-950">
                    {periodPendingDays}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {periodPendingDays === 1 ? 'Day' : 'Days'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 truncate">
                  Awaiting review ({timeFilter})
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-3xs font-semibold text-slate-500">
                <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md font-bold">
                  {periodPendingLeaves.length} in Queue
                </span>
                <span>Tier 1 & 2</span>
              </div>
            </div>

            {/* 3. Available Annual Balance */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between transition-all hover:shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Remaining Balance</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-indigo-600">
                    {totalAvailable}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    / {totalOpening} Days
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Annual Available Quota
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-3xs font-semibold text-slate-500">
                <span className="text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-md font-bold">
                  {totalOpening > 0 ? Math.round((totalAvailable / totalOpening) * 100) : 0}% Available
                </span>
                <span>Annual Balance</span>
              </div>
            </div>

            {/* 4. Filter Scope Indicator Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-5 rounded-2xl shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-extrabold tracking-widest text-slate-400 uppercase">Active Filter</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-3xs font-bold border border-blue-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  {timeFilter}
                </span>
              </div>
              <div className="mt-3">
                <h4 className="text-base sm:text-lg font-black tracking-tight text-white truncate">
                  {filterMeta.label}
                </h4>
                <p className="text-3xs text-slate-400 mt-1 line-clamp-1">
                  {filterMeta.description}
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-3xs text-slate-400">
                <span>{filteredLeaves.length} Total Records</span>
                <span className="text-blue-300 font-semibold">Live Filtered</span>
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            TWO COLUMN WORKSPACE
            ========================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-7 items-start">
          {/* ==========================================
              LEFT COLUMN: "My Leaves"
              ========================================== */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-7 rounded-[26px] border border-slate-200/80 shadow-xs space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Card Title & Quick Apply '+' Button */}
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-bold text-slate-950 tracking-tight">My Leave Requests</h3>
                <Link
                  to="/employee/apply-leave"
                  className="w-8 h-8 rounded-full border border-slate-200/80 flex items-center justify-center text-slate-700 hover:text-white hover:bg-slate-950 hover:border-slate-950 transition-all shadow-2xs"
                  title="Apply For Leave"
                >
                  <Plus className="w-4 h-4" />
                </Link>
              </div>

              {/* Filter Pills: All, Pending, Approved */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100/70 rounded-full text-xs w-fit">
                {(['ALL', 'PENDING', 'APPROVED'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setTabFilter(filter)}
                    className={`px-3.5 py-1.5 rounded-full font-semibold transition-all ${
                      tabFilter === filter
                        ? 'bg-slate-950 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
                    }`}
                  >
                    {filter.charAt(0) + filter.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              {/* Counter Tag */}
              <div className="flex items-center justify-between px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-950 text-white text-3xs font-bold flex items-center justify-center">
                    {filteredLeaves.length}
                  </span>
                  <span>Applications in {timeFilter}</span>
                </div>
                <span className="text-3xs text-slate-400 font-medium">
                  {filterMeta.label}
                </span>
              </div>

              {/* List of Pastel Leave Cards */}
              {isLoading ? (
                <TableSkeleton rows={3} />
              ) : filteredLeaves.length === 0 ? (
                <div className="py-12 px-4 text-center rounded-2xl bg-slate-50/70 border border-dashed border-slate-200">
                  <p className="text-xs font-bold text-slate-700">No leave requests found for {timeFilter}</p>
                  <p className="text-3xs text-slate-400 mt-1 max-w-xs mx-auto">
                    There are no recorded leave applications in this specific timeframe. Try selecting a broader filter.
                  </p>
                  <button
                    type="button"
                    onClick={() => setTimeFilter('All Time')}
                    className="mt-3 px-3.5 py-1 bg-white border border-slate-200 rounded-full text-3xs font-bold text-slate-700 hover:text-slate-950 shadow-2xs hover:border-slate-300 transition-all"
                  >
                    View All Time History
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredLeaves.slice(0, 5).map((l) => {
                    const style = getLeaveCardStyle(l.leaveType.code);
                    const isApproved = l.status === 'APPROVED';

                    return (
                      <Link
                        key={l.id}
                        to={`/employee/leaves/${l.id}`}
                        className={`block p-4 rounded-2xl border ${style.bg} ${style.border} hover:shadow-xs transition-all group`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <span className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${style.dot}`} />
                            <div className="min-w-0">
                              <h4 className={`text-xs sm:text-sm font-bold truncate ${style.text}`}>
                                {l.leaveType.name}
                              </h4>
                              <p className="text-3xs text-slate-500 mt-0.5 line-clamp-1 leading-relaxed">
                                {l.reason || 'No description provided'}
                              </p>
                            </div>
                          </div>

                          {/* Right Status Badge */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="text-3xs font-bold px-2 py-0.5 rounded-full bg-white/90 border border-slate-200/70 text-slate-700">
                              {l.daysCount} {l.daysCount === 1 ? 'day' : 'days'}
                            </span>
                            {isApproved ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Clock className="w-4 h-4 text-amber-600" />
                            )}
                          </div>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-black/5 flex items-center justify-between text-4xs text-slate-500">
                          <span>
                            {new Date(l.startDate).toLocaleDateString()} — {new Date(l.endDate).toLocaleDateString()}
                          </span>
                          <span className="font-semibold text-slate-700 capitalize">
                            {l.status.replace(/_/g, ' ').toLowerCase()}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* View All Leaves Footer Link */}
            <Link
              to="/employee/leaves"
              className="mt-4 w-full py-2.5 rounded-xl text-center text-xs font-bold text-slate-700 hover:text-slate-950 bg-slate-50 hover:bg-slate-100 flex items-center justify-center gap-1.5 transition-colors border border-slate-100"
            >
              <span>View All History</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* ==========================================
              RIGHT COLUMN: Overview & Summary Cards
              ========================================== */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-7">
            {/* Top Section: Donut Chart & Quick Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch">
              {/* Dynamic Donut Chart */}
              <LeaveDonutChart
                title={`Leave Overview — ${timeFilter}`}
                totalQuota={
                  timeFilter === 'All Time'
                    ? totalOpening
                    : Math.max(totalOpening, periodTakenDays + periodPendingDays + totalAvailable)
                }
                approvedDays={periodTakenDays}
                pendingDays={periodPendingDays}
                availableDays={totalAvailable}
              />

              {/* Quick Apply & Entitlement Summary Card */}
              <div className="bg-white p-6 sm:p-7 rounded-[26px] border border-slate-200/80 shadow-xs flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">Need Time Off?</h3>
                    <div className="w-8 h-8 rounded-full border border-slate-200/80 flex items-center justify-center text-slate-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-4">
                    Planning a vacation, sick recovery, or personal day? Submit your leave request in seconds with automated notifications.
                  </p>

                  <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs">
                    <div className="font-bold text-indigo-900">Total Remaining Balance</div>
                    <div className="text-2xl sm:text-3xl font-black text-indigo-600 mt-1">
                      {totalAvailable}{' '}
                      <span className="text-xs font-semibold text-slate-500">/ {totalOpening} Days</span>
                    </div>
                  </div>
                </div>

                <Link
                  to="/employee/apply-leave"
                  className="mt-6 w-full py-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all hover:translate-y-[-1px]"
                >
                  <span>Apply For Leave</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Bottom Section: Quota Breakdown */}
            <div className="bg-white p-6 sm:p-7 rounded-[26px] border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">Leave Quota Breakdown</h3>
                  <p className="text-3xs text-slate-400 mt-0.5">
                    Showing usage in <span className="font-semibold text-slate-700">{timeFilter}</span> versus annual entitlement
                  </p>
                </div>
                <Link
                  to="/employee/balance"
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
                >
                  Full Breakdown →
                </Link>
              </div>

              <div className="space-y-4 pt-1">
                {balances.map((b, idx) => {
                  const safeOpening = b.openingBalance > 0 ? b.openingBalance : 1;
                  // Calculate days taken in this specific period for this leave type
                  const typePeriodTaken = timeFilter === 'All Time'
                    ? b.approvedDays
                    : periodApprovedLeaves
                        .filter((l) => l.leaveType.code === b.code)
                        .reduce((acc, l) => acc + calculateDaysInPeriod(l, filterMeta.start, filterMeta.end), 0);

                  const percent = Math.min(100, Math.round(((b.approvedDays + b.pendingDays) / safeOpening) * 100));

                  const barColors = [
                    'bg-gradient-to-r from-violet-600 to-indigo-600',
                    'bg-gradient-to-r from-amber-500 to-rose-500',
                    'bg-gradient-to-r from-sky-400 to-blue-600',
                  ];
                  const activeColor = barColors[idx % barColors.length];

                  return (
                    <div key={b.id} className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900">
                          {b.name} ({b.code})
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-3xs">
                            {typePeriodTaken}d taken in {timeFilter}
                          </span>
                          <span className="font-semibold text-slate-500 text-3xs">
                            {b.availableDays} / {b.openingBalance} Days Left
                          </span>
                        </div>
                      </div>

                      {/* Progress Track */}
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${activeColor}`}
                          style={{ width: `${Math.max(4, percent)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
