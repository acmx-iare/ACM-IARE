import React from "react";
import { GALLERY_ITEMS, CHAPTER_ACHIEVEMENTS } from "@/data/chapter";
import { getCmsPublishedContent, type CmsGalleryContent } from "@/lib/cms-store";
import { GalleryClient } from "./GalleryClient";

export const metadata = {
  title: "Gallery & Verified Achievements",
  description:
    "Photographic archives of campus coding marathons, distinguished speaker colloquiums, and documented honors attained by collegiate student teams.",
};

export default function GalleryPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-xs text-slate-400">
          Loading photographic gallery archives...
        </div>
      }
    >
      <GalleryPageContent />
    </React.Suspense>
  );
}

async function GalleryPageContent() {
  const cms = await getCmsPublishedContent<CmsGalleryContent>("gallery");
  const galleryItems =
    cms.galleryItems && cms.galleryItems.length > 0
      ? cms.galleryItems
      : GALLERY_ITEMS;
  const achievements =
    cms.achievements && cms.achievements.length > 0
      ? cms.achievements
      : CHAPTER_ACHIEVEMENTS;
  const hero = cms.hero || {};
  const layout = cms.layout || {};

  return (
    <GalleryClient
      initialItems={galleryItems}
      achievements={achievements}
      hero={hero}
      layout={layout}
    />
  );
}
