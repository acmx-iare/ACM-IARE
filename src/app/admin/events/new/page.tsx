"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormConfiguration } from "@/types";
import { FormBuilder } from "@/components/admin/FormBuilder";
import { createDefaultFormConfig } from "@/data/form-templates";

export default function NewEventPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<{
    title: string;
    formUrl?: string;
    formStatus?: string;
    id: string;
    slug: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    tagline: "",
    category: "Workshop",
    date: "2026-10-25",
    time: "10:00 AM – 01:00 PM IST",
    venue: "Central Computing Centre, IARE Campus",
    mode: "In-Person",
    capacity: 100,
    registrationDeadline: "2026-10-24",
    description: "",
  });

  const [formConfig, setFormConfig] = useState<FormConfiguration>(() =>
    createDefaultFormConfig("", "", "workshop")
  );

  const handleTitleChange = (newTitle: string) => {
    setFormData((prev) => ({ ...prev, title: newTitle }));
    setFormConfig((prev) => {
      // If title was default or empty, update form title
      if (!prev.formTitle || prev.formTitle.startsWith("Registration: ")) {
        return {
          ...prev,
          formTitle: `Registration: ${newTitle} | ACM IARE`,
        };
      }
      return prev;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError("Event title is required.");
      return;
    }

    if (!formData.description.trim()) {
      setError("Event description is required.");
      return;
    }

    if (!formConfig.formTitle.trim()) {
      setError("Google Form title is required.");
      return;
    }

    if (formConfig.questions.length === 0) {
      setError("At least one registration question is required for the Google Form.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          formConfig,
          registrationQuestions: formConfig.questions,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCreatedResult({
          title: data.event.title,
          formUrl: data.event.googleFormUrl,
          formStatus: data.event.formStatus,
          id: data.event.id,
          slug: data.event.slug,
        });
      } else {
        setError(data.error || "Failed to create event and provision Google Form.");
      }
    } catch {
      setError("Network error while submitting event creation request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <Link
            href="/admin/events"
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-blue-700 transition-colors gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Events List
          </Link>
          <h1 className="text-2xl font-extrabold text-[#14213d] tracking-tight">
            Create Event &amp; Auto-Generate Google Form
          </h1>
          <p className="text-xs text-slate-500">
            Publishing an event automatically creates a dedicated Google Form and connects it to the Google Sheets responses log.
          </p>
        </div>
      </div>

      {createdResult ? (
        <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-xs text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="text-xl font-bold text-[#14213d]">
              Event &amp; Google Form Successfully Created!
            </h2>
            <p className="text-xs text-slate-600">
              <strong>{createdResult.title}</strong> is now saved in the registry and published on the website.
            </p>
          </div>

          {createdResult.formUrl && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-md max-w-md mx-auto space-y-2 text-left">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Generated Google Form Link:
              </span>
              <a
                href={createdResult.formUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-blue-600 hover:underline break-all block"
              >
                {createdResult.formUrl}
              </a>
              <span className="text-[11px] text-emerald-700 font-medium block">
                ✓ Ready to accept attendee submissions
              </span>
            </div>
          )}

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <Button href={`/events/${createdResult.slug}`} variant="outline" size="md" isExternal>
              View Public Page
            </Button>
            <Button href="/admin/events" variant="secondary" size="md">
              Return to Events Dashboard
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg shadow-xs p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Core Details */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-blue-700 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> 1. Event Logistics
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Event Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Distributed Consensus Masterclass with Raft in Go"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tagline / Short Summary
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="e.g. Implementing leader election and log replication from scratch."
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <option>Workshop</option>
                  <option>Hackathon</option>
                  <option>Coding Competition</option>
                  <option>Tech Talk</option>
                  <option>Open Source</option>
                  <option>Career &amp; Seminar</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Event Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Event Time
                </label>
                <input
                  type="text"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  placeholder="10:00 AM – 01:00 PM IST"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Venue / Location
                </label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  placeholder="Lab 2, Central Computing Centre, IARE Campus"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery Mode
                </label>
                <select
                  value={formData.mode}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <option>In-Person</option>
                  <option>Virtual</option>
                  <option>Hybrid</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Event Description *
              </label>
              <textarea
                rows={4}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed curriculum, agenda, and target student audience..."
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 2: Advanced Custom Google Form Builder */}
          <div className="pt-4 border-t border-slate-200">
            <h2 className="text-sm font-bold uppercase tracking-wider text-purple-700 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" /> 2. Google Form Customizer &amp; Question Builder
            </h2>
            <FormBuilder
              config={formConfig}
              onChange={setFormConfig}
              eventTitle={formData.title}
              eventDescription={formData.description}
              eventDate={formData.date}
              eventTime={formData.time}
              eventVenue={formData.venue}
            />
          </div>



          {/* Submit Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <Button href="/admin/events" variant="outline" size="md">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="secondary"
              size="md"
              disabled={loading}
              className="min-w-[180px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Generating Form...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  Create Event &amp; Form
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
