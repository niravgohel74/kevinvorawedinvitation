"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { VolumeX, Music, Volume2 } from "lucide-react";

interface MusicPlayerProps {
  customAudioUrl?: string;
  autoStartOnOpen?: boolean;
  isVisible?: boolean;
}

/**
 * Studio Quality Wedding Music Player
 * Handles streaming URLs, native blob objects, and base64 audio data.
 * Guarantees crystal-clear original sound reproduction without synthetic beeps.
 */
export function MusicPlayer({
  customAudioUrl,
  autoStartOnOpen = true,
  isVisible = true,
}: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasUserTapped, setHasUserTapped] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const currentBlobUrlRef = useRef<string | null>(null);

  // Cleanly convert data URIs to Blob Object URLs for seamless Safari / iOS / mobile streaming
  const resolveAudioSource = useCallback(async (url: string): Promise<string> => {
    if (!url) return "";

    // If it's a base64 data URI, convert to Blob URL in memory
    if (url.startsWith("data:")) {
      try {
        if (currentBlobUrlRef.current) {
          URL.revokeObjectURL(currentBlobUrlRef.current);
          currentBlobUrlRef.current = null;
        }
        const res = await fetch(url);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        currentBlobUrlRef.current = blobUrl;
        return blobUrl;
      } catch (err) {
        console.warn("Could not create blob URL from data URI, using raw URL:", err);
        return url;
      }
    }

    return url;
  }, []);

  const playAudio = useCallback(() => {
    if (!audioElementRef.current) return;
    
    // Set generous audible volume
    audioElementRef.current.volume = 0.65;
    const playPromise = audioElementRef.current.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setAutoplayBlocked(false);
          try {
            sessionStorage.setItem("wedding_music_state", "playing");
          } catch {}
        })
        .catch((err) => {
          console.log("Audio autoplay waiting for user tap gesture:", err?.message || err);
          // Autoplay blocked by browser policy: show gentle pulsing tap indicator
          setAutoplayBlocked(true);
          setIsPlaying(false);
        });
    }
  }, []);

  const pauseAudio = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      setIsPlaying(false);
      try {
        sessionStorage.setItem("wedding_music_state", "paused");
      } catch {}
    }
  }, []);

  // Initialize or update audio element whenever customAudioUrl changes
  useEffect(() => {
    let isCancelled = false;

    async function initAudio() {
      const activeUrl = customAudioUrl || "/audio/perfect-acoustic.wav";
      const resolvedSrc = await resolveAudioSource(activeUrl);

      if (isCancelled) return;

      if (!audioElementRef.current) {
        const audio = new Audio();
        audio.preload = "auto";
        audio.loop = true;
        audio.volume = 0.65;
        audioElementRef.current = audio;

        audio.addEventListener("play", () => setIsPlaying(true));
        audio.addEventListener("pause", () => setIsPlaying(false));
      }

      if (audioElementRef.current.src !== resolvedSrc) {
        audioElementRef.current.src = resolvedSrc;
        audioElementRef.current.load();
      }

      if (autoStartOnOpen) {
        playAudio();
      }
    }

    initAudio();

    return () => {
      isCancelled = true;
    };
  }, [customAudioUrl, autoStartOnOpen, playAudio, resolveAudioSource]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
    };
  }, []);

  // If autoplay was blocked, listen for the very first interaction anywhere on document to start
  useEffect(() => {
    if (!autoplayBlocked) return;

    const handleFirstTouch = () => {
      if (audioElementRef.current && !isPlaying) {
        playAudio();
      }
      setHasUserTapped(true);
      window.removeEventListener("click", handleFirstTouch);
      window.removeEventListener("touchstart", handleFirstTouch);
    };

    window.addEventListener("click", handleFirstTouch, { once: true });
    window.addEventListener("touchstart", handleFirstTouch, { once: true });

    return () => {
      window.removeEventListener("click", handleFirstTouch);
      window.removeEventListener("touchstart", handleFirstTouch);
    };
  }, [autoplayBlocked, isPlaying, playAudio]);

  const toggleMusic = () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 z-40 flex items-center gap-3">
      <button
        type="button"
        onClick={toggleMusic}
        aria-label={isPlaying ? "Mute wedding music" : "Play wedding music"}
        title={isPlaying ? "Pause music" : "Play music"}
        className={`group relative flex items-center justify-center w-12 h-12 rounded-full bg-[#1A1816]/95 backdrop-blur-md border border-[#C9B38C]/60 text-[#FAF8F5] shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:border-[#D4AF37] hover:scale-105 active:scale-95 transition-all duration-300 ${
          isPlaying ? "ring-2 ring-[#C9B38C]/40" : "opacity-90 hover:opacity-100"
        } ${autoplayBlocked ? "animate-bounce" : ""}`}
      >
        {isPlaying ? (
          <div className="flex items-end justify-center gap-[3px] h-4 w-5">
            <span className="w-[3px] bg-[#C9B38C] rounded-full animate-music-bar-1 h-3.5" />
            <span className="w-[3px] bg-[#C9B38C] rounded-full animate-music-bar-2 h-2" />
            <span className="w-[3px] bg-[#C9B38C] rounded-full animate-music-bar-3 h-4" />
          </div>
        ) : (
          <VolumeX className="w-5 h-5 text-[#C9B38C] group-hover:text-[#FAF8F5] transition-colors" />
        )}
      </button>

      {/* Gentle helper pill when autoplay is blocked by mobile browser */}
      {autoplayBlocked && !isPlaying && (
        <button
          type="button"
          onClick={playAudio}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1A1816]/90 border border-[#C9B38C]/50 text-[11px] text-[#FCFAF6] shadow-lg animate-fade-in hover:border-[#D4AF37] transition-all"
        >
          <Music className="w-3 h-3 text-[#C9B38C]" />
          <span>Tap to Play Song</span>
        </button>
      )}
    </div>
  );
}
