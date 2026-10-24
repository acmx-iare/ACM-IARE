"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, Calendar, Filter, Sparkles } from "lucide-react";
import { ChapterEvent } from "@/types";
import { EventCard } from "@/components/events/EventCard";
import { Button } from "@/components/ui/Button";

type FilterTab = "All" | "Upcoming" | "Past" | "Hackathon" | "Workshop" | "Tech Talk" | "Open Source";

export default function EventsPage() {
  const [selectedTab, setSelectedTab] = useState<FilterTab>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [eventsList, setEventsList] = useState<ChapterEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.events)) {
          setEventsList(data.events);
        }
      })
      .catch((err) => console.warn("Could not refresh events from API:", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredEvents = useMemo(() => {
    return eventsList.filter((event) => {
      // Tab filter
      if (selectedTab === "Upcoming" && event.status !== "upcoming") return false;
      if (selectedTab === "Past" && event.status !== "past") return false;
      if (
        selectedTab !== "All" &&
        selectedTab !== "Upcoming" &&
        selectedTab !== "Past" &&
        event.category !== selectedTab
      ) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = event.title.toLowerCase().includes(query);
        const matchesTagline = event.tagline.toLowerCase().includes(query);
        const matchesVenue = event.venue.toLowerCase().includes(query);
        const matchesCategory = event.category.toLowerCase().includes(query);
        return matchesTitle || matchesTagline || matchesVenue || matchesCategory;
      }

      return true;
    });
  }, [eventsList, selectedTab, searchQuery]);

  const allCount = eventsList.length;
  const upcomingCount = eventsList.filter((e) => e.status === "upcoming").length;
  const pastCount = eventsList.filter((e) => e.status === "past").length;

  const tabs: { label: string; value: FilterTab; badge?: number }[] = [
    { label: "All Events", value: "All", badge: allCount },
    { label: "Upcoming", value: "Upcoming", badge: upcomingCount },
    { label: "Past Archive", value: "Past", badge: pastCount },
    { label: "Hackathons", value: "Hackathon" },
    { label: "Workshops", value: "Workshop" },
    { label: "Tech Talks", value: "Tech Talk" },
    { label: "Open Source", value: "Open Source" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header Banner */}
      <section className="bg-white border-b border-slate-200 brand-subtle-bg section-space">
        <div className="site-container">
          <div className="hero-enter max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold bg-teal-50/80 text-[#007a91] border border-[#0097b2]/30">
              <Calendar className="w-3.5 h-3.5 text-[#0097b2]" />
              Chapter Calendar &amp; Workshops
            </div>
            <h1 className="display-heading font-extrabold text-[#14213d]">
              Technical Events &amp; Hackathons
            </h1>
            <p className="lead-copy text-base">
              Explore upcoming workshops, algorithmic coding drills, research talks, and browse archive documentation of past chapter clinics.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Event category filters">
              {tabs.map((tab) => {
                const isSelected = selectedTab === tab.value;
                return (
                  <button
                    key={tab.value}
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setSelectedTab(tab.value)}
                    className={`inline-flex min-h-10 items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0097b2] ${
                      isSelected
                        ? "bg-[#14213d] text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                          isSelected
                            ? "bg-[#0097b2] text-white"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72 shrink-0">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search event title, venue..."
                className="min-h-10 w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3.5 text-xs placeholder-slate-400 focus:border-[#0097b2] focus:outline-none focus:ring-2 focus:ring-[#0097b2] sm:text-sm"
                aria-label="Search events"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Events Grid Content */}
      <section className="py-12 site-container w-full flex-1">
        {loading ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-lg p-8 max-w-md mx-auto space-y-3">
            <Calendar className="w-8 h-8 text-[#0097b2] animate-pulse mx-auto" />
            <h3 className="font-bold text-base text-[#14213d]">Loading Chapter Events...</h3>
            <p className="text-xs text-slate-400">Fetching latest schedule from chapter database.</p>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : eventsList.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-lg p-8 max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#14213d]">No Events Scheduled Currently</h3>
              <p className="text-xs text-slate-500 mt-1">
                We are actively curating new workshops, hackathons, and guest lectures. Check back soon for announcements!
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-lg p-8 max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
              <Filter className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#14213d]">No matching events found</h3>
              <p className="text-xs text-slate-500 mt-1">
                Try clearing your search query or switching to another category tab.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedTab("All");
                setSearchQuery("");
              }}
            >
              Reset Filters
            </Button>
          </div>
        )}
      </section>

      {/* Registration & Proposing an Event Callout */}
      <section className="bg-white border-t border-slate-200 py-12">
        <div className="site-container">
          <div className="p-8 rounded-lg bg-blue-50/60 border border-blue-200/80 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-800">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Want to Host or Present a Topic?
              </div>
              <h3 className="text-xl font-bold text-[#14213d]">
                Student &amp; Faculty Technical Talk Proposals
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Have you completed a noteworthy systems project, research paper, or algorithmic technique? The ACM IARE Technical Board invites proposals for lightning talks and peer workshops.
              </p>
            </div>
            <Button href="/contact" variant="secondary" size="md" className="shrink-0">
              Submit a Talk Proposal
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
