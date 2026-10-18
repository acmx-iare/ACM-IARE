"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Users,
  Search,
  Download,
  Filter,
  RefreshCw,
  Mail,
  Phone,
} from "lucide-react";
import { EventRegistration, ChapterEvent } from "@/types";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

function RegistrationsContent() {
  const searchParams = useSearchParams();
  const initialEventId = searchParams.get("eventId") || "";

  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [events, setEvents] = useState<ChapterEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState(initialEventId);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      fetch(`/api/admin/registrations${selectedEventId ? `?eventId=${selectedEventId}` : ""}`),
      fetch("/api/admin/events"),
    ])
      .then(async ([regRes, eventRes]) => {
        if (!isMounted) return;
        if (regRes.status === 401 || eventRes.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        const regData = await regRes.json();
        const eventData = await eventRes.json();
        if (regData.success) setRegistrations(regData.registrations);
        if (eventData.success) setEvents(eventData.events);
      })
      .catch((err) => {
        console.error("Error loading registrations:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedEventId, refreshCount]);

  const filteredRegistrations = registrations.filter((r) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.fullName.toLowerCase().includes(q) ||
        r.rollNumber.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q) ||
        r.eventTitle.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const exportCSV = () => {
    if (filteredRegistrations.length === 0) return;

    const headers = [
      "Registration ID",
      "Event Title",
      "Full Name",
      "Roll Number",
      "Email Address",
      "Phone Number",
      "Department",
      "Year of Study",
      "ACM Member ID",
      "Submitted At",
    ];

    const rows = filteredRegistrations.map((r) => [
      r.id,
      `"${r.eventTitle.replace(/"/g, '""')}"`,
      `"${r.fullName.replace(/"/g, '""')}"`,
      r.rollNumber,
      r.email,
      r.phone,
      `"${r.department.replace(/"/g, '""')}"`,
      `"${r.yearOfStudy.replace(/"/g, '""')}"`,
      r.acmId || "N/A",
      r.submittedAt,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ACM_IARE_Registrations_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#14213d] tracking-tight">
            Event Registrations Registry
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Student attendee responses recorded via dedicated Google Forms and website registration desks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            disabled={filteredRegistrations.length === 0}
          >
            <Download className="w-4 h-4 mr-1.5" />
            Export CSV ({filteredRegistrations.length})
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, roll no, email..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500 font-semibold">Filter Event:</span>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white max-w-xs focus:ring-1 focus:ring-blue-600"
          >
            <option value="">All Events ({events.length})</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
          <button
            onClick={() => setRefreshCount((c) => c + 1)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
            title="Refresh registrations"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Registrations Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Loading attendees from Google Sheets response registry...
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No registrations found</h3>
            <p className="text-xs text-slate-500">
              When students submit the Google Form or event registration modal, their entries will be logged here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-3">Student Attendee</th>
                  <th className="px-4 py-3">Roll Number</th>
                  <th className="px-4 py-3">Department &amp; Year</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Event Registered</th>
                  <th className="px-6 py-3 text-right">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRegistrations.map((reg, idx) => (
                  <tr key={reg.id || `reg_${idx}`} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-3.5">
                      <span className="font-bold text-slate-900 block">
                        {reg.fullName}
                      </span>
                      {reg.acmId && (
                        <span className="text-[10px] text-blue-700 font-semibold block">
                          ACM ID: {reg.acmId}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-slate-800 font-semibold">
                      {reg.rollNumber}
                    </td>

                    <td className="px-4 py-3.5 text-slate-600">
                      <span className="block truncate max-w-[180px]" title={reg.department}>
                        {reg.department}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        {reg.yearOfStudy}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-slate-600">
                      <div className="space-y-0.5">
                        <span className="flex items-center gap-1 text-[11px]">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <a href={`mailto:${reg.email}`} className="hover:underline">
                            {reg.email}
                          </a>
                        </span>
                        <span className="flex items-center gap-1 text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{reg.phone}</span>
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-medium text-slate-800 block truncate max-w-xs" title={reg.eventTitle}>
                        {reg.eventTitle}
                      </span>
                    </td>

                    <td className="px-6 py-3.5 text-right text-slate-400 text-[11px]">
                      {formatDate(reg.submittedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RegistrationsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading...</div>}>
      <RegistrationsContent />
    </Suspense>
  );
}
