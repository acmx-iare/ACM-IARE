"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { NAVIGATION_LINKS } from "@/data/chapter";
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

  // Prevent background scrolling while the navigation drawer is open.
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  // Do not render public Navbar on Admin or Studio portal pages
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/studio")) {
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

      {/* Main Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white">
        <div className="site-container">
          <div className="flex h-16 items-center justify-between gap-3 sm:h-20">
            {/* Logo and Brand Title */}
            <Link
              href="/"
              className="group flex min-w-0 items-center gap-2.5 rounded-md py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 sm:gap-3.5"
            >
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white p-0.5 shadow-xs sm:h-12 sm:w-12">
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
                  <span className="text-[clamp(0.72rem,2.5vw,1rem)] font-extrabold leading-tight tracking-tight text-[#14213d] transition-colors group-hover:text-blue-700">
                    ACM STUDENT CHAPTER
                  </span>
                </div>
                <span className="hidden text-[11px] font-medium text-slate-500 sm:block sm:text-xs">
                  Institute of Aeronautical Engineering
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden items-center gap-1 xl:flex" aria-label="Main Navigation">
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
            <div className="hidden items-center gap-3 xl:flex">
              <Button href="/events" variant="outline" size="sm">
                Explore Events
              </Button>
              <Button href="/contact#join" variant="secondary" size="sm">
                Join Chapter
              </Button>
            </div>

            {/* Mobile Hamburger Toggle Button */}
            <div className="flex items-center gap-2 xl:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-navigation-dialog"
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
            className="fixed inset-0 top-16 z-50 bg-slate-950/35 backdrop-blur-[2px] sm:top-20 xl:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Mobile Navigation Menu Panel */}
        {mobileMenuOpen && (
          <div
            id="mobile-navigation-dialog"
            className="drawer-enter fixed inset-y-16 right-0 z-50 flex w-[min(100vw,24rem)] max-w-full flex-col justify-between overflow-y-auto border-l border-slate-200 bg-white p-5 shadow-2xl sm:inset-y-20 sm:p-6 xl:hidden"
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
        )}
      </header>
    </>
  );
}
