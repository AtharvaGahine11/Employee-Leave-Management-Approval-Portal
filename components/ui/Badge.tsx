import * as React from "react";
import { cn, getStatusBadgeVariant } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "danger" | "info";
  status?: string;
}

export function Badge({ className, variant = "default", status, children, ...props }: BadgeProps) {
  if (status) {
    const statusMeta = getStatusBadgeVariant(status);
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
          statusMeta.className,
          className
        )}
        {...props}
      >
        <span className={cn("w-1.5 h-1.5 rounded-full", statusMeta.dotColor)} />
        {children || statusMeta.label}
      </span>
    );
  }

  const variants = {
    default: "bg-white/10 text-white border-white/20 backdrop-blur-md",
    secondary: "bg-white/[0.04] text-slate-300 border-white/[0.08] backdrop-blur-md",
    outline: "text-slate-300 border-white/[0.15] bg-transparent backdrop-blur-md",
    success: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 backdrop-blur-md shadow-[0_0_12px_rgba(16,185,129,0.15)]",
    warning: "bg-amber-500/10 text-amber-300 border-amber-500/30 backdrop-blur-md shadow-[0_0_12px_rgba(245,158,11,0.15)]",
    danger: "bg-rose-500/10 text-rose-300 border-rose-500/30 backdrop-blur-md shadow-[0_0_12px_rgba(244,63,94,0.15)]",
    info: "bg-sky-500/10 text-sky-300 border-sky-500/30 backdrop-blur-md shadow-[0_0_12px_rgba(56,189,248,0.15)]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
