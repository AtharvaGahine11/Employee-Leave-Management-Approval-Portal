import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { leaveApi } from '../../api';
import { LeaveRequest, LeaveStatus } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Filter, CalendarPlus, ArrowRight, RefreshCw } from 'lucide-react';

export const MyLeavesPage: React.FC = () => {
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchLeaves = async () => {
    try {
      setIsLoading(true);
      const data = await leaveApi.getLeaves({
        status: statusFilter === 'ALL' ? undefined : (statusFilter as LeaveStatus),
        search: searchQuery.trim() || undefined,
      });
      setLeaves(data);
    } catch (err) {
      console.error('Failed to fetch leave history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLeaves();
  };

  return (
    <Layout
      title="My Leave History"
      subtitle="View, track, and manage all your past and active leave applications"
    >
      <div className="space-y-6">
        {/* Search & Filter Bar */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Request ID or reason..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
            />
          </form>

          <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3 w-full md:w-auto flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
              <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto px-2.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING_MANAGER">Pending Manager</option>
                <option value="PENDING_HR">Pending HR</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED_BY_MANAGER">Rejected (Manager)</option>
                <option value="REJECTED_BY_HR">Rejected (HR)</option>
                <option value="ESCALATED">Escalated</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchLeaves}
                className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <Link
                to="/employee/apply-leave"
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <CalendarPlus className="w-3.5 h-3.5" /> <span>Apply</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Leave Table / Cards */}
        {isLoading ? (
          <TableSkeleton rows={6} />
        ) : leaves.length === 0 ? (
          <EmptyState
            title="No Leave Requests Found"
            description="You don't have any leave requests matching your current search or filter criteria."
            icon="calendar"
            action={{
              label: 'Apply for Leave',
              onClick: () => navigate('/employee/apply-leave'),
            }}
          />
        ) : (
          <div className="space-y-3">
            {/* Mobile Cards (< md) */}
            <div className="md:hidden space-y-3">
              {leaves.map((req) => (
                <div
                  key={req.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-indigo-600 tracking-tight">
                      {req.requestId}
                    </span>
                    <StatusBadge status={req.status} size="sm" />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">{req.leaveType.name}</span>
                    <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md text-3xs">
                      {req.daysCount} {req.daysCount === 1 ? 'Day' : 'Days'}
                    </span>
                  </div>

                  <div className="text-3xs text-slate-500">
                    {new Date(req.startDate).toLocaleDateString()} &ndash; {new Date(req.endDate).toLocaleDateString()}
                  </div>

                  {req.reason && (
                    <p className="text-3xs text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      {req.reason}
                    </p>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex justify-end">
                    <Link
                      to={`/employee/leaves/${req.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      View Details <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (>= md) */}
            <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Request ID</th>
                      <th className="px-6 py-4">Leave Type</th>
                      <th className="px-6 py-4">Start Date</th>
                      <th className="px-6 py-4">End Date</th>
                      <th className="px-6 py-4">Days</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Reason</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {leaves.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-bold text-indigo-600">{req.requestId}</td>
                        <td className="px-6 py-4 font-bold text-slate-900">{req.leaveType.name}</td>
                        <td className="px-6 py-4 text-slate-600">{new Date(req.startDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-slate-600">{new Date(req.endDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 font-bold text-slate-800">{req.daysCount}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={req.status} />
                        </td>
                        <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{req.reason}</td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            to={`/employee/leaves/${req.id}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            View <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
