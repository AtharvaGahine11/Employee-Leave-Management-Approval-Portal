import React from 'react';
import { AuditLog } from '../../types';
import { ShieldCheck, Activity } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

interface AuditTimelineProps {
  logs: AuditLog[];
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({ logs }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
      <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-100">
        <ShieldCheck className="w-5 h-5 text-indigo-600" />
        <h3 className="text-base font-bold text-slate-900">Immutable Audit Log History</h3>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {logs.map((log) => {
          return (
            <div key={log.id} className="relative flex items-start gap-4 text-xs">
              <div className="absolute -left-[18px] w-4 h-4 rounded-full bg-indigo-600 border-2 border-white shadow-xs z-10"></div>

              <div className="flex-1 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-900">{log.action}</span>
                  <span className="text-3xs text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>
                    Actor: <strong className="text-slate-800">{log.actor.name}</strong> ({log.actorRole})
                  </span>
                </div>

                {log.previousStatus && log.newStatus && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-2 text-3xs">
                    <StatusBadge status={log.previousStatus} size="sm" />
                    <span className="text-slate-400">→</span>
                    <StatusBadge status={log.newStatus} size="sm" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
