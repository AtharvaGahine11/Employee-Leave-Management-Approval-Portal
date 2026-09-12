import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost" | "link";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090d16] disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

    const variants = {
      primary:
        "bg-sky-500 hover:bg-sky-400 text-white font-semibold shadow-[0_0_24px_rgba(56,189,248,0.35)] hover:shadow-[0_0_30px_rgba(56,189,248,0.5)] focus-visible:ring-sky-400 border border-sky-400/30",
      secondary:
        "bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 border border-white/[0.08] backdrop-blur-md hover:border-white/[0.15] focus-visible:ring-slate-400",
      outline:
        "border border-white/[0.12] bg-white/[0.02] text-slate-300 hover:bg-white/[0.06] hover:text-white hover:border-white/[0.2] focus-visible:ring-slate-400 backdrop-blur-md",
      danger:
        "bg-rose-600/90 hover:bg-rose-500 text-white font-semibold shadow-[0_0_24px_rgba(244,63,94,0.35)] hover:shadow-[0_0_30px_rgba(244,63,94,0.5)] focus-visible:ring-rose-400 border border-rose-500/30",
      ghost:
        "text-slate-400 hover:bg-white/[0.06] hover:text-white focus-visible:ring-slate-400",
      link:
        "text-sky-400 underline-offset-4 hover:underline focus-visible:ring-sky-400 p-0 h-auto",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-9 px-4 text-sm gap-2",
      lg: "h-11 px-6 text-base gap-2.5",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
