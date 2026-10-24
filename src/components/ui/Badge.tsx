import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "upcoming" | "past" | "teal" | "outline" | "danger";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const variantStyles = {
    default: "bg-slate-100 text-slate-800 border-slate-200",
    upcoming: "bg-teal-50 text-[#007a91] border-teal-200",
    past: "bg-slate-100 text-slate-600 border-slate-200",
    teal: "bg-[#f0fdfa] text-[#007a91] border-[#99f6e4]",
    outline: "bg-transparent text-slate-700 border-slate-300",
    danger: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-wide",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
