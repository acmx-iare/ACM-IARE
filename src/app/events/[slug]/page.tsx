import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Users,
  Award,
  Sparkles,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { EventRegistrationModal } from "@/components/events/EventRegistrationModal";
import { getAllEvents, getEventBySlug } from "@/lib/events-store";

export async function generateStaticParams() {
  const events = await getAllEvents(false);
  return events.map((event) => ({
    slug: event.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    return { title: "Event Not Found" };
  }

  return {
    title: `${event.title} | ACM IARE Events`,
    description: event.description,
    openGraph: {
      title: event.title,
      description: event.description,
      images: [event.bannerImage],
    },
  };
}

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
          <div className="text-slate-500 text-sm">Loading event details...</div>
        </div>
      }
    >
      <EventDetailContent params={params} />
    </React.Suspense>
  );
}

async function EventDetailContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  const isUpcoming = event.status === "upcoming";

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Breadcrumb Header */}
      <div className="bg-white border-b border-slate-200 py-4">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs text-slate-500" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-blue-600 transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link href="/events" className="hover:text-blue-600 transition-colors">
              Events
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-medium truncate max-w-xs sm:max-w-md">
              {event.title}
            </span>
          </nav>
        </div>
      </div>

      {/* Main Event Article Container */}
      <article className="py-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 space-y-8">
        
        {/* Back Link */}
        <div>
          <Link
            href="/events"
            className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-blue-700 transition-colors gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Events Calendar
          </Link>
        </div>

        {/* Hero Card */}
        <div className="academic-card overflow-hidden bg-white">
          <div className="relative aspect-[16/8] sm:aspect-[21/9] w-full bg-slate-900 border-b border-slate-200">
            <Image
              src={event.bannerImage}
              alt={`Poster for ${event.title}`}
              fill
              className="object-cover"
              priority
            />
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={isUpcoming ? "upcoming" : "past"}>
                {event.category}
              </Badge>
              <Badge variant="outline">
                {event.mode}
              </Badge>
              {isUpcoming && event.registrationOpen && (
                <Badge variant="teal">
                  Registration Open
                </Badge>
              )}
              {!isUpcoming && (
                <Badge variant="past">
                  Archived / Concluded
                </Badge>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#14213d] tracking-tight">
                {event.title}
              </h1>
              <p className="mt-2 text-base text-slate-600 leading-relaxed font-normal">
                {event.tagline}
              </p>
            </div>

            {/* Event Key Logistics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200/80 text-xs sm:text-sm">
              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                    Date
                  </span>
                  <span className="font-semibold text-slate-800">
                    {formatDate(event.date)}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                    Time
                  </span>
                  <span className="font-semibold text-slate-800">
                    {event.time}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 sm:col-span-2 md:col-span-1">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                    Campus Venue
                  </span>
                  <span className="font-semibold text-slate-800">
                    {event.venue}
                  </span>
                </div>
              </div>
            </div>

            {/* Registration Action Area */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                {isUpcoming && event.registrationDeadline && (
                  <span>
                    Registration Deadline: <strong className="text-slate-800">{formatDate(event.registrationDeadline)}</strong>
                  </span>
                )}
                {event.capacity && (
                  <span className="ml-3 sm:inline block sm:mt-0 mt-1">
                    Capacity: <strong className="text-slate-800">{event.capacity} Attendees</strong>
                  </span>
                )}
              </div>

              <div>
                <EventRegistrationModal event={event} />
              </div>
            </div>
          </div>
        </div>

        {/* Content Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Article Body (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Overview */}
            <section className="academic-card p-6 sm:p-8 bg-white space-y-4">
              <h2 className="text-xl font-bold text-[#14213d] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Detailed Overview
              </h2>
              <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
                {event.detailedOverview.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </section>

            {/* Prerequisites */}
            <section className="academic-card p-6 sm:p-8 bg-white space-y-4">
              <h2 className="text-xl font-bold text-[#14213d] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-teal-600" />
                Prerequisites &amp; Requirements
              </h2>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
                {event.prerequisites.map((prereq, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-2 shrink-0"></span>
                    <span>{prereq}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Expected Takeaways */}
            <section className="academic-card p-6 sm:p-8 bg-white space-y-4">
              <h2 className="text-xl font-bold text-[#14213d] flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                Learning Takeaways
              </h2>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
                {event.takeaways.map((takeaway, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0"></span>
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Sidebar: Speakers & Faculty Mentors (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <section className="academic-card p-6 bg-white space-y-4">
              <h2 className="text-base font-bold text-[#14213d] flex items-center gap-2 pb-3 border-b border-slate-100">
                <Users className="w-4 h-4 text-blue-600" />
                Resource Persons &amp; Mentors
              </h2>

              <div className="space-y-4">
                {event.speakers.map((speaker, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-md space-y-1">
                    <h3 className="text-sm font-bold text-[#14213d]">{speaker.name}</h3>
                    <p className="text-xs text-blue-700 font-semibold">{speaker.role}</p>
                    <p className="text-xs text-slate-500">{speaker.organization}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Chapter Help Desk Box */}
            <div className="p-5 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 space-y-2">
              <span className="font-bold text-slate-800 block">Queries Regarding this Event?</span>
              <p>
                Reach out to the chapter event coordination desk via <a href="mailto:acm@iare.ac.in" className="text-blue-600 hover:underline">acm@iare.ac.in</a> or visit the CSE Department Lab 1 during campus hours.
              </p>
            </div>
          </div>

        </div>
      </article>
    </div>
  );
}
