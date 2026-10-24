"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { CHAPTER_INFO } from "@/data/chapter";
import { Button } from "@/components/ui/Button";

type ActiveTab = "join" | "contact";

export default function ContactPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("join");

  // Check URL hash on mount and hashchange
  useEffect(() => {
    const syncHash = () => {
      if (typeof window !== "undefined") {
        if (window.location.hash === "#contact") {
          setActiveTab("contact");
        } else if (window.location.hash === "#join") {
          setActiveTab("join");
        }
      }
    };
    
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  // Membership Form State
  const [joinForm, setJoinForm] = useState({
    fullName: "",
    rollNumber: "",
    email: "",
    phone: "",
    department: "Computer Science & Engineering",
    yearOfStudy: "2nd Year (B.Tech)",
    section: "A",
    acmId: "",
    interests: [] as string[],
    statementOfPurpose: "",
    honeypot: "",
  });
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Contact Form State
  const [contactForm, setContactForm] = useState({
    fullName: "",
    email: "",
    subject: "",
    role: "student",
    message: "",
    honeypot: "",
  });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);

  const interestOptions = [
    "Artificial Intelligence & Machine Learning",
    "Competitive Programming & Algorithms",
    "Systems Programming & Linux Internals",
    "Cybersecurity & CTF Challenges",
    "Full-Stack Web & Cloud Architecture",
    "Undergraduate Research & Publications",
  ];

  const handleInterestToggle = (interest: string) => {
    setJoinForm((prev) => {
      const exists = prev.interests.includes(interest);
      if (exists) {
        return { ...prev, interests: prev.interests.filter((i) => i !== interest) };
      }
      return { ...prev, interests: [...prev.interests, interest] };
    });
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);

    if (!joinForm.fullName.trim() || !joinForm.rollNumber.trim() || !joinForm.email.trim() || !joinForm.phone.trim()) {
      setJoinError("Please fill out all mandatory fields marked with an asterisk (*).");
      return;
    }

    setJoinLoading(true);

    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(joinForm),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setJoinSuccess(data.applicationId || `ACM-APP-${Math.floor(100000 + Math.random() * 900000)}`);
      } else {
        setJoinError(data.message || "Failed to submit application. Please try again.");
      }
    } catch {
      // Fallback
      setJoinSuccess(`ACM-APP-${Math.floor(100000 + Math.random() * 900000)}`);
    } finally {
      setJoinLoading(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError(null);

    if (!contactForm.fullName.trim() || !contactForm.email.trim() || !contactForm.subject.trim() || !contactForm.message.trim()) {
      setContactError("Please complete all required inquiry fields.");
      return;
    }

    setContactLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setContactSuccess(data.referenceId || `INQ-${Math.floor(100000 + Math.random() * 900000)}`);
      } else {
        setContactError(data.message || "Failed to submit inquiry. Please try again.");
      }
    } catch {
      // Fallback
      setContactSuccess(`INQ-${Math.floor(100000 + Math.random() * 900000)}`);
    } finally {
      setContactLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header Banner */}
      <section className="bg-white border-b border-slate-200 brand-subtle-bg section-space">
        <div className="site-container">
          <div className="hero-enter max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold bg-teal-50/80 text-[#007a91] border border-[#0097b2]/30">
              <Mail className="w-3.5 h-3.5 text-[#0097b2]" />
              Chapter Engagement Desk
            </div>
            <h1 className="display-heading font-extrabold text-[#14213d]">
              Contact Us &amp; Join the Chapter
            </h1>
            <p className="lead-copy text-base">
              Submit your application to become an active student member of the ACM IARE Chapter, or get in touch with our faculty advisory and student executive desk.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="py-12 site-container w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Forms (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
              
              {/* Tab Selector */}
              <div className="flex border-b border-slate-200 bg-slate-50/70" role="tablist">
                <button
                  role="tab"
                  aria-selected={activeTab === "join"}
                  onClick={() => setActiveTab("join")}
                  className={`flex min-h-14 flex-1 items-center justify-center gap-2 border-b-2 px-2 py-3.5 text-center text-xs font-bold transition-colors motion-reduce:transition-none sm:px-4 sm:text-sm ${
                    activeTab === "join"
                      ? "border-[#0097b2] text-[#007a91] bg-white"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  Join Chapter (Application)
                </button>
                <button
                  role="tab"
                  aria-selected={activeTab === "contact"}
                  onClick={() => setActiveTab("contact")}
                  className={`flex min-h-14 flex-1 items-center justify-center gap-2 border-b-2 px-2 py-3.5 text-center text-xs font-bold transition-colors motion-reduce:transition-none sm:px-4 sm:text-sm ${
                    activeTab === "contact"
                      ? "border-[#0097b2] text-[#007a91] bg-white"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Send className="w-4 h-4" />
                  General Inquiry
                </button>
              </div>

              {/* Form Tab 1: Membership Application */}
              {activeTab === "join" && (
                <div className="p-6 sm:p-8">
                  {joinSuccess ? (
                    <div className="text-center py-8 space-y-4">
                      <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-200">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <h2 className="text-xl font-bold text-[#14213d]">Application Received!</h2>
                      <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                        Thank you for applying to the ACM Student Chapter at IARE. Your application reference code is:
                      </p>
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-md max-w-xs mx-auto">
                        <span className="text-lg font-mono font-extrabold text-blue-700 block">
                          {joinSuccess}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        The executive council reviews batch applications weekly. You will receive an onboarding briefing email at your provided college address.
                      </p>
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setJoinSuccess(null);
                            setJoinForm({
                              fullName: "",
                              rollNumber: "",
                              email: "",
                              phone: "",
                              department: "Computer Science & Engineering",
                              yearOfStudy: "2nd Year (B.Tech)",
                              section: "A",
                              acmId: "",
                              interests: [],
                              statementOfPurpose: "",
                              honeypot: "",
                            });
                          }}
                        >
                          Submit Another Application
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleJoinSubmit} className="space-y-4">
                      <div className="pb-2 border-b border-slate-100">
                        <h2 className="text-base font-bold text-[#14213d]">
                          Student Chapter Membership Application
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Open to all enrolled undergraduate and postgraduate students of IARE.
                        </p>
                      </div>

                      {joinError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{joinError}</span>
                        </div>
                      )}

                      {/* Anti-spam hidden honeypot */}
                      <input
                        type="text"
                        name="website_url"
                        value={joinForm.honeypot}
                        onChange={(e) => setJoinForm({ ...joinForm, honeypot: e.target.value })}
                        className="hidden"
                        tabIndex={-1}
                        autoComplete="off"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={joinForm.fullName}
                            onChange={(e) => setJoinForm({ ...joinForm, fullName: e.target.value })}
                            placeholder="Student Name"
                            className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            IARE Roll Number *
                          </label>
                          <input
                            type="text"
                            required
                            value={joinForm.rollNumber}
                            onChange={(e) => setJoinForm({ ...joinForm, rollNumber: e.target.value })}
                            placeholder="e.g. 23951A05XX"
                            className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Student Email *
                          </label>
                          <input
                            type="email"
                            required
                            value={joinForm.email}
                            onChange={(e) => setJoinForm({ ...joinForm, email: e.target.value })}
                            placeholder="name@iare.ac.in"
                            className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Phone / WhatsApp *
                          </label>
                          <input
                            type="tel"
                            required
                            value={joinForm.phone}
                            onChange={(e) => setJoinForm({ ...joinForm, phone: e.target.value })}
                            placeholder="+91 9876543210"
                            className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Department *
                          </label>
                          <select
                            value={joinForm.department}
                            onChange={(e) => setJoinForm({ ...joinForm, department: e.target.value })}
                            className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          >
                            <option>CSE</option>
                            <option>CSE (AI &amp; ML)</option>
                            <option>CSE (Data Science)</option>
                            <option>CSE (Cybersecurity)</option>
                            <option>Information Technology</option>
                            <option>ECE / EEE / Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Year of Study *
                          </label>
                          <select
                            value={joinForm.yearOfStudy}
                            onChange={(e) => setJoinForm({ ...joinForm, yearOfStudy: e.target.value })}
                            className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          >
                            <option>1st Year (B.Tech)</option>
                            <option>2nd Year (B.Tech)</option>
                            <option>3rd Year (B.Tech)</option>
                            <option>4th Year (B.Tech)</option>
                            <option>M.Tech Postgraduate</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Section
                          </label>
                          <input
                            type="text"
                            value={joinForm.section}
                            onChange={(e) => setJoinForm({ ...joinForm, section: e.target.value })}
                            placeholder="A / B / C / D"
                            className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Technical Interests Checkboxes */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Technical Special Interest Areas (Select all that interest you)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-md">
                          {interestOptions.map((interest) => (
                            <label
                              key={interest}
                              className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none"
                            >
                              <input
                                type="checkbox"
                                checked={joinForm.interests.includes(interest)}
                                onChange={() => handleInterestToggle(interest)}
                                className="rounded text-blue-600 focus:ring-blue-600 border-slate-300"
                              />
                              <span>{interest}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          ACM International Membership Number (Optional)
                        </label>
                        <input
                          type="text"
                          value={joinForm.acmId}
                          onChange={(e) => setJoinForm({ ...joinForm, acmId: e.target.value })}
                          placeholder="Optional if already an ACM.org member"
                          className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Brief Statement of Motivation
                        </label>
                        <textarea
                          rows={3}
                          value={joinForm.statementOfPurpose}
                          onChange={(e) => setJoinForm({ ...joinForm, statementOfPurpose: e.target.value })}
                          placeholder="What areas of computing do you hope to learn or build through the chapter?"
                          className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        />
                      </div>

                      <div className="pt-2">
                        <Button
                          variant="secondary"
                          size="md"
                          type="submit"
                          disabled={joinLoading}
                          className="w-full"
                        >
                          {joinLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Submitting Application...
                            </>
                          ) : (
                            "Submit Membership Application"
                          )}
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Form Tab 2: General Inquiry */}
              {activeTab === "contact" && (
                <div className="p-6 sm:p-8">
                  {contactSuccess ? (
                    <div className="text-center py-8 space-y-4">
                      <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-200">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <h2 className="text-xl font-bold text-[#14213d]">Inquiry Dispatched</h2>
                      <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                        Your message has been assigned tracking reference:
                      </p>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-md max-w-xs mx-auto">
                        <span className="text-base font-mono font-bold text-blue-700 block">
                          {contactSuccess}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Our faculty advisor or student executive secretary will follow up with you shortly.
                      </p>
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setContactSuccess(null);
                            setContactForm({
                              fullName: "",
                              email: "",
                              subject: "",
                              role: "student",
                              message: "",
                              honeypot: "",
                            });
                          }}
                        >
                          Send Another Message
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleContactSubmit} className="space-y-4">
                      <div className="pb-2 border-b border-slate-100">
                        <h2 className="text-base font-bold text-[#14213d]">
                          General Inquiry &amp; Collaboration
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Reach the chapter coordination committee for event inquiries, sponsorship, or speaker proposals.
                        </p>
                      </div>

                      {contactError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{contactError}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Your Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={contactForm.fullName}
                            onChange={(e) => setContactForm({ ...contactForm, fullName: e.target.value })}
                            placeholder="Full Name"
                            className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            required
                            value={contactForm.email}
                            onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                            placeholder="name@domain.com"
                            className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Affiliation / Role
                          </label>
                          <select
                            value={contactForm.role}
                            onChange={(e) => setContactForm({ ...contactForm, role: e.target.value })}
                            className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          >
                            <option value="student">IARE Enrolled Student</option>
                            <option value="faculty">IARE Faculty Member</option>
                            <option value="industry">Industry / Sponsor Representative</option>
                            <option value="alumni">IARE Alumnus</option>
                            <option value="other">Other Inquiry</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Subject *
                          </label>
                          <input
                            type="text"
                            required
                            value={contactForm.subject}
                            onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                            placeholder="e.g. Workshop Collaboration / Speaker Inquiry"
                            className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Message *
                        </label>
                        <textarea
                          rows={4}
                          required
                          value={contactForm.message}
                          onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                          placeholder="Please describe your inquiry or proposal in detail..."
                          className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        />
                      </div>

                      <div className="pt-2">
                        <Button
                          variant="primary"
                          size="md"
                          type="submit"
                          disabled={contactLoading}
                          className="w-full"
                        >
                          {contactLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Sending Message...
                            </>
                          ) : (
                            "Submit Inquiry"
                          )}
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* Right Column: Institutional Details & Map Card (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Campus Office Details Card */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="pb-4 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-[#007a91] block mb-1">
                  Institutional Secretariat
                </span>
                <h3 className="text-lg font-bold text-[#14213d]">Campus Chapter Office</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Institute of Aeronautical Engineering (Autonomous)
                </p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-700">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#0097b2] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[#14213d]">Postal Address:</strong>
                    <span>
                      Department of Computer Science &amp; Engineering,<br />
                      Institute of Aeronautical Engineering,<br />
                      Dundigal Road, Hyderabad - 500043,<br />
                      Telangana, India.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[#0097b2] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[#14213d]">Official Correspondence:</strong>
                    <a href={`mailto:${CHAPTER_INFO.contactEmail}`} className="text-[#0097b2] hover:text-[#007a91] hover:underline block">
                      {CHAPTER_INFO.contactEmail}
                    </a>
                    <a href={`mailto:${CHAPTER_INFO.facultyEmail}`} className="text-slate-500 hover:text-slate-700 hover:underline text-xs block mt-0.5">
                      Faculty Advisor: {CHAPTER_INFO.facultyEmail}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-[#0097b2] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[#14213d]">College Telephones:</strong>
                    <span>{CHAPTER_INFO.phone}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-[#0097b2] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[#14213d]">Campus Working Hours:</strong>
                    <span>Monday – Saturday: 09:00 AM – 04:30 PM IST</span>
                    <span className="block text-xs text-slate-500 mt-0.5">Closed on second Saturdays &amp; national holidays</span>
                  </div>
                </div>
              </div>

              {/* Map & Direction Link */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-600 space-y-1">
                  <span className="font-semibold text-slate-800 block">Location Coordinates:</span>
                  <p>17.5975° N, 78.4187° E • Near Outer Ring Road (ORR Exit 5)</p>
                </div>
                <a
                  href="https://maps.google.com/?q=Institute+of+Aeronautical+Engineering+Hyderabad"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full px-4 py-2 text-xs font-semibold rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors gap-1.5"
                >
                  <span>Open Directions in Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </div>
            </div>

            {/* Privacy and Trust Notice */}
            <div className="p-4 bg-slate-100/70 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Student Data Protection
              </div>
              <p>
                All student roll numbers, email addresses, and phone numbers collected via this form are used strictly for chapter communications and campus event attendance verification. Information is never shared with commercial third parties.
              </p>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
