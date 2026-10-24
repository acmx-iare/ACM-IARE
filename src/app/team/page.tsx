import React from "react";
import { Users, ShieldCheck, Award, FileCode } from "lucide-react";
import { CORE_OFFICE_BEARERS } from "@/data/chapter";
import { TeamMember } from "@/types";
import { MemberCard } from "@/components/team/MemberCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { getCmsPublishedContent, type CmsTeamContent } from "@/lib/cms-store";

export const metadata = {
  title: "Chapter Team & Core Office Bearers",
  description:
    "Meet the five core office bearers guiding the ACM Student Chapter at IARE: Chairperson, Vice Chairperson, Webmaster, Secretary, and Treasurer.",
};

export default function TeamPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-xs text-slate-400">
          Loading chapter team...
        </div>
      }
    >
      <TeamPageContent />
    </React.Suspense>
  );
}

async function TeamPageContent() {
  const cms = await getCmsPublishedContent<CmsTeamContent>("team");
  const membersList: TeamMember[] =
    cms.members && cms.members.length > 0 ? cms.members : CORE_OFFICE_BEARERS;

  const hero = cms.hero || {};

  // For exactly 5 members, arrange top row (3) and bottom row (2 centered) for visual balance
  const isFiveMembers = membersList.length === 5;
  const topRowMembers = isFiveMembers ? membersList.slice(0, 3) : membersList;
  const bottomRowMembers = isFiveMembers ? membersList.slice(3) : [];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header Banner */}
      <section className="bg-white border-b border-slate-200 brand-subtle-bg section-space">
        <div className="site-container">
          <div className="hero-enter max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold bg-teal-50/80 text-[#007a91] border border-[#0097b2]/30">
              <Users className="w-3.5 h-3.5 text-[#0097b2]" />
              {hero.badge || "Executive Council"}
            </div>
            <h1 className="display-heading font-extrabold text-[#14213d]">
              {hero.title || "Core Chapter Office Bearers"}
            </h1>
            <p className="lead-copy text-base">
              {hero.description ||
                "Meet the democratically elected executive council leading the ACM Student Chapter at IARE, driving technical innovation, student mentorship, and competitive programming initiatives."}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Sections */}
      <div className="py-12 site-container w-full flex-1 space-y-16">
        {/* Core Office Bearers Section */}
        <section>
          <SectionHeader
            badge="Leadership"
            title="Executive Office Bearers"
            description="The core five elected student officers stewarding chapter operations, technical infrastructure, academic liaisons, and member advocacy."
          />

          {isFiveMembers ? (
            <div className="space-y-6">
              {/* Row 1: Chairperson, Vice Chairperson, Webmaster */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {topRowMembers.map((member) => (
                  <MemberCard key={member.id} member={member} />
                ))}
              </div>

              {/* Row 2: Secretary, Treasurer (centered) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl lg:max-w-4xl mx-auto">
                {bottomRowMembers.map((member) => (
                  <MemberCard key={member.id} member={member} />
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {membersList.map((member) => (
                <MemberCard key={member.id} member={member} />
              ))}
            </div>
          )}
        </section>

        {/* Annual Election & Nomination Process Notice */}
        <section className="bg-white border border-slate-200 rounded-lg p-8 shadow-xs">
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#007a91]">
              <ShieldCheck className="w-4 h-4 text-[#0097b2]" />
              Council Nomination &amp; Succession Policy
            </div>
            <h2 className="text-xl font-bold text-[#14213d]">
              How Council Members Are Selected
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Elections and technical lead selections occur each academic year during the Spring semester. Candidates must be enrolled IARE students in good standing who have actively contributed to chapter initiatives for at least one semester.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded border border-slate-200 flex items-start gap-2">
                <Award className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Eligibility: Active participation in chapter technical clinics and academic integrity standing.</span>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200 flex items-start gap-2">
                <FileCode className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>Technical office bearers complete peer demonstration and repository contributions.</span>
              </div>
            </div>
            <div className="pt-2">
              <Button href="/contact" variant="outline" size="sm">
                Inquire About Chapter Openings
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
