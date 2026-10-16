import React from "react";
import Link from "next/link";
import { ArrowLeft, Home, Calendar, Users, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-700 mx-auto flex items-center justify-center border border-blue-200">
          <span className="text-xl font-mono font-extrabold">404</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#14213d] tracking-tight">
            Page Not Found
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            The requested page or collegiate resource does not exist or may have been relocated in the chapter archives.
          </p>
        </div>

        {/* Quick Nav Links */}
        <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-3 text-left">
          <Link
            href="/"
            className="p-3 bg-white border border-slate-200 rounded-md hover:border-blue-400 transition-colors flex items-center gap-2.5 text-xs font-semibold text-slate-700"
          >
            <Home className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Chapter Home</span>
          </Link>
          <Link
            href="/events"
            className="p-3 bg-white border border-slate-200 rounded-md hover:border-blue-400 transition-colors flex items-center gap-2.5 text-xs font-semibold text-slate-700"
          >
            <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Events Calendar</span>
          </Link>
          <Link
            href="/team"
            className="p-3 bg-white border border-slate-200 rounded-md hover:border-blue-400 transition-colors flex items-center gap-2.5 text-xs font-semibold text-slate-700"
          >
            <Users className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Chapter Team</span>
          </Link>
          <Link
            href="/contact"
            className="p-3 bg-white border border-slate-200 rounded-md hover:border-blue-400 transition-colors flex items-center gap-2.5 text-xs font-semibold text-slate-700"
          >
            <Mail className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Contact Desk</span>
          </Link>
        </div>

        <div className="pt-2">
          <Button href="/" variant="primary" size="md">
            <ArrowLeft className="w-4 h-4" />
            Return to Homepage
          </Button>
        </div>
      </div>
    </div>
  );
}
