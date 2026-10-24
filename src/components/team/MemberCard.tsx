"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Mail, UserCheck, Crown } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/ui/SocialIcons";
import { TeamMember } from "@/types";

interface MemberCardProps {
  member: TeamMember;
}

export function MemberCard({ member }: MemberCardProps) {
  const [imgError, setImgError] = useState(false);

  // Clean initials generator (e.g. "K. Sai Charan" -> "SC", "M. Sneha Reddy" -> "SR")
  const cleanName = member.name.replace(/^Dr\.\s*/i, "").trim();
  const nameParts = cleanName.split(/\s+/).filter(Boolean);
  const initials =
    nameParts.length >= 2
      ? (nameParts[nameParts.length - 2][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : cleanName.slice(0, 2).toUpperCase();

  const isChairperson =
    member.role.toLowerCase() === "chairperson" ||
    member.role.toLowerCase() === "chapter chair" ||
    (member.role.toLowerCase().includes("chair") && !member.role.toLowerCase().includes("vice"));

  const hasValidImage = Boolean(
    member.imageUrl &&
    !member.imageUrl.includes("placeholder") &&
    !imgError
  );

  return (
    <div
      className={`academic-card p-6 flex flex-col justify-between h-full rounded-xl transition-all duration-300 ${
        isChairperson
          ? "border-2 border-[#0097b2]/50 bg-gradient-to-b from-teal-50/40 via-white to-white shadow-sm hover:shadow-md hover:border-[#0097b2] ring-1 ring-[#0097b2]/15"
          : "border border-slate-200/90 bg-white shadow-xs hover:shadow-md hover:border-slate-300"
      }`}
    >
      <div>
        {/* Top Header: Avatar & Designation */}
        <div className="flex items-start gap-4">
          <div
            className={`relative w-16 h-16 rounded-full overflow-hidden shrink-0 border-2 flex items-center justify-center shadow-xs ${
              isChairperson ? "border-[#0097b2] ring-2 ring-teal-100" : "border-slate-200 bg-slate-100"
            }`}
          >
            {hasValidImage ? (
              <Image
                src={member.imageUrl}
                alt={member.name}
                fill
                sizes="64px"
                className="object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div
                className={`w-full h-full flex items-center justify-center font-bold tracking-wider ${
                  isChairperson
                    ? "bg-[#0097b2] text-white text-sm"
                    : "bg-[#14213d] text-teal-100 text-xs"
                }`}
                aria-label={`Avatar for ${member.name}`}
              >
                {initials}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {isChairperson ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#0097b2] text-white tracking-wide uppercase">
                  <Crown className="w-2.5 h-2.5" />
                  Chairperson
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  {member.role}
                </span>
              )}

              {member.acmMemberId && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                  <UserCheck className="w-2.5 h-2.5" />
                  ACM Member
                </span>
              )}
            </div>

            <h3 className="mt-1.5 text-base font-bold text-[#14213d] truncate" title={member.name}>
              {member.name}
            </h3>
            <p className="text-xs font-semibold text-[#007a91] truncate" title={member.role}>
              {member.role}
            </p>
          </div>
        </div>

        {/* Academic & Bio Details */}
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-1">
          {member.department && (
            <p className="text-xs text-slate-600 font-medium">
              {member.department}
            </p>
          )}
          {member.academicYear && (
            <p className="text-xs text-slate-400">
              {member.academicYear}
            </p>
          )}
          {member.bio && (
            <p className="mt-2.5 text-xs text-slate-600 leading-relaxed line-clamp-3">
              {member.bio}
            </p>
          )}
        </div>
      </div>

      {/* Social / Contact Links Footer */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-400">
          Core Office Bearer
        </span>
        <div className="flex items-center gap-2 text-slate-500">
          {member.email && member.email.trim() && (
            <a
              href={`mailto:${member.email}`}
              className="p-1 hover:text-[#0097b2] transition-colors"
              aria-label={`Email ${member.name}`}
              title={`Email ${member.email}`}
            >
              <Mail className="w-4 h-4" />
            </a>
          )}
          {member.linkedin && member.linkedin.trim() && (
            <a
              href={member.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:text-[#0097b2] transition-colors"
              aria-label={`${member.name} LinkedIn Profile`}
            >
              <LinkedinIcon className="w-4 h-4" />
            </a>
          )}
          {member.github && member.github.trim() && (
            <a
              href={member.github}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:text-[#14213d] transition-colors"
              aria-label={`${member.name} GitHub Profile`}
            >
              <GithubIcon className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
