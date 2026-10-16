import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Lock, Database, Eye } from "lucide-react";
import { CHAPTER_INFO } from "@/data/chapter";

export const metadata = {
  title: "Privacy Policy",
  description: "Privacy policy and student data governance of the ACM Student Chapter at IARE.",
};

export default function PrivacyPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Institutional Data Governance
          </div>
          <h1 className="text-3xl font-extrabold text-[#14213d] tracking-tight">
            Privacy Policy &amp; Data Protection
          </h1>
          <p className="text-sm text-slate-600 mt-2">
            Last updated: October 2026 • ACM Student Chapter, Institute of Aeronautical Engineering
          </p>
        </div>
      </div>

      <div className="py-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        <div className="academic-card p-6 sm:p-10 bg-white space-y-8 text-sm text-slate-700 leading-relaxed">
          
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#14213d] flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600" />
              1. Purpose of Data Collection
            </h2>
            <p>
              The ACM Student Chapter at the Institute of Aeronautical Engineering collects personal and academic details (including student names, roll numbers, institutional email addresses, and phone numbers) solely for the administration of chapter activities, collegiate hackathons, workshops, and ACM India reporting.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#14213d] flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              2. Data Storage and Security
            </h2>
            <p>
              Information submitted through registration and membership application forms is stored securely and accessed exclusively by authorized student executive council officers and faculty advisors. We maintain strict safeguards against unauthorized access, alteration, or disclosure.
            </p>
            <p>
              We do not sell, rent, lease, or monetize student information to any commercial entity, marketing agency, or external party under any circumstances.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#14213d] flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-600" />
              3. Event Photography and Media
            </h2>
            <p>
              Photographs and video recordings captured during public workshops, hackathons, and speaker colloquiums held on campus may be published in our technical archives and annual chapter newsletters to document academic milestones.
            </p>
          </section>

          <section className="space-y-3 pt-4 border-t border-slate-100">
            <h2 className="text-lg font-bold text-[#14213d]">
              4. Contact for Privacy Matters
            </h2>
            <p>
              If you have inquiries regarding your submitted details or wish to update or withdraw your chapter registration, please email our coordination desk at{" "}
              <a href={`mailto:${CHAPTER_INFO.contactEmail}`} className="text-blue-600 font-semibold hover:underline">
                {CHAPTER_INFO.contactEmail}
              </a>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
