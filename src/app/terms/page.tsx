import React from "react";
import Link from "next/link";
import { Scale, ArrowLeft, BookCheck, ShieldAlert, Award } from "lucide-react";

export const metadata = {
  title: "Terms of Service & Bylaws",
  description: "Terms of participation, code of conduct, and chapter bylaws of ACM IARE Student Chapter.",
};

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-blue-700 transition-colors mb-4 gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200 mb-3">
            <Scale className="w-3.5 h-3.5 text-blue-600" />
            Bylaws &amp; Standards
          </div>
          <h1 className="text-3xl font-extrabold text-[#14213d] tracking-tight">
            Terms of Participation &amp; Code of Conduct
          </h1>
          <p className="text-sm text-slate-600 mt-2">
            Operating under the auspices of ACM (Association for Computing Machinery) and Institute of Aeronautical Engineering
          </p>
        </div>
      </div>

      <div className="py-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        <div className="academic-card p-6 sm:p-10 bg-white space-y-8 text-sm text-slate-700 leading-relaxed">
          
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#14213d] flex items-center gap-2">
              <BookCheck className="w-4 h-4 text-blue-600" />
              1. Acceptance of Terms
            </h2>
            <p>
              By participating in events, hackathons, workshops, or registering as a member of the ACM Student Chapter at the Institute of Aeronautical Engineering (IARE), you agree to comply with these terms, the college rules of conduct, and the international ACM Code of Ethics.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#14213d] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              2. Academic and Technical Integrity
            </h2>
            <p>
              Plagiarism, submission of uncredited external code in chapter hackathons or algorithmic contests, or unauthorized tampering with campus computing facilities, network systems, or laboratory software will result in immediate disqualification and referral to the Head of Department.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#14213d] flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600" />
              3. Community Standards &amp; Inclusivity
            </h2>
            <p>
              The chapter is dedicated to providing a respectful, harassment-free environment for all participants regardless of race, gender, gender identity, sexual orientation, disability, physical appearance, or level of computing experience. Disrespectful behavior in Discord, WhatsApp groups, or on-campus venues will not be tolerated.
            </p>
          </section>

          <section className="space-y-3 pt-4 border-t border-slate-100">
            <h2 className="text-lg font-bold text-[#14213d]">
              4. Chapter Jurisdiction
            </h2>
            <p>
              The chapter operates in accordance with the policies of the Institute of Aeronautical Engineering, Dundigal, Hyderabad. In case of disputes concerning event awards, membership status, or elections, decisions rendered by the Faculty Sponsor and Principal are final and binding.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
