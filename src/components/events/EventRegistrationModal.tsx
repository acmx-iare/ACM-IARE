"use client";

import React from "react";
import { ChapterEvent } from "@/types";
import { Button } from "@/components/ui/Button";
import { ExternalLink } from "lucide-react";

interface EventRegistrationModalProps {
  event: ChapterEvent;
}

/**
 * Event Registration Action Component
 * Directs students to the real, official Google Form created for the event.
 * Never creates simulated internal React forms.
 */
export function EventRegistrationModal({ event }: EventRegistrationModalProps) {
  const formUrl = event.googleFormUrl || event.registrationUrl;

  // 1. Registration is explicitly closed
  if (!event.registrationOpen || event.status === "registration_closed" || event.status === "past") {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" disabled className="w-full sm:w-auto text-slate-500 border-slate-300">
          Registration Closed
        </Button>
      </div>
    );
  }

  // 2. Real Google Form exists and is active -> Direct official link
  if (formUrl && formUrl.startsWith("http")) {
    return (
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
        <a
          href={formUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-xs hover:shadow transition-all text-sm w-full sm:w-auto text-center cursor-pointer"
        >
          <span>Register on Official Google Form</span>
          <ExternalLink className="w-4 h-4 shrink-0" />
        </a>
      </div>
    );
  }

  // 3. Form not yet provisioned or failed
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" disabled className="w-full sm:w-auto text-slate-400 border-slate-200">
        Registration Desk Opening Soon
      </Button>
    </div>
  );
}

// Export with alternate alias if needed
export const EventRegistrationButton = EventRegistrationModal;
