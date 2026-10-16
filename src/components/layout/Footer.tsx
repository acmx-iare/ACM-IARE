import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Mail, Phone, MapPin, Globe } from "lucide-react";
import { CHAPTER_INFO, NAVIGATION_LINKS, TECHNICAL_SIGS } from "@/data/chapter";

export function Footer() {
  const currentYear = 2026;

  return (
    <footer className="bg-[#0b1324] text-slate-300 border-t border-slate-800" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Col 1 & 2: Chapter Identity and Disclaimer */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-white p-0.5 shrink-0 overflow-hidden">
                <Image
                  src="/images/acm-iare-logo.jpg"
                  alt="ACM IARE Logo"
                  width={40}
                  height={40}
                  className="object-contain w-full h-full"
                />
              </div>
              <div>
                <span className="font-bold text-white text-base block tracking-tight">
                  ACM Student Chapter
                </span>
                <span className="text-xs text-slate-400 block font-medium">
                  Institute of Aeronautical Engineering
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              An officially recognized student organization advancing computer science education, algorithmic research, and software engineering craftsmanship at IARE.
            </p>

            {/* Official Distinction Disclaimer */}
            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-md text-xs text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-200 block mb-1">Institutional Notice:</span>
              {CHAPTER_INFO.disclaimer}
            </div>
          </div>

          {/* Col 3: Navigation Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm">
              {NAVIGATION_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/privacy"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Terms &amp; Bylaws
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Technical SIGs */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Technical SIGs
            </h3>
            <ul className="space-y-2 text-sm">
              {TECHNICAL_SIGS.map((sig) => (
                <li key={sig.id}>
                  <Link
                    href="/about#sigs"
                    className="text-slate-400 hover:text-white transition-colors block"
                  >
                    <span className="font-medium text-slate-300">{sig.shortName}</span>
                    <span className="text-xs text-slate-500 block truncate">{sig.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 5: Institutional Contact */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Campus Office
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  Department of CSE, IARE,<br />
                  Dundigal, Hyderabad - 500043,<br />
                  Telangana, India
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <a
                  href={`mailto:${CHAPTER_INFO.contactEmail}`}
                  className="hover:text-white transition-colors"
                >
                  {CHAPTER_INFO.contactEmail}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{CHAPTER_INFO.phone}</span>
              </li>
              <li className="flex items-center gap-2 pt-1">
                <Globe className="w-4 h-4 text-blue-400 shrink-0" />
                <a
                  href={CHAPTER_INFO.socials.iareWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
                >
                  iare.ac.in <ArrowUpRight className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            &copy; {currentYear} ACM Student Chapter, Institute of Aeronautical Engineering. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">
              Terms
            </Link>
            <a
              href="https://www.acm.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-slate-300 transition-colors"
            >
              ACM.org <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
