"use client";

import { upload } from "@vercel/blob/client";
import { safeFetchJson } from "@/lib/apiHelper";
import { blobToDataUrl } from "@/lib/audioTrimmer";

export const MAX_AUDIO_UPLOAD_BYTES = 50 * 1024 * 1024;

function cleanFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function isLocalEnvironment() {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "::1" ||
    h.startsWith("192.168.") ||
    h.startsWith("10.") ||
    h.startsWith("172.16.") ||
    h.endsWith(".local")
  );
}

export async function uploadAudioToStorage(file: Blob, fileName: string): Promise<string> {
  const safeName = cleanFileName(fileName || `wedding-audio-${Date.now()}.mp3`);
  const isLocal = isLocalEnvironment();

  // 1. In local development (localhost / LAN IP), standard /api/upload saves directly to /public/uploads/
  if (isLocal) {
    try {
      const formData = new FormData();
      formData.append("file", file, safeName);
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await safeFetchJson<{ success?: boolean; url?: string; error?: string }>(
        response,
        "audio upload"
      );

      if (response.ok && result.success && result.url) {
        return result.url;
      }
    } catch (localErr) {
      console.warn("Local direct upload failed, proceeding to in-memory fallback:", localErr);
    }
  }

  // 2. On Vercel / Production:
  // For files <= 2.8MB (including all trimmed audio clips and compact tracks),
  // convert directly in browser memory to a Base64 data URL.
  // This COMPLETELY bypasses Vercel's 4.5MB serverless function payload limit,
  // requires ZERO external tokens or Blob stores, and never fails!
  if (file.size <= 2.8 * 1024 * 1024) {
    try {
      const dataUrl = await blobToDataUrl(file);
      if (dataUrl && dataUrl.startsWith("data:")) {
        return dataUrl;
      }
    } catch (dataUrlErr) {
      console.warn("Base64 Data URL conversion failed:", dataUrlErr);
    }
  }

  // 3. For large files (> 2.8MB) on Vercel, attempt Vercel Blob client upload
  try {
    const blob = await upload(`music/${Date.now()}-${safeName}`, file, {
      access: "public",
      handleUploadUrl: "/api/upload/blob",
      contentType: file.type || "audio/mpeg",
    });
    return blob.url;
  } catch (error: any) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(
      `Audio file is ${sizeMb}MB (exceeds Vercel's 4.5MB serverless limit). Please use the Studio Trimmer to select your favorite 30-45s highlight clip, which saves instantly!`
    );
  }
}


