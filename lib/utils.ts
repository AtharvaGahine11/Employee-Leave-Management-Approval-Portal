import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return dateString;
  }
}

export function calculateWorkingDays(startDateStr: string, endDateStr: string): number {
  if (!startDateStr || !endDateStr) return 0;
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0;

  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const dayOfWeek = cur.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

export function getStatusBadgeVariant(status: string): {
  label: string;
  className: string;
  dotColor: string;
} {
  switch (status) {
    case "PENDING_MANAGER":
      return {
        label: "Pending Manager",
        className: "bg-amber-500/10 text-amber-300 border-amber-500/30 backdrop-blur-md shadow-[0_0_12px_rgba(245,158,11,0.15)]",
        dotColor: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]",
      };
    case "PENDING_HR":
      return {
        label: "Pending HR",
        className: "bg-sky-500/10 text-sky-300 border-sky-500/30 backdrop-blur-md shadow-[0_0_12px_rgba(56,189,248,0.15)]",
        dotColor: "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]",
      };
    case "APPROVED":
      return {
        label: "Approved",
        className: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 backdrop-blur-md shadow-[0_0_12px_rgba(16,185,129,0.15)]",
        dotColor: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]",
      };
    case "REJECTED_BY_MANAGER":
      return {
        label: "Rejected by Manager",
        className: "bg-rose-500/10 text-rose-300 border-rose-500/30 backdrop-blur-md shadow-[0_0_12px_rgba(244,63,94,0.15)]",
        dotColor: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]",
      };
    case "REJECTED_BY_HR":
      return {
        label: "Rejected by HR",
        className: "bg-rose-500/10 text-rose-300 border-rose-500/30 backdrop-blur-md shadow-[0_0_12px_rgba(244,63,94,0.15)]",
        dotColor: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]",
      };
    case "CANCELLED":
      return {
        label: "Cancelled",
        className: "bg-slate-800/40 text-slate-400 border-slate-700/50 backdrop-blur-md",
        dotColor: "bg-slate-500",
      };
    default:
      return {
        label: status,
        className: "bg-slate-800/40 text-slate-300 border-slate-700/50 backdrop-blur-md",
        dotColor: "bg-slate-400",
      };
  }
}

export function getLeaveTypeLabel(type: string): { label: string; code: string } {
  switch (type) {
    case "CASUAL_LEAVE":
      return { label: "Casual Leave", code: "CL" };
    case "SICK_LEAVE":
      return { label: "Sick Leave", code: "SL" };
    case "EARNED_LEAVE":
      return { label: "Earned Leave", code: "EL" };
    default:
      return { label: type, code: type };
  }
}
