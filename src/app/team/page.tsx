import React from "react";
import { Users, ShieldCheck, Award, FileCode } from "lucide-react";
import { CHAPTER_TEAM } from "@/data/chapter";
import { TeamMember } from "@/types";
import { MemberCard } from "@/components/team/MemberCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { getCmsPublishedContent } from "@/lib/cms-store";

export const metadata = {
  title: "Chapter Team & Executive Council",
  description:
    "Meet the faculty advisors, student office bearers, technical leads, and coordinators guiding the ACM Student Chapter at IARE.",
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
  const cms = await getCmsPublishedContent("team");
  const membersList: TeamMember[] =
    cms.members && cms.members.length > 0 ? cms.members : CHAPTER_TEAM;

  const facultyMembers = membersList.filter((m) => m.category === "Faculty");
  const officeBearers = membersList.filter((m) => m.category === "Office Bearers");
  const technicalLeads = membersList.filter((m) => m.category === "Technical Leads");
  const committeeLeads = membersList.filter((m) => m.category === "Committee Leads");

  const hero = cms.hero || {};

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header Banner */}
      <section className="bg-white border-b border-slate-200 section-space">
        <div className="site-container">
          <div className="hero-enter max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              {hero.badge || "Leadership & Advisory Council"}
            </div>
            <h1 className="display-heading font-extrabold text-[#14213d]">
              {hero.title || "Chapter Team & Office Bearers"}
            </h1>
            <p className="lead-copy text-base">
              {hero.description ||
                "The ACM Student Chapter at IARE is guided by dedicated faculty scholars and operated by democratically elected student officers committed to technical service and academic integrity."}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Sections */}
      <div className="py-12 site-container w-full flex-1 space-y-16">
        
        {/* 1. Faculty Advisors & Institutional Patrons */}
        <section>
          <SectionHeader
            badge="Institutional Advisory"
            title="Faculty Advisory Board"
            description="Senior academicians and research supervisors stewarding chapter charter compliance, institutional resources, and university liaisons."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {facultyMembers.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        </section>

        {/* 2. Executive Office Bearers */}
        <section>
          <SectionHeader
            badge="Student Executive"
            title="Elected Office Bearers"
            description="Student council responsible for organizational roadmap, annual reporting to ACM India, cross-department coordination, and member advocacy."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {officeBearers.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        </section>

        {/* 3. Technical Specialization Leads */}
        <section>
          <SectionHeader
            badge="Technical Leads"
            title="Domain &amp; SIG Coordinators"
            description="Student engineers architecting contest testbeds, leading deep-learning paper dissections, and managing open-source software contributions."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {technicalLeads.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        </section>

        {/* 4. Operations & Logistics Leads */}
        <section>
          <SectionHeader
            badge="Operations"
            title="Logistics, Design &amp; Media Coordinators"
            description="Ensuring flawless audio-visual setups, laboratory scheduling, brand design consistency, and student outreach."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">
            {committeeLeads.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        </section>

        {/* Annual Election & Nomination Process Notice */}
        <section className="bg-white border border-slate-200 rounded-lg p-8">
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
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
                <span>Eligibility: Active participation in at least 3 chapter technical clinics.</span>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200 flex items-start gap-2">
                <FileCode className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>Technical leads complete a code review &amp; peer demonstration process.</span>
              </div>
            </div>
            <div className="pt-2">
              <Button href="/contact" variant="outline" size="sm">
                Inquire About Committee Openings
              </Button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
