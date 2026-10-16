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
import { CHAPTER_EVENTS, CHAPTER_TEAM, TECHNICAL_SIGS, CHAPTER_ACHIEVEMENTS } from "@/data/chapter";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EventCard } from "@/components/events/EventCard";
import { MemberCard } from "@/components/team/MemberCard";

export default function HomePage() {
  const upcomingEvents = CHAPTER_EVENTS.filter((e) => e.status === "upcoming").slice(0, 3);
  const featuredTeam = CHAPTER_TEAM.slice(0, 4);

  return (
    <div className="flex flex-col">
      {/* 1. Academic Hero Section */}
      <section className="relative bg-gradient-to-b from-slate-50 via-white to-slate-50/50 border-b border-slate-200 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200/80">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                Official Chapter ID • Established 2018
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#14213d] tracking-tight leading-[1.15]">
                Advancing Computing as a Science &amp; Profession at{" "}
                <span className="text-blue-600">IARE</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
                The ACM Student Chapter at the Institute of Aeronautical Engineering unites passionate student developers, researchers, and faculty mentors. We foster computer science fundamentals, algorithmic problem solving, open source contributions, and ethical engineering.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Button href="/events" variant="secondary" size="lg">
                  <Calendar className="w-4 h-4" />
                  Explore Events Calendar
                </Button>
                <Button href="/contact#join" variant="outline" size="lg">
                  <Users className="w-4 h-4" />
                  Join Chapter
                </Button>
              </div>

              {/* Verification & Trust Badges */}
              <div className="pt-6 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Autonomous Institution</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>NAAC &apos;A++&apos; Accredited</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Faculty Mentored</span>
                </div>
              </div>
            </div>

            {/* Right Card / Visual Column */}
            <div className="lg:col-span-5">
              <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-md bg-white border border-slate-200 p-1 shrink-0">
                      <Image
                        src="/images/acm-iare-logo.jpg"
                        alt="ACM IARE Logo"
                        width={44}
                        height={44}
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-[#14213d]">IARE Chapter Chapter</h2>
                      <p className="text-xs text-slate-500">Dundigal, Hyderabad</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active 2026
                  </span>
                </div>

                <div className="mt-5 space-y-4">
                  <div className="p-3 bg-slate-50 rounded border border-slate-100 text-xs space-y-1">
                    <span className="font-semibold text-slate-700 block">Next Flagship Assembly:</span>
                    <p className="text-slate-600 font-medium">IARE CodeSprint Hackathon</p>
                    <span className="text-slate-500 block">November 14, 2026 • 08:30 AM IST</span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Department Affiliation:</span>
                      <span className="font-semibold text-slate-800">CSE &amp; IT</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Technical SIGs:</span>
                      <span className="font-semibold text-slate-800">4 Active Cohorts</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Eligibility:</span>
                      <span className="font-semibold text-slate-800">Enrolled IARE Students</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button href="/about" variant="ghost" size="sm" className="w-full text-blue-700 hover:text-blue-900 justify-between">
                      <span>Read Chapter Charter &amp; Bylaws</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. Institutional Introduction & Technical Pillars */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Chapter Mission"
            title="Building Foundational Competence, Not Just Buzzwords"
            description="Our activities bridge theoretical university curricula with rigorous industrial software engineering and academic research standards."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-colors">
              <div className="w-10 h-10 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 mb-4">
                <Code2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#14213d] mb-2">Algorithmic Problem Solving</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Structured competitive programming ladders, ICPC coaching, asymptotic analysis masterclasses, and weekly contest post-mortems.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-colors">
              <div className="w-10 h-10 rounded-md bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 mb-4">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#14213d] mb-2">Systems &amp; Open Source</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Linux kernel internals, Git hygiene, containerization with Docker, and contributing verified code to production open-source repositories.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-colors">
              <div className="w-10 h-10 rounded-md bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 mb-4">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#14213d] mb-2">Research Reading Groups</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Critical dissections of landmark ACM and IEEE publications in deep learning, distributed systems, and computer vision with faculty scholars.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-colors">
              <div className="w-10 h-10 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mb-4">
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
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Academic Calendar"
            title="Featured Upcoming Events"
            description="Participate in hands-on technical workshops, competitive hackathons, and lectures conducted by faculty and industry practitioners."
            actionHref="/events"
            actionText="View All Events"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event, idx) => (
              <EventCard key={event.id} event={event} priority={idx === 0} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. Special Interest Groups (SIGs) */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                BrainCircuit: <BrainCircuit className="w-6 h-6 text-blue-600" />,
                Code2: <Code2 className="w-6 h-6 text-teal-600" />,
                ServerCog: <ServerCog className="w-6 h-6 text-indigo-600" />,
                ShieldCheck: <ShieldCheck className="w-6 h-6 text-emerald-600" />,
              };

              return (
                <div key={sig.id} className="academic-card p-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-md bg-slate-100 border border-slate-200 shrink-0">
                        {iconMap[sig.iconName] || <Code2 className="w-6 h-6 text-slate-700" />}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">
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
                      className="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
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

      {/* 5. Selected Chapter Leadership */}
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Leadership"
            title="Faculty Advisory &amp; Student Executive"
            description="Guided by experienced faculty mentors and driven by elected student office bearers dedicated to technical service."
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
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Verified Records"
            title="Recognitions &amp; Competitive Milestones"
            description="Documented achievements accomplished by collegiate teams and research cohorts representing IARE."
            actionHref="/gallery"
            actionText="Explore Gallery &amp; Archives"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CHAPTER_ACHIEVEMENTS.map((item, idx) => (
              <div key={idx} className="p-6 rounded-lg border border-slate-200 bg-slate-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
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
      <section className="py-16 sm:py-20 bg-[#14213d] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-blue-400 bg-blue-950/70 border border-blue-800 px-3 py-1 rounded-sm">
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
              className="bg-transparent text-white border-slate-600 hover:bg-slate-800"
            >
              Contact Chapter Office
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
