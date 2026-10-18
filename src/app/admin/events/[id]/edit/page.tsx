"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ChapterEvent, FormConfiguration } from "@/types";
import { FormBuilder } from "@/components/admin/FormBuilder";
import { createDefaultFormConfig } from "@/data/form-templates";

export default function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <React.Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-500">
          Loading event editor...
        </div>
      }
    >
      <EditEventContent params={params} />
    </React.Suspense>
  );
}

function EditEventContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [eventData, setEventData] = useState<Partial<ChapterEvent>>({});
  const [formConfig, setFormConfig] = useState<FormConfiguration | null>(null);

  useEffect(() => {
    async function loadEvent() {
      try {
        const res = await fetch(`/api/admin/events/${id}`);
        if (res.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        const data = await res.json();
        if (data.success && data.event) {
          setEventData(data.event);
          if (data.event.formConfig) {
            setFormConfig(data.event.formConfig);
          } else {
            setFormConfig(
              createDefaultFormConfig(
                data.event.title,
                data.event.description || "",
                data.event.category === "Hackathon" ? "hackathon" : "workshop"
              )
            );
          }
        } else {
          setError(data.error || "Event not found.");
        }
      } catch {
        setError("Network error fetching event details.");
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...eventData,
          formConfig: formConfig || undefined,
          registrationQuestions: formConfig?.questions || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg("Event and linked Google Form synchronized successfully!");
      } else {
        setError(data.error || "Failed to update event.");
      }
    } catch {
      setError("Network error updating event.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const title = eventData.title || "this event";
    if (
      !confirm(
        `Are you sure you want to permanently delete "${title}"?\n\nThis will remove the event from the website and Google Sheets, and close its registration form. This action cannot be undone.`
      )
    ) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push("/admin/events");
      } else {
        setError(data.error || "Failed to delete event.");
        setDeleting(false);
      }
    } catch {
      setError("Network error deleting event.");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        Loading event details...
      </div>
    );
  }

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
            Edit Event: {eventData.title}
          </h1>
          <p className="text-xs text-slate-500">
            Changes will synchronize directly to Google Sheets and the linked Google Form.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <Link
            href="/admin/events"
            className="text-xs font-bold text-emerald-900 hover:underline"
          >
            Return to table
          </Link>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg shadow-xs p-6 sm:p-8 space-y-6">
        
        {/* Form Meta Box */}
        {eventData.googleFormUrl && (
          <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-blue-900 block">Linked Google Form</span>
              <a
                href={eventData.googleFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 hover:underline font-mono inline-flex items-center gap-1 mt-0.5"
              >
                <span>{eventData.googleFormUrl}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            {eventData.googleFormEditUrl && (
              <a
                href={eventData.googleFormEditUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded bg-white border border-blue-300 text-blue-800 font-semibold hover:bg-blue-50 shrink-0"
              >
                Open in Google Forms Editor
              </a>
            )}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Event Title
            </label>
            <input
              type="text"
              required
              value={eventData.title || ""}
              onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tagline
            </label>
            <input
              type="text"
              value={eventData.tagline || ""}
              onChange={(e) => setEventData({ ...eventData, tagline: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={eventData.date || ""}
                onChange={(e) => setEventData({ ...eventData, date: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Time
              </label>
              <input
                type="text"
                value={eventData.time || ""}
                onChange={(e) => setEventData({ ...eventData, time: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Venue
              </label>
              <input
                type="text"
                value={eventData.venue || ""}
                onChange={(e) => setEventData({ ...eventData, venue: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={4}
              value={eventData.description || ""}
              onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={eventData.registrationOpen || false}
                onChange={(e) => setEventData({ ...eventData, registrationOpen: e.target.checked })}
                className="rounded text-blue-600 focus:ring-blue-600 border-slate-300"
              />
              <span>Registration Active &amp; Accepting Responses</span>
            </label>
          </div>
        </div>

        {/* Section 2: Form Customizer */}
        {formConfig && (
          <div className="pt-4 border-t border-slate-200">
            <h2 className="text-sm font-bold uppercase tracking-wider text-purple-700 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" /> Google Form Customizer &amp; Question Builder
            </h2>
            <FormBuilder
              config={formConfig}
              onChange={setFormConfig}
              eventTitle={eventData.title}
              eventDescription={eventData.description}
              eventDate={eventData.date}
              eventTime={eventData.time}
              eventVenue={eventData.venue}
            />
          </div>
        )}

        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting || saving}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md border border-red-200 hover:border-red-300 transition-colors disabled:opacity-50"
          >
            {deleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting Event...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Event</span>
              </>
            )}
          </button>

          <div className="flex items-center justify-end gap-3">
            <Button href="/admin/events" variant="outline" size="md">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="secondary"
              size="md"
              disabled={saving || deleting}
              className="min-w-[150px]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1.5" />
                  Save &amp; Sync Form
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
