"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { NAVIGATION_LINKS, CHAPTER_INFO } from "@/data/chapter";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const [prevPathname, setPrevPathname] = useState(pathname);

  // Close mobile menu on route change during render
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
  }

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  // Do not render public Navbar or top affiliation bar on Admin portal pages
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      {/* Skip to Main Content Link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>

      {/* Top Academic Affiliation Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="bg-[#14213d] text-slate-300 text-xs py-1.5 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="font-medium text-white truncate">
                Institute of Aeronautical Engineering (Autonomous)
              </span>
              <span className="hidden md:inline text-slate-400">• NAAC &apos;A++&apos; • JNTUH Affiliated</span>
            </div>
            <div className="flex items-center gap-4 text-xs shrink-0">
              <a
                href={CHAPTER_INFO.socials.iareWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1 hover:text-white transition-colors"
              >
                IARE Portal <ArrowUpRight className="w-3 h-3" />
              </a>
              <span className="hidden sm:inline text-slate-600">|</span>
              <a
                href={CHAPTER_INFO.socials.acmGlobal}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-white transition-colors"
              >
                ACM Global <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo and Brand Title */}
            <Link
              href="/"
              className="flex items-center gap-3.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-md py-1"
            >
              <div className="relative w-12 h-12 shrink-0 bg-white rounded-md border border-slate-200 p-0.5 overflow-hidden shadow-xs">
                <Image
                  src="/images/acm-iare-logo.jpg"
                  alt="ACM Student Chapter IARE Logo"
                  width={48}
                  height={48}
                  className="object-contain w-full h-full"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg text-[#14213d] tracking-tight group-hover:text-blue-700 transition-colors">
                    ACM STUDENT CHAPTER
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Institute of Aeronautical Engineering
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1" aria-label="Main Navigation">
              {NAVIGATION_LINKS.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "px-3.5 py-2 text-sm font-semibold rounded-md transition-colors",
                      isActive
                        ? "text-blue-700 bg-blue-50/70"
                        : "text-slate-700 hover:text-[#14213d] hover:bg-slate-100"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Action Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              <Button href="/events" variant="outline" size="sm">
                Explore Events
              </Button>
              <Button href="/contact#join" variant="secondary" size="sm">
                Join Chapter
              </Button>
            </div>

            {/* Mobile Hamburger Toggle Button */}
            <div className="flex lg:hidden items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded={mobileMenuOpen}
                aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                className="p-2 text-slate-800"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 top-[110px] z-50 bg-slate-900/40 backdrop-blur-xs lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Mobile Navigation Menu Panel */}
        <div
          className={cn(
            "fixed top-[110px] right-0 bottom-0 z-50 w-full max-w-sm bg-white border-l border-slate-200 shadow-xl p-6 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:hidden",
            mobileMenuOpen ? "translate-x-0" : "translate-x-full"
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
        >
          <div className="space-y-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
              Menu Navigation
            </div>
            <nav className="flex flex-col space-y-1">
              {NAVIGATION_LINKS.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-between px-3.5 py-2.5 text-base font-semibold rounded-md transition-colors",
                      isActive
                        ? "text-blue-700 bg-blue-50"
                        : "text-slate-800 hover:bg-slate-100"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="pt-6 border-t border-slate-200 space-y-3">
            <Button
              href="/contact#join"
              variant="secondary"
              size="lg"
              className="w-full text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Join Chapter
            </Button>
            <Button
              href="/events"
              variant="outline"
              size="lg"
              className="w-full text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              View Calendar
            </Button>
            <div className="text-center pt-2">
              <span className="text-xs text-slate-500">
                Official Student Chapter at IARE
              </span>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
