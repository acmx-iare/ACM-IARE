import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  Users,
  Code2,
  BrainCircuit,
  ServerCog,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Award,
  Terminal,
} from "lucide-react";
import { CORE_OFFICE_BEARERS, TECHNICAL_SIGS, CHAPTER_ACHIEVEMENTS } from "@/data/chapter";
import { getAllEvents } from "@/lib/events-store";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EventCard } from "@/components/events/EventCard";
import { MemberCard } from "@/components/team/MemberCard";
import { getCmsPublishedContent, type CmsHomeContent } from "@/lib/cms-store";

export default function HomePage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-xs text-slate-400">
          Loading ACM IARE portal...
        </div>
      }
    >
      <HomePageContent />
    </React.Suspense>
  );
}

async function HomePageContent() {
  const cms = await getCmsPublishedContent<CmsHomeContent>("home");
  const allEvents = await getAllEvents(false);
  const upcomingEvents = allEvents.filter((e) => e.status === "upcoming").slice(0, 3);
  const nextFlagshipEvent = upcomingEvents.find((e) => e.featured) || upcomingEvents[0];
  const featuredTeam = CORE_OFFICE_BEARERS.slice(0, 4);

  const hero = cms.hero || {};
  const announcement = cms.announcement || {};

  return (
    <div className="flex flex-col">
      {/* Optional Top Announcement Strip managed via /studio */}
      {announcement.enabled && announcement.text && (
        <div className="bg-[#14213d] text-white border-b border-slate-800 py-2.5 px-4 text-center text-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0097b2] text-white uppercase tracking-wider">
              {announcement.badge || "Announcement"}
            </span>
            <span className="font-medium text-slate-200">{announcement.text}</span>
            {announcement.linkHref && (
              <Link
                href={announcement.linkHref}
                className="font-bold text-[#00b4d8] hover:text-white underline inline-flex items-center gap-0.5 ml-1"
              >
                {announcement.linkText || "Learn More &rarr;"}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 1. Academic Hero Section with Subtle ACM Logo Diamond Geometry */}
      <section className="relative overflow-hidden border-b border-slate-200/90 brand-hero-bg py-[clamp(3.5rem,7vw,6rem)]">
        <div className="site-container">
          <div className="grid min-w-0 grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">

            {/* Left Column: Chapter introduction */}
            <div className="hero-enter min-w-0 space-y-6 lg:col-span-7">
              <div className="inline-flex max-w-full items-center gap-2 rounded-md border border-[#0097b2]/30 bg-teal-50/80 px-3 py-1.5 text-xs font-semibold text-[#007a91]">
                <span className="w-2 h-2 rounded-full bg-[#0097b2]"></span>
                {hero.badge || "Official Student Chapter • Established 2018"}
              </div>

              <h1 className="display-heading font-extrabold text-[#14213d]">
                {hero.titlePrefix || "Advancing Computing as a Science & Profession at"}{" "}
                <span className="text-[#0097b2]">{hero.highlightedWord || "IARE"}</span>
              </h1>

              <p className="lead-copy text-base sm:text-lg">
                {hero.description ||
                  "The ACM Student Chapter at the Institute of Aeronautical Engineering unites passionate student developers, researchers, and faculty mentors. We foster computer science fundamentals, algorithmic problem solving, open source contributions, and ethical engineering."}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Button href={hero.primaryButtonLink || "/events"} variant="secondary" size="lg">
                  <Calendar className="w-4 h-4" />
                  {hero.primaryButtonText || "Explore Events Calendar"}
                </Button>
                <Button href={hero.secondaryButtonLink || "/contact#join"} variant="outline" size="lg">
                  <Users className="w-4 h-4" />
                  {hero.secondaryButtonText || "Join Chapter"}
                </Button>
              </div>

              {/* Verification & Institutional Accreditation Badges */}
              <div className="pt-6 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0097b2] shrink-0" />
                  <span>Autonomous Institution</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0097b2] shrink-0" />
                  <span>NAAC &apos;A++&apos; Accredited</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0097b2] shrink-0" />
                  <span>Faculty Mentored</span>
                </div>
              </div>
            </div>

            {/* Right Column: Refined Chapter Status Card inspired by ACM Logo */}
            <div className="min-w-0 lg:col-span-5">
              <div className="relative overflow-hidden rounded-2xl border border-slate-700/80 bg-[#14213d] p-6 text-white shadow-xl sm:p-7">
                {/* Geometric ambient diamond background motif matching 45-degree ACM logo */}
                <div
                  className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rotate-45 rounded-2xl border border-[#0097b2]/20 bg-[#0097b2]/5 blur-xs"
                  aria-hidden="true"
                />

                <div className="relative flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="h-12 w-12 shrink-0 rounded-lg border border-[#0097b2]/40 bg-white p-1 shadow-xs">
                      <Image
                        src="/images/acm-iare-logo.jpg"
                        alt="ACM IARE Logo"
                        width={44}
                        height={44}
                        className="object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-sm font-bold text-white tracking-wide">ACM IARE</h2>
                      <p className="text-xs text-slate-300">Chapter #152431 • Hyderabad</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Active Chapter
                  </span>
                </div>

                <div className="relative mt-5 space-y-4">
                  {/* Flagship Event Banner */}
                  <div className="rounded-lg border border-white/10 bg-white/[0.05] p-4 text-sm transition-colors hover:bg-white/[0.08]">
                    <span className="mb-1 block text-xs font-semibold text-[#00b4d8]">Next Flagship Event</span>
                    {nextFlagshipEvent ? (
                      <>
                        <Link
                          href={`/events/${nextFlagshipEvent.slug}`}
                          className="font-semibold text-white hover:text-[#00b4d8] transition-colors block truncate"
                          title={nextFlagshipEvent.title}
                        >
                          {nextFlagshipEvent.title}
                        </Link>
                        <span className="mt-1 block text-xs text-slate-300">
                          {formatDate(nextFlagshipEvent.date)}
                          {nextFlagshipEvent.time ? ` · ${nextFlagshipEvent.time}` : ""}
                        </span>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-white">Upcoming Events in Preparation</p>
                        <span className="mt-1 block text-xs text-slate-300">
                          Technical clinics and workshop schedules coming soon
                        </span>
                      </>
                    )}
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-b border-white/10 py-2">
                      <span className="text-slate-300">Department Affiliation</span>
                      <span className="font-semibold text-white">CSE &amp; IT (Autonomous)</span>
                    </div>
                    <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-b border-white/10 py-2">
                      <span className="text-slate-300">Technical SIG Tracks</span>
                      <span className="font-semibold text-white">4 Active Cohorts</span>
                    </div>
                    <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-2">
                      <span className="text-slate-300">Member Eligibility</span>
                      <span className="font-semibold text-white">Enrolled IARE Students</span>
                    </div>
                  </div>

                  <Button
                    href="/about"
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between text-[#00b4d8] hover:bg-white/10 hover:text-white"
                  >
                    <span>Read Chapter Charter &amp; Bylaws</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. Institutional Introduction & Technical Pillars */}
      <section className="section-space bg-white border-b border-slate-200">
        <div className="site-container">
          <SectionHeader
            badge="Chapter Mission"
            title="Building Foundational Competence, Not Just Buzzwords"
            description="Our activities bridge theoretical university curricula with rigorous industrial software engineering and academic research standards."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="academic-card p-6">
              <div className="w-10 h-10 rounded-md bg-teal-50 border border-teal-200 flex items-center justify-center text-[#007a91] mb-4">
                <Code2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#14213d] mb-2">Algorithmic Problem Solving</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Structured competitive programming ladders, ICPC coaching, asymptotic analysis masterclasses, and weekly contest post-mortems.
              </p>
            </div>

            <div className="academic-card p-6">
              <div className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-[#14213d] mb-4">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#14213d] mb-2">Systems &amp; Open Source</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Linux kernel internals, Git hygiene, containerization with Docker, and contributing verified code to production open-source repositories.
              </p>
            </div>

            <div className="academic-card p-6">
              <div className="w-10 h-10 rounded-md bg-teal-50 border border-teal-200 flex items-center justify-center text-[#007a91] mb-4">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#14213d] mb-2">Research Reading Groups</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Critical dissections of landmark ACM and IEEE publications in deep learning, distributed systems, and computer vision with faculty scholars.
              </p>
            </div>

            <div className="academic-card p-6">
              <div className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-[#14213d] mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#14213d] mb-2">Peer Mentorship</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Senior students and distinguished alumni guiding freshman scholars in course planning, interview preparedness, and undergraduate research.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Featured Upcoming Events */}
      <section className="section-space brand-subtle-bg border-b border-slate-200">
        <div className="site-container">
          <SectionHeader
            badge="Academic Calendar"
            title="Featured Upcoming Events"
            description="Participate in hands-on technical workshops, competitive hackathons, and lectures conducted by faculty and industry practitioners."
            actionHref="/events"
            actionText="View All Events"
          />

          {upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event, idx) => (
                <EventCard key={event.id} event={event} priority={idx === 0} />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-lg mx-auto space-y-3 shadow-xs">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Upcoming Events Scheduled</h3>
              <p className="text-xs text-slate-500">
                New technical workshops, hackathons, and lectures are being planned. Check back shortly or browse past events in our archive.
              </p>
              <div className="pt-2">
                <Button href="/events" variant="secondary" size="sm">
                  Browse Events Archive
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. Special Interest Groups (SIGs) */}
      <section className="section-space bg-white border-b border-slate-200">
        <div className="site-container">
          <SectionHeader
            badge="Special Interest Groups"
            title="Specialized Technical Focus Areas"
            description="Join specialized student cohorts that meet weekly to build projects, read papers, and tackle advanced problem sets."
            actionHref="/about#sigs"
            actionText="Explore SIG Details"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TECHNICAL_SIGS.map((sig) => {
              const iconMap: Record<string, React.ReactNode> = {
                BrainCircuit: <BrainCircuit className="w-6 h-6 text-[#0097b2]" />,
                Code2: <Code2 className="w-6 h-6 text-[#007a91]" />,
                ServerCog: <ServerCog className="w-6 h-6 text-[#14213d]" />,
                ShieldCheck: <ShieldCheck className="w-6 h-6 text-emerald-600" />,
              };

              return (
                <div key={sig.id} className="academic-card p-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-md bg-teal-50/60 border border-teal-100 shrink-0">
                        {iconMap[sig.iconName] || <Code2 className="w-6 h-6 text-slate-700" />}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#007a91] uppercase tracking-wider block">
                          {sig.shortName}
                        </span>
                        <h3 className="text-lg font-bold text-[#14213d]">
                          {sig.name}
                        </h3>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed">
                      {sig.description}
                    </p>

                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                        Core Tech Stack &amp; Topics
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {sig.technologies.map((tech) => (
                          <span
                            key={tech}
                            className="text-xs font-medium px-2 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200/80"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <Link
                      href="/about#sigs"
                      className="inline-flex items-center text-xs font-bold text-[#0097b2] hover:text-[#007a91] transition-colors"
                    >
                      View activities &amp; schedule
                      <ArrowRight className="ml-1 w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Selected Chapter Leadership (Featuring Core Office Bearers) */}
      <section className="section-space brand-subtle-bg border-b border-slate-200">
        <div className="site-container">
          <SectionHeader
            badge="Executive Council"
            title="Core Chapter Office Bearers"
            description="Guided by elected student leaders dedicated to technical advancement, academic integrity, and student advocacy."
            actionHref="/team"
            actionText="View Complete Chapter Roster"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredTeam.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      </section>

      {/* 6. Verified Chapter Achievements */}
      <section className="section-space bg-white border-b border-slate-200">
        <div className="site-container">
          <SectionHeader
            badge="Verified Records"
            title="Recognitions &amp; Competitive Milestones"
            description="Documented achievements accomplished by collegiate teams and research cohorts representing IARE."
            actionHref="/gallery"
            actionText="Explore Gallery &amp; Archives"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CHAPTER_ACHIEVEMENTS.map((item, idx) => (
              <div key={idx} className="academic-card p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#007a91] bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
                    {item.year}
                  </span>
                  <Award className="w-4 h-4 text-amber-500" />
                </div>
                <h3 className="text-sm font-bold text-[#14213d] leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Call To Action (Join / Inquire) */}
      <section className="bg-[#14213d] py-[clamp(3.5rem,7vw,6rem)] text-white relative overflow-hidden">
        {/* Subtle geometric motif in background */}
        <div
          className="pointer-events-none absolute -left-16 -bottom-16 h-64 w-64 rotate-45 rounded-3xl border border-[#0097b2]/15 bg-[#0097b2]/5 blur-xs"
          aria-hidden="true"
        />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#00b4d8] bg-white/5 border border-[#0097b2]/30 px-3 py-1 rounded-sm">
            Become Part of ACM IARE
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
            Ready to Accelerate Your Computing Career at IARE?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Whether you want to solve complex algorithmic puzzles, build systems software, read research publications, or contribute to hackathons, the chapter provides the environment and peer mentorship you need.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Button href="/contact#join" variant="secondary" size="lg">
              Submit Membership Application
            </Button>
            <Button
              href="/contact"
              variant="outline"
              size="lg"
              className="bg-transparent text-white border-slate-600 hover:bg-slate-800 hover:text-white"
            >
              Contact Chapter Office
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
