"use client";
import React, { useState, useEffect, useRef } from "react";
import { VolumeX, Music } from "lucide-react";

interface MusicPlayerProps {
  customAudioUrl?: string;
  autoStartOnOpen?: boolean;
}

export function MusicPlayer({ customAudioUrl, autoStartOnOpen = true }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorIntervalRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const startPlayback = () => {
    if (customAudioUrl) {
      if (!audioElementRef.current) {
        audioElementRef.current = new Audio(customAudioUrl);
        audioElementRef.current.loop = true;
        audioElementRef.current.volume = 0.45;
      }
      audioElementRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          try {
            sessionStorage.setItem("wedding_music_state", "playing");
          } catch {}
        })
        .catch(() => {
          // If browser restricts audio stream, start gentle ambient synthesizer
          startAmbientSynth();
          setIsPlaying(true);
        });
    } else {
      startAmbientSynth();
      setIsPlaying(true);
    }
  };

  // Auto-play when invitation opens (user click gesture satisfies browser policy)
  useEffect(() => {
    if (autoStartOnOpen) {
      startPlayback();
    }
    return () => {
      stopAmbientSynth();
    };
  }, [autoStartOnOpen, customAudioUrl]);

  // Web Audio peaceful melodic synthesizer fallback
  const startAmbientSynth = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      // Pentatonic warm notes in Indian Raag Yaman / Bhupali mood: D4, E4, F#4, A4, B4, D5
      const notes = [293.66, 329.63, 369.99, 440.0, 493.88, 587.33];
      let noteIdx = 0;

      const playPluck = () => {
        if (!audioContextRef.current || audioContextRef.current.state === "closed") return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Soft sine/triangle blend for serene sitar/harp acoustic quality
        osc.type = "sine";
        const freq = notes[noteIdx % notes.length];
        noteIdx = (noteIdx + 1 + Math.floor(Math.random() * 2)) % notes.length;
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.04, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 3.0);
      };

      playPluck();
      oscillatorIntervalRef.current = setInterval(playPluck, 2400);
    } catch (err) {
      console.warn("Ambient audio context not supported or blocked:", err);
    }
  };

  const stopAmbientSynth = () => {
    if (oscillatorIntervalRef.current) {
      clearInterval(oscillatorIntervalRef.current);
      oscillatorIntervalRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
  };

  const toggleMusic = () => {
    if (isPlaying) {
      stopAmbientSynth();
      setIsPlaying(false);
      try {
        sessionStorage.setItem("wedding_music_state", "stopped");
      } catch {}
    } else {
      startPlayback();
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-40">
      <button
        type="button"
        onClick={toggleMusic}
        aria-label={isPlaying ? "Mute wedding music" : "Play wedding music"}
        title={isPlaying ? "Mute music" : "Play music"}
        className={`group relative flex items-center justify-center w-12 h-12 rounded-full bg-[#1A1816]/90 backdrop-blur-md border border-[#C9B38C]/50 text-[#FAF8F5] shadow-[0_8px_25px_rgba(0,0,0,0.45)] hover:border-[#D4AF37] hover:scale-105 active:scale-95 transition-all duration-300 ${
          isPlaying ? "ring-2 ring-[#C9B38C]/30" : "opacity-80 hover:opacity-100"
        }`}
      >
        {isPlaying ? (
          <div className="flex items-end justify-center gap-[3px] h-4 w-5">
            <span className="w-[3px] bg-[#C9B38C] rounded-full animate-music-bar-1 h-3.5" />
            <span className="w-[3px] bg-[#C9B38C] rounded-full animate-music-bar-2 h-2" />
            <span className="w-[3px] bg-[#C9B38C] rounded-full animate-music-bar-3 h-4" />
          </div>
        ) : (
          <VolumeX className="w-5 h-5 text-[#A8A096] group-hover:text-[#FAF8F5] transition-colors" />
        )}
      </button>
    </div>
  );
}
