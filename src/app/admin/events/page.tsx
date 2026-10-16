"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  PlusCircle,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  Edit,
  Eye,
  Lock,
  Unlock,
  Archive,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Users,
  Calendar,
} from "lucide-react";
import { ChapterEvent } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

export default function AdminEventsPage() {
  const [events, setEvents] = useState<ChapterEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteEvent, setConfirmDeleteEvent] = useState<ChapterEvent | null>(null);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/admin/events");
      const data = await res.json();
      if (data.success && Array.isArray(data.events)) {
        setEvents(data.events);
      }
    } catch {
      setActionMessage({ type: "error", text: "Could not load events from server." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/admin/events")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.events)) {
          setEvents(data.events);
        }
      })
      .catch(() => {
        setActionMessage({ type: "error", text: "Could not load events from server." });
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleToggleRegistration = async (id: string, currentOpen: boolean) => {
    setActionMessage(null);
    try {
      const res = await fetch(`/api/admin/events/${id}/toggle-registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ open: !currentOpen }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage({
          type: "success",
          text: !currentOpen ? "Registration reopened successfully." : "Registration closed successfully.",
        });
        fetchEvents();
      } else {
        setActionMessage({ type: "error", text: data.error || "Failed to update registration status." });
      }
    } catch {
      setActionMessage({ type: "error", text: "Network error updating registration status." });
    }
  };

  const handleRetryForm = async (id: string) => {
    setActionMessage(null);
    try {
      const res = await fetch(`/api/admin/events/${id}/retry-form`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage({ type: "success", text: "Google Form created successfully!" });
        fetchEvents();
      } else {
        setActionMessage({ type: "error", text: data.error || "Form creation retry failed." });
      }
    } catch {
      setActionMessage({ type: "error", text: "Network error retrying form creation." });
    }
  };

  const handleArchive = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to archive "${title}"? Registrations will be preserved.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/events/${id}/archive`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage({ type: "success", text: "Event archived successfully." });
        fetchEvents();
      } else {
        setActionMessage({ type: "error", text: data.error || "Failed to archive event." });
      }
    } catch {
      setActionMessage({ type: "error", text: "Network error archiving event." });
    }
  };

  const handleDelete = async (id: string, title: string) => {
    setActionMessage(null);
    setDeletingId(id);

    try {
      const res = await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage({
          type: "success",
          text: `Event "${title}" and its Google Form link deleted successfully.`,
        });
        setEvents((prev) => prev.filter((e) => e.id !== id));
        setConfirmDeleteEvent(null);
        fetchEvents();
      } else {
        setActionMessage({ type: "error", text: data.error || "Failed to delete event." });
      }
    } catch {
      setActionMessage({ type: "error", text: "Network error deleting event." });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredEvents = events.filter((e) => {
    if (statusFilter === "active" && (e.isArchived || !e.registrationOpen)) return false;
    if (statusFilter === "closed" && (e.isArchived || e.registrationOpen)) return false;
    if (statusFilter === "archived" && !e.isArchived) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#14213d] tracking-tight">
            Event &amp; Form Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create events, review Google Forms links, control registration status, and inspect attendee responses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button href="/admin/events/new" variant="secondary" size="md">
            <PlusCircle className="w-4 h-4" />
            Create Event &amp; Form
          </Button>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-3.5 rounded-md text-xs flex items-center justify-between gap-2 border ${
            actionMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search event title, venue, ID..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500 font-semibold">Filter:</span>
          {(["all", "active", "closed", "archived"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-2.5 py-1 rounded text-xs capitalize font-medium transition-colors ${
                statusFilter === status
                  ? "bg-[#14213d] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {status}
            </button>
          ))}
          <button
            onClick={fetchEvents}
            className="ml-2 p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
            title="Refresh events list"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Loading events and Google Forms registry...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No events found</h3>
            <p className="text-xs text-slate-500">
              Create an event to automatically generate a dedicated Google Form and publish it.
            </p>
            <Button href="/admin/events/new" variant="secondary" size="sm">
              Create First Event
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-3">Event Details</th>
                  <th className="px-4 py-3">Date &amp; Venue</th>
                  <th className="px-4 py-3">Registration Status</th>
                  <th className="px-4 py-3">Google Form</th>
                  <th className="px-4 py-3 text-center">Registrations</th>
                  <th className="px-6 py-3 text-right">Admin Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvents.map((event) => (
                  <tr
                    key={event.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      event.isArchived ? "opacity-60 bg-slate-50/40" : ""
                    }`}
                  >
                    {/* Column 1: Title & ID */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className="font-bold text-slate-900 block truncate max-w-xs" title={event.title}>
                          {event.title}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-400">
                            {event.id}
                          </span>
                          <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                            {event.category}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Date & Venue */}
                    <td className="px-4 py-4 text-slate-600">
                      <div>
                        <span className="font-medium block">{formatDate(event.date)}</span>
                        <span className="text-[11px] text-slate-400 block truncate max-w-[150px]">
                          {event.venue.split(",")[0]}
                        </span>
                      </div>
                    </td>

                    {/* Column 3: Registration Status */}
                    <td className="px-4 py-4">
                      {event.isArchived ? (
                        <Badge variant="outline">Archived</Badge>
                      ) : event.registrationOpen ? (
                        <Badge variant="teal">Open</Badge>
                      ) : (
                        <Badge variant="past">Closed</Badge>
                      )}
                    </td>

                    {/* Column 4: Google Form */}
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        {event.googleFormUrl ? (
                          <>
                            <a
                              href={event.googleFormUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold"
                            >
                              <span>Public Form</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            {event.googleFormEditUrl && (
                              <a
                                href={event.googleFormEditUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-[11px] text-slate-500 hover:text-slate-800"
                              >
                                Edit in Google Forms
                              </a>
                            )}
                          </>
                        ) : event.formStatus === "failed" ? (
                          <div className="space-y-1">
                            <span className="text-red-600 font-bold block text-[11px]">
                              Creation Failed
                            </span>
                            <button
                              onClick={() => handleRetryForm(event.id)}
                              className="inline-flex items-center gap-1 text-[11px] text-blue-700 font-bold hover:underline"
                            >
                              <RefreshCw className="w-2.5 h-2.5" /> Retry Form
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Pending</span>
                        )}
                      </div>
                    </td>

                    {/* Column 5: Responses */}
                    <td className="px-4 py-4 text-center">
                      <Link
                        href={`/admin/registrations?eventId=${event.id}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-bold transition-colors"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>{event.responseCount || 0}</span>
                      </Link>
                    </td>

                    {/* Column 6: Controls */}
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        {/* Toggle Open/Closed */}
                        {!event.isArchived && (
                          <button
                            onClick={() => handleToggleRegistration(event.id, event.registrationOpen)}
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-600"
                            title={event.registrationOpen ? "Close Registration" : "Reopen Registration"}
                          >
                            {event.registrationOpen ? (
                              <Lock className="w-4 h-4 text-amber-600" />
                            ) : (
                              <Unlock className="w-4 h-4 text-emerald-600" />
                            )}
                          </button>
                        )}

                        {/* Edit */}
                        <Link
                          href={`/admin/events/${event.id}/edit`}
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-600"
                          title="Edit Event"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>

                        {/* Public View */}
                        <Link
                          href={`/events/${event.slug}`}
                          target="_blank"
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-800"
                          title="View on Website"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {/* Archive */}
                        {!event.isArchived && (
                          <button
                            onClick={() => handleArchive(event.id, event.title)}
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            title="Archive Event"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete Event */}
                        <button
                          onClick={() => setConfirmDeleteEvent(event)}
                          className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                          title="Delete Event"
                          aria-label="Delete Event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDeleteEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-red-50/60">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Event</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-5 space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                Are you sure you want to permanently delete{" "}
                <strong className="text-slate-900 font-bold">&quot;{confirmDeleteEvent.title}&quot;</strong>?
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5 text-[11px] text-slate-600">
                <p className="font-semibold text-slate-700">What will happen:</p>
                <ul className="list-disc pl-4 space-y-1 text-slate-500">
                  <li>The event will be immediately removed from the website portal.</li>
                  <li>The event record will be removed from your Google Sheet.</li>
                  <li>The linked Google Form will be closed so no further registrations can be submitted.</li>
                </ul>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDeleteEvent(null)}
                disabled={deletingId === confirmDeleteEvent.id}
                className="px-4 py-2 rounded-md text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDeleteEvent.id, confirmDeleteEvent.title)}
                disabled={deletingId === confirmDeleteEvent.id}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-xs disabled:opacity-50"
              >
                {deletingId === confirmDeleteEvent.id ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
