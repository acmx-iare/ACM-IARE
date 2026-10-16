import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  badge?: string;
  title: string;
  description?: string;
  actionHref?: string;
  actionText?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeader({
  badge,
  title,
  description,
  actionHref,
  actionText,
  align = "left",
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10",
        align === "center" && "md:flex-col items-center text-center",
        className
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {badge && (
          <div className="inline-block text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200/60 px-2.5 py-1 rounded-sm mb-3">
            {badge}
          </div>
        )}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#14213d] tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-base text-slate-600 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actionHref && actionText && (
        <div className="shrink-0">
          <Link
            href={actionHref}
            className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors group"
          >
            {actionText}
            <ArrowRight className="ml-1.5 w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      )}
    </div>
  );
}
