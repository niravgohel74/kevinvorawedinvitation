"use client";

import { upload } from "@vercel/blob/client";
import { safeFetchJson } from "@/lib/apiHelper";

export const MAX_AUDIO_UPLOAD_BYTES = 50 * 1024 * 1024;

function cleanFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function isLocalEnvironment() {
  return (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  );
}

export async function uploadAudioToStorage(file: Blob, fileName: string): Promise<string> {
  if (file.size > MAX_AUDIO_UPLOAD_BYTES) {
    throw new Error(
      `Audio file (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 50MB upload limit. Please trim the song first.`
    );
  }

  const safeName = cleanFileName(fileName || `wedding-audio-${Date.now()}.mp3`);

  if (isLocalEnvironment()) {
    const formData = new FormData();
    formData.append("file", file, safeName);
    const response = await fetch("/api/upload", { method: "POST", body: formData });
    const result = await safeFetchJson<{ success?: boolean; url?: string; error?: string }>(
      response,
      "audio upload"
    );

    if (!response.ok || !result.success || !result.url) {
      throw new Error(result.error || "Audio upload failed.");
    }
    return result.url;
  }

  try {
    const blob = await upload(`music/${Date.now()}-${safeName}`, file, {
      access: "public",
      handleUploadUrl: "/api/upload/blob",
      contentType: file.type || "audio/mpeg",
    });
    return blob.url;
  } catch (error: any) {
    const message = String(error?.message || error || "");
    if (
      message.includes("BLOB_READ_WRITE_TOKEN") ||
      message.toLowerCase().includes("blob store") ||
      message.toLowerCase().includes("store not found")
    ) {
      throw new Error(
        "Music storage is not connected. Create a Vercel Blob store for this project, then redeploy and try again."
      );
    }
    throw new Error(message || "Could not upload audio to Vercel Blob.");
  }
}
