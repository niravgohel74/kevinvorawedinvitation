import fs from "fs";
import path from "path";
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

function ensureStore(): WeddingData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (e) {
        // Ignored if directory creation restricted
      }
    }
    if (!fs.existsSync(STORE_PATH)) {
      let initialJson = JSON.stringify(initialWeddingData, null, 2);
      if (isVercel && fs.existsSync(REPO_STORE_PATH)) {
        try {
          initialJson = fs.readFileSync(REPO_STORE_PATH, "utf-8");
        } catch {
          initialJson = JSON.stringify(initialWeddingData, null, 2);
        }
      }
      try {
        fs.writeFileSync(STORE_PATH, initialJson, "utf-8");
      } catch (writeErr) {
        console.warn("Could not write to STORE_PATH:", writeErr);
      }
      try {
        return JSON.parse(initialJson);
      } catch {
        return initialWeddingData;
      }
    }
    const raw = fs.readFileSync(STORE_PATH, "utf-8");
    const parsed = JSON.parse(raw);
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
      shagun: parsed.shagun || initialWeddingData.shagun,
      musicLibrary: parsed.musicLibrary || initialWeddingData.musicLibrary,
    };
  } catch (err) {
    console.error("Error reading wedding-store.json, using fallback initial data:", err);
    return initialWeddingData;
  }
}

function saveStore(data: WeddingData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempPath = `${STORE_PATH}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempPath, STORE_PATH);
    if (isVercel) {
      try {
        if (fs.existsSync(REPO_STORE_PATH)) {
          fs.writeFileSync(REPO_STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
        }
      } catch (repoWriteErr) {
        // Ignored on read-only serverless environments
      }
    }
  } catch (err) {
    console.error("Error saving wedding-store.json:", err);
    try {
      fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
    } catch (directWriteErr) {
      console.error("Direct write also failed:", directWriteErr);
    }
  }
}

export async function getWeddingData(): Promise<WeddingData> {
  return ensureStore();
}

export async function updateWeddingDetails(updates: Partial<WeddingDetails>): Promise<WeddingDetails> {
  const data = ensureStore();
  data.wedding = {
    ...data.wedding,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveStore(data);
  return data.wedding;
}

export async function updateCoupleInfo(updates: Partial<CoupleInfo>): Promise<CoupleInfo> {
  const data = ensureStore();
  data.couple = {
    ...data.couple,
    ...updates,
  };
  saveStore(data);
  return data.couple;
}

export async function updateSectionVisibility(updates: Partial<SectionVisibility>): Promise<SectionVisibility> {
  const data = ensureStore();
  data.sectionVisibility = {
    ...data.sectionVisibility,
    ...updates,
  };
  saveStore(data);
  return data.sectionVisibility;
}

export async function getEvents(): Promise<WeddingEvent[]> {
  const data = ensureStore();
  return (data.events || []).sort((a, b) => a.order - b.order);
}

export async function createEvent(event: Omit<WeddingEvent, "id">): Promise<WeddingEvent> {
  const data = ensureStore();
  const newEvent: WeddingEvent = {
    ...event,
    id: `event-${Date.now()}`,
    order: event.order ?? (data.events.length + 1),
  };
  data.events.push(newEvent);
  saveStore(data);
  return newEvent;
}

export async function updateEvent(id: string, updates: Partial<WeddingEvent>): Promise<WeddingEvent> {
  const data = ensureStore();
  const idx = data.events.findIndex((e) => e.id === id);
  if (idx === -1) throw new Error("Event not found");
  data.events[idx] = { ...data.events[idx], ...updates };
  saveStore(data);
  return data.events[idx];
}

export async function deleteEvent(id: string): Promise<boolean> {
  const data = ensureStore();
  data.events = data.events.filter((e) => e.id !== id);
  saveStore(data);
  return true;
}

export async function reorderEvents(orderedIds: string[]): Promise<WeddingEvent[]> {
  const data = ensureStore();
  data.events.forEach((evt) => {
    const idx = orderedIds.indexOf(evt.id);
    if (idx !== -1) {
      evt.order = idx + 1;
    }
  });
  data.events.sort((a, b) => a.order - b.order);
  saveStore(data);
  return data.events;
}

export async function updateStory(items: StoryItem[]): Promise<StoryItem[]> {
  const data = ensureStore();
  data.story = items;
  saveStore(data);
  return data.story;
}

export async function updateTimeline(items: TimelineItem[]): Promise<TimelineItem[]> {
  const data = ensureStore();
  data.timeline = items;
  saveStore(data);
  return data.timeline;
}

export async function updateVenue(updates: Partial<VenueInfo>): Promise<VenueInfo> {
  const data = ensureStore();
  data.venue = { ...data.venue, ...updates };
  saveStore(data);
  return data.venue;
}

export async function getGallery(): Promise<GalleryItem[]> {
  const data = ensureStore();
  return (data.gallery || []).sort((a, b) => a.order - b.order);
}

export async function addGalleryItem(item: Omit<GalleryItem, "id">): Promise<GalleryItem> {
  const data = ensureStore();
  const newItem: GalleryItem = {
    ...item,
    id: `gal-${Date.now()}`,
    order: item.order ?? (data.gallery.length + 1),
  };
  data.gallery.push(newItem);
  saveStore(data);
  return newItem;
}

export async function deleteGalleryItem(id: string): Promise<boolean> {
  const data = ensureStore();
  data.gallery = data.gallery.filter((g) => g.id !== id);
  saveStore(data);
  return true;
}

export async function updateGallery(items: GalleryItem[]): Promise<GalleryItem[]> {
  const data = ensureStore();
  data.gallery = items;
  saveStore(data);
  return data.gallery;
}

export async function updateFamily(updates: Partial<FamilyInfo>): Promise<FamilyInfo> {
  const data = ensureStore();
  data.family = { ...data.family, ...updates };
  saveStore(data);
  return data.family;
}

export async function getRSVPs(): Promise<RSVPRecord[]> {
  const data = ensureStore();
  return data.rsvps || [];
}

export async function addRSVP(entry: Omit<RSVPRecord, "id" | "submittedAt">): Promise<RSVPRecord> {
  const data = ensureStore();
  const newRsvp: RSVPRecord = {
    ...entry,
    id: `rsvp-${Date.now()}`,
    submittedAt: new Date().toISOString(),
  };
  data.rsvps.unshift(newRsvp);
  saveStore(data);
  return newRsvp;
}

export async function deleteRSVP(id: string): Promise<boolean> {
  const data = ensureStore();
  data.rsvps = data.rsvps.filter((r) => r.id !== id);
  saveStore(data);
  return true;
}

export async function getWishes(): Promise<GuestWishRecord[]> {
  const data = ensureStore();
  return data.wishes || [];
}

export async function addWish(entry: { name: string; message: string }): Promise<GuestWishRecord> {
  const data = ensureStore();
  const newWish: GuestWishRecord = {
    id: `wish-${Date.now()}`,
    name: entry.name,
    message: entry.message,
    status: "pending",
    submittedAt: new Date().toISOString(),
  };
  data.wishes.unshift(newWish);
  saveStore(data);
  return newWish;
}

export async function updateWishStatus(id: string, status: "pending" | "approved" | "hidden"): Promise<GuestWishRecord> {
  const data = ensureStore();
  const wish = data.wishes.find((w) => w.id === id);
  if (!wish) throw new Error("Wish not found");
  wish.status = status;
  saveStore(data);
  return wish;
}

export async function deleteWish(id: string): Promise<boolean> {
  const data = ensureStore();
  data.wishes = data.wishes.filter((w) => w.id !== id);
  saveStore(data);
  return true;
}

// --- SHAGUN / MONEY COLLECTION REPOSITORY ---
export async function getShagun(): Promise<ShagunRecord[]> {
  const data = ensureStore();
  return data.shagun || [];
}

export async function addShagun(entry: Omit<ShagunRecord, "id" | "date">): Promise<ShagunRecord> {
  const data = ensureStore();
  const newEntry: ShagunRecord = {
    ...entry,
    id: `shagun-${Date.now()}`,
    date: new Date().toISOString(),
  };
  if (!data.shagun) data.shagun = [];
  data.shagun.unshift(newEntry);
  saveStore(data);
  return newEntry;
}

export async function updateShagun(id: string, updates: Partial<ShagunRecord>): Promise<ShagunRecord> {
  const data = ensureStore();
  if (!data.shagun) data.shagun = [];
  const idx = data.shagun.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error("Shagun record not found");
  data.shagun[idx] = { ...data.shagun[idx], ...updates };
  saveStore(data);
  return data.shagun[idx];
}

export async function deleteShagun(id: string): Promise<boolean> {
  const data = ensureStore();
  if (!data.shagun) data.shagun = [];
  data.shagun = data.shagun.filter((s) => s.id !== id);
  saveStore(data);
  return true;
}

// --- MUSIC LIBRARY REPOSITORY ---
export async function getMusicLibrary(): Promise<MusicTrack[]> {
  const data = ensureStore();
  return data.musicLibrary || [];
}

export async function addMusicTrack(track: Omit<MusicTrack, "id" | "addedAt">): Promise<MusicTrack> {
  const data = ensureStore();
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
  saveStore(data);
  return newTrack;
}

export async function setActiveMusicTrack(id: string): Promise<MusicTrack> {
  const data = ensureStore();
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
  saveStore(data);
  return selectedTrack;
}

export async function updateMusicTrack(id: string, updates: Partial<MusicTrack>): Promise<MusicTrack> {
  const data = ensureStore();
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
  saveStore(data);
  return data.musicLibrary[idx];
}

export async function deleteMusicTrack(id: string): Promise<boolean> {
  const data = ensureStore();
  if (!data.musicLibrary) data.musicLibrary = [];
  data.musicLibrary = data.musicLibrary.filter((m) => m.id !== id);
  saveStore(data);
  return true;
}

export async function restoreWeddingData(fullData: WeddingData): Promise<WeddingData> {
  const current = ensureStore();
  const merged: WeddingData = {
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
  };
  saveStore(merged);
  return merged;
}
