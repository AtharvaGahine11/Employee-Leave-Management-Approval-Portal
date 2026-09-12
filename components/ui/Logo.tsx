"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
  linkHref?: string;
}

export function LogoIcon({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizeMap = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  return (
    <div
      className={cn(
        "relative flex items-center justify-center shrink-0 rounded-2xl group",
        sizeMap[size],
        className
      )}
    >
      {/* Outer Ambient Aura Glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-sky-500/40 via-indigo-500/30 to-purple-500/30 blur-md opacity-70 group-hover:opacity-100 transition-opacity" />

      {/* Glass Backing Shield */}
      <div className="absolute inset-0 rounded-2xl bg-[#0c1222]/90 border border-white/20 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Subtle internal gradient sweep */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/60 pointer-events-none" />
      </div>

      {/* Futuristic Vector SVG Emblem */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 w-3/5 h-3/5 drop-shadow-[0_2px_10px_rgba(56,189,248,0.5)]"
      >
        <defs>
          <linearGradient id="elap-cyan-glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="60%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <linearGradient id="elap-purple-glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <linearGradient id="elap-accent-leaf" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
          <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Backing Geometry: Modern Geometric 'E' & Approval Check Wings */}
        
        {/* Vertical Left Spine of 'E' */}
        <rect
          x="18"
          y="18"
          width="15"
          height="64"
          rx="7.5"
          fill="url(#elap-cyan-glow)"
        />

        {/* Top Horizontal Bar of 'E' */}
        <path
          d="M26 25.5C26 21.3579 29.3579 18 33.5 18H72C76.1421 18 79.5 21.3579 79.5 25.5C79.5 29.6421 76.1421 33 72 33H33.5C29.3579 33 26 29.6421 26 25.5Z"
          fill="url(#elap-cyan-glow)"
        />

        {/* Middle Floating Bar of 'E' with Glass Cyan accent */}
        <path
          d="M26 50C26 45.8579 29.3579 42.5 33.5 42.5H62C66.1421 42.5 69.5 45.8579 69.5 50C69.5 54.1421 66.1421 57.5 62 57.5H33.5C29.3579 57.5 26 54.1421 26 50Z"
          fill="url(#elap-purple-glow)"
        />

        {/* Bottom Swoop forming dynamic 'E' base + Approval Wing / Verified Check */}
        <path
          d="M26 74.5C26 70.3579 29.3579 67 33.5 67H60.2C63.2 67 65.9 68.7 67.2 71.4L73.8 84.6C75.2 87.4 73.1 90.7 70 90.7H33.5C29.3579 90.7 26 87.3421 26 83.2V74.5Z"
          fill="url(#elap-cyan-glow)"
        />

        {/* Ascending Verification Wing (Approval Leaf) */}
        <path
          d="M60 76L82.5 47C85.1 43.7 89.9 43.6 92.6 46.8C95.1 49.7 94.6 54.2 91.5 56.6L68 75.5C65.5 77.5 61.8 77.2 60 76Z"
          fill="url(#elap-accent-leaf)"
          filter="url(#glow-filter)"
        />

        {/* Central Brilliant Node */}
        <circle cx="50" cy="50" r="3.5" fill="#ffffff" />
      </svg>
    </div>
  );
}

export function Logo({
  size = "md",
  showText = true,
  className,
  linkHref = "/dashboard",
}: LogoProps) {
  const content = (
    <div className={cn("inline-flex items-center gap-3 select-none group", className)}>
      <LogoIcon size={size} />

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold tracking-wider text-white text-lg sm:text-xl font-mono leading-none group-hover:text-sky-300 transition-colors">
              EL<span className="bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">AP</span>
            </span>
            <span className="px-1.5 py-0.2 rounded-md bg-sky-500/10 border border-sky-400/20 text-[9px] font-bold text-sky-300 tracking-wide uppercase">
              PRO
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            Leave Portal
          </span>
        </div>
      )}
    </div>
  );

  if (linkHref) {
    return (
      <Link href={linkHref} className="inline-block transition-transform active:scale-95">
        {content}
      </Link>
    );
  }

  return content;
}
