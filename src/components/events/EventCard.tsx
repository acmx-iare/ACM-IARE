import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, MapPin, ArrowRight, ExternalLink } from "lucide-react";
import { ChapterEvent } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

interface EventCardProps {
  event: ChapterEvent;
  priority?: boolean;
}

export function EventCard({ event, priority = false }: EventCardProps) {
  const isUpcoming = event.status === "upcoming";

  return (
    <article className="academic-card flex flex-col h-full overflow-hidden bg-white group">
      {/* Event Banner Container */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900 border-b border-slate-100">
        <Image
          src={event.bannerImage}
          alt={`Poster for ${event.title}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          priority={priority}
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-10">
          <Badge variant={isUpcoming ? "upcoming" : "past"}>
            {event.category}
          </Badge>
          {isUpcoming && event.registrationOpen && (
            <Badge variant="teal">
              Registration Open
            </Badge>
          )}
          {isUpcoming && !event.registrationOpen && (
            <Badge variant="danger">
              Registration Closed
            </Badge>
          )}
          {!isUpcoming && (
            <Badge variant="outline" className="bg-slate-900/70 text-slate-200 border-slate-700">
              Concluded
            </Badge>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-6 flex flex-col flex-1 justify-between">
        <div className="space-y-3">
          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs font-medium text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#0097b2]" />
              {formatDate(event.date)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {event.time.split("–")[0]}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-[#14213d] group-hover:text-[#0097b2] transition-colors leading-snug">
            <Link href={`/events/${event.slug}`} className="focus:outline-none">
              {event.title}
            </Link>
          </h3>

          {/* Description */}
          <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        </div>

        {/* Footer Row */}
        <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
          <span className="text-xs text-slate-500 truncate inline-flex items-center gap-1 max-w-[50%]">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{event.venue.split(",")[0]}</span>
          </span>

          <div className="flex items-center gap-2">
            {event.registrationOpen && (event.googleFormUrl || event.registrationUrl) && (
              <a
                href={event.googleFormUrl || event.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded border border-emerald-200 transition-colors"
                title="Register directly on Google Form"
              >
                <span>Register</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            <Link
              href={`/events/${event.slug}`}
              className="inline-flex items-center text-xs font-bold text-[#0097b2] hover:text-[#007a91] transition-colors"
            >
              Details
              <ArrowRight className="ml-1 w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
