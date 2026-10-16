import React from "react";
import Image from "next/image";
import { Mail, UserCheck } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/ui/SocialIcons";
import { TeamMember } from "@/types";
import { Badge } from "@/components/ui/Badge";

interface MemberCardProps {
  member: TeamMember;
}

export function MemberCard({ member }: MemberCardProps) {
  // Generate initials for avatar fallback
  const initials = member.name
    .replace(/^Dr\.\s*/i, "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isFaculty = member.category === "Faculty";

  return (
    <div className="academic-card p-6 flex flex-col justify-between h-full bg-white">
      <div>
        {/* Header with Avatar and Category Badge */}
        <div className="flex items-start gap-4">
          <div className="relative w-16 h-16 rounded-full overflow-hidden shrink-0 border-2 border-slate-200 bg-slate-100 flex items-center justify-center">
            {member.imageUrl && !member.imageUrl.endsWith(".jpg") ? (
              <Image
                src={member.imageUrl}
                alt={member.name}
                fill
                className="object-cover"
              />
            ) : (
              <div
                className={`w-full h-full flex items-center justify-center text-sm font-bold ${
                  isFaculty
                    ? "bg-[#14213d] text-white"
                    : "bg-blue-600 text-white"
                }`}
                aria-label={`Avatar for ${member.name}`}
              >
                {initials}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant={isFaculty ? "default" : "upcoming"}>
                {member.category}
              </Badge>
              {member.acmMemberId && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                  <UserCheck className="w-2.5 h-2.5" />
                  ACM Member
                </span>
              )}
            </div>

            <h3 className="mt-1 text-base font-bold text-[#14213d] truncate" title={member.name}>
              {member.name}
            </h3>
            <p className="text-xs font-semibold text-blue-700 truncate" title={member.role}>
              {member.role}
            </p>
          </div>
        </div>

        {/* Academic Details */}
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-1">
          <p className="text-xs text-slate-500 font-medium">
            {member.department}
          </p>
          {member.academicYear && (
            <p className="text-xs text-slate-400">
              {member.academicYear}
            </p>
          )}
          <p className="mt-3 text-xs text-slate-600 leading-relaxed line-clamp-3">
            {member.bio}
          </p>
        </div>
      </div>

      {/* Social / Contact Links Footer */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-400">
          Official Roster
        </span>
        <div className="flex items-center gap-2 text-slate-500">
          {member.email && (
            <a
              href={`mailto:${member.email}`}
              className="p-1 hover:text-blue-600 transition-colors"
              aria-label={`Email ${member.name}`}
              title={`Email ${member.email}`}
            >
              <Mail className="w-4 h-4" />
            </a>
          )}
          {member.linkedin && (
            <a
              href={member.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:text-blue-700 transition-colors"
              aria-label={`${member.name} LinkedIn Profile`}
            >
              <LinkedinIcon className="w-4 h-4" />
            </a>
          )}
          {member.github && (
            <a
              href={member.github}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:text-slate-900 transition-colors"
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
