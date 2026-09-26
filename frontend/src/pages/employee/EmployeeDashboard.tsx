import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { LeaveDonutChart } from '../../components/dashboard/LeaveDonutChart';
import { leaveApi } from '../../api';
import { LeaveRequest } from '../../types';
import { Link } from 'react-router-dom';
import { Plus, CheckCircle2, Clock, Calendar, ArrowUpRight, FileText, ChevronRight } from 'lucide-react';
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

  // Compute aggregated totals for Donut Chart
  const totalOpening = balances.reduce((acc, b) => acc + b.openingBalance, 0);
  const totalApproved = balances.reduce((acc, b) => acc + b.approvedDays, 0);
  const totalPending = balances.reduce((acc, b) => acc + b.pendingDays, 0);
  const totalAvailable = balances.reduce((acc, b) => acc + b.availableDays, 0);

  // Filter leaves based on selected tab and time filter
  const filteredLeaves = leaves.filter((l) => {
    // 1. Tab / Status Filter
    if (tabFilter === 'PENDING') {
      const isPending = l.status === 'PENDING_MANAGER' || l.status === 'PENDING_HR' || l.status === 'ESCALATED';
      if (!isPending) return false;
    } else if (tabFilter === 'APPROVED') {
      if (l.status !== 'APPROVED') return false;
    }

    // 2. Time Filter (All Time, Today, This Week, This Month)
    if (timeFilter === 'All Time') {
      return true;
    }

    const leaveDate = new Date(l.createdAt || l.startDate);
    const now = new Date();

    if (timeFilter === 'Today') {
      return leaveDate.toDateString() === now.toDateString();
    }

    if (timeFilter === 'This Week') {
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);
      return leaveDate >= startOfWeek;
    }

    if (timeFilter === 'This Month') {
      return leaveDate.getMonth() === now.getMonth() && leaveDate.getFullYear() === now.getFullYear();
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-7 items-start">
        {/* ==========================================
            LEFT COLUMN: "My Leaves" (Tasks style card from reference)
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
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-700">
              <span className="w-5 h-5 rounded-full bg-slate-950 text-white text-3xs font-bold flex items-center justify-center">
                {filteredLeaves.length}
              </span>
              <span>Recorded Leave Applications</span>
            </div>

            {/* List of Pastel Leave Cards */}
            {isLoading ? (
              <TableSkeleton rows={3} />
            ) : filteredLeaves.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No leave requests found in this category.
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
          {/* Top Section: Donut Chart & Quick Summary (Equal Height with items-stretch) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch">
            {/* Donut Chart */}
            <LeaveDonutChart
              title="Leave Overview"
              totalQuota={totalOpening}
              approvedDays={totalApproved}
              pendingDays={totalPending}
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
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Leave Quota Overview</h3>
              <Link
                to="/employee/balance"
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
              >
                View Detailed Breakdown →
              </Link>
            </div>

            <div className="space-y-4 pt-1">
              {balances.map((b, idx) => {
                const safeOpening = b.openingBalance > 0 ? b.openingBalance : 1;
                const percent = Math.min(100, Math.round(((b.approvedDays + b.pendingDays) / safeOpening) * 100));

                // Vibrant progress colors (purple, coral red, bright cyan)
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
                      <span className="font-semibold text-slate-500 text-3xs">
                        {b.availableDays} Days Remaining ({b.approvedDays} Taken)
                      </span>
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
    </Layout>
  );
};
