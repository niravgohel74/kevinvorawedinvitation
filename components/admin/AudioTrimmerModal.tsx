"use client";
import React, { useState, useEffect, useRef } from "react";
import { MusicTrack } from "@/types/wedding";
import { formatTimeSeconds, sliceAudioSource } from "@/lib/audioTrimmer";
import { MAX_AUDIO_UPLOAD_BYTES, uploadAudioToStorage } from "@/lib/uploadAudio";
import {
  Scissors,
  Play,
  Pause,
  Upload,
  Loader2,
  X,
  Clock,
  Sparkles,
  Volume2,
} from "lucide-react";

interface AudioTrimmerModalProps {
  isOpen: boolean;
  track: Partial<MusicTrack> | null;
  onClose: () => void;
  onSave: (updated: { id?: string; title: string; artist: string; url: string; isActive?: boolean }) => Promise<void>;
}

export function AudioTrimmerModal({
  isOpen,
  track,
  onClose,
  onSave,
}: AudioTrimmerModalProps) {
  const [title, setTitle] = useState(track?.title || "");
  const [artist, setArtist] = useState(track?.artist || "");
  const [audioUrl, setAudioUrl] = useState(track?.url || "");
  const [audioFile, setAudioFile] = useState<File | null>(null);

  // Audio trimming state
  const [duration, setDuration] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(60);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(0);

  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isTrimming, setIsTrimming] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Keep live references so audio event callbacks always see current slider values without effect re-triggers
  const startTimeRef = useRef(startTime);
  const endTimeRef = useRef(endTime);
  const isPlayingRef = useRef(isPlayingPreview);

  useEffect(() => {
    startTimeRef.current = startTime;
  }, [startTime]);

  useEffect(() => {
    endTimeRef.current = endTime;
  }, [endTime]);

  useEffect(() => {
    isPlayingRef.current = isPlayingPreview;
  }, [isPlayingPreview]);

  // Sync props when modal opens
  useEffect(() => {
    if (isOpen && track) {
      setTitle(track.title || "");
      setArtist(track.artist || "");
      setAudioUrl(track.url || "");
      setAudioFile(null);
      setStartTime(0);
      setEndTime(60);
      setDuration(0);
      setCurrentTime(0);
      setIsPlayingPreview(false);
      setErrorMessage("");
      setStatusMessage("");
    }
  }, [isOpen, track]);

  // Load audio element and duration when audioUrl changes (ONLY DEPENDS ON audioUrl)
  useEffect(() => {
    if (!audioUrl) {
      setDuration(0);
      return;
    }

    setIsLoadingAudio(true);
    setErrorMessage("");

    let playUrl = audioUrl;
    // Route external URLs through proxy if needed for playback and metadata
    if (audioUrl.startsWith("http://") || audioUrl.startsWith("https://")) {
      try {
        if (!audioUrl.startsWith(window.location.origin)) {
          playUrl = `/api/audio-proxy?url=${encodeURIComponent(audioUrl)}`;
        }
      } catch {}
    }

    const audio = new Audio(playUrl);
    audioRef.current = audio;
    audio.preload = "metadata";

    const handleLoadedMetadata = () => {
      const dur = Math.floor(audio.duration);
      if (!isNaN(dur) && dur > 0) {
        setDuration(dur);
        setIsLoadingAudio(false);

        // Preset middle 60s if track is longer than 60s
        if (dur > 60) {
          const mid = Math.floor(dur / 2);
          const start = Math.max(0, mid - 30);
          const end = Math.min(dur, start + 60);
          setStartTime(start);
          setEndTime(end);
          startTimeRef.current = start;
          endTimeRef.current = end;
        } else {
          setStartTime(0);
          setEndTime(dur);
          startTimeRef.current = 0;
          endTimeRef.current = dur;
        }
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      // Auto-loop preview when reaching end boundary
      if (isPlayingRef.current && audio.currentTime >= endTimeRef.current) {
        audio.currentTime = startTimeRef.current;
      }
    };

    const handleError = () => {
      setIsLoadingAudio(false);
      // If error occurs, fallback duration estimate
      setDuration((prev) => (prev > 0 ? prev : 180));
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("error", handleError);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("error", handleError);
      audioRef.current = null;
    };
  }, [audioUrl]);

  // Handle local file upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAudioUrl(objectUrl);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
    if (!artist) {
      setArtist("Uploaded Track");
    }
  };

  // Preview trimmed slice
  const togglePlayPreview = () => {
    if (!audioRef.current) return;

    if (isPlayingPreview) {
      audioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      audioRef.current.currentTime = startTime;
      audioRef.current
        .play()
        .then(() => {
          setIsPlayingPreview(true);
        })
        .catch((err) => {
          setErrorMessage("Could not play preview: " + err.message);
        });
    }
  };

  // Slider adjustments
  const handleStartTimeChange = (val: number) => {
    const safeVal = Math.min(val, endTime - 1);
    setStartTime(safeVal);
    startTimeRef.current = safeVal;
    if (audioRef.current && !isPlayingPreview) {
      audioRef.current.currentTime = safeVal;
      setCurrentTime(safeVal);
    }
  };

  const handleEndTimeChange = (val: number) => {
    const safeVal = Math.max(val, startTime + 1);
    setEndTime(safeVal);
    endTimeRef.current = safeVal;
  };

  // Quick 1-minute middle clip preset
  const handleQuickMiddleOneMin = () => {
    const effectiveDur = duration > 0 ? duration : 180;
    if (effectiveDur <= 60) {
      setStartTime(0);
      setEndTime(effectiveDur);
      startTimeRef.current = 0;
      endTimeRef.current = effectiveDur;
      return;
    }
    const middle = Math.floor(effectiveDur / 2);
    const start = Math.max(0, middle - 30);
    const end = Math.min(effectiveDur, start + 60);
    setStartTime(start);
    setEndTime(end);
    startTimeRef.current = start;
    endTimeRef.current = end;
    if (audioRef.current) {
      audioRef.current.currentTime = start;
      setCurrentTime(start);
    }
  };

  // Quick 30-sec hook preset
  const handleQuickThirtySec = () => {
    const effectiveDur = duration > 0 ? duration : 180;
    const start = Math.max(0, Math.floor(effectiveDur * 0.3));
    const end = Math.min(effectiveDur, start + 30);
    setStartTime(start);
    setEndTime(end);
    startTimeRef.current = start;
    endTimeRef.current = end;
    if (audioRef.current) {
      audioRef.current.currentTime = start;
      setCurrentTime(start);
    }
  };

  // Trim and save
  const handleTrimAndSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!title.trim()) {
      setErrorMessage("Please enter a track title");
      return;
    }
    if (!audioUrl) {
      setErrorMessage("Please provide an audio file or URL");
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlayingPreview(false);
    }

    setIsTrimming(true);
    setErrorMessage("");
    setStatusMessage("Decoding audio and trimming clip...");

    try {
      // 1. Slice audio using Web Audio API with Studio Fidelity (32-44.1 kHz Stereo)
      const source = audioFile || audioUrl;
      const { blob, duration: clipDur, sizeBytes, qualityInfo } = await sliceAudioSource(source, startTime, endTime);

      const sizeMb = (sizeBytes / (1024 * 1024)).toFixed(2);
      setStatusMessage(`Studio Clip (${sizeMb} MB - ${qualityInfo}). Saving...`);

      // 2. Upload directly from the browser to durable Blob storage on Vercel.
      // This bypasses the 4.5MB Vercel Function request/response payload limit.
      setStatusMessage("Uploading trimmed audio to music storage...");
      const cleanFileName = `trimmed_${title.trim().replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.wav`;
      const finalUrl = await uploadAudioToStorage(blob, cleanFileName);

      setStatusMessage("Saving track in wedding music library...");

      // 4. Save track
      await onSave({
        id: track?.id,
        title: title.trim(),
        artist: artist.trim() || "Wedding Music",
        url: finalUrl,
        isActive: track?.isActive,
      });

      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to trim and save audio. Try uploading a direct MP3/WAV file.");
    } finally {
      setIsTrimming(false);
      setStatusMessage("");
    }
  };

  // Simple save without trimming (metadata update)
  const handleSaveWithoutTrim = async () => {
    if (!title.trim() || !audioUrl) {
      setErrorMessage("Title and audio URL required");
      return;
    }
    setIsTrimming(true);
    setStatusMessage("Saving track...");
    try {
      let finalUrl = audioUrl;
      if (audioFile) {
        if (audioFile.size > 2.5 * 1024 * 1024) {
          setIsTrimming(false);
          return handleTrimAndSave();
        }

        setStatusMessage("Uploading audio file to music storage...");
        finalUrl = await uploadAudioToStorage(audioFile, audioFile.name);
      }

      if (finalUrl.startsWith("blob:")) {
        throw new Error("Cannot save temporary blob URL. Please upload a file or click 'Trim & Save Song'.");
      }

      await onSave({
        id: track?.id,
        title: title.trim(),
        artist: artist.trim() || "Wedding Music",
        url: finalUrl,
        isActive: track?.isActive,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to save track");
    } finally {
      setIsTrimming(false);
      setStatusMessage("");
    }
  };

  if (!isOpen) return null;

  const clipDuration = Math.max(0, endTime - startTime);
  const displayDuration = duration > 0 ? duration : Math.max(60, endTime);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#FCFAF6] border border-[#E9E1D5] p-6 sm:p-8 text-[#202020] shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E9E1D5] pb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#202020] text-[#C9B38C]">
              <Scissors className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-editorial-serif text-2xl text-[#202020]">
                {track?.id ? "Edit & Trim Song" : "Upload & Trim Music"}
              </h3>
              <p className="text-xs text-[#736B63]">
                Select the middle 1-minute clip for the wedding walk or ambient background.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleTrimAndSave} className="space-y-5">
          {/* Title & Artist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#5A524A]">Song Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Perfect"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E9E1D5] bg-white text-[#202020] focus:ring-1 focus:ring-[#C9B38C] focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#5A524A]">Artist / Ceremony Tag</label>
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="e.g. Ed Sheeran (Acoustic)"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E9E1D5] bg-white text-[#202020] focus:ring-1 focus:ring-[#C9B38C] focus:outline-none"
              />
            </div>
          </div>

          {/* Audio Source Picker */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#5A524A] flex items-center justify-between">
              <span>Audio File or URL *</span>
              <span className="text-[11px] text-[#9E814D]">Supports MP3, WAV, AAC, M4A</span>
            </label>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
                placeholder="Paste audio URL or upload file below..."
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-[#E9E1D5] bg-white text-[#202020] focus:ring-1 focus:ring-[#C9B38C] focus:outline-none"
              />

              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-lg bg-[#202020] text-[#FCFAF6] text-xs font-medium hover:bg-[#38332E] transition-colors flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
              >
                <Upload className="w-3.5 h-3.5 text-[#C9B38C]" />
                <span>Upload Audio</span>
              </button>
            </div>
          </div>

          {/* Trimmer Controls Box */}
          <div className="p-5 rounded-xl bg-white border border-[#E9E1D5] space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#202020] flex items-center gap-1.5 uppercase tracking-wider">
                <Scissors className="w-3.5 h-3.5 text-[#9E814D]" />
                <span>Precision Audio Trimmer</span>
              </span>

              {displayDuration > 0 && (
                <span className="text-xs text-[#736B63] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Total: {formatTimeSeconds(displayDuration)}</span>
                </span>
              )}
            </div>

            {isLoadingAudio ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2 text-xs text-[#736B63]">
                <Loader2 className="w-5 h-5 animate-spin text-[#9E814D]" />
                <span>Loading audio waveform...</span>
              </div>
            ) : audioUrl ? (
              <div className="space-y-4">
                {/* Visual duration bar */}
                <div className="space-y-1">
                  <div className="relative h-7 bg-stone-100 rounded-lg overflow-hidden border border-stone-200">
                    {/* Active Trimmed Zone Highlight */}
                    <div
                      className="absolute top-0 bottom-0 bg-[#C9B38C]/40 border-l-2 border-r-2 border-[#9E814D] transition-all"
                      style={{
                        left: `${(startTime / displayDuration) * 100}%`,
                        width: `${Math.max(2, ((endTime - startTime) / displayDuration) * 100)}%`,
                      }}
                    />

                    {/* Current Playhead indicator */}
                    {isPlayingPreview && (
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-red-600 shadow-sm z-10"
                        style={{ left: `${(currentTime / displayDuration) * 100}%` }}
                      />
                    )}
                  </div>

                  <div className="flex justify-between text-[10px] text-stone-500 font-mono">
                    <span>00:00</span>
                    <span className="font-semibold text-[#9E814D]">
                      Selected: {formatTimeSeconds(startTime)} — {formatTimeSeconds(endTime)} ({clipDuration}s)
                    </span>
                    <span>{formatTimeSeconds(displayDuration)}</span>
                  </div>
                </div>

                {/* Range Sliders for Start & End Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#5A524A]">Start Time</span>
                      <span className="font-mono font-semibold text-[#202020]">
                        {formatTimeSeconds(startTime)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={Math.max(0, endTime - 1)}
                      value={startTime}
                      onChange={(e) => handleStartTimeChange(Number(e.target.value))}
                      className="w-full accent-[#202020] cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#5A524A]">End Time</span>
                      <span className="font-mono font-semibold text-[#202020]">
                        {formatTimeSeconds(endTime)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={startTime + 1}
                      max={displayDuration}
                      value={endTime}
                      onChange={(e) => handleEndTimeChange(Number(e.target.value))}
                      className="w-full accent-[#202020] cursor-pointer"
                    />
                  </div>
                </div>

                {/* Quick Presets & Preview */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleQuickMiddleOneMin}
                      className="px-3 py-1.5 rounded-full border border-[#C9B38C] bg-[#FCFAF6] text-[#202020] hover:bg-[#E9E1D5] text-[11px] font-medium transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <Sparkles className="w-3 h-3 text-[#9E814D]" />
                      <span>Middle 1-Min Clip</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleQuickThirtySec}
                      className="px-3 py-1.5 rounded-full border border-stone-200 bg-white text-[#5A524A] hover:bg-stone-50 text-[11px] font-medium transition-colors"
                    >
                      <span>30s Highlight</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={togglePlayPreview}
                    className="px-4 py-1.5 rounded-full bg-[#202020] text-white hover:bg-[#342F2A] text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    {isPlayingPreview ? (
                      <>
                        <Pause className="w-3.5 h-3.5 text-[#C9B38C]" />
                        <span>Pause Preview</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 text-[#C9B38C] fill-[#C9B38C]" />
                        <span>Preview Trimmed Clip</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#8C847B] italic text-center py-2">
                Enter an audio URL or upload an audio file above to enable interactive waveform trimming.
              </p>
            )}
          </div>

          {/* Feedback & Error alerts */}
          {statusMessage && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2 animate-fade-in">
              <Loader2 className="w-4 h-4 animate-spin text-amber-600 flex-shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs animate-fade-in">
              {errorMessage}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E9E1D5]">
            <button
              type="button"
              onClick={onClose}
              disabled={isTrimming}
              className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-medium transition-colors"
            >
              Cancel
            </button>

            {audioUrl && (
              <button
                type="button"
                onClick={handleSaveWithoutTrim}
                disabled={isTrimming}
                className="px-4 py-2.5 rounded-xl border border-[#C9B38C] text-[#202020] hover:bg-[#FCFAF6] text-xs font-medium transition-colors"
              >
                Save Without Trimming
              </button>
            )}

            <button
              type="submit"
              disabled={isTrimming || !audioUrl}
              className="px-6 py-2.5 rounded-xl bg-[#202020] text-white hover:bg-[#342F2A] text-xs font-semibold tracking-wider uppercase transition-colors shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              {isTrimming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#C9B38C]" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Scissors className="w-4 h-4 text-[#C9B38C]" />
                  <span>Trim &amp; Save Song</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
