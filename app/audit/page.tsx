"use client";

import React, { useState, useEffect } from "react";
import {
  FileClock,
  ShieldCheck,
  Search,
  Filter,
  ArrowRight,
  User,
  Calendar,
  Layers,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth/AuthContext";
import { dataStore } from "@/lib/data/store";
import { formatDateTime, getStatusBadgeVariant } from "@/lib/utils";
import { AuditLog, AuditAction } from "@/types";

export default function AuditTrailPage() {
  const { role } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");

  const loadData = () => {
    setLogs(dataStore.getAuditLogs());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("elap_data_updated", loadData);
    return () => window.removeEventListener("elap_data_updated", loadData);
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== "ALL" && log.action !== actionFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchActor = log.actorName.toLowerCase().includes(q);
      const matchReq = log.requestDisplayId.toLowerCase().includes(q);
      const matchRemarks = log.remarks?.toLowerCase().includes(q);
      if (!matchActor && !matchReq && !matchRemarks) return false;
    }
    return true;
  });

  const getActionBadge = (action: AuditAction) => {
    switch (action) {
      case "LEAVE_SUBMITTED":
        return <Badge variant="info">Application Submitted</Badge>;
      case "MANAGER_APPROVED":
        return <Badge variant="warning">Manager Endorsed</Badge>;
      case "MANAGER_REJECTED":
        return <Badge variant="danger">Manager Rejected</Badge>;
      case "HR_APPROVED":
        return <Badge variant="success">HR Final Approved</Badge>;
      case "HR_REJECTED":
        return <Badge variant="danger">HR Rejected</Badge>;
      case "LEAVE_CANCELLED":
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge>{action}</Badge>;
    }
  };

  return (
    <AppShell
      title="Compliance & Audit Trail"
      subtitle="Complete chronological audit log of all leave lifecycle events and state transitions"
    >
      <div className="space-y-6">
        {/* Compliance Header Card */}
        <div className="p-5 rounded-3xl border border-sky-500/20 bg-gradient-to-r from-sky-500/10 via-[#0e1424]/80 to-[#121826]/70 backdrop-blur-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_0_30px_rgba(56,189,248,0.1)]">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-400/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Immutable Event Logging Active</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                All status modifications, actor identities, and timestamps are recorded for HR compliance.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-sky-300 bg-sky-500/10 px-3 py-1.5 rounded-full border border-sky-500/20">
            {logs.length} Recorded Events
          </span>
        </div>

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
                  placeholder="Search actor, request ID, or remarks..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-full glass-input text-white placeholder:text-slate-500"
                />
              </div>

              <div className="flex items-center gap-2.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="px-3.5 py-1.5 text-xs rounded-full glass-input text-slate-300"
                >
                  <option value="ALL" className="bg-[#0e1424]">All Actions</option>
                  <option value="LEAVE_SUBMITTED" className="bg-[#0e1424]">Leave Submitted</option>
                  <option value="MANAGER_APPROVED" className="bg-[#0e1424]">Manager Approved</option>
                  <option value="MANAGER_REJECTED" className="bg-[#0e1424]">Manager Rejected</option>
                  <option value="HR_APPROVED" className="bg-[#0e1424]">HR Approved</option>
                  <option value="HR_REJECTED" className="bg-[#0e1424]">HR Rejected</option>
                  <option value="LEAVE_CANCELLED" className="bg-[#0e1424]">Leave Cancelled</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Trail Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileClock className="w-4 h-4 text-sky-400" /> System Audit Records
            </CardTitle>
            <CardDescription>
              Showing {filteredLogs.length} historical state changes
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No audit events match your filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/[0.02] text-xs text-slate-400 font-semibold uppercase tracking-wider border-b border-white/[0.06]">
                    <tr>
                      <th className="px-6 py-3.5">Timestamp</th>
                      <th className="px-6 py-3.5">Request ID</th>
                      <th className="px-6 py-3.5">Actor / Performer</th>
                      <th className="px-6 py-3.5">Action</th>
                      <th className="px-6 py-3.5">State Transition</th>
                      <th className="px-6 py-3.5">Remarks / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredLogs.map((log) => {
                      const prevMeta = log.previousStatus
                        ? getStatusBadgeVariant(log.previousStatus)
                        : null;
                      const newMeta = getStatusBadgeVariant(log.newStatus);

                      return (
                        <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 text-xs font-mono text-slate-400 whitespace-nowrap">
                            {formatDateTime(log.timestamp)}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs font-semibold text-sky-400">
                            {log.requestDisplayId}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-white block">{log.actorName}</span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                              {log.actorRole}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {getActionBadge(log.action)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-xs">
                              {prevMeta ? (
                                <>
                                  <span className="text-slate-400">{prevMeta.label}</span>
                                  <ArrowRight className="w-3 h-3 text-slate-500" />
                                </>
                              ) : (
                                <>
                                  <span className="text-slate-500">New</span>
                                  <ArrowRight className="w-3 h-3 text-slate-500" />
                                </>
                              )}
                              <span className="font-semibold text-white">{newMeta.label}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-300 max-w-sm">
                            {log.remarks || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
