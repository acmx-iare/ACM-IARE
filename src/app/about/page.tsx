import React from "react";
import Image from "next/image";
import {
  ShieldCheck,
  Award,
  BookOpen,
  Users,
  Compass,
  CheckCircle,
  FileText,
  School,
  ExternalLink,
} from "lucide-react";
import { CHAPTER_INFO, TECHNICAL_SIGS, FREQUENTLY_ASKED_QUESTIONS } from "@/data/chapter";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { getCmsPublishedContent } from "@/lib/cms-store";

export const metadata = {
  title: "About the Chapter",
  description:
    "Learn about the ACM Student Chapter at Institute of Aeronautical Engineering (IARE), our mission, technical SIGs, governance, and institutional relationship.",
};

export default function AboutPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-xs text-slate-400">
          Loading chapter overview...
        </div>
      }
    >
      <AboutPageContent />
    </React.Suspense>
  );
}

async function AboutPageContent() {
  const cms = await getCmsPublishedContent("about");
  const hero = cms.hero || {};
  const mission = cms.mission || CHAPTER_INFO.mission;
  const vision = cms.vision || CHAPTER_INFO.vision;

  return (
    <div className="flex flex-col">
      {/* Header Banner */}
      <section className="section-space border-b border-slate-200 bg-slate-50">
        <div className="site-container">
          <div className="hero-enter max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
              <School className="w-3.5 h-3.5 text-blue-600" />
              Institutional Profile &amp; Charter
            </div>
            <h1 className="display-heading font-extrabold text-[#14213d]">
              {hero.title || "About ACM Student Chapter at IARE"}
            </h1>
            <p className="lead-copy text-base sm:text-lg">
              {hero.tagline ||
                "Established in 2018, the chapter serves as the collegiate center of computing excellence at the Institute of Aeronautical Engineering, bridging foundational theory with software engineering practice."}
            </p>
          </div>
        </div>
      </section>

      {/* Institutional Overview & ACM Relationship */}
      <section className="section-space bg-white border-b border-slate-200">
        <div className="site-container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-5">
              <SectionHeader
                badge="Affiliation &amp; Heritage"
                title="A Community Rooted in Academic Rigor"
              />
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                The <strong className="text-[#14213d]">Institute of Aeronautical Engineering (IARE)</strong>, established in 1994, is a premier autonomous engineering college in Hyderabad, accredited with <strong className="text-blue-700">&apos;A++&apos; Grade by NAAC</strong> and affiliated with Jawaharlal Nehru Technological University Hyderabad (JNTUH).
              </p>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                The ACM Student Chapter was chartered to cultivate a peer-led culture of computer science research and open collaboration among undergraduate and postgraduate students. Operating under the departmental stewardship of Computer Science &amp; Engineering and Information Technology, the chapter upholds the standards established by the global Association for Computing Machinery.
              </p>

              {/* Crucial Institutional Notice Box */}
              <div className="p-5 rounded-md bg-blue-50/70 border border-blue-200 text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2">
                <div className="flex items-center gap-2 font-bold text-blue-900">
                  <ShieldCheck className="w-4 h-4 text-blue-700" />
                  Official Membership Distinction
                </div>
                <p>
                  Participation in the <strong>ACM IARE Student Chapter</strong> is open to all enrolled IARE students. Chapter activities include local workshops, competitive programming squads, and internal research circles. Students may additionally subscribe to <strong>ACM International Membership</strong> (via acm.org) for international voting privileges, access to the complete ACM Digital Library, and global ACM SIG conference discounts.
                </p>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                  <div className="w-12 h-12 bg-white rounded border border-slate-200 p-1 shrink-0">
                    <Image
                      src="/images/acm-iare-logo.jpg"
                      alt="ACM IARE Logo"
                      width={44}
                      height={44}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#14213d]">ACM Student Chapter</h3>
                    <p className="text-xs text-slate-500">Institute of Aeronautical Engineering</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Charter Established:</span>
                    <span className="font-semibold text-slate-800">2018</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Location:</span>
                    <span className="font-semibold text-slate-800">Dundigal, Hyderabad - 500043</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Host Department:</span>
                    <span className="font-semibold text-slate-800">Computer Science &amp; Engineering</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Faculty Sponsor:</span>
                    <span className="font-semibold text-slate-800">Dr. C. Raghavendra</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Global Association:</span>
                    <a
                      href="https://www.acm.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-blue-600 hover:underline inline-flex items-center gap-0.5"
                    >
                      acm.org <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="section-space bg-slate-50 border-b border-slate-200">
        <div className="site-container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="academic-card p-8 bg-white">
              <div className="w-10 h-10 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 mb-4">
                <Compass className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-[#14213d] mb-3">Our Mission</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {mission}
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  Cultivating rigorous algorithmic problem-solving habits
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  Demystifying systems programming and open-source contribution
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  Encouraging undergraduate research paper publication
                </li>
              </ul>
            </div>

            <div className="academic-card p-8 bg-white">
              <div className="w-10 h-10 rounded-md bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 mb-4">
                <Award className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-[#14213d] mb-3">Our Vision</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {vision}
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  Ranked among premier student chapters across ACM India
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  Consistent collegiate representation at regional &amp; world ICPC finals
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  Graduating engineers grounded in computing ethics and technical leadership
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Special Interest Groups (SIGs) Section */}
      <section id="sigs" className="section-space bg-white border-b border-slate-200">
        <div className="site-container">
          <SectionHeader
            badge="Technical Specialization"
            title="Special Interest Groups (SIGs)"
            description="Our technical domain squads meet on alternating Saturdays for intensive labs, paper reviews, and collaborative development."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {TECHNICAL_SIGS.map((sig) => (
              <div key={sig.id} className="academic-card p-6 sm:p-8 space-y-5">
                <div>
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                    {sig.shortName}
                  </span>
                  <h3 className="text-xl font-bold text-[#14213d] mt-2">
                    {sig.name}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mt-2">
                    {sig.description}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Core Technologies &amp; Frameworks
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {sig.technologies.map((t) => (
                      <span
                        key={t}
                        className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Routine Chapter Activities
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-600">
                    {sig.activities.map((act, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></span>
                        {act}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chapter Governance & Bylaws Summary */}
      <section className="section-space bg-slate-50 border-b border-slate-200">
        <div className="site-container">
          <SectionHeader
            badge="Chapter Governance"
            title="Constitution &amp; Operating Bylaws"
            description="Our chapter is governed by an elected student council under the supervisory guidance of the Faculty Sponsor and Head of Department."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white border border-slate-200 rounded-lg space-y-3">
              <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-700">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-[#14213d]">Annual Democratic Elections</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Council officers (Chair, Vice-Chair, Secretary, Treasurer) are elected each academic spring from eligible active members in good standing.
              </p>
            </div>

            <div className="p-6 bg-white border border-slate-200 rounded-lg space-y-3">
              <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-700">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-[#14213d]">Faculty Oversight &amp; Audit</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                All financial disbursements, event logistics, and institutional announcements require prior verification by the designated Faculty Sponsor.
              </p>
            </div>

            <div className="p-6 bg-white border border-slate-200 rounded-lg space-y-3">
              <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-700">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-[#14213d]">ACM Code of Ethics</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every member pledges to adhere to ACM&apos;s ethical canons regarding algorithmic fairness, software privacy, intellectual property, and respectful community conduct.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="section-space bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Clarifications"
            title="Frequently Asked Questions"
            description="Clear answers regarding chapter enrollment, eligibility, and benefits."
            align="center"
          />

          <div className="mt-8 space-y-4">
            {FREQUENTLY_ASKED_QUESTIONS.map((faq, idx) => (
              <div
                key={idx}
                className="p-5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2"
              >
                <h3 className="text-sm sm:text-base font-bold text-[#14213d]">
                  {faq.question}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button href="/contact#join" variant="secondary" size="lg">
              Apply to Join Chapter
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
