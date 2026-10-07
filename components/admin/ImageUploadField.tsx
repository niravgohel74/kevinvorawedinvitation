"use client";
import React, { useState, useRef, useEffect } from "react";
import { Upload, Check, Loader2, X, ExternalLink, HardDrive } from "lucide-react";
import { safeFetchJson } from "@/lib/apiHelper";

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  helpText?: string;
  className?: string;
}

export function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ImageUploadField({
  label,
  value,
  onChange,
  placeholder = "https://images.unsplash.com/... or /uploads/...",
  helpText,
  className = "",
}: ImageUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [imageSize, setImageSize] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-detect size of image URL if already present
  useEffect(() => {
    if (!value) {
      setImageSize(null);
      return;
    }
    let isCurrent = true;
    try {
      fetch(value, { method: "HEAD" })
        .then((res) => {
          if (!isCurrent) return;
          const len = res.headers.get("content-length");
          if (len) {
            const parsed = parseInt(len, 10);
            if (!isNaN(parsed) && parsed > 0) {
              setImageSize(formatBytes(parsed));
            }
          }
        })
        .catch(() => {});
    } catch {}

    return () => {
      isCurrent = false;
    };
  }, [value]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formattedSize = formatBytes(file.size);
    setImageSize(formattedSize);
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      if (file.size > 4.2 * 1024 * 1024) {
        throw new Error(
          `Image (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds 4MB limit. Please compress or use an external URL.`
        );
      }

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const resData = await safeFetchJson(res, "image upload");
      if (resData.success && resData.url) {
        onChange(resData.url);
        if (resData.size) {
          setImageSize(formatBytes(resData.size));
        }
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        setUploadError(resData.error || "Failed to upload image");
      }
    } catch (err: any) {
      setUploadError(err?.message || "Error uploading image");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-[#5A524A]">{label}</label>
        {value && (
          <div className="flex items-center gap-2">
            {imageSize && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#F5EFE6] text-[#7A5C28] border border-[#C9B38C]/50 shadow-2xs">
                <HardDrive className="w-2.5 h-2.5 text-[#9E814D]" />
                <span>{imageSize}</span>
              </span>
            )}
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-[#9E814D] hover:underline flex items-center gap-1"
            >
              <span>Preview</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        {/* URL Text Input */}
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={value || ""}
            onChange={(e) => {
              onChange(e.target.value);
              if (!e.target.value) setImageSize(null);
            }}
            placeholder={placeholder}
            className="w-full px-3 py-2 text-xs rounded-lg border border-[#E9E1D5] bg-[#FCFAF6] text-[#202020] placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#C9B38C] pr-8"
          />
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setImageSize(null);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
              title="Clear URL"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Upload File Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-[#C9B38C] text-[#5A524A] hover:bg-[#FCFAF6] hover:text-[#202020] text-xs font-medium transition-colors shadow-sm disabled:opacity-50 whitespace-nowrap"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#9E814D]" />
                <span>{imageSize ? `Uploading (${imageSize})...` : "Uploading..."}</span>
              </>
            ) : uploadSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Uploaded {imageSize ? `(${imageSize})` : ""}</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5 text-[#9E814D]" />
                <span>Upload Image</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Helpful preview thumbnail & feedback */}
      {uploadError && (
        <p className="text-[11px] text-rose-600 animate-fade-in">{uploadError}</p>
      )}

      {value && (
        <div className="flex items-center gap-2.5 pt-1">
          <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-[#E9E1D5] bg-stone-100 flex-shrink-0 shadow-2xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Thumbnail preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#5A524A] font-medium truncate max-w-xs">
                {value.startsWith("/api/media-proxy") || value.startsWith("/uploads/")
                  ? "✓ Uploaded media file"
                  : "External web photo"}
              </span>
              {imageSize && (
                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#EFE9DF] text-[#6B5328] border border-[#C9B38C]/40">
                  {imageSize}
                </span>
              )}
            </div>
            <span className="text-[10px] text-[#8C847B] truncate max-w-xs">{value}</span>
          </div>
        </div>
      )}

      {helpText && <p className="text-[11px] text-[#8C847B]">{helpText}</p>}
    </div>
  );
}
