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
        "mb-8 flex min-w-0 flex-col justify-between gap-5 sm:mb-10 md:flex-row md:items-end md:gap-8",
        align === "center" && "items-center text-center md:flex-col",
        className
      )}
    >
      <div className={cn("min-w-0 max-w-2xl", align === "center" && "mx-auto")}>
        {badge && (
          <div className="mb-3 inline-flex items-center border-l-2 border-blue-600 bg-blue-50/70 px-2.5 py-1 text-sm font-semibold text-blue-800">
            {badge}
          </div>
        )}
        <h2 className="section-heading font-bold text-[#14213d]">
          {title}
        </h2>
        {description && (
          <p className="lead-copy mt-3 text-sm sm:text-base">
            {description}
          </p>
        )}
      </div>

      {actionHref && actionText && (
        <div className="shrink-0 md:pb-1">
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
