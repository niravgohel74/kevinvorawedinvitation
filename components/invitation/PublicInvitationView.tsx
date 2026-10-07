"use client";
import React, { useState, useEffect, useRef } from "react";
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
  const localVersionRef = useRef<number>(0);

  // 1. Sync immediately whenever initialData prop updates (e.g. Split Live Preview inside Admin)
  useEffect(() => {
    if (initialData) {
      setData(initialData);
    }
  }, [initialData]);

  // 2. Real-time multi-layered sync engine (inter-tab 0ms broadcast, storage events, and cross-device heartbeat)
  useEffect(() => {
    let isMounted = true;

    // Helper to fetch latest data from server
    const fetchLatestServerData = async () => {
      try {
        const res = await fetch("/api/wedding", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (isMounted && json.success && json.data) {
          setData(json.data);
          if (json.version) {
            localVersionRef.current = Number(json.version);
            try {
              localStorage.setItem("wedding_live_data", JSON.stringify(json.data));
              localStorage.setItem("wedding_data_version", json.version.toString());
            } catch {}
          }
        }
      } catch (e) {
        // silent background failure
      }
    };

    // Sync fresh server-provided initialData into local storage to clear any stale cache
    try {
      if (initialData?.wedding?.groomName) {
        localStorage.setItem("wedding_live_data", JSON.stringify(initialData));
      }
      const v = localStorage.getItem("wedding_data_version");
      if (v) localVersionRef.current = Number(v);
    } catch {}

    // Initial server fetch to ensure complete cloud parity
    fetchLatestServerData();

    // A. BroadcastChannel for INSTANT (0ms) sync across tabs on the same browser
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== "undefined") {
        channel = new BroadcastChannel("wedding_live_sync");
        channel.onmessage = (event) => {
          if (event.data?.type === "LIVE_DATA_UPDATE" && event.data?.data) {
            if (isMounted) {
              setData(event.data.data);
              if (event.data.timestamp) {
                localVersionRef.current = event.data.timestamp;
              }
            }
          }
        };
      }
    } catch (e) {
      console.warn("BroadcastChannel not supported:", e);
    }

    // B. LocalStorage storage event fallback (for other open tabs)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "wedding_live_data" && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          if (isMounted && updated?.wedding) {
            setData(updated);
          }
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);

    // C. Custom window event (for same window / split views)
    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<WeddingData>;
      if (isMounted && customEvent.detail) {
        setData(customEvent.detail);
      }
    };
    window.addEventListener("wedding_data_updated", handleCustomEvent);

    // D. Auto-refresh when tab gains focus or user unlocks mobile screen
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchLatestServerData();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    // E. Lightweight background version heartbeat for cross-device updates (e.g. mobile <-> laptop)
    const interval = setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const vRes = await fetch("/api/wedding/version", { cache: "no-store" });
        if (vRes.ok) {
          const { version } = await vRes.json();
          if (version && version > localVersionRef.current) {
            localVersionRef.current = version;
            await fetchLatestServerData();
          }
        }
      } catch {}
    }, 3500);

    return () => {
      isMounted = false;
      if (channel) channel.close();
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("wedding_data_updated", handleCustomEvent);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
      clearInterval(interval);
    };
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

  const textStyling = data.wedding.textStyling;
  const headingFontFamily =
    textStyling?.headingFont === "playfair"
      ? "'Playfair Display', Georgia, serif"
      : textStyling?.headingFont === "cinzel"
      ? "'Cinzel', Georgia, serif"
      : textStyling?.headingFont === "great-vibes"
      ? "'Great Vibes', cursive"
      : textStyling?.headingFont === "inter"
      ? "'Plus Jakarta Sans', system-ui, sans-serif"
      : "'Cormorant Garamond', Georgia, serif";

  const dynamicStyles = {
    "--wedding-heading-font": headingFontFamily,
    "--wedding-heading-color": textStyling?.headingColor || "#202020",
    "--wedding-accent-color": textStyling?.accentColor || "#9E814D",
    "--wedding-body-color": textStyling?.bodyColor || "#665E55",
    "--wedding-heading-style": textStyling?.isItalicHeading ? "italic" : "normal",
    "--wedding-heading-weight": textStyling?.isBoldHeading ? "700" : "normal",
  } as React.CSSProperties;

  return (
    <main
      style={dynamicStyles}
      className="relative min-h-screen bg-[#F8F5EF] text-[#202020] selection:bg-[#E9E1D5] selection:text-[#202020]"
    >
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
