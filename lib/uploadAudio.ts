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
  if (file.size > MAX_AUDIO_UPLOAD_BYTES) {
    throw new Error(
      `Audio file (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 50MB upload limit. Please trim the song first.`
    );
  }

  const safeName = cleanFileName(fileName || `wedding-audio-${Date.now()}.mp3`);
  const isLocal = isLocalEnvironment();

  // 1. If file is within serverless / direct upload limits (up to 35MB on local, 4.2MB on Vercel),
  // try standard /api/upload first. This avoids external token dependencies completely.
  const directUploadLimit = isLocal ? 35 * 1024 * 1024 : 4.2 * 1024 * 1024;

  if (file.size <= directUploadLimit) {
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
    } catch (directErr) {
      console.warn("Direct upload endpoint failed, proceeding to storage fallback:", directErr);
    }
  }

  // 2. Try Vercel Blob client-side upload for large files or when Blob storage is active
  try {
    const blob = await upload(`music/${Date.now()}-${safeName}`, file, {
      access: "public",
      handleUploadUrl: "/api/upload/blob",
      contentType: file.type || "audio/mpeg",
    });
    return blob.url;
  } catch (error: any) {
    const message = String(error?.message || error || "");

    // 3. If file is under 4.2MB and Vercel Blob fails (token missing or not connected),
    // convert directly to an in-browser base64 data URL so the user is NEVER blocked!
    if (file.size <= 4.2 * 1024 * 1024) {
      try {
        const dataUrl = await blobToDataUrl(file);
        if (dataUrl && dataUrl.startsWith("data:")) {
          return dataUrl;
        }
      } catch (dataUrlErr) {
        console.warn("Base64 Data URL fallback failed:", dataUrlErr);
      }
    }

    const isTokenOrStoreError =
      message.toLowerCase().includes("client token") ||
      message.includes("BLOB_READ_WRITE_TOKEN") ||
      message.toLowerCase().includes("blob store") ||
      message.toLowerCase().includes("store not found");

    if (isTokenOrStoreError) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      throw new Error(
        `Vercel Blob storage is not connected (BLOB_READ_WRITE_TOKEN missing). Because this audio file is ${sizeMb}MB, please either connect a Blob store in your Vercel Dashboard (Storage -> Create Database -> Blob) and redeploy, OR use the Audio Trimmer to trim the clip under 4MB.`
      );
    }

    throw new Error(message || "Could not upload audio to storage.");
  }
}

