import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { auditApi } from '../../api';
import { AuditLog } from '../../types';
import { AuditTimeline } from '../../components/audit/AuditTimeline';
import { StatusBadge } from '../../components/common/StatusBadge';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../contexts/ToastContext';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Search,
  Filter,
  Download,
  List,
  Clock,
  ArrowRight,
  Eye,
  FileText,
} from 'lucide-react';

export const HrAuditPage: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('table');

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const data = await auditApi.getAuditLogs({
        limit: 200,
        action: actionFilter !== 'ALL' ? actionFilter : undefined,
        search: searchQuery.trim() || undefined,
      });
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const blob = await auditApi.exportAuditCSV({
        action: actionFilter !== 'ALL' ? actionFilter : undefined,
        search: searchQuery.trim() || undefined,
      });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ELAP_Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showSuccess('Audit Logs CSV downloaded successfully!');
    } catch (err) {
      showError('Failed to export audit logs CSV.');
    } finally {
      setIsExporting(false);
    }
  };

  const getActionBadgeClass = (action: string) => {
    switch (action) {
      case 'HR_APPROVED':
      case 'MANAGER_APPROVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'HR_REJECTED':
      case 'MANAGER_REJECTED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'ESCALATED':
        return 'bg-amber-50 text-amber-800 border-amber-300 font-extrabold';
      case 'REMINDER_SENT':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'COMMENT_ADDED':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <Layout
      title="System Audit Trail & History"
      subtitle="Immutable audit log of all leave creations, approvals, rejections, comments, and SLA escalations"
    >
      <div className="space-y-6">
        {/* Controls Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search logs by Actor, Employee ID, or Request ID..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
              />
            </form>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              {/* View Switcher */}
              <div className="flex items-center p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <List className="w-3.5 h-3.5" /> Table
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('timeline')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    viewMode === 'timeline' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" /> Timeline
                </button>
              </div>

              {/* Export CSV Button */}
              <button
                onClick={handleExportCSV}
                disabled={isExporting}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'Exporting...' : 'Export Audit CSV'}
              </button>
            </div>
          </div>

          {/* Action Filter Pills */}
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap">
            <span className="text-3xs font-bold uppercase text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter Action:
            </span>
            {[
              { id: 'ALL', label: 'All Actions' },
              { id: 'HR_APPROVED', label: 'HR Approved' },
              { id: 'MANAGER_APPROVED', label: 'Manager Approved' },
              { id: 'HR_REJECTED', label: 'HR Rejected' },
              { id: 'MANAGER_REJECTED', label: 'Manager Rejected' },
              { id: 'ESCALATED', label: 'SLA Escalated' },
              { id: 'REMINDER_SENT', label: 'SLA Reminder' },
              { id: 'COMMENT_ADDED', label: 'Comment Added' },
              { id: 'ATTACHMENT_UPLOADED', label: 'Attachment' },
              { id: 'LEAVE_SUBMITTED', label: 'Submitted' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActionFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-3xs font-bold transition-colors ${
                  actionFilter === tab.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content View */}
        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : logs.length === 0 ? (
          <EmptyState
            title="No Matching Audit Logs"
            description="There are no system audit logs matching your selected action or search query."
            icon="calendar"
          />
        ) : viewMode === 'timeline' ? (
          <div className="max-w-4xl">
            <AuditTimeline logs={logs} />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Timestamp</th>
                    <th className="px-5 py-3.5">Action</th>
                    <th className="px-5 py-3.5">Actor</th>
                    <th className="px-5 py-3.5">Request ID</th>
                    <th className="px-5 py-3.5">Status Transition</th>
                    <th className="px-5 py-3.5">Details &amp; Metadata</th>
                    <th className="px-5 py-3.5 text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {logs.map((log) => {
                    let parsedMeta: any = null;
                    try {
                      parsedMeta = log.metadata ? JSON.parse(log.metadata) : null;
                    } catch (e) {
                      parsedMeta = log.metadata;
                    }

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap font-mono text-3xs">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full border text-3xs font-extrabold ${getActionBadgeClass(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-900">{log.actor.name}</div>
                          <div className="text-3xs text-slate-500">
                            {log.actorRole} &bull; {log.actor.employeeId}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-bold text-indigo-600">
                          {log.leaveRequest?.requestId ? (
                            <Link
                              to={`/employee/leaves/${log.leaveRequestId}`}
                              className="hover:underline"
                            >
                              {log.leaveRequest.requestId}
                            </Link>
                          ) : (
                            <span className="text-slate-400 font-normal">&mdash;</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {log.previousStatus && log.newStatus ? (
                            <div className="flex items-center gap-1.5">
                              <StatusBadge status={log.previousStatus} size="sm" />
                              <span className="text-slate-400 text-3xs">&rarr;</span>
                              <StatusBadge status={log.newStatus} size="sm" />
                            </div>
                          ) : (
                            <span className="text-slate-400 text-3xs">&mdash;</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 max-w-xs text-3xs text-slate-600 truncate">
                          {parsedMeta ? (
                            typeof parsedMeta === 'object' ? (
                              <span>
                                {parsedMeta.comment ||
                                  parsedMeta.rejectionComment ||
                                  parsedMeta.reason ||
                                  parsedMeta.fileName ||
                                  JSON.stringify(parsedMeta)}
                              </span>
                            ) : (
                              <span>{String(parsedMeta)}</span>
                            )
                          ) : (
                            <span className="text-slate-400">&mdash;</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {log.leaveRequestId && (
                            <Link
                              to={`/employee/leaves/${log.leaveRequestId}`}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg inline-flex"
                              title="View Request"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
