"use client";
import React, { useState, useEffect } from "react";
import { WeddingData } from "@/types/wedding";
import { EnvelopeIntro } from "@/components/invitation/EnvelopeIntro";
import { HeroSection } from "@/components/invitation/HeroSection";
import { DateRevealSection } from "@/components/invitation/DateRevealSection";
import { StorySection } from "@/components/invitation/StorySection";
import { CountdownSection } from "@/components/invitation/CountdownSection";
import { EventsSection } from "@/components/invitation/EventsSection";
import { TimelineSection } from "@/components/invitation/TimelineSection";
import { VenueSection } from "@/components/invitation/VenueSection";
import { GallerySection } from "@/components/invitation/GallerySection";
import { FamilySection } from "@/components/invitation/FamilySection";
import { RsvpSection } from "@/components/invitation/RsvpSection";
import { WishesSection } from "@/components/invitation/WishesSection";
import { ClosingSection } from "@/components/invitation/ClosingSection";
import { FloatingNav } from "@/components/invitation/FloatingNav";
import { MusicPlayer } from "@/components/invitation/MusicPlayer";
import { PetalShower } from "@/components/ui/PetalShower";

interface PublicInvitationViewProps {
  initialData: WeddingData;
  isEmbedPreview?: boolean;
}

export function PublicInvitationView({
  initialData,
  isEmbedPreview = false,
}: PublicInvitationViewProps) {
  const [data, setData] = useState<WeddingData>(initialData);
  const [isOpened, setIsOpened] = useState(isEmbedPreview);

  // Sync active music and latest wedding data dynamically on mount
  useEffect(() => {
    // 1. Instant hydration from localStorage if cached from Admin
    try {
      const cached = localStorage.getItem("wedding_live_data");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.wedding) {
          setData((prev) => ({
            ...prev,
            ...parsed,
            wedding: {
              ...prev.wedding,
              ...parsed.wedding,
            },
          }));
        }
      }
      const localActiveMusic = localStorage.getItem("wedding_active_music_url");
      if (localActiveMusic) {
        setData((prev) => ({
          ...prev,
          wedding: {
            ...prev.wedding,
            ambientMusicUrl: localActiveMusic,
          },
        }));
      }
    } catch (e) {
      console.warn("Local storage sync error:", e);
    }

    // 2. Fetch fresh wedding data from /api/wedding (picks up Vercel runtime updates)
    fetch("/api/wedding")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          const freshUrl =
            (typeof window !== "undefined" && localStorage.getItem("wedding_active_music_url")) ||
            res.data.wedding?.ambientMusicUrl ||
            initialData.wedding.ambientMusicUrl;

          const freshData = {
            ...res.data,
            wedding: {
              ...res.data.wedding,
              ambientMusicUrl: freshUrl,
            },
          };
          setData(freshData);
          try {
            localStorage.setItem("wedding_live_data", JSON.stringify(freshData));
          } catch {}
        }
      })
      .catch((e) => console.warn("Background wedding sync:", e));
  }, []);

  const vis = data.sectionVisibility || {
    hero: true,
    dateReveal: true,
    countdown: true,
    story: true,
    couple: true,
    events: true,
    timeline: true,
    venue: true,
    gallery: true,
    family: true,
    rsvp: true,
    wishes: true,
  };

  return (
    <main className="relative min-h-screen bg-[#F8F5EF] text-[#202020] selection:bg-[#E9E1D5] selection:text-[#202020]">
      {/* Background Flower Petals Showering Animation */}
      <PetalShower density={38} />

      {/* 1. Full Screen Luxury Invitation Envelope Intro */}
      {!isOpened && (
        <EnvelopeIntro
          wedding={data.wedding}
          onOpen={() => setIsOpened(true)}
        />
      )}

      {/* 2. Floating Minimal Navigation - Groom First */}
      {isOpened && (
        <FloatingNav
          groomName={data.wedding.groomName}
          brideName={data.wedding.brideName}
        />
      )}

      {/* 3. Floating Music Controller - Starts by default upon opening, stays mounted for smooth audio */}
      <MusicPlayer
        customAudioUrl={data.wedding.ambientMusicUrl}
        autoStartOnOpen={isOpened}
        isVisible={isOpened}
      />

      {/* Main Wedding Content Flow */}
      <div className={`transition-opacity duration-1000 ${isOpened ? "opacity-100" : "opacity-0"}`}>
        {/* 4. Cinematic Hero with Parallax (Romantic couple quote, no date/location) */}
        {vis.hero !== false && <HeroSection wedding={data.wedding} />}

        {/* 4.5. Romantic Date Reveal Section with 3 Golden Hearts */}
        {vis.dateReveal !== false && <DateRevealSection wedding={data.wedding} />}

        {/* 5. Countdown Section */}
        {vis.countdown !== false && (
          <CountdownSection
            weddingDate={data.wedding.weddingDate}
            weddingTime={data.wedding.weddingTime}
          />
        )}

        {/* 6. Story & Couple Section */}
        {vis.story !== false && (
          <StorySection story={data.story} couple={data.couple} />
        )}

        {/* 7. Wedding Events (The Celebration) */}
        {vis.events !== false && <EventsSection events={data.events} />}

        {/* 8. Wedding Day Itinerary Timeline */}
        {vis.timeline !== false && <TimelineSection timeline={data.timeline} />}

        {/* 9. Venue & Directions */}
        {vis.venue !== false && <VenueSection venue={data.venue} />}

        {/* 10. Photo Gallery */}
        {vis.gallery !== false && <GallerySection gallery={data.gallery} />}

        {/* 11. Family Blessings */}
        {vis.family !== false && <FamilySection family={data.family} />}

        {/* 12. RSVP Form */}
        {vis.rsvp !== false && <RsvpSection />}

        {/* 13. Guest Wishes / Guestbook */}
        {vis.wishes !== false && (
          <WishesSection initialWishes={(data.wishes || []).filter((w) => w.status === "approved")} />
        )}

        {/* 14. Emotional Closing Section */}
        <ClosingSection wedding={data.wedding} />
      </div>
    </main>
  );
}
