import fs from "fs";
import path from "path";
import { put, list, get } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import {
  WeddingData,
  WeddingDetails,
  CoupleInfo,
  StoryItem,
  WeddingEvent,
  TimelineItem,
  VenueInfo,
  GalleryItem,
  FamilyInfo,
  RSVPRecord,
  GuestWishRecord,
  ShagunRecord,
  MusicTrack,
  SectionVisibility,
} from "@/types/wedding";
import { initialWeddingData } from "@/data/defaultData";

const isVercel = process.env.VERCEL === "1";
const REPO_STORE_PATH = path.join(process.cwd(), "data", "wedding-store.json");
const DATA_DIR = isVercel ? "/tmp" : path.join(process.cwd(), "data");
const STORE_PATH = isVercel ? path.join("/tmp", "wedding-store.json") : REPO_STORE_PATH;
const BLOB_STORE_PATH = "wedding-data/store.json";

// In-memory cache for fast read performance within runtime lifecycle
let memoryCache: WeddingData | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 1500; // 1.5 seconds TTL
let storeVersion = 0;

export function getStoreVersion(): number {
  if (memoryCache?.wedding?.updatedAt) {
    return new Date(memoryCache.wedding.updatedAt).getTime();
  }
  return storeVersion;
}

export function normalizeMediaUrl(url: any): any {
  if (typeof url !== "string" || !url) return url;
  const trimmed = url.trim();
  // If already proxied, leave as is
  if (trimmed.startsWith("/api/media-proxy") || trimmed.startsWith("/api/audio-proxy")) {
    return trimmed;
  }
  // If it's a private Vercel blob URL (or any vercel storage blob URL), route through media-proxy
  if (
    trimmed.includes("blob.vercel-storage.com") &&
    !trimmed.includes("/api/media-proxy?url=") &&
    !trimmed.includes("/api/audio-proxy?url=")
  ) {
    return `/api/media-proxy?url=${encodeURIComponent(trimmed)}`;
  }
  return trimmed;
}

export function sanitizeMediaUrls<T>(obj: T): T {
  if (typeof obj === "string") {
    return normalizeMediaUrl(obj) as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeMediaUrls(item)) as unknown as T;
  }
  if (obj && typeof obj === "object") {
    const res: any = {};
    for (const [key, value] of Object.entries(obj)) {
      res[key] = sanitizeMediaUrls(value);
    }
    return res;
  }
  return obj;
}

function deepMergeWeddingData(parsed: any): WeddingData {
  if (!parsed || typeof parsed !== "object") {
    return initialWeddingData;
  }
  const cleanParsed = sanitizeMediaUrls(parsed);
  return {
    ...initialWeddingData,
    ...cleanParsed,
    wedding: {
      ...initialWeddingData.wedding,
      ...(cleanParsed.wedding || {}),
      textStyling: {
        ...(initialWeddingData.wedding.textStyling as any),
        ...(cleanParsed.wedding?.textStyling || {}),
      },
    },
    couple: {
      ...initialWeddingData.couple,
      ...(cleanParsed.couple || {}),
    },
    family: {
      ...initialWeddingData.family,
      ...(cleanParsed.family || {}),
    },
    sectionVisibility: {
      ...initialWeddingData.sectionVisibility,
      ...(cleanParsed.sectionVisibility || {}),
    },
    venue: {
      ...initialWeddingData.venue,
      ...(cleanParsed.venue || {}),
    },
    events: Array.isArray(cleanParsed.events) ? cleanParsed.events : initialWeddingData.events,
    story: Array.isArray(cleanParsed.story) ? cleanParsed.story : initialWeddingData.story,
    timeline: Array.isArray(cleanParsed.timeline) ? cleanParsed.timeline : initialWeddingData.timeline,
    gallery: Array.isArray(cleanParsed.gallery) ? cleanParsed.gallery : initialWeddingData.gallery,
    rsvps: Array.isArray(cleanParsed.rsvps) ? cleanParsed.rsvps : initialWeddingData.rsvps,
    wishes: Array.isArray(cleanParsed.wishes) ? cleanParsed.wishes : initialWeddingData.wishes,
    shagun: Array.isArray(cleanParsed.shagun) ? cleanParsed.shagun : initialWeddingData.shagun,
    musicLibrary: Array.isArray(cleanParsed.musicLibrary) ? cleanParsed.musicLibrary : initialWeddingData.musicLibrary,
  };
}

function readLocalDisk(): any {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, "utf-8");
      return JSON.parse(raw);
    }
    if (fs.existsSync(REPO_STORE_PATH)) {
      const raw = fs.readFileSync(REPO_STORE_PATH, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Could not read local store file:", err);
  }
  return initialWeddingData;
}

function writeLocalBackup(data: WeddingData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
    if (!isVercel && fs.existsSync(path.dirname(REPO_STORE_PATH))) {
      fs.writeFileSync(REPO_STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
    }
  } catch {
    // Ignore errors on read-only serverless filesystems
  }
}

let runtimeTokenOverride: string | null = null;

export function setBlobTokenOverride(token: string | null): void {
  runtimeTokenOverride = token ? token.trim() : null;
  if (token) {
    try {
      if (fs.existsSync("/tmp")) {
        fs.writeFileSync("/tmp/active_blob_token.txt", token.trim(), "utf-8");
      }
    } catch {}
  } else {
    try {
      if (fs.existsSync("/tmp/active_blob_token.txt")) {
        fs.unlinkSync("/tmp/active_blob_token.txt");
      }
    } catch {}
  }
}

export function getBlobToken(): string | undefined {
  if (runtimeTokenOverride && runtimeTokenOverride.startsWith("vercel_blob_rw_")) {
    return runtimeTokenOverride;
  }
  try {
    if (fs.existsSync("/tmp/active_blob_token.txt")) {
      const fileToken = fs.readFileSync("/tmp/active_blob_token.txt", "utf-8").trim();
      if (fileToken.startsWith("vercel_blob_rw_")) {
        runtimeTokenOverride = fileToken;
        return fileToken;
      }
    }
  } catch {}

  // Static property accesses ensure Next.js / Webpack bundles these environment variables
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return process.env.BLOB_READ_WRITE_TOKEN;
  }
  if ((process.env as any).KEVINSTORAGE_READ_WRITE_TOKEN) {
    return (process.env as any).KEVINSTORAGE_READ_WRITE_TOKEN;
  }
  if ((process.env as any).KEVIN_STORAGE_READ_WRITE_TOKEN) {
    return (process.env as any).KEVIN_STORAGE_READ_WRITE_TOKEN;
  }
  if ((process.env as any).STORAGE_READ_WRITE_TOKEN) {
    return (process.env as any).STORAGE_READ_WRITE_TOKEN;
  }
  if ((process.env as any).VERCEL_BLOB_READ_WRITE_TOKEN) {
    return (process.env as any).VERCEL_BLOB_READ_WRITE_TOKEN;
  }
  // 1. Detect any env var ending in _READ_WRITE_TOKEN or containing BLOB
  for (const [key, val] of Object.entries(process.env)) {
    if (
      typeof val === "string" &&
      (key.endsWith("_READ_WRITE_TOKEN") || key.includes("BLOB")) &&
      val.startsWith("vercel_blob_rw_")
    ) {
      return val;
    }
  }
  // 2. Fallback: inspect all env vars for any standard Vercel Blob read-write prefix
  for (const [, val] of Object.entries(process.env)) {
    if (typeof val === "string" && val.startsWith("vercel_blob_rw_")) {
      return val;
    }
  }
  return undefined;
}

async function readStream(stream: any): Promise<string> {
  if (!stream) return "";
  if (typeof stream === "string") return stream;
  if (Buffer.isBuffer(stream)) return stream.toString("utf-8");
  if (typeof stream.text === "function") {
    try {
      return await stream.text();
    } catch {}
  }
  try {
    const chunks: Buffer[] = [];
    if (typeof stream[Symbol.asyncIterator] === "function") {
      for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      return Buffer.concat(chunks).toString("utf-8");
    }
  } catch {}
  try {
    return await new Response(stream).text();
  } catch {}
  try {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    return Buffer.concat(chunks).toString("utf-8");
  } catch {
    return "";
  }
}

async function readBlobStore(): Promise<any | null> {
  const token = getBlobToken();
  if (!token) return null;

  // 1. Try reading with private access first (matches Private stores like kevinstorage)
  try {
    const res = await get(BLOB_STORE_PATH, { access: "private", token, useCache: false });
    if (res && res.statusCode === 200 && res.stream) {
      const text = await readStream(res.stream);
      if (text && text.trim().startsWith("{")) {
        return JSON.parse(text);
      }
    }
  } catch (err: any) {
    console.warn("[Vercel Blob] Private get error:", err?.message || err);
  }

  // 2. Try reading with public access (if store is Public)
  try {
    const res = await get(BLOB_STORE_PATH, { access: "public", token, useCache: false });
    if (res && res.statusCode === 200 && res.stream) {
      const text = await readStream(res.stream);
      if (text && text.trim().startsWith("{")) {
        return JSON.parse(text);
      }
    }
  } catch (err: any) {
    console.warn("[Vercel Blob] Public get error:", err?.message || err);
  }

  // 3. Fallback: list()
  try {
    const { blobs } = await list({ prefix: BLOB_STORE_PATH, token });
    if (blobs && blobs.length > 0) {
      const newest = blobs.sort(
        (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      )[0];
      try {
        const res = await get(newest.url, { access: "private", token, useCache: false });
        if (res && res.statusCode === 200 && res.stream) {
          const text = await readStream(res.stream);
          if (text && text.trim().startsWith("{")) {
            return JSON.parse(text);
          }
        }
      } catch {}
      try {
        const res = await get(newest.url, { access: "public", token, useCache: false });
        if (res && res.statusCode === 200 && res.stream) {
          const text = await readStream(res.stream);
          if (text && text.trim().startsWith("{")) {
            return JSON.parse(text);
          }
        }
      } catch {}
      if (newest.downloadUrl) {
        try {
          const fetchRes = await fetch(newest.downloadUrl, {
            cache: "no-store",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (fetchRes.ok) {
            return await fetchRes.json();
          }
        } catch {}
      }
    }
  } catch (listErr) {
    console.warn("Blob list fallback error:", listErr);
  }

  return null;
}

export interface BlobSyncResult {
  blobSaved: boolean;
  isConfigured: boolean;
  isStoreBlocked?: boolean;
  blobError?: string;
  url?: string;
}

export async function writeBlobStore(data: WeddingData, overrideToken?: string): Promise<BlobSyncResult> {
  const token = overrideToken || getBlobToken();
  if (!token) {
    console.warn("[Vercel Blob] No Blob token found in environment variables.");
    return {
      blobSaved: false,
      isConfigured: false,
      blobError: "BLOB_READ_WRITE_TOKEN is missing in environment variables",
    };
  }

  const jsonStr = JSON.stringify(data, null, 2);

  // 1. Try private access first (matches Private store configuration like kevinstorage)
  try {
    const blob = await put(BLOB_STORE_PATH, jsonStr, {
      access: "private",
      token,
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    console.log("[Vercel Blob] Successfully saved to private store:", blob.url);
    return { blobSaved: true, isConfigured: true, url: blob.url };
  } catch (privErr: any) {
    console.warn("[Vercel Blob] Private put failed, trying public access:", privErr?.message || privErr);
    // 2. Fall back to public access (if store was created as Public)
    try {
      const blob = await put(BLOB_STORE_PATH, jsonStr, {
        access: "public",
        token,
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      });
      console.log("[Vercel Blob] Successfully saved to public store:", blob.url);
      return { blobSaved: true, isConfigured: true, url: blob.url };
    } catch (pubErr: any) {
      const privMsg = privErr?.message || String(privErr);
      const pubMsg = pubErr?.message || String(pubErr);
      const isSuspended =
        privMsg.toLowerCase().includes("suspend") ||
        pubMsg.toLowerCase().includes("suspend") ||
        privMsg.toLowerCase().includes("block") ||
        pubMsg.toLowerCase().includes("block") ||
        privErr?.status === 403 ||
        pubErr?.status === 403;

      const errMsg = isSuspended
        ? "Vercel Blob store is suspended/blocked by Vercel. Please unsuspend it in Vercel Dashboard or connect a new store token."
        : `Private write: ${privMsg} | Public write: ${pubMsg}`;

      console.error("[Vercel Blob] Both private and public writes failed:", errMsg);
      return {
        blobSaved: false,
        isConfigured: true,
        isStoreBlocked: isSuspended,
        blobError: errMsg,
      };
    }
  }
}

export interface BlobHealthCheck {
  configured: boolean;
  isVercel: boolean;
  tokenPreview?: string;
  isStoreBlocked: boolean;
  blockReason?: string;
  canRead: boolean;
  canWrite: boolean;
  storeBlobFound: boolean;
  storeBlobSize?: number;
  totalBlobsInStore: number;
}

export async function checkBlobStoreHealth(overrideToken?: string): Promise<BlobHealthCheck> {
  const token = overrideToken || getBlobToken();
  const isVercel = process.env.VERCEL === "1";
  if (!token) {
    return {
      configured: false,
      isVercel,
      isStoreBlocked: false,
      canRead: false,
      canWrite: false,
      storeBlobFound: false,
      totalBlobsInStore: 0,
    };
  }

  const tokenPreview = `${token.slice(0, 15)}...${token.slice(-4)}`;
  let isStoreBlocked = false;
  let blockReason: string | undefined = undefined;
  let storeBlobFound = false;
  let storeBlobSize: number | undefined = undefined;
  let totalBlobs = 0;
  let canRead = false;
  let canWrite = false;

  try {
    const listRes = await list({ limit: 100, token });
    totalBlobs = listRes.blobs.length;
    const storeBlob = listRes.blobs.find((b) => b.pathname === BLOB_STORE_PATH);
    if (storeBlob) {
      storeBlobFound = true;
      storeBlobSize = storeBlob.size;
    }
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (msg.toLowerCase().includes("suspend") || msg.toLowerCase().includes("block") || err?.status === 403) {
      isStoreBlocked = true;
      blockReason = msg;
    }
  }

  // Test reading store.json
  try {
    const res = await get(BLOB_STORE_PATH, { access: "private", token, useCache: false });
    if (res && res.statusCode === 200) {
      canRead = true;
    }
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (
      msg.toLowerCase().includes("suspend") ||
      msg.toLowerCase().includes("block") ||
      msg.toLowerCase().includes("forbidden") ||
      msg.includes("403") ||
      err?.status === 403
    ) {
      isStoreBlocked = true;
      blockReason = msg;
    }
  }

  // If wedding-data/store.json exists in store but reading fails (e.g. 403), mark store as blocked
  if (storeBlobFound && !canRead) {
    isStoreBlocked = true;
    if (!blockReason) {
      blockReason = "Vercel Blob store is suspended/blocked by Vercel (HTTP 403 Forbidden).";
    }
  }

  if (!isStoreBlocked && canRead) {
    canWrite = true;
  }

  return {
    configured: true,
    isVercel,
    tokenPreview,
    isStoreBlocked,
    blockReason,
    canRead,
    canWrite,
    storeBlobFound,
    storeBlobSize,
    totalBlobsInStore: totalBlobs,
  };
}

async function ensureStore(forceFresh: boolean = false): Promise<WeddingData> {
  const token = getBlobToken();
  const hasBlobToken = Boolean(token);

  if (!forceFresh && memoryCache && Date.now() - lastCacheTime < CACHE_TTL_MS) {
    return memoryCache;
  }

  // 1. If Vercel Blob is configured (production or local with token)
  if (hasBlobToken) {
    try {
      const remoteData = await readBlobStore();
      if (remoteData) {
        const remoteTime = remoteData.wedding?.updatedAt
          ? new Date(remoteData.wedding.updatedAt).getTime()
          : 0;
        const localCacheTime = memoryCache?.wedding?.updatedAt
          ? new Date(memoryCache.wedding.updatedAt).getTime()
          : 0;

        // If local memory cache has a newer modification, do not downgrade to stale remote data
        if (!memoryCache || remoteTime >= localCacheTime) {
          const merged = deepMergeWeddingData(remoteData);
          memoryCache = merged;
          lastCacheTime = Date.now();
          storeVersion = remoteTime || Date.now();
          writeLocalBackup(merged);
          return merged;
        } else {
          return memoryCache;
        }
      }
    } catch (blobErr: any) {
      console.warn("Vercel Blob read error:", blobErr?.message || blobErr);
    }
  }

  // If memoryCache exists and remote reading failed or returned null (e.g. store suspended):
  // Preserve memoryCache so active edits in current instance are never lost!
  if (memoryCache) {
    return memoryCache;
  }

  // 2. Fallback to local filesystem
  const local = readLocalDisk();
  const merged = deepMergeWeddingData(local);
  memoryCache = merged;
  lastCacheTime = Date.now();
  storeVersion = merged.wedding?.updatedAt
    ? new Date(merged.wedding.updatedAt).getTime()
    : Date.now();
  return merged;
}

export async function syncCurrentStoreToBlob(): Promise<BlobSyncResult> {
  const current = await ensureStore(true);
  return await writeBlobStore(current);
}

async function saveStore(data: WeddingData): Promise<BlobSyncResult> {
  const nowIso = new Date().toISOString();
  const nowMs = new Date(nowIso).getTime();

  const merged = deepMergeWeddingData({
    ...data,
    wedding: {
      ...data.wedding,
      updatedAt: nowIso,
    },
  });

  memoryCache = merged;
  lastCacheTime = Date.now();
  storeVersion = nowMs;

  writeLocalBackup(merged);

  try {
    revalidatePath("/");
    revalidatePath("/admin");
  } catch {}

  const hasBlobToken = Boolean(getBlobToken());
  if (hasBlobToken) {
    return await writeBlobStore(merged);
  }
  return {
    blobSaved: false,
    isConfigured: false,
    blobError: "BLOB_READ_WRITE_TOKEN is not defined in environment variables",
  };
}

export async function getWeddingData(forceFresh: boolean = false): Promise<WeddingData> {
  return await ensureStore(forceFresh);
}

export type MutationResult<T> = T & {
  data: T;
  sync: BlobSyncResult;
};

export async function updateWeddingDetails(updates: Partial<WeddingDetails>): Promise<MutationResult<WeddingDetails>> {
  const data = await ensureStore(false);
  const nowIso = new Date().toISOString();
  data.wedding = {
    ...data.wedding,
    ...updates,
    updatedAt: nowIso,
  };
  const sync = await saveStore(data);
  return Object.assign({}, data.wedding, { data: data.wedding, sync });
}

export async function updateCoupleInfo(updates: Partial<CoupleInfo>): Promise<MutationResult<CoupleInfo>> {
  const data = await ensureStore(false);
  data.couple = {
    ...data.couple,
    ...updates,
  };
  const sync = await saveStore(data);
  return Object.assign({}, data.couple, { data: data.couple, sync });
}

export async function updateSectionVisibility(updates: Partial<SectionVisibility>): Promise<MutationResult<SectionVisibility>> {
  const data = await ensureStore(false);
  data.sectionVisibility = {
    ...data.sectionVisibility,
    ...updates,
  };
  const sync = await saveStore(data);
  return Object.assign({}, data.sectionVisibility, { data: data.sectionVisibility, sync });
}

export async function getEvents(): Promise<WeddingEvent[]> {
  const data = await ensureStore();
  return (data.events || []).sort((a, b) => a.order - b.order);
}

export async function createEvent(event: Omit<WeddingEvent, "id">): Promise<MutationResult<WeddingEvent>> {
  const data = await ensureStore(false);
  const newEvent: WeddingEvent = {
    ...event,
    id: `event-${Date.now()}`,
    order: event.order ?? (data.events.length + 1),
  };
  data.events.push(newEvent);
  const sync = await saveStore(data);
  return Object.assign({}, newEvent, { data: newEvent, sync });
}

export async function updateEvent(id: string, updates: Partial<WeddingEvent>): Promise<MutationResult<WeddingEvent>> {
  const data = await ensureStore(false);
  const idx = data.events.findIndex((e) => e.id === id);
  if (idx === -1) throw new Error("Event not found");
  data.events[idx] = { ...data.events[idx], ...updates };
  const sync = await saveStore(data);
  return Object.assign({}, data.events[idx], { data: data.events[idx], sync });
}

export async function deleteEvent(id: string): Promise<{ success: boolean; sync: BlobSyncResult }> {
  const data = await ensureStore(false);
  data.events = data.events.filter((e) => e.id !== id);
  const sync = await saveStore(data);
  return { success: true, sync };
}

export async function reorderEvents(orderedIds: string[]): Promise<{ data: WeddingEvent[]; sync: BlobSyncResult }> {
  const data = await ensureStore(false);
  data.events.forEach((evt) => {
    const idx = orderedIds.indexOf(evt.id);
    if (idx !== -1) {
      evt.order = idx + 1;
    }
  });
  data.events.sort((a, b) => a.order - b.order);
  const sync = await saveStore(data);
  return { data: data.events, sync };
}

export async function updateStory(items: StoryItem[]): Promise<{ data: StoryItem[]; sync: BlobSyncResult }> {
  const data = await ensureStore(false);
  data.story = items;
  const sync = await saveStore(data);
  return { data: data.story, sync };
}

export async function updateTimeline(items: TimelineItem[]): Promise<{ data: TimelineItem[]; sync: BlobSyncResult }> {
  const data = await ensureStore(false);
  data.timeline = items;
  const sync = await saveStore(data);
  return { data: data.timeline, sync };
}

export async function updateVenue(updates: Partial<VenueInfo>): Promise<MutationResult<VenueInfo>> {
  const data = await ensureStore(false);
  data.venue = { ...data.venue, ...updates };
  const sync = await saveStore(data);
  return Object.assign({}, data.venue, { data: data.venue, sync });
}

export async function getGallery(): Promise<GalleryItem[]> {
  const data = await ensureStore();
  return (data.gallery || []).sort((a, b) => a.order - b.order);
}

export async function addGalleryItem(item: Omit<GalleryItem, "id">): Promise<MutationResult<GalleryItem>> {
  const data = await ensureStore(false);
  const newItem: GalleryItem = {
    ...item,
    id: `gal-${Date.now()}`,
    order: item.order ?? (data.gallery.length + 1),
  };
  data.gallery.push(newItem);
  const sync = await saveStore(data);
  return Object.assign({}, newItem, { data: newItem, sync });
}

export async function deleteGalleryItem(id: string): Promise<{ success: boolean; sync: BlobSyncResult }> {
  const data = await ensureStore(false);
  data.gallery = data.gallery.filter((g) => g.id !== id);
  const sync = await saveStore(data);
  return { success: true, sync };
}

export async function updateGallery(items: GalleryItem[]): Promise<{ data: GalleryItem[]; sync: BlobSyncResult }> {
  const data = await ensureStore(false);
  data.gallery = items;
  const sync = await saveStore(data);
  return { data: data.gallery, sync };
}

export async function updateFamily(updates: Partial<FamilyInfo>): Promise<MutationResult<FamilyInfo>> {
  const data = await ensureStore(false);
  data.family = { ...data.family, ...updates };
  const sync = await saveStore(data);
  return Object.assign({}, data.family, { data: data.family, sync });
}

export async function getRSVPs(): Promise<RSVPRecord[]> {
  const data = await ensureStore();
  return data.rsvps || [];
}

export async function addRSVP(entry: Omit<RSVPRecord, "id" | "submittedAt">): Promise<MutationResult<RSVPRecord>> {
  const data = await ensureStore(true);
  const newRsvp: RSVPRecord = {
    ...entry,
    id: `rsvp-${Date.now()}`,
    submittedAt: new Date().toISOString(),
  };
  data.rsvps.unshift(newRsvp);
  const sync = await saveStore(data);
  return Object.assign({}, newRsvp, { data: newRsvp, sync });
}

export async function deleteRSVP(id: string): Promise<{ success: boolean; sync: BlobSyncResult }> {
  const data = await ensureStore(true);
  data.rsvps = data.rsvps.filter((r) => r.id !== id);
  const sync = await saveStore(data);
  return { success: true, sync };
}

export async function getWishes(): Promise<GuestWishRecord[]> {
  const data = await ensureStore();
  return data.wishes || [];
}

export async function addWish(entry: { name: string; message: string }): Promise<MutationResult<GuestWishRecord>> {
  const data = await ensureStore(true);
  const newWish: GuestWishRecord = {
    id: `wish-${Date.now()}`,
    name: entry.name,
    message: entry.message,
    status: "pending",
    submittedAt: new Date().toISOString(),
  };
  data.wishes.unshift(newWish);
  const sync = await saveStore(data);
  return Object.assign({}, newWish, { data: newWish, sync });
}

export async function updateWishStatus(id: string, status: "pending" | "approved" | "hidden"): Promise<MutationResult<GuestWishRecord>> {
  const data = await ensureStore(true);
  const wish = data.wishes.find((w) => w.id === id);
  if (!wish) throw new Error("Wish not found");
  wish.status = status;
  const sync = await saveStore(data);
  return Object.assign({}, wish, { data: wish, sync });
}

export async function deleteWish(id: string): Promise<{ success: boolean; sync: BlobSyncResult }> {
  const data = await ensureStore(true);
  data.wishes = data.wishes.filter((w) => w.id !== id);
  const sync = await saveStore(data);
  return { success: true, sync };
}

// --- SHAGUN / MONEY COLLECTION REPOSITORY ---
export async function getShagun(): Promise<ShagunRecord[]> {
  const data = await ensureStore();
  return data.shagun || [];
}

export async function addShagun(entry: Omit<ShagunRecord, "id" | "date">): Promise<MutationResult<ShagunRecord>> {
  const data = await ensureStore(true);
  const newEntry: ShagunRecord = {
    ...entry,
    id: `shagun-${Date.now()}`,
    date: new Date().toISOString(),
  };
  if (!data.shagun) data.shagun = [];
  data.shagun.unshift(newEntry);
  const sync = await saveStore(data);
  return Object.assign({}, newEntry, { data: newEntry, sync });
}

export async function updateShagun(id: string, updates: Partial<ShagunRecord>): Promise<MutationResult<ShagunRecord>> {
  const data = await ensureStore(true);
  if (!data.shagun) data.shagun = [];
  const idx = data.shagun.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error("Shagun record not found");
  data.shagun[idx] = { ...data.shagun[idx], ...updates };
  const sync = await saveStore(data);
  return Object.assign({}, data.shagun[idx], { data: data.shagun[idx], sync });
}

export async function deleteShagun(id: string): Promise<{ success: boolean; sync: BlobSyncResult }> {
  const data = await ensureStore(true);
  if (!data.shagun) data.shagun = [];
  data.shagun = data.shagun.filter((s) => s.id !== id);
  const sync = await saveStore(data);
  return { success: true, sync };
}

// --- MUSIC LIBRARY REPOSITORY ---
export async function getMusicLibrary(): Promise<MusicTrack[]> {
  const data = await ensureStore();
  return data.musicLibrary || [];
}

export async function addMusicTrack(track: Omit<MusicTrack, "id" | "addedAt">): Promise<MutationResult<MusicTrack>> {
  const data = await ensureStore(true);
  if (!data.musicLibrary) data.musicLibrary = [];
  const newTrack: MusicTrack = {
    ...track,
    id: `music-${Date.now()}`,
    addedAt: new Date().toISOString(),
  };
  if (newTrack.isActive) {
    data.musicLibrary.forEach((m) => (m.isActive = false));
    data.wedding.ambientMusicUrl = newTrack.url;
  }
  data.musicLibrary.push(newTrack);
  const sync = await saveStore(data);
  return Object.assign({}, newTrack, { data: newTrack, sync });
}

export async function setActiveMusicTrack(id: string): Promise<MutationResult<MusicTrack>> {
  const data = await ensureStore(true);
  if (!data.musicLibrary) data.musicLibrary = [];
  let selectedTrack: MusicTrack | null = null;
  data.musicLibrary.forEach((m) => {
    if (m.id === id) {
      m.isActive = true;
      selectedTrack = m;
    } else {
      m.isActive = false;
    }
  });
  if (!selectedTrack) throw new Error("Track not found");
  data.wedding.ambientMusicUrl = (selectedTrack as MusicTrack).url;
  const sync = await saveStore(data);
  return Object.assign({}, selectedTrack, { data: selectedTrack, sync });
}

export async function updateMusicTrack(id: string, updates: Partial<MusicTrack>): Promise<MutationResult<MusicTrack>> {
  const data = await ensureStore(true);
  if (!data.musicLibrary) data.musicLibrary = [];
  const idx = data.musicLibrary.findIndex((m) => m.id === id);
  if (idx === -1) throw new Error("Track not found");
  data.musicLibrary[idx] = { ...data.musicLibrary[idx], ...updates };
  if (updates.isActive || data.musicLibrary[idx].isActive) {
    if (updates.isActive) {
      data.musicLibrary.forEach((m) => {
        if (m.id !== id) m.isActive = false;
      });
    }
    data.wedding.ambientMusicUrl = data.musicLibrary[idx].url;
  }
  const sync = await saveStore(data);
  return Object.assign({}, data.musicLibrary[idx], { data: data.musicLibrary[idx], sync });
}

export async function deleteMusicTrack(id: string): Promise<{ success: boolean; sync: BlobSyncResult }> {
  const data = await ensureStore(true);
  if (!data.musicLibrary) data.musicLibrary = [];
  data.musicLibrary = data.musicLibrary.filter((m) => m.id !== id);
  const sync = await saveStore(data);
  return { success: true, sync };
}

export async function restoreWeddingData(
  fullData: WeddingData
): Promise<{ data: WeddingData; sync: BlobSyncResult }> {
  const current = await ensureStore(true);
  const merged: WeddingData = deepMergeWeddingData({
    ...current,
    ...fullData,
    wedding: {
      ...current.wedding,
      ...(fullData.wedding || {}),
      updatedAt: new Date().toISOString(),
    },
    couple: {
      ...current.couple,
      ...(fullData.couple || {}),
    },
    family: {
      ...current.family,
      ...(fullData.family || {}),
    },
    sectionVisibility: {
      ...current.sectionVisibility,
      ...(fullData.sectionVisibility || {}),
    },
    shagun: fullData.shagun || current.shagun,
    musicLibrary: fullData.musicLibrary || current.musicLibrary,
  });
  const sync = await saveStore(merged);
  return { data: merged, sync };
}
