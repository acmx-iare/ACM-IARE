"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { Award, Camera, Calendar, X } from "lucide-react";
import { GALLERY_ITEMS, CHAPTER_ACHIEVEMENTS } from "@/data/chapter";
import { GalleryItem } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";

type GalleryCategory = "All" | "Hackathons" | "Workshops" | "Community" | "Celebrations";

export default function GalleryPage() {
  const [selectedCategory, setSelectedCategory] = useState<GalleryCategory>("All");
  const [activeItem, setActiveItem] = useState<GalleryItem | null>(null);

  const filteredItems = useMemo(() => {
    if (selectedCategory === "All") return GALLERY_ITEMS;
    return GALLERY_ITEMS.filter((item) => item.category === selectedCategory);
  }, [selectedCategory]);

  const categories: GalleryCategory[] = ["All", "Hackathons", "Workshops", "Community", "Celebrations"];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header Banner */}
      <section className="bg-white border-b border-slate-200 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
              <Camera className="w-3.5 h-3.5 text-blue-600" />
              Archives &amp; Competitive Milestones
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#14213d] tracking-tight">
              Gallery &amp; Verified Achievements
            </h1>
            <p className="text-base text-slate-600 leading-relaxed">
              Photographic archives of campus coding marathons, distinguished speaker colloquiums, and documented honors attained by collegiate student teams.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 space-y-16">
        
        {/* Verified Achievements Grid */}
        <section>
          <SectionHeader
            badge="Institutional Honors"
            title="Verified Chapter &amp; Student Achievements"
            description="Authentic collegiate milestones accomplished by chapter members in national and regional competitions."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CHAPTER_ACHIEVEMENTS.map((achievement, idx) => (
              <div
                key={idx}
                className="academic-card p-6 bg-white space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                      {achievement.year}
                    </span>
                    <Award className="w-4 h-4 text-amber-500" />
                  </div>
                  <h3 className="mt-3 text-base font-bold text-[#14213d] leading-snug">
                    {achievement.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    {achievement.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span>Category</span>
                  <span className="text-slate-600 font-semibold">{achievement.category}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Photographic Gallery Grid with Filters */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block mb-1">
                Visual Documentation
              </span>
              <h2 className="text-2xl font-bold text-[#14213d]">Event Gallery</h2>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5" role="tablist">
              {categories.map((cat) => (
                <button
                  key={cat}
                  role="tab"
                  aria-selected={selectedCategory === cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                    selectedCategory === cat
                      ? "bg-[#14213d] text-white shadow-xs"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setActiveItem(item)}
                className="academic-card overflow-hidden bg-white cursor-pointer group flex flex-col justify-between"
              >
                <div className="relative aspect-[16/10] w-full bg-slate-900 overflow-hidden">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge variant="outline" className="bg-slate-900/80 text-white border-slate-700 text-[10px]">
                      {item.category}
                    </Badge>
                  </div>
                </div>

                <div className="p-5 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>{item.date}</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#14213d] group-hover:text-blue-700 transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {item.caption}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* Lightbox Modal */}
      {activeItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveItem(null)}
        >
          <div
            className="bg-white rounded-lg border border-slate-200 max-w-2xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[16/10] w-full bg-slate-950">
              <Image
                src={activeItem.imageUrl}
                alt={activeItem.title}
                fill
                className="object-contain"
              />
              <button
                onClick={() => setActiveItem(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 transition-colors"
                aria-label="Close image modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 bg-white">
              <div className="flex items-center justify-between">
                <Badge variant="upcoming">{activeItem.category}</Badge>
                <span className="text-xs text-slate-500 font-medium">{activeItem.date}</span>
              </div>
              <h3 className="text-lg font-bold text-[#14213d]">{activeItem.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{activeItem.caption}</p>
              <div className="pt-2 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setActiveItem(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
