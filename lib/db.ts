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
let storeVersion = Date.now();

export function getStoreVersion(): number {
  return storeVersion;
}

function deepMergeWeddingData(parsed: any): WeddingData {
  if (!parsed || typeof parsed !== "object") {
    return initialWeddingData;
  }
  return {
    ...initialWeddingData,
    ...parsed,
    wedding: {
      ...initialWeddingData.wedding,
      ...(parsed.wedding || {}),
    },
    couple: {
      ...initialWeddingData.couple,
      ...(parsed.couple || {}),
    },
    family: {
      ...initialWeddingData.family,
      ...(parsed.family || {}),
    },
    sectionVisibility: {
      ...initialWeddingData.sectionVisibility,
      ...(parsed.sectionVisibility || {}),
    },
    venue: {
      ...initialWeddingData.venue,
      ...(parsed.venue || {}),
    },
    events: Array.isArray(parsed.events) ? parsed.events : initialWeddingData.events,
    story: Array.isArray(parsed.story) ? parsed.story : initialWeddingData.story,
    timeline: Array.isArray(parsed.timeline) ? parsed.timeline : initialWeddingData.timeline,
    gallery: Array.isArray(parsed.gallery) ? parsed.gallery : initialWeddingData.gallery,
    rsvps: Array.isArray(parsed.rsvps) ? parsed.rsvps : initialWeddingData.rsvps,
    wishes: Array.isArray(parsed.wishes) ? parsed.wishes : initialWeddingData.wishes,
    shagun: Array.isArray(parsed.shagun) ? parsed.shagun : initialWeddingData.shagun,
    musicLibrary: Array.isArray(parsed.musicLibrary) ? parsed.musicLibrary : initialWeddingData.musicLibrary,
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

export function getBlobToken(): string | undefined {
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
  blobError?: string;
  url?: string;
}

export async function writeBlobStore(data: WeddingData): Promise<BlobSyncResult> {
  const token = getBlobToken();
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
      const errMsg = `Private write: ${privErr?.message || privErr} | Public write: ${pubErr?.message || pubErr}`;
      console.error("[Vercel Blob] Both private and public writes failed:", errMsg);
      return { blobSaved: false, isConfigured: true, blobError: errMsg };
    }
  }
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
        const merged = deepMergeWeddingData(remoteData);
        memoryCache = merged;
        lastCacheTime = Date.now();
        writeLocalBackup(merged);
        return merged;
      }

      // Store doesn't exist yet on Vercel Blob: seed it from repository disk data!
      console.log("[Vercel Blob] Store empty on cloud, auto-seeding from repository default data...");
      const initialDisk = readLocalDisk();
      const mergedInitial = deepMergeWeddingData(initialDisk);
      await writeBlobStore(mergedInitial);
      memoryCache = mergedInitial;
      lastCacheTime = Date.now();
      return mergedInitial;
    } catch (blobErr: any) {
      console.warn("Vercel Blob read error, falling back to local disk:", blobErr?.message || blobErr);
    }
  }

  // 2. Fallback to local filesystem
  const local = readLocalDisk();
  const merged = deepMergeWeddingData(local);
  memoryCache = merged;
  lastCacheTime = Date.now();
  return merged;
}

export async function syncCurrentStoreToBlob(): Promise<BlobSyncResult> {
  const current = await ensureStore(true);
  return await writeBlobStore(current);
}

async function saveStore(data: WeddingData): Promise<BlobSyncResult> {
  const merged = deepMergeWeddingData({
    ...data,
    wedding: {
      ...data.wedding,
      updatedAt: new Date().toISOString(),
    },
  });
  memoryCache = merged;
  lastCacheTime = Date.now();
  storeVersion = Date.now();

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

export async function updateWeddingDetails(updates: Partial<WeddingDetails>): Promise<WeddingDetails> {
  const data = await ensureStore(true);
  data.wedding = {
    ...data.wedding,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await saveStore(data);
  return data.wedding;
}

export async function updateCoupleInfo(updates: Partial<CoupleInfo>): Promise<CoupleInfo> {
  const data = await ensureStore(true);
  data.couple = {
    ...data.couple,
    ...updates,
  };
  await saveStore(data);
  return data.couple;
}

export async function updateSectionVisibility(updates: Partial<SectionVisibility>): Promise<SectionVisibility> {
  const data = await ensureStore(true);
  data.sectionVisibility = {
    ...data.sectionVisibility,
    ...updates,
  };
  await saveStore(data);
  return data.sectionVisibility;
}

export async function getEvents(): Promise<WeddingEvent[]> {
  const data = await ensureStore();
  return (data.events || []).sort((a, b) => a.order - b.order);
}

export async function createEvent(event: Omit<WeddingEvent, "id">): Promise<WeddingEvent> {
  const data = await ensureStore(true);
  const newEvent: WeddingEvent = {
    ...event,
    id: `event-${Date.now()}`,
    order: event.order ?? (data.events.length + 1),
  };
  data.events.push(newEvent);
  await saveStore(data);
  return newEvent;
}

export async function updateEvent(id: string, updates: Partial<WeddingEvent>): Promise<WeddingEvent> {
  const data = await ensureStore(true);
  const idx = data.events.findIndex((e) => e.id === id);
  if (idx === -1) throw new Error("Event not found");
  data.events[idx] = { ...data.events[idx], ...updates };
  await saveStore(data);
  return data.events[idx];
}

export async function deleteEvent(id: string): Promise<boolean> {
  const data = await ensureStore(true);
  data.events = data.events.filter((e) => e.id !== id);
  await saveStore(data);
  return true;
}

export async function reorderEvents(orderedIds: string[]): Promise<WeddingEvent[]> {
  const data = await ensureStore(true);
  data.events.forEach((evt) => {
    const idx = orderedIds.indexOf(evt.id);
    if (idx !== -1) {
      evt.order = idx + 1;
    }
  });
  data.events.sort((a, b) => a.order - b.order);
  await saveStore(data);
  return data.events;
}

export async function updateStory(items: StoryItem[]): Promise<StoryItem[]> {
  const data = await ensureStore(true);
  data.story = items;
  await saveStore(data);
  return data.story;
}

export async function updateTimeline(items: TimelineItem[]): Promise<TimelineItem[]> {
  const data = await ensureStore(true);
  data.timeline = items;
  await saveStore(data);
  return data.timeline;
}

export async function updateVenue(updates: Partial<VenueInfo>): Promise<VenueInfo> {
  const data = await ensureStore(true);
  data.venue = { ...data.venue, ...updates };
  await saveStore(data);
  return data.venue;
}

export async function getGallery(): Promise<GalleryItem[]> {
  const data = await ensureStore();
  return (data.gallery || []).sort((a, b) => a.order - b.order);
}

export async function addGalleryItem(item: Omit<GalleryItem, "id">): Promise<GalleryItem> {
  const data = await ensureStore(true);
  const newItem: GalleryItem = {
    ...item,
    id: `gal-${Date.now()}`,
    order: item.order ?? (data.gallery.length + 1),
  };
  data.gallery.push(newItem);
  await saveStore(data);
  return newItem;
}

export async function deleteGalleryItem(id: string): Promise<boolean> {
  const data = await ensureStore(true);
  data.gallery = data.gallery.filter((g) => g.id !== id);
  await saveStore(data);
  return true;
}

export async function updateGallery(items: GalleryItem[]): Promise<GalleryItem[]> {
  const data = await ensureStore(true);
  data.gallery = items;
  await saveStore(data);
  return data.gallery;
}

export async function updateFamily(updates: Partial<FamilyInfo>): Promise<FamilyInfo> {
  const data = await ensureStore(true);
  data.family = { ...data.family, ...updates };
  await saveStore(data);
  return data.family;
}

export async function getRSVPs(): Promise<RSVPRecord[]> {
  const data = await ensureStore();
  return data.rsvps || [];
}

export async function addRSVP(entry: Omit<RSVPRecord, "id" | "submittedAt">): Promise<RSVPRecord> {
  const data = await ensureStore(true);
  const newRsvp: RSVPRecord = {
    ...entry,
    id: `rsvp-${Date.now()}`,
    submittedAt: new Date().toISOString(),
  };
  data.rsvps.unshift(newRsvp);
  await saveStore(data);
  return newRsvp;
}

export async function deleteRSVP(id: string): Promise<boolean> {
  const data = await ensureStore(true);
  data.rsvps = data.rsvps.filter((r) => r.id !== id);
  await saveStore(data);
  return true;
}

export async function getWishes(): Promise<GuestWishRecord[]> {
  const data = await ensureStore();
  return data.wishes || [];
}

export async function addWish(entry: { name: string; message: string }): Promise<GuestWishRecord> {
  const data = await ensureStore(true);
  const newWish: GuestWishRecord = {
    id: `wish-${Date.now()}`,
    name: entry.name,
    message: entry.message,
    status: "pending",
    submittedAt: new Date().toISOString(),
  };
  data.wishes.unshift(newWish);
  await saveStore(data);
  return newWish;
}

export async function updateWishStatus(id: string, status: "pending" | "approved" | "hidden"): Promise<GuestWishRecord> {
  const data = await ensureStore(true);
  const wish = data.wishes.find((w) => w.id === id);
  if (!wish) throw new Error("Wish not found");
  wish.status = status;
  await saveStore(data);
  return wish;
}

export async function deleteWish(id: string): Promise<boolean> {
  const data = await ensureStore(true);
  data.wishes = data.wishes.filter((w) => w.id !== id);
  await saveStore(data);
  return true;
}

// --- SHAGUN / MONEY COLLECTION REPOSITORY ---
export async function getShagun(): Promise<ShagunRecord[]> {
  const data = await ensureStore();
  return data.shagun || [];
}

export async function addShagun(entry: Omit<ShagunRecord, "id" | "date">): Promise<ShagunRecord> {
  const data = await ensureStore(true);
  const newEntry: ShagunRecord = {
    ...entry,
    id: `shagun-${Date.now()}`,
    date: new Date().toISOString(),
  };
  if (!data.shagun) data.shagun = [];
  data.shagun.unshift(newEntry);
  await saveStore(data);
  return newEntry;
}

export async function updateShagun(id: string, updates: Partial<ShagunRecord>): Promise<ShagunRecord> {
  const data = await ensureStore(true);
  if (!data.shagun) data.shagun = [];
  const idx = data.shagun.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error("Shagun record not found");
  data.shagun[idx] = { ...data.shagun[idx], ...updates };
  await saveStore(data);
  return data.shagun[idx];
}

export async function deleteShagun(id: string): Promise<boolean> {
  const data = await ensureStore(true);
  if (!data.shagun) data.shagun = [];
  data.shagun = data.shagun.filter((s) => s.id !== id);
  await saveStore(data);
  return true;
}

// --- MUSIC LIBRARY REPOSITORY ---
export async function getMusicLibrary(): Promise<MusicTrack[]> {
  const data = await ensureStore();
  return data.musicLibrary || [];
}

export async function addMusicTrack(track: Omit<MusicTrack, "id" | "addedAt">): Promise<MusicTrack> {
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
  await saveStore(data);
  return newTrack;
}

export async function setActiveMusicTrack(id: string): Promise<MusicTrack> {
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
  await saveStore(data);
  return selectedTrack;
}

export async function updateMusicTrack(id: string, updates: Partial<MusicTrack>): Promise<MusicTrack> {
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
  await saveStore(data);
  return data.musicLibrary[idx];
}

export async function deleteMusicTrack(id: string): Promise<boolean> {
  const data = await ensureStore(true);
  if (!data.musicLibrary) data.musicLibrary = [];
  data.musicLibrary = data.musicLibrary.filter((m) => m.id !== id);
  await saveStore(data);
  return true;
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
