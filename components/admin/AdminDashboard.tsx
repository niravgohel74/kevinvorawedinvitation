"use client";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  WeddingData,
  WeddingDetails,
  CoupleInfo,
  WeddingEvent,
  StoryItem,
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
import {
  LayoutDashboard,
  Heart,
  Users,
  Calendar,
  Clock,
  MapPin,
  Image as ImageIcon,
  MessageSquareHeart,
  CheckCircle2,
  Sliders,
  LogOut,
  ExternalLink,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Download,
  Search,
  Eye,
  Columns,
  Coins,
  Music2,
  Upload,
  Play,
  Pause,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Edit,
  Scissors,
  Type,
  Palette,
  RotateCcw,
} from "lucide-react";
import { PublicInvitationView } from "@/components/invitation/PublicInvitationView";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { RichTextEditorField } from "@/components/admin/RichTextEditorField";
import { TypographySettingsSection } from "@/components/admin/TypographySettingsSection";
import { AudioTrimmerModal } from "@/components/admin/AudioTrimmerModal";
import { safeFetchJson } from "@/lib/apiHelper";
import { MAX_AUDIO_UPLOAD_BYTES, uploadAudioToStorage } from "@/lib/uploadAudio";
import { ShagunDeleteModal } from "@/components/admin/ShagunDeleteModal";
import { initialWeddingData } from "@/data/defaultData";
import { RichText } from "@/components/ui/RichText";

interface AdminDashboardProps {
  initialData: WeddingData;
  adminUsername: string;
}

export function AdminDashboard({ initialData, adminUsername }: AdminDashboardProps) {
  const router = useRouter();
  const [data, setData] = useState<WeddingData>(initialData);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [splitPreview, setSplitPreview] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Event editing state
  const [editingEvent, setEditingEvent] = useState<WeddingEvent | null>(null);
  const [isSavingEvent, setIsSavingEvent] = useState<boolean>(false);

  // Audio preview in Admin
  const [previewingAudio, setPreviewingAudio] = useState<string | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  // Filter/search state for RSVPs
  const [rsvpSearch, setRsvpSearch] = useState("");
  const [rsvpFilter, setRsvpFilter] = useState<"all" | "yes" | "no">("all");

  // Filter for Wishes
  const [wishesTab, setWishesTab] = useState<"pending" | "approved" | "hidden">("pending");

  // Shagun Register Filter & State
  const [shagunSearch, setShagunSearch] = useState("");
  const [shagunSideFilter, setShagunSideFilter] = useState<"all" | "groom" | "bride">("all");
  const [newShagunModal, setNewShagunModal] = useState(false);
  const [newShagun, setNewShagun] = useState<Partial<ShagunRecord>>({
    guestName: "",
    side: "groom",
    relation: "",
    city: "",
    amount: 5100,
    paymentMode: "cash",
    event: "Wedding",
    receivedBy: "",
    notes: "",
  });

  // Version tracker to prevent redundant re-fetching and support cross-device sync
  const currentVersionRef = useRef<number>(
    initialData?.wedding?.updatedAt ? new Date(initialData.wedding.updatedAt).getTime() : Date.now()
  );
  const isSavingRef = useRef<boolean>(isSaving);
  isSavingRef.current = isSaving;

  // Helper to broadcast live updates in real-time (0ms) across all tabs, split views, and devices
  const broadcastLiveData = (updated: WeddingData) => {
    setData(updated);
    const ver = updated?.wedding?.updatedAt
      ? new Date(updated.wedding.updatedAt).getTime()
      : Date.now();
    currentVersionRef.current = ver;

    try {
      localStorage.setItem("wedding_live_data", JSON.stringify(updated));
      localStorage.setItem("wedding_data_version", ver.toString());
    } catch (err) {
      console.warn("Could not save to localStorage:", err);
    }

    // 1. Instant 0ms BroadcastChannel across open tabs (e.g., "VIEW INVITATION")
    try {
      if (typeof BroadcastChannel !== "undefined") {
        const channel = new BroadcastChannel("wedding_live_sync");
        channel.postMessage({
          type: "LIVE_DATA_UPDATE",
          data: updated,
          timestamp: ver,
        });
        channel.close();
      }
    } catch (err) {
      console.warn("BroadcastChannel error:", err);
    }

    // 2. Custom window event for same-tab / embedded split views
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("wedding_data_updated", { detail: updated }));
    }
  };

  const persistLocalBackup = broadcastLiveData;

  // Cloud storage status state
  const [cloudStatus, setCloudStatus] = useState<{
    configured: boolean;
    isVercel?: boolean;
    storeBlobFound?: boolean;
    totalBlobsInStore?: number;
    error?: string;
    message?: string;
  } | null>(null);

  const checkCloudStatus = React.useCallback(() => {
    fetch("/api/wedding/blob-check", { cache: "no-store" })
      .then((r) => r.json())
      .then((res) => setCloudStatus(res))
      .catch(() => setCloudStatus(null));
  }, []);

  // Multi-Device Real-Time Cloud Sync Engine:
  // Vercel Blob cloud storage is the single source of truth across all devices (laptop, mobile, tablet).
  // On mount, tab focus, and background heartbeat, we synchronize with the cloud database.
  // We NEVER automatically overwrite the cloud store with stale browser localStorage!
  React.useEffect(() => {
    let isMounted = true;

    // A. Initial cloud hydration: pull the freshest data from Vercel Cloud DB
    fetch("/api/wedding", { cache: "no-store" })
      .then((r) => r.json())
      .then((res) => {
        if (isMounted && res.success && res.data) {
          setData(res.data);
          const ver = Number(res.version) || Date.now();
          currentVersionRef.current = ver;
          try {
            localStorage.setItem("wedding_live_data", JSON.stringify(res.data));
            localStorage.setItem("wedding_data_version", ver.toString());
          } catch {}
        }
      })
      .catch((e) => console.warn("Admin mount sync error:", e));

    checkCloudStatus();

    // B. BroadcastChannel for instant inter-tab sync on same machine
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== "undefined") {
        channel = new BroadcastChannel("wedding_live_sync");
        channel.onmessage = (event) => {
          if (event.data?.type === "LIVE_DATA_UPDATE" && event.data?.data) {
            if (isMounted) {
              setData(event.data.data);
              if (event.data.timestamp) {
                currentVersionRef.current = event.data.timestamp;
              }
            }
          }
        };
      }
    } catch (e) {
      console.warn("BroadcastChannel not supported:", e);
    }

    // C. Storage event fallback for other open tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "wedding_live_data" && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          if (isMounted && updated?.wedding) {
            setData(updated);
          }
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);

    // D. Auto-sync when tab gains focus or mobile screen unlocks
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        const activeTag = document.activeElement?.tagName?.toLowerCase();
        if (activeTag === "input" || activeTag === "textarea") return;

        try {
          const res = await fetch("/api/wedding", { cache: "no-store" });
          if (res.ok) {
            const json = await res.json();
            if (isMounted && json.success && json.data) {
              const serverVer = Number(json.version) || 0;
              if (serverVer > currentVersionRef.current) {
                currentVersionRef.current = serverVer;
                setData(json.data);
                try {
                  localStorage.setItem("wedding_live_data", JSON.stringify(json.data));
                  localStorage.setItem("wedding_data_version", serverVer.toString());
                } catch {}
                showToast("🔄 Synced latest updates from cloud!");
              }
            }
          }
        } catch {}
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    // E. 3-Second Heartbeat Poller for Cross-Device Sync (e.g. edits on phone -> appear on laptop)
    const interval = setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      if (isSavingRef.current) return;
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") return;

      try {
        const vRes = await fetch("/api/wedding/version", { cache: "no-store" });
        if (vRes.ok) {
          const { version } = await vRes.json();
          if (version && version > currentVersionRef.current) {
            const dRes = await fetch("/api/wedding", { cache: "no-store" });
            if (dRes.ok) {
              const dJson = await dRes.json();
              if (isMounted && dJson.success && dJson.data) {
                currentVersionRef.current = Number(dJson.version) || version;
                setData(dJson.data);
                try {
                  localStorage.setItem("wedding_live_data", JSON.stringify(dJson.data));
                  localStorage.setItem("wedding_data_version", currentVersionRef.current.toString());
                } catch {}
                showToast("🔄 Synced latest updates from other device!");
              }
            }
          }
        }
      } catch {}
    }, 3000);

    return () => {
      isMounted = false;
      if (channel) channel.close();
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
      clearInterval(interval);
    };
  }, [checkCloudStatus]);


  // State for Add Event Form
  const [newEventModal, setNewEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<WeddingEvent>>({
    name: "",
    date: "17 December 2026",
    time: "06:00 PM",
    venue: "The Leela Palace",
    address: "Udaipur, Rajasthan",
    description: "",
    dressCode: "Festive Indian Attire",
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1000&auto=format&fit=crop",
    mapsUrl: "https://maps.google.com/?q=The+Leela+Palace+Udaipur",
  });

  // State for Add Gallery Item
  const [newGalleryModal, setNewGalleryModal] = useState(false);
  const [newGalleryItem, setNewGalleryItem] = useState<Partial<GalleryItem>>({
    url: "",
    caption: "",
    category: "ceremony",
    aspect: "landscape",
  });

  // Shagun Custom Delete Modal State
  const [shagunToDelete, setShagunToDelete] = useState<ShagunRecord | null>(null);
  const [isDeletingShagun, setIsDeletingShagun] = useState(false);

  // Audio Trimmer & Song Editor Modal State
  const [audioTrimmerModal, setAudioTrimmerModal] = useState(false);
  const [trackToTrim, setTrackToTrim] = useState<Partial<MusicTrack> | null>(null);

  // Music upload / add state
  const [newMusicModal, setNewMusicModal] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [newMusic, setNewMusic] = useState<Partial<MusicTrack>>({
    title: "",
    artist: "",
    url: "",
    isActive: false,
  });

  // Helper notification
  const showToast = (msg: string) => {
    setSaveStatus(msg);
    setTimeout(() => setSaveStatus(""), 4000);
  };

  const stripAllHtmlTags = (str: string | undefined): string => {
    if (!str || typeof str !== "string") return str || "";
    return str.replace(/<[^>]*>/g, "").trim();
  };

  const handleGlobalResetStyling = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to reset all text styling? This will remove all custom formatting (bold, italic, colors, fonts) across all fields and restore default royal typography."
    );
    if (!confirmed) return;

    const resetWedding: WeddingDetails = {
      ...data.wedding,
      groomName: stripAllHtmlTags(data.wedding.groomName),
      brideName: stripAllHtmlTags(data.wedding.brideName),
      weddingTime: stripAllHtmlTags(data.wedding.weddingTime),
      location: stripAllHtmlTags(data.wedding.location),
      city: stripAllHtmlTags(data.wedding.city),
      hashtag: stripAllHtmlTags(data.wedding.hashtag),
      invitationSubtitle: stripAllHtmlTags(data.wedding.invitationSubtitle),
      heroTagline: stripAllHtmlTags(data.wedding.heroTagline),
      heroQuote: stripAllHtmlTags(data.wedding.heroQuote),
      introText: stripAllHtmlTags(data.wedding.introText),
      closingMessage: stripAllHtmlTags(data.wedding.closingMessage),
      textStyling: {
        headingFont: "editorial-serif",
        bodyFont: "sans",
        fontSizeScale: "normal",
        headingColor: "#202020",
        accentColor: "#9E814D",
        bodyColor: "#665E55",
        isBoldHeading: false,
        isItalicHeading: false,
      },
      updatedAt: new Date().toISOString(),
    };

    const resetCouple: CoupleInfo = {
      ...data.couple,
      groomName: stripAllHtmlTags(data.couple.groomName),
      groomTitle: stripAllHtmlTags(data.couple.groomTitle),
      groomBio: stripAllHtmlTags(data.couple.groomBio),
      brideName: stripAllHtmlTags(data.couple.brideName),
      brideTitle: stripAllHtmlTags(data.couple.brideTitle),
      brideBio: stripAllHtmlTags(data.couple.brideBio),
      quote: stripAllHtmlTags(data.couple.quote),
    };

    const resetEvents = data.events.map((evt) => ({
      ...evt,
      name: stripAllHtmlTags(evt.name),
      date: stripAllHtmlTags(evt.date),
      time: stripAllHtmlTags(evt.time),
      venue: stripAllHtmlTags(evt.venue),
      address: stripAllHtmlTags(evt.address),
      dressCode: stripAllHtmlTags(evt.dressCode),
      description: stripAllHtmlTags(evt.description),
    }));

    const resetStory = data.story.map((st) => ({
      ...st,
      title: stripAllHtmlTags(st.title),
      description: stripAllHtmlTags(st.description),
    }));

    const resetTimeline = data.timeline.map((tm) => ({
      ...tm,
      time: stripAllHtmlTags(tm.time),
      title: stripAllHtmlTags(tm.title),
      description: stripAllHtmlTags(tm.description),
    }));

    const resetVenue: VenueInfo = {
      ...data.venue,
      name: stripAllHtmlTags(data.venue.name),
      cityState: stripAllHtmlTags(data.venue.cityState),
      address: stripAllHtmlTags(data.venue.address),
      description: stripAllHtmlTags(data.venue.description),
      airportInfo: stripAllHtmlTags(data.venue.airportInfo),
      accommodations: stripAllHtmlTags(data.venue.accommodations),
    };

    const resetFamily: FamilyInfo = {
      ...data.family,
      groomFamilyTitle: stripAllHtmlTags(data.family.groomFamilyTitle),
      groomParents: stripAllHtmlTags(data.family.groomParents),
      brideFamilyTitle: stripAllHtmlTags(data.family.brideFamilyTitle),
      brideParents: stripAllHtmlTags(data.family.brideParents),
      blessingQuote: stripAllHtmlTags(data.family.blessingQuote),
    };

    const updated: WeddingData = {
      ...data,
      wedding: resetWedding,
      couple: resetCouple,
      events: resetEvents,
      story: resetStory,
      timeline: resetTimeline,
      venue: resetVenue,
      family: resetFamily,
    };

    persistLocalBackup(updated);

    setIsSaving(true);
    try {
      const fetchRes = await fetch("/api/wedding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      const res = await safeFetchJson<{ success: boolean }>(fetchRes, "reset styling");
      if (res?.success) {
        showToast("All text styling has been reset to clean royal defaults!");
      } else {
        showToast("Styling reset locally.");
      }
    } catch {
      showToast("Styling reset locally.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEditedEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    setIsSavingEvent(true);
    try {
      const res = await fetch(`/api/events/${editingEvent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingEvent),
      });
      const resData = await res.json();
      if (resData.success) {
        const updatedEvents = data.events.map((evt) =>
          evt.id === editingEvent.id ? editingEvent : evt
        );
        const nextData = { ...data, events: updatedEvents };
        persistLocalBackup(nextData);
        showToast("Event updated successfully!");
        setEditingEvent(null);
      } else {
        showToast(resData.error || "Failed to update event");
      }
    } catch {
      showToast("Failed to update event");
    } finally {
      setIsSavingEvent(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  // --- SAVE OPERATIONS ---
  const saveWeddingDetails = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/wedding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.wedding),
      });
      const resData = await res.json();
      if (resData.success) {
        const nextData = { ...data, wedding: { ...data.wedding, ...resData.data } };
        persistLocalBackup(nextData);
        showToast("Wedding details successfully updated!");
      } else {
        showToast(resData.error || "Error saving wedding details.");
      }
    } catch {
      showToast("Error saving wedding details.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveCoupleInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/couple", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.couple),
      });
      const resData = await res.json();
      if (resData.success) {
        const nextData = {
          ...data,
          couple: { ...data.couple, ...resData.data },
          wedding: { ...data.wedding, updatedAt: new Date().toISOString() },
        };
        persistLocalBackup(nextData);
        showToast("Couple profile updated successfully!");
      } else {
        showToast(resData.error || "Error updating couple info.");
      }
    } catch {
      showToast("Error updating couple info.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveVenueInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/venue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.venue),
      });
      const resData = await res.json();
      if (resData.success) {
        const nextData = {
          ...data,
          venue: { ...data.venue, ...resData.data },
          wedding: { ...data.wedding, updatedAt: new Date().toISOString() },
        };
        persistLocalBackup(nextData);
        showToast("Venue information saved!");
      } else {
        showToast(resData.error || "Error updating venue.");
      }
    } catch {
      showToast("Error updating venue.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveFamilyInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/family", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.family),
      });
      const resData = await res.json();
      if (resData.success) {
        const nextData = {
          ...data,
          family: { ...data.family, ...resData.data },
          wedding: { ...data.wedding, updatedAt: new Date().toISOString() },
        };
        persistLocalBackup(nextData);
        showToast("Family blessings saved!");
      } else {
        showToast(resData.error || "Error updating family blessings.");
      }
    } catch {
      showToast("Error updating family blessings.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveSectionVisibility = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/sections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.sectionVisibility),
      });
      const resData = await res.json();
      if (res.ok) {
        const nextData = {
          ...data,
          sectionVisibility: resData.data || data.sectionVisibility,
          wedding: { ...data.wedding, updatedAt: new Date().toISOString() },
        };
        persistLocalBackup(nextData);
        showToast("Section visibility preferences saved!");
      } else {
        showToast(resData?.error || "Error saving section visibility.");
      }
    } catch {
      showToast("Error saving section visibility.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSection = (section: keyof SectionVisibility) => {
    const updated = {
      ...data.sectionVisibility,
      [section]: !data.sectionVisibility[section],
    };
    setData({ ...data, sectionVisibility: updated });
  };

  // --- EVENTS HANDLERS ---
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newEvent, order: data.events.length + 1 }),
      });
      const resData = await res.json();
      if (resData.success) {
        const nextData = { ...data, events: [...data.events, resData.data] };
        persistLocalBackup(nextData);
        setNewEventModal(false);
        showToast("New event added!");
      }
    } catch {
      showToast("Failed to add event.");
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (res.ok) {
        const nextData = { ...data, events: data.events.filter((e) => e.id !== id) };
        persistLocalBackup(nextData);
        showToast("Event removed.");
      }
    } catch {
      showToast("Failed to delete event.");
    }
  };

  const handleMoveEvent = async (idx: number, direction: "up" | "down") => {
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= data.events.length) return;

    const reordered = [...data.events];
    const temp = reordered[idx];
    reordered[idx] = reordered[newIdx];
    reordered[newIdx] = temp;

    const orderIds = reordered.map((e) => e.id);
    const nextData = { ...data, events: reordered };
    persistLocalBackup(nextData);

    try {
      await fetch("/api/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds }),
      });
      showToast("Event order updated.");
    } catch {
      showToast("Failed to save reorder.");
    }
  };

  // --- STORY HANDLERS ---
  const handleAddStory = async () => {
    const newItem: StoryItem = {
      id: `story-${Date.now()}`,
      year: "2026",
      title: "New Story Moment",
      description: "Description of this special milestone...",
      image: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=900&auto=format&fit=crop",
      order: data.story.length + 1,
    };
    const updated = [...data.story, newItem];
    const nextData = { ...data, story: updated };
    persistLocalBackup(nextData);
    await fetch("/api/story", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    showToast("Story milestone added.");
  };

  const handleDeleteStory = async (id: string) => {
    const updated = data.story.filter((s) => s.id !== id);
    const nextData = { ...data, story: updated };
    persistLocalBackup(nextData);
    await fetch("/api/story", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    showToast("Story milestone deleted.");
  };

  const handleUpdateStoryItem = async (id: string, field: keyof StoryItem, val: string) => {
    const updated = data.story.map((s) => (s.id === id ? { ...s, [field]: val } : s));
    setData({ ...data, story: updated });
  };

  const handleSaveAllStory = async () => {
    setIsSaving(true);
    await fetch("/api/story", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data.story),
    });
    persistLocalBackup(data);
    setIsSaving(false);
    showToast("Story changes saved!");
  };

  // --- TIMELINE HANDLERS ---
  const handleAddTimeline = async () => {
    const newItem: TimelineItem = {
      id: `t-${Date.now()}`,
      time: "07:00 PM",
      title: "New Ceremony Step",
      description: "Details for guests...",
      order: data.timeline.length + 1,
    };
    const updated = [...data.timeline, newItem];
    const nextData = { ...data, timeline: updated };
    persistLocalBackup(nextData);
    await fetch("/api/timeline", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    showToast("Timeline entry added.");
  };

  const handleDeleteTimeline = async (id: string) => {
    const updated = data.timeline.filter((t) => t.id !== id);
    const nextData = { ...data, timeline: updated };
    persistLocalBackup(nextData);
    await fetch("/api/timeline", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    showToast("Timeline item deleted.");
  };

  const handleSaveAllTimeline = async () => {
    setIsSaving(true);
    await fetch("/api/timeline", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data.timeline),
    });
    persistLocalBackup(data);
    setIsSaving(false);
    showToast("Timeline schedule saved!");
  };

  // --- GALLERY HANDLERS ---
  const handleAddGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGalleryItem.url) return;
    try {
      const res = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newGalleryItem),
      });
      const resData = await res.json();
      if (resData.success) {
        const nextData = { ...data, gallery: [...data.gallery, resData.data] };
        persistLocalBackup(nextData);
        setNewGalleryModal(false);
        setNewGalleryItem({ url: "", caption: "", category: "ceremony", aspect: "landscape" });
        showToast("Image added to gallery!");
      }
    } catch {
      showToast("Failed to add image.");
    }
  };

  const handleDeleteGallery = async (id: string) => {
    try {
      const res = await fetch(`/api/gallery/${id}`, { method: "DELETE" });
      if (res.ok) {
        const nextData = { ...data, gallery: data.gallery.filter((g) => g.id !== id) };
        persistLocalBackup(nextData);
        showToast("Image deleted.");
      }
    } catch {
      showToast("Failed to delete image.");
    }
  };

  // --- SHAGUN / MONEY COLLECTION HANDLERS ---
  const handleAddShagun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShagun.guestName || !newShagun.amount) return;
    try {
      const res = await fetch("/api/shagun", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newShagun),
      });
      const resData = await res.json();
      if (resData.success) {
        const nextData = { ...data, shagun: [resData.data, ...(data.shagun || [])] };
        persistLocalBackup(nextData);
        setNewShagunModal(false);
        setNewShagun({
          guestName: "",
          side: "groom",
          relation: "",
          city: "",
          amount: 5100,
          paymentMode: "cash",
          event: "Wedding",
          receivedBy: "",
          notes: "",
        });
        showToast("Shagun entry recorded successfully!");
      }
    } catch {
      showToast("Failed to add shagun entry.");
    }
  };

  const handleConfirmDeleteShagun = async () => {
    if (!shagunToDelete) return;
    setIsDeletingShagun(true);
    try {
      const res = await fetch(`/api/shagun/${shagunToDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        const nextData = { ...data, shagun: (data.shagun || []).filter((s) => s.id !== shagunToDelete.id) };
        persistLocalBackup(nextData);
        showToast("Shagun record deleted from register.");
        setShagunToDelete(null);
      } else {
        showToast("Failed to delete shagun record.");
      }
    } catch {
      showToast("Failed to delete shagun record.");
    } finally {
      setIsDeletingShagun(false);
    }
  };

  const handleOpenTrimmer = (track?: Partial<MusicTrack>) => {
    setTrackToTrim(track || { title: "", artist: "", url: "", isActive: false });
    setAudioTrimmerModal(true);
  };

  const handleSaveTrimmedTrack = async (updated: {
    id?: string;
    title: string;
    artist: string;
    url: string;
    isActive?: boolean;
  }) => {
    if (updated.id) {
      const res = await fetch("/api/music", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          id: updated.id,
          updates: {
            title: updated.title,
            artist: updated.artist,
            url: updated.url,
            isActive: updated.isActive,
          },
        }),
      });
      const resJson = await safeFetchJson(res, "music track update");
      if (resJson.success) {
        const updatedList = (data.musicLibrary || []).map((m) =>
          m.id === updated.id ? { ...m, ...resJson.data } : m
        );
        const nextData = {
          ...data,
          musicLibrary: updatedList,
          wedding: updated.isActive
            ? { ...data.wedding, ambientMusicUrl: updated.url, updatedAt: new Date().toISOString() }
            : { ...data.wedding, updatedAt: new Date().toISOString() },
        };
        setData(nextData);
        persistLocalBackup(nextData);
        showToast("Music track updated with studio audio!");
      } else {
        showToast(resJson.error || "Failed to update track");
      }
    } else {
      const res = await fetch("/api/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: updated.title,
          artist: updated.artist,
          url: updated.url,
          isActive: updated.isActive,
        }),
      });
      const resJson = await safeFetchJson(res, "music track creation");
      if (resJson.success) {
        const nextList = [...(data.musicLibrary || []), resJson.data];
        const nextData = {
          ...data,
          musicLibrary: nextList,
          wedding: updated.isActive
            ? { ...data.wedding, ambientMusicUrl: resJson.data.url, updatedAt: new Date().toISOString() }
            : { ...data.wedding, updatedAt: new Date().toISOString() },
        };
        setData(nextData);
        persistLocalBackup(nextData);
        showToast("New track added to music library!");
      } else {
        showToast(resJson.error || "Failed to add track");
      }
    }
  };

  const exportShagunCsv = () => {
    const headers = ["Guest Name", "Family Side", "Relation", "City", "Amount (INR)", "Payment Mode", "Event", "Received By", "Notes", "Date"];
    const rows = (data.shagun || []).map((s) => [
      `"${s.guestName.replace(/"/g, '""')}"`,
      s.side === "groom" ? "Groom Side" : "Bride Side",
      `"${(s.relation || "").replace(/"/g, '""')}"`,
      `"${(s.city || "").replace(/"/g, '""')}"`,
      s.amount,
      s.paymentMode.toUpperCase(),
      `"${(s.event || "").replace(/"/g, '""')}"`,
      `"${(s.receivedBy || "").replace(/"/g, '""')}"`,
      `"${(s.notes || "").replace(/"/g, '""')}"`,
      `"${new Date(s.date).toLocaleDateString()}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `wedding_shagun_register_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Shagun Calculations
  const shagunList = data.shagun || [];
  const totalShagunAmount = shagunList.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const groomSideShagun = shagunList
    .filter((s) => s.side === "groom")
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const brideSideShagun = shagunList
    .filter((s) => s.side === "bride")
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const cashShagun = shagunList
    .filter((s) => s.paymentMode === "cash")
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const upiShagun = shagunList
    .filter((s) => s.paymentMode === "upi")
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const filteredShagun = shagunList.filter((s) => {
    const matchesSide = shagunSideFilter === "all" || s.side === shagunSideFilter;
    const matchesSearch =
      s.guestName.toLowerCase().includes(shagunSearch.toLowerCase()) ||
      s.relation?.toLowerCase().includes(shagunSearch.toLowerCase()) ||
      s.city?.toLowerCase().includes(shagunSearch.toLowerCase()) ||
      s.notes?.toLowerCase().includes(shagunSearch.toLowerCase());
    return matchesSide && matchesSearch;
  });

  // --- MUSIC LIBRARY HANDLERS ---
  const handleAddMusic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMusic.title || !newMusic.url) return;
    try {
      const res = await fetch("/api/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMusic),
      });
      const resData = await safeFetchJson(res, "music track creation");
      if (resData.success) {
        const nextList = [...(data.musicLibrary || []), resData.data];
        const nextData = {
          ...data,
          musicLibrary: nextList,
          wedding: newMusic.isActive
            ? { ...data.wedding, ambientMusicUrl: resData.data.url, updatedAt: new Date().toISOString() }
            : { ...data.wedding, updatedAt: new Date().toISOString() },
        };
        setData(nextData);
        persistLocalBackup(nextData);
        setNewMusicModal(false);
        setNewMusic({ title: "", artist: "", url: "", isActive: false });
        showToast("Track added to music library!");
      }
    } catch (error: any) {
      showToast(error?.message || "Failed to add music track.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Very large files should be trimmed before uploading to avoid excessive storage and playback cost.
    if (file.size > 2.5 * 1024 * 1024) {
      showToast("Audio file is large. Opening Studio Trimmer to select your favorite clip...");
      handleOpenTrimmer({
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: "Uploaded Track",
        url: URL.createObjectURL(file),
        isActive: false,
      });
      return;
    }

    setUploadingAudio(true);
    try {
      const uploadedUrl = await uploadAudioToStorage(file, file.name);
      setNewMusic({
        ...newMusic,
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: "Uploaded Audio",
        url: uploadedUrl,
      });
      showToast("Audio file uploaded successfully!");
    } catch (err: any) {
      showToast(err?.message || "Upload failed. Please use the Audio Trimmer or an external URL.");
    } finally {
      setUploadingAudio(false);
    }
  };

  const handleSetActiveTrack = async (id: string) => {
    try {
      const res = await fetch("/api/music", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_active", id }),
      });
      const resData = await safeFetchJson(res, "music activation");
      if (resData.success) {
        const updatedLibrary = (data.musicLibrary || []).map((m) => ({
          ...m,
          isActive: m.id === id,
        }));
        const nextData = {
          ...data,
          musicLibrary: updatedLibrary,
          wedding: {
            ...data.wedding,
            ambientMusicUrl: resData.data.url,
            updatedAt: new Date().toISOString(),
          },
        };
        setData(nextData);
        persistLocalBackup(nextData);

        showToast(`"${resData.data.title}" is now active on the invitation!`);
      }
    } catch {
      showToast("Failed to activate song.");
    }
  };

  const handleDeleteMusic = async (id: string) => {
    if (!confirm("Are you sure you want to remove this music track?")) return;
    try {
      const res = await fetch(`/api/music?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        const nextList = (data.musicLibrary || []).filter((m) => m.id !== id);
        const nextData = {
          ...data,
          musicLibrary: nextList,
          wedding: { ...data.wedding, updatedAt: new Date().toISOString() },
        };
        setData(nextData);
        persistLocalBackup(nextData);
        showToast("Track deleted.");
      }
    } catch {
      showToast("Failed to delete track.");
    }
  };

  const toggleAudioPreview = (url: string) => {
    if (previewingAudio === url) {
      audioPreviewRef.current?.pause();
      setPreviewingAudio(null);
    } else {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
      const audio = new Audio(url);
      audioPreviewRef.current = audio;
      audio.play().catch(() => {});
      setPreviewingAudio(url);
      audio.onended = () => setPreviewingAudio(null);
    }
  };

  // --- RSVP STATS & CSV EXPORT ---
  const totalRsvps = data.rsvps.length;
  const attendingRsvps = data.rsvps.filter((r) => r.attending === "yes");
  const declinedRsvps = data.rsvps.filter((r) => r.attending === "no");
  const totalGuestsAttending = attendingRsvps.reduce((acc, curr) => acc + (curr.guestsCount || 1), 0);

  const filteredRsvps = data.rsvps.filter((r) => {
    const matchesFilter = rsvpFilter === "all" || r.attending === rsvpFilter;
    const matchesSearch =
      r.name.toLowerCase().includes(rsvpSearch.toLowerCase()) ||
      r.phone?.toLowerCase().includes(rsvpSearch.toLowerCase()) ||
      r.dietaryPreference?.toLowerCase().includes(rsvpSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const exportRsvpsCsv = () => {
    const headers = ["Name", "Phone", "Attending", "Guests Count", "Dietary", "Message", "Submitted At"];
    const rows = data.rsvps.map((r) => [
      `"${r.name.replace(/"/g, '""')}"`,
      `"${(r.phone || "").replace(/"/g, '""')}"`,
      r.attending,
      r.guestsCount,
      `"${(r.dietaryPreference || "").replace(/"/g, '""')}"`,
      `"${(r.message || "").replace(/"/g, '""')}"`,
      `"${new Date(r.submittedAt).toLocaleString()}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `wedding_rsvps_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteRsvp = async (id: string) => {
    if (!confirm("Are you sure you want to remove this RSVP entry?")) return;
    try {
      const res = await fetch(`/api/rsvp/${id}`, { method: "DELETE" });
      if (res.ok) {
        setData({ ...data, rsvps: data.rsvps.filter((r) => r.id !== id) });
        showToast("RSVP deleted.");
      }
    } catch {
      showToast("Error deleting RSVP.");
    }
  };

  // --- WISHES MODERATION ---
  const handleUpdateWishStatus = async (id: string, status: "pending" | "approved" | "hidden") => {
    try {
      const res = await fetch("/api/wishes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        const nextData = {
          ...data,
          wishes: data.wishes.map((w) => (w.id === id ? { ...w, status } : w)),
        };
        persistLocalBackup(nextData);
        showToast(`Wish marked as ${status}.`);
      }
    } catch {
      showToast("Error updating wish.");
    }
  };

  const handleDeleteWish = async (id: string) => {
    if (!confirm("Delete this blessing from the guestbook?")) return;
    try {
      const res = await fetch(`/api/wishes/${id}`, { method: "DELETE" });
      if (res.ok) {
        const nextData = { ...data, wishes: data.wishes.filter((w) => w.id !== id) };
        persistLocalBackup(nextData);
        showToast("Wish removed.");
      }
    } catch {
      showToast("Error deleting wish.");
    }
  };

  const filteredWishes = data.wishes.filter((w) => w.status === wishesTab);

  // Navigation Items
  const navTabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "sections", label: "Section Visibility", icon: ToggleRight },
    { id: "shagun", label: `Shagun Register (₹${totalShagunAmount.toLocaleString("en-IN")})`, icon: Coins },
    { id: "music", label: "Music Library", icon: Music2 },
    { id: "details", label: "Wedding Details", icon: Heart },
    { id: "typography", label: "Typography & Theme", icon: Type },
    { id: "couple", label: "The Couple", icon: Users },
    { id: "story", label: "Our Story", icon: Clock },
    { id: "events", label: "Events", icon: Calendar },
    { id: "timeline", label: "Day Timeline", icon: Sliders },
    { id: "venue", label: "Venue & Stay", icon: MapPin },
    { id: "gallery", label: "Gallery", icon: ImageIcon },
    { id: "family", label: "Family Blessings", icon: Users },
    { id: "rsvp", label: `RSVPs (${totalRsvps})`, icon: CheckCircle2 },
    { id: "wishes", label: `Wishes (${data.wishes.filter((w) => w.status === "pending").length} pending)`, icon: MessageSquareHeart },
  ];

  
  // Export full wedding store as JSON file
  // Push all current CMS data to Vercel Blob cloud database
  const handleSyncAllToCloud = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/wedding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (resData.success && resData.data) {
        setData(resData.data);
        persistLocalBackup(resData.data);
        checkCloudStatus();
        if (resData.blobSaved) {
          showToast("Live data saved to Vercel Blob store & synced across all devices!");
        } else if (resData.isConfigured === false) {
          showToast("Saved locally. BLOB_READ_WRITE_TOKEN is missing in environment variables!");
        } else {
          showToast(`Saved locally, but Vercel Blob error: ${resData.blobError || "Unknown error"}`);
        }
      } else {
        showToast(resData.error || "Failed to sync to cloud.");
      }
    } catch {
      showToast("Error syncing with cloud database.");
    } finally {
      setIsSaving(false);
    }
  };

  // Export full wedding store as JSON file
  const handleExportFullJson = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `wedding-store-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Full wedding data backup downloaded!");
  };

  // Restore full wedding store from uploaded JSON file
  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (!parsed.wedding || !parsed.couple) {
          alert("Invalid wedding store JSON file. Missing wedding or couple root keys.");
          return;
        }
        setIsSaving(true);
        const res = await fetch("/api/wedding", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed),
        });
        const resData = await res.json();
        if (resData.success && resData.data) {
          setData(resData.data);
          persistLocalBackup(resData.data);
          showToast("Wedding store restored successfully from JSON backup!");
        } else {
          alert(resData.error || "Failed to restore backup.");
        }
      } catch (err: any) {
        alert("Failed to parse JSON file: " + (err?.message || err));
      } finally {
        setIsSaving(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#202020] flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-[#FFFFFF] border-b border-[#E9E1D5] px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[#202020] text-[#C9B38C] flex items-center justify-center font-editorial-serif font-bold text-sm">
              {(data.wedding.groomName.replace(/<[^>]*>/g, "").trim()[0] || "K")}&amp;{(data.wedding.brideName.replace(/<[^>]*>/g, "").trim()[0] || "M")}
            </span>
            <div>
              <h1 className="text-sm font-semibold tracking-wide text-[#202020]">
                <RichText content={data.wedding.groomName} /> &amp; <RichText content={data.wedding.brideName} />
              </h1>
              <p className="text-[10px] text-[#8C847B] uppercase tracking-wider">
                Wedding CMS &amp; Gift Register
              </p>
            </div>
          </div>

          {saveStatus && (
            <span className="ml-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs animate-fade-in">
              ✓ {saveStatus}
            </span>
          )}

          {cloudStatus && (
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                cloudStatus.configured
                  ? cloudStatus.storeBlobFound
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-blue-50 text-blue-800 border-blue-200"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
              title={
                cloudStatus.configured
                  ? cloudStatus.storeBlobFound
                    ? "Vercel Blob store connected and active (wedding-data/store.json exists)"
                    : "Vercel Blob store connected. Click 'Sync All to Cloud' to upload initial data."
                  : "Vercel Blob token missing in environment. Changes will save to local disk only."
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  cloudStatus.configured
                    ? cloudStatus.storeBlobFound
                      ? "bg-emerald-500 animate-pulse"
                      : "bg-blue-500"
                    : "bg-amber-500"
                }`}
              />
              <span>
                {cloudStatus.configured
                  ? cloudStatus.storeBlobFound
                    ? "Blob Active"
                    : "Blob Connected (Empty)"
                  : "Local Mode"}
              </span>
            </div>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSyncAllToCloud}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-sm disabled:opacity-50"
            title="Push all current CMS state to Vercel Blob cloud database"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isSaving ? "Syncing..." : "Sync All to Cloud"}</span>
          </button>

          <button
            type="button"
            onClick={handleExportFullJson}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#E9E1D5] bg-white hover:bg-[#F8F5EF] text-[#5A524A] transition-colors"
            title="Download wedding-store.json for local backup or git commit"
          >
            <Download className="w-3.5 h-3.5 text-[#9E814D]" />
            <span>Backup JSON</span>
          </button>

          <label
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#E9E1D5] bg-white hover:bg-[#F8F5EF] text-[#5A524A] cursor-pointer transition-colors"
            title="Restore from a downloaded JSON backup"
          >
            <Upload className="w-3.5 h-3.5 text-[#9E814D]" />
            <span>Restore JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJsonFile}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => setSplitPreview(!splitPreview)}
            className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              splitPreview
                ? "bg-[#202020] text-white border-[#202020]"
                : "bg-white text-[#5A524A] border-[#E9E1D5] hover:bg-[#F8F5EF]"
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>{splitPreview ? "Hide Split View" : "Split Live Preview"}</span>
          </button>

          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#C9B38C] text-[#202020] hover:bg-[#D4AF37] font-medium text-xs tracking-wider transition-colors shadow-sm"
          >
            <span>VIEW INVITATION</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-600 hover:bg-red-50 transition-colors"
            title="Log out of admin"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Cloud Persistence Alert Banner if deployed on Vercel without connected Blob store */}
      {cloudStatus?.isVercel && !cloudStatus.configured && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
          <div className="flex items-start sm:items-center gap-2">
            <span className="text-base leading-none">⚠️</span>
            <div>
              <span className="font-semibold text-amber-950">Keep changes permanently across code updates:</span>
              {" "}Your Vercel project is in local mode. Changes are currently preserved in this browser. To keep all data &amp; music permanently across code pushes, connect your Blob store in Vercel:
              <span className="inline-block ml-1 font-mono text-[11px] bg-amber-100/70 text-amber-800 px-1.5 py-0.5 rounded">
                Vercel Dashboard → Storage tab → Connect your store (kevinstorage) to this project
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={handleSyncAllToCloud}
              disabled={isSaving}
              className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded font-medium text-[11px] transition-colors shadow-xs disabled:opacity-50"
            >
              {isSaving ? "Syncing..." : "Sync Edits Now"}
            </button>
          </div>
        </div>
      )}

      {/* Main Body */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-64 bg-[#FFFFFF] border-r border-[#E9E1D5] flex flex-col justify-between shrink-0 hidden md:flex">
          <div className="p-4 space-y-1 overflow-y-auto">
            <span className="px-3 text-[10px] uppercase tracking-widest font-semibold text-[#A8A096] block mb-2">
              Management Suite
            </span>
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-[#202020] text-[#FAF8F5] shadow-sm font-semibold"
                      : "text-[#5A524A] hover:bg-[#F8F5EF] hover:text-[#202020]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#C9B38C]" : "text-[#8C847B]"}`} />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* User profile footer */}
          <div className="p-4 border-t border-[#E9E1D5] bg-[#FCFAF6] text-xs space-y-1">
            <p className="text-[11px] text-[#8C847B]">Logged in as</p>
            <p className="font-semibold text-[#202020]">{adminUsername || "Administrator"}</p>
          </div>
        </aside>

        {/* Mobile Horizontal Tab Navigation */}
        <div className="md:hidden w-full shrink-0 flex overflow-x-auto bg-white border-b border-[#E9E1D5] p-2 gap-2 sticky top-[57px] z-20 scrollbar-none shadow-xs">
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium ${
                activeTab === tab.id ? "bg-[#202020] text-white" : "bg-[#F8F5EF] text-[#5A524A]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area & Split Screen Container */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Form Content Column */}
          <div className={`flex-1 p-6 sm:p-10 overflow-y-auto ${splitPreview ? "lg:w-1/2" : "w-full"}`}>
            {/* TAB: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="max-w-4xl mx-auto space-y-8">
                <div>
                  <h2 className="font-editorial-serif text-3xl text-[#202020]">Wedding Overview</h2>
                  <p className="text-xs text-[#736B63] mt-1">
                    Live snapshot of attendance, Shagun money collection, and guestbook moderation.
                  </p>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-5 rounded-2xl bg-white border border-[#E9E1D5] shadow-sm space-y-1">
                    <p className="text-xs text-[#8C847B] uppercase tracking-wider font-medium">Total RSVPs</p>
                    <p className="font-editorial-serif text-3xl text-[#202020]">{totalRsvps}</p>
                    <span className="text-[10px] text-[#A8A096]">Responses logged</span>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-[#E9E1D5] shadow-sm space-y-1">
                    <p className="text-xs text-[#8C847B] uppercase tracking-wider font-medium">Attending</p>
                    <p className="font-editorial-serif text-3xl text-emerald-700">{attendingRsvps.length}</p>
                    <span className="text-[10px] text-emerald-600 font-medium">
                      {totalGuestsAttending} total guests
                    </span>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-[#E9E1D5] shadow-sm space-y-1">
                    <p className="text-xs text-[#8C847B] uppercase tracking-wider font-medium">Total Shagun</p>
                    <p className="font-editorial-serif text-3xl text-[#9E814D]">
                      ₹{totalShagunAmount.toLocaleString("en-IN")}
                    </p>
                    <span className="text-[10px] text-[#736B63]">
                      {shagunList.length} envelopes recorded
                    </span>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-[#E9E1D5] shadow-sm space-y-1">
                    <p className="text-xs text-[#8C847B] uppercase tracking-wider font-medium">Guest Wishes</p>
                    <p className="font-editorial-serif text-3xl text-[#202020]">
                      {data.wishes.filter((w) => w.status === "approved").length}
                    </p>
                    <span className="text-[10px] text-amber-700 font-medium">
                      {data.wishes.filter((w) => w.status === "pending").length} pending review
                    </span>
                  </div>
                </div>

                {/* Quick actions & Wedding Details Preview */}
                <div className="p-6 rounded-2xl bg-white border border-[#C9B38C]/40 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-editorial-serif text-2xl text-[#202020]">
                        <RichText content={data.wedding.groomName} /> &amp; <RichText content={data.wedding.brideName} />
                      </h3>
                      <p className="text-xs text-[#736B63]">
                        {data.wedding.weddingDate} • {data.wedding.location}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-[#F8F5EF] text-[#9E814D] border border-[#C9B38C]/40 text-xs font-medium">
                      {data.wedding.hashtag}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-4 border-t border-[#E9E1D5]">
                    <button
                      onClick={() => setActiveTab("shagun")}
                      className="p-3 rounded-xl bg-[#F8F5EF] hover:bg-[#E9E1D5] text-left transition-colors"
                    >
                      <p className="text-xs font-semibold text-[#202020]">Shagun Register</p>
                      <p className="text-[11px] text-[#8C847B]">Manage gift entries</p>
                    </button>
                    <button
                      onClick={() => setActiveTab("sections")}
                      className="p-3 rounded-xl bg-[#F8F5EF] hover:bg-[#E9E1D5] text-left transition-colors"
                    >
                      <p className="text-xs font-semibold text-[#202020]">Section Controls</p>
                      <p className="text-[11px] text-[#8C847B]">Show/hide sections</p>
                    </button>
                    <button
                      onClick={() => setActiveTab("music")}
                      className="p-3 rounded-xl bg-[#F8F5EF] hover:bg-[#E9E1D5] text-left transition-colors"
                    >
                      <p className="text-xs font-semibold text-[#202020]">Music Library</p>
                      <p className="text-[11px] text-[#8C847B]">Upload &amp; select songs</p>
                    </button>
                    <button
                      onClick={() => setActiveTab("rsvp")}
                      className="p-3 rounded-xl bg-[#F8F5EF] hover:bg-[#E9E1D5] text-left transition-colors"
                    >
                      <p className="text-xs font-semibold text-[#202020]">RSVP Guests</p>
                      <p className="text-[11px] text-[#8C847B]">Export CSV &amp; responses</p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SECTION VISIBILITY */}
            {activeTab === "sections" && (
              <div className="max-w-3xl mx-auto space-y-6">
                <div>
                  <h2 className="font-editorial-serif text-3xl text-[#202020]">Section Visibility Controls</h2>
                  <p className="text-xs text-[#736B63] mt-1">
                    Toggle any section on or off on the public invitation website in real-time.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-[#E9E1D5] shadow-sm space-y-4">
                  {[
                    { key: "hero" as keyof SectionVisibility, title: "Hero Section", desc: "Large cinematic portrait, couple names, and romantic quote" },
                    { key: "dateReveal" as keyof SectionVisibility, title: "Royal Date Reveal & Palace Gate", desc: "Interactive scroll-triggered palace gate uncurtaining the wedding date and Muhurat" },
                    { key: "countdown" as keyof SectionVisibility, title: "Live Countdown Timer", desc: "Real-time countdown until wedding day" },
                    { key: "story" as keyof SectionVisibility, title: "Our Story & Couple Profiles", desc: "Relationship timeline milestones and bride & groom bios" },
                    { key: "events" as keyof SectionVisibility, title: "Celebration Events (Haldi, Mehendi, etc.)", desc: "Event dates, timings, dress codes, and calendar links" },
                    { key: "timeline" as keyof SectionVisibility, title: "Day Itinerary Timeline", desc: "Step-by-step ceremony schedule" },
                    { key: "venue" as keyof SectionVisibility, title: "Venue & Accommodations", desc: "Destination palace, Google Maps link, and stay notes" },
                    { key: "gallery" as keyof SectionVisibility, title: "Photo Gallery", desc: "Editorial asymmetric masonry photos with lightbox" },
                    { key: "family" as keyof SectionVisibility, title: "Family Blessings", desc: "Parents, grandparents, and family heritage introduction" },
                    { key: "rsvp" as keyof SectionVisibility, title: "RSVP Response Form", desc: "Interactive attendance and dietary preferences form" },
                    { key: "wishes" as keyof SectionVisibility, title: "Guestbook Wishes", desc: "Public blessings wall and submission form" },
                  ].map((sec) => {
                    const isVisible = data.sectionVisibility[sec.key] !== false;
                    return (
                      <div
                        key={sec.key}
                        className="flex items-center justify-between p-4 rounded-xl border border-[#E9E1D5] hover:bg-[#FCFAF6] transition-colors"
                      >
                        <div className="space-y-0.5">
                          <p className="text-sm font-semibold text-[#202020]">{sec.title}</p>
                          <p className="text-xs text-[#736B63]">{sec.desc}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleSection(sec.key)}
                          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${
                            isVisible
                              ? "bg-emerald-700 text-white"
                              : "bg-stone-200 text-stone-700"
                          }`}
                        >
                          {isVisible ? "Visible" : "Hidden"}
                        </button>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={saveSectionVisibility}
                  disabled={isSaving}
                  className="px-8 py-3 rounded-full bg-[#202020] text-[#FCFAF6] text-xs font-medium tracking-[0.2em] uppercase hover:bg-[#38332E] transition-colors shadow-md disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "SAVE SECTION PREFERENCES"}
                </button>
              </div>
            )}

            {/* TAB: SHAGUN MONEY COLLECTION */}
            {activeTab === "shagun" && (
              <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-editorial-serif text-3xl text-[#202020]">Traditional Shagun Register</h2>
                    <p className="text-xs text-[#736B63]">
                      Indian traditional cash gift &amp; lifafa tracker for both Groom and Bride sides.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setNewShagunModal(true)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#202020] text-[#FCFAF6] text-xs font-medium tracking-wider uppercase hover:bg-[#38332E] shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Shagun Entry</span>
                    </button>
                    <button
                      type="button"
                      onClick={exportShagunCsv}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[#C9B38C] text-[#202020] text-xs font-medium tracking-wider uppercase hover:bg-[#F8F5EF] shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5 text-[#9E814D]" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>

                {/* Shagun Summary Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-5 rounded-2xl bg-white border border-[#C9B38C]/40 shadow-sm space-y-1">
                    <p className="text-xs text-[#8C847B] uppercase tracking-wider font-medium">Total Collection</p>
                    <p className="font-editorial-serif text-3xl text-[#9E814D]">
                      ₹{totalShagunAmount.toLocaleString("en-IN")}
                    </p>
                    <span className="text-[10px] text-[#736B63]">{shagunList.length} gifts recorded</span>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-blue-200 shadow-sm space-y-1">
                    <p className="text-xs text-blue-700 uppercase tracking-wider font-semibold">Groom Side</p>
                    <p className="font-editorial-serif text-3xl text-blue-900">
                      ₹{groomSideShagun.toLocaleString("en-IN")}
                    </p>
                    <span className="text-[10px] text-blue-600 font-medium">
                      {shagunList.filter((s) => s.side === "groom").length} entries
                    </span>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-rose-200 shadow-sm space-y-1">
                    <p className="text-xs text-rose-700 uppercase tracking-wider font-semibold">Bride Side</p>
                    <p className="font-editorial-serif text-3xl text-rose-900">
                      ₹{brideSideShagun.toLocaleString("en-IN")}
                    </p>
                    <span className="text-[10px] text-rose-600 font-medium">
                      {shagunList.filter((s) => s.side === "bride").length} entries
                    </span>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-[#E9E1D5] shadow-sm space-y-1">
                    <p className="text-xs text-[#8C847B] uppercase tracking-wider font-medium">Payment Modes</p>
                    <div className="text-xs text-[#202020] space-y-0.5 pt-1">
                      <p>Cash: <span className="font-semibold">₹{cashShagun.toLocaleString("en-IN")}</span></p>
                      <p>UPI/Online: <span className="font-semibold">₹{upiShagun.toLocaleString("en-IN")}</span></p>
                    </div>
                  </div>
                </div>

                {/* Add Shagun Modal */}
                {newShagunModal && (
                  <form
                    onSubmit={handleAddShagun}
                    className="p-6 rounded-3xl bg-white border-2 border-[#C9B38C] shadow-xl space-y-4"
                  >
                    <div className="flex items-center justify-between border-b pb-3">
                      <h3 className="font-editorial-serif text-2xl text-[#202020]">Record Shagun Gift</h3>
                      <button
                        type="button"
                        onClick={() => setNewShagunModal(false)}
                        className="text-stone-400 hover:text-stone-700 text-sm"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Side Selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-[#5A524A] block">
                        Family Side
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setNewShagun({ ...newShagun, side: "groom" })}
                          className={`py-2.5 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all ${
                            newShagun.side === "groom"
                              ? "bg-blue-900 text-white border-blue-900 shadow-sm"
                              : "bg-[#F8F5EF] text-[#5A524A] border-[#E9E1D5]"
                          }`}
                        >
                          Groom Side ({data.wedding.groomName.replace(/<[^>]*>/g, "").trim()}&apos;s Family)
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewShagun({ ...newShagun, side: "bride" })}
                          className={`py-2.5 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all ${
                            newShagun.side === "bride"
                              ? "bg-rose-900 text-white border-rose-900 shadow-sm"
                              : "bg-[#F8F5EF] text-[#5A524A] border-[#E9E1D5]"
                          }`}
                        >
                          Bride Side ({data.wedding.brideName.replace(/<[^>]*>/g, "").trim()}&apos;s Family)
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-[#5A524A] block mb-1">
                          Guest / Family Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Mukeshbhai &amp; Hansaben Shah"
                          value={newShagun.guestName}
                          onChange={(e) => setNewShagun({ ...newShagun, guestName: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[#5A524A] block mb-1">
                          Amount (₹ INR) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          required
                          min={1}
                          step={1}
                          placeholder="e.g. 5100"
                          value={newShagun.amount}
                          onChange={(e) => setNewShagun({ ...newShagun, amount: Number(e.target.value) })}
                          className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold text-[#9E814D]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-medium text-[#5A524A] block mb-1">Relation / Label</label>
                        <input
                          type="text"
                          placeholder="e.g. Kaka, Mama, Fua, Friend"
                          value={newShagun.relation}
                          onChange={(e) => setNewShagun({ ...newShagun, relation: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[#5A524A] block mb-1">City / Native</label>
                        <input
                          type="text"
                          placeholder="e.g. Ahmedabad, Mumbai"
                          value={newShagun.city}
                          onChange={(e) => setNewShagun({ ...newShagun, city: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[#5A524A] block mb-1">Payment Mode</label>
                        <select
                          value={newShagun.paymentMode}
                          onChange={(e) =>
                            setNewShagun({
                              ...newShagun,
                              paymentMode: e.target.value as "cash" | "upi" | "cheque" | "gift",
                            })
                          }
                          className="w-full px-3.5 py-2 rounded-xl border text-xs"
                        >
                          <option value="cash">Cash (Lifafa)</option>
                          <option value="upi">UPI / Online Transfer</option>
                          <option value="cheque">Cheque</option>
                          <option value="gift">Gold / Silver Shagun Gift</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-[#5A524A] block mb-1">Ceremony / Event</label>
                        <select
                          value={newShagun.event}
                          onChange={(e) => setNewShagun({ ...newShagun, event: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border text-xs"
                        >
                          <option value="Wedding">Wedding Ceremony</option>
                          <option value="Mameru">Mameru / Mosalu</option>
                          <option value="Sangeet">Sangeet</option>
                          <option value="Mehendi">Mehendi</option>
                          <option value="Haldi">Haldi</option>
                          <option value="Reception">Reception</option>
                          <option value="General">General Shagun</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[#5A524A] block mb-1">Received By</label>
                        <input
                          type="text"
                          placeholder="e.g. Nilesh Vora, Kevin"
                          value={newShagun.receivedBy}
                          onChange={(e) => setNewShagun({ ...newShagun, receivedBy: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-[#5A524A] block mb-1">Notes / Blessings</label>
                      <input
                        type="text"
                        placeholder="Additional remarks..."
                        value={newShagun.notes}
                        onChange={(e) => setNewShagun({ ...newShagun, notes: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-full bg-[#202020] text-[#FCFAF6] text-xs font-semibold tracking-wider uppercase hover:bg-[#38332E]"
                      >
                        Save Shagun Entry
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewShagunModal(false)}
                        className="px-4 py-2.5 rounded-full text-xs text-[#736B63]"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Filters & Search */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 text-[#8C847B] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search guest, relation, city, notes..."
                      value={shagunSearch}
                      onChange={(e) => setShagunSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E9E1D5] bg-white text-xs text-[#202020] focus:ring-2 focus:ring-[#C9B38C]"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setShagunSideFilter("all")}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                        shagunSideFilter === "all" ? "bg-[#202020] text-white" : "bg-white text-[#736B63] border"
                      }`}
                    >
                      All ({shagunList.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setShagunSideFilter("groom")}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                        shagunSideFilter === "groom" ? "bg-blue-900 text-white" : "bg-white text-blue-800 border"
                      }`}
                    >
                      Groom Side ({shagunList.filter((s) => s.side === "groom").length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setShagunSideFilter("bride")}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                        shagunSideFilter === "bride" ? "bg-rose-900 text-white" : "bg-white text-rose-800 border"
                      }`}
                    >
                      Bride Side ({shagunList.filter((s) => s.side === "bride").length})
                    </button>
                  </div>
                </div>

                {/* Shagun Entries Table */}
                <div className="rounded-2xl border border-[#E9E1D5] bg-white shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F8F5EF] border-b border-[#E9E1D5] text-[#5A524A] uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="p-3.5">Guest / Family</th>
                          <th className="p-3.5">Side</th>
                          <th className="p-3.5">Relation &amp; City</th>
                          <th className="p-3.5">Amount (₹)</th>
                          <th className="p-3.5">Payment</th>
                          <th className="p-3.5">Event</th>
                          <th className="p-3.5">Received By</th>
                          <th className="p-3.5">Notes</th>
                          <th className="p-3.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E9E1D5]">
                        {filteredShagun.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="p-8 text-center text-xs text-[#8C847B]">
                              No shagun entries found matching search.
                            </td>
                          </tr>
                        ) : (
                          filteredShagun.map((s) => (
                            <tr key={s.id} className="hover:bg-[#FCFAF6] transition-colors">
                              <td className="p-3.5 font-medium text-[#202020] whitespace-nowrap">
                                {s.guestName}
                              </td>
                              <td className="p-3.5 whitespace-nowrap">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                                    s.side === "groom"
                                      ? "bg-blue-100 text-blue-800 border border-blue-200"
                                      : "bg-rose-100 text-rose-800 border border-rose-200"
                                  }`}
                                >
                                  {s.side === "groom" ? "Groom" : "Bride"}
                                </span>
                              </td>
                              <td className="p-3.5 text-[#5A524A] whitespace-nowrap">
                                {s.relation || "—"} {s.city ? `(${s.city})` : ""}
                              </td>
                              <td className="p-3.5 font-semibold text-[#9E814D] whitespace-nowrap">
                                ₹{Number(s.amount).toLocaleString("en-IN")}
                              </td>
                              <td className="p-3.5 whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded-md bg-[#F8F5EF] text-[10px] uppercase font-semibold text-[#5A524A]">
                                  {s.paymentMode}
                                </span>
                              </td>
                              <td className="p-3.5 text-[#736B63] whitespace-nowrap">{s.event || "Wedding"}</td>
                              <td className="p-3.5 text-[#736B63] whitespace-nowrap">{s.receivedBy || "—"}</td>
                              <td className="p-3.5 text-[#8C847B] max-w-xs truncate" title={s.notes}>
                                {s.notes || "—"}
                              </td>
                              <td className="p-3.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => setShagunToDelete(s)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                  title="Delete record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: MUSIC LIBRARY */}
            {activeTab === "music" && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-editorial-serif text-3xl text-[#202020]">Music Library</h2>
                    <p className="text-xs text-[#736B63]">
                      Upload, preview, and set the active background music for the wedding invitation.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenTrimmer()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#202020] text-[#FCFAF6] text-xs font-medium tracking-wider uppercase hover:bg-[#38332E]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add / Upload &amp; Trim Song</span>
                  </button>
                </div>

                {/* Active Playing Song Highlight Card */}
                {(() => {
                  const activeTrack = (data.musicLibrary || []).find((m) => m.isActive);
                  return (
                    <div className="p-6 rounded-3xl bg-[#202020] text-white border border-[#C9B38C]/40 shadow-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-[#C9B38C]">
                          Currently Active on Invitation
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="w-1 h-3 bg-[#C9B38C] animate-pulse" />
                          <span className="w-1 h-4 bg-[#C9B38C] animate-pulse delay-75" />
                          <span className="w-1 h-2 bg-[#C9B38C] animate-pulse delay-150" />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                        <div>
                          <h3 className="font-editorial-serif text-2xl sm:text-3xl text-white">
                            {activeTrack ? activeTrack.title : "Perfect (Ed Sheeran - Acoustic Romance)"}
                          </h3>
                          <p className="text-xs text-[#C9B38C] font-light">
                            {activeTrack ? activeTrack.artist : "Ed Sheeran"}
                          </p>
                        </div>

                        {activeTrack && (
                          <button
                            type="button"
                            onClick={() => toggleAudioPreview(activeTrack.url)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#C9B38C] text-[#202020] text-xs font-semibold tracking-wider uppercase hover:bg-[#E5D3B3] transition-colors self-start sm:self-auto"
                          >
                            {previewingAudio === activeTrack.url ? (
                              <>
                                <Pause className="w-4 h-4" />
                                <span>Pause Preview</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4" />
                                <span>Play Preview</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Upload / Add Music Modal */}
                {newMusicModal && (
                  <form
                    onSubmit={handleAddMusic}
                    className="p-6 rounded-3xl bg-white border-2 border-[#C9B38C] shadow-xl space-y-4"
                  >
                    <h3 className="font-editorial-serif text-2xl text-[#202020]">Add or Upload Audio Track</h3>

                    {/* Direct Computer File Upload */}
                    <div className="p-4 rounded-2xl bg-[#F8F5EF] border border-dashed border-[#C9B38C] space-y-2 text-center">
                      <Upload className="w-6 h-6 mx-auto text-[#9E814D]" />
                      <p className="text-xs font-semibold text-[#202020]">Upload MP3 from your computer</p>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleFileUpload}
                        disabled={uploadingAudio}
                        className="text-xs mx-auto block file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#202020] file:text-white hover:file:bg-[#38332E]"
                      />
                      {uploadingAudio && <p className="text-xs text-amber-700 animate-pulse">Uploading file to secure music storage...</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-[#5A524A] block mb-1">Song Title</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Perfect"
                          value={newMusic.title}
                          onChange={(e) => setNewMusic({ ...newMusic, title: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[#5A524A] block mb-1">Artist</label>
                        <input
                          type="text"
                          placeholder="e.g. Ed Sheeran"
                          value={newMusic.artist}
                          onChange={(e) => setNewMusic({ ...newMusic, artist: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-[#5A524A] block mb-1">Audio URL (or uploaded link)</label>
                      <input
                        type="url"
                        required
                        placeholder="https://... or /uploads/song.mp3"
                        value={newMusic.url}
                        onChange={(e) => setNewMusic({ ...newMusic, url: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="set-active-cb"
                        checked={newMusic.isActive}
                        onChange={(e) => setNewMusic({ ...newMusic, isActive: e.target.checked })}
                        className="rounded text-[#C9B38C]"
                      />
                      <label htmlFor="set-active-cb" className="text-xs text-[#202020] font-medium">
                        Set as Active background song immediately
                      </label>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-full bg-[#202020] text-[#FCFAF6] text-xs font-semibold tracking-wider uppercase hover:bg-[#38332E]"
                      >
                        Add to Library
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewMusicModal(false)}
                        className="px-4 py-2.5 rounded-full text-xs text-[#736B63]"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Song List */}
                <div className="space-y-3">
                  {(data.musicLibrary || []).map((track) => (
                    <div
                      key={track.id}
                      className={`p-4 rounded-2xl bg-white border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-sm ${
                        track.isActive ? "border-[#C9B38C] ring-1 ring-[#C9B38C]/50" : "border-[#E9E1D5]"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-editorial-serif text-xl text-[#202020]">{track.title}</h4>
                          {track.isActive && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold uppercase">
                              Active Song
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#736B63]">{track.artist}</p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => toggleAudioPreview(track.url)}
                          className="p-2 rounded-lg border border-[#E9E1D5] hover:bg-[#F8F5EF] text-xs flex items-center gap-1.5"
                          title="Preview Track"
                        >
                          {previewingAudio === track.url ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          <span className="text-[11px]">{previewingAudio === track.url ? "Pause" : "Play"}</span>
                        </button>

                        {!track.isActive && (
                          <button
                            type="button"
                            onClick={() => handleSetActiveTrack(track.id)}
                            className="px-3 py-1.5 rounded-lg bg-[#202020] text-[#FCFAF6] text-[11px] font-medium tracking-wider uppercase hover:bg-[#38332E]"
                          >
                            Set Active
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenTrimmer(track)}
                          className="p-2 rounded-lg border border-[#C9B38C] text-[#202020] hover:bg-[#FCFAF6] text-xs flex items-center gap-1.5 transition-colors"
                          title="Trim & Edit Audio"
                        >
                          <Scissors className="w-3.5 h-3.5 text-[#9E814D]" />
                          <span className="text-[11px] font-medium hidden sm:inline">Trim / Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteMusic(track.id)}
                          className="p-2 text-red-500 hover:text-red-700"
                          title="Remove Track"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: WEDDING DETAILS */}
            {activeTab === "details" && (
              <form onSubmit={saveWeddingDetails} className="max-w-3xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="font-editorial-serif text-3xl text-[#202020]">Wedding Details</h2>
                    <p className="text-xs text-[#736B63] mt-1">
                      Configure Groom name, Bride name, date, location, hashtag, and hero image. Each text field supports individual colors, fonts, bold, and italic styling.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGlobalResetStyling}
                    className="text-xs px-3.5 py-2 rounded-xl bg-[#F6F2EB] hover:bg-stone-200 text-[#5A524A] hover:text-[#202020] border border-[#E9E1D5] flex items-center gap-1.5 font-medium transition-colors self-start sm:self-auto shrink-0 shadow-2xs"
                    title="Reset all custom text styling tags across all sections to clean defaults"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#9E814D]" />
                    <span>Reset All Text Styles</span>
                  </button>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-[#E9E1D5] shadow-sm space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <RichTextEditorField
                      label="Groom Name (First)"
                      required
                      rows={1}
                      value={data.wedding.groomName}
                      onChange={(val) =>
                        setData({ ...data, wedding: { ...data.wedding, groomName: val } })
                      }
                      defaultOriginalValue={initialWeddingData.wedding.groomName}
                      placeholder="e.g. Kevin"
                      helpText="Format groom name with custom colors, bold, or elegant script fonts."
                    />

                    <RichTextEditorField
                      label="Bride Name (Second)"
                      required
                      rows={1}
                      value={data.wedding.brideName}
                      onChange={(val) =>
                        setData({ ...data, wedding: { ...data.wedding, brideName: val } })
                      }
                      defaultOriginalValue={initialWeddingData.wedding.brideName}
                      placeholder="e.g. Moksha"
                      helpText="Format bride name with custom colors, bold, or elegant script fonts."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#5A524A] uppercase tracking-wider block">
                        Wedding Date (YYYY-MM-DD) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={data.wedding.weddingDate}
                        onChange={(e) =>
                          setData({ ...data, wedding: { ...data.wedding, weddingDate: e.target.value } })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E1D5] text-sm text-[#202020] focus:ring-2 focus:ring-[#C9B38C] bg-[#FCFAF6]"
                      />
                    </div>

                    <RichTextEditorField
                      label="Ceremony Time"
                      rows={1}
                      value={data.wedding.weddingTime}
                      onChange={(val) =>
                        setData({ ...data, wedding: { ...data.wedding, weddingTime: val } })
                      }
                      defaultOriginalValue={initialWeddingData.wedding.weddingTime}
                      placeholder="e.g. 12:00 PM"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <RichTextEditorField
                      label="Location / Venue Name"
                      rows={1}
                      value={data.wedding.location}
                      onChange={(val) =>
                        setData({ ...data, wedding: { ...data.wedding, location: val } })
                      }
                      defaultOriginalValue={initialWeddingData.wedding.location}
                      placeholder="e.g. Kunvarbai Jain Dharmshala"
                    />

                    <RichTextEditorField
                      label="City & State"
                      rows={1}
                      value={data.wedding.city}
                      onChange={(val) =>
                        setData({ ...data, wedding: { ...data.wedding, city: val } })
                      }
                      defaultOriginalValue={initialWeddingData.wedding.city}
                      placeholder="e.g. Jamnagar, Gujarat"
                    />
                  </div>

                  <RichTextEditorField
                    label="Wedding Hashtag"
                    rows={1}
                    value={data.wedding.hashtag}
                    onChange={(val) =>
                      setData({ ...data, wedding: { ...data.wedding, hashtag: val } })
                    }
                    defaultOriginalValue={initialWeddingData.wedding.hashtag}
                    placeholder="e.g. #MokshVin"
                  />

                  {/* Hero Quotations & Taglines */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <RichTextEditorField
                      label="Hero Subtitle / Headline"
                      rows={1}
                      value={data.wedding.invitationSubtitle || ""}
                      onChange={(val) =>
                        setData({ ...data, wedding: { ...data.wedding, invitationSubtitle: val } })
                      }
                      defaultOriginalValue={initialWeddingData.wedding.invitationSubtitle}
                      placeholder="e.g. Two Stories, One Chapter"
                    />

                    <RichTextEditorField
                      label="Couple Micro-Tagline"
                      rows={1}
                      value={data.wedding.heroTagline || ""}
                      onChange={(val) =>
                        setData({ ...data, wedding: { ...data.wedding, heroTagline: val } })
                      }
                      defaultOriginalValue={initialWeddingData.wedding.heroTagline}
                      placeholder="e.g. Two Souls • One Heartbeat"
                    />
                  </div>

                  <RichTextEditorField
                    label="Hero Romantic Couple Quote (Displayed Beneath Names)"
                    value={data.wedding.heroQuote || ""}
                    onChange={(val) =>
                      setData({ ...data, wedding: { ...data.wedding, heroQuote: val } })
                    }
                    defaultOriginalValue={initialWeddingData.wedding.heroQuote}
                    placeholder="e.g. In the quiet rhythm of our laughter and in every shared dream, we found our forever."
                    helpText="Format text with bold, italic, custom color, font size, and fonts."
                  />

                  <ImageUploadField
                    label="Hero Cinematic Cover Photo"
                    value={data.wedding.heroImage}
                    onChange={(url) =>
                      setData({ ...data, wedding: { ...data.wedding, heroImage: url } })
                    }
                    helpText="Large landscape cover photo displayed at the very top of the invitation."
                  />

                  <ImageUploadField
                    label="Social Share Preview (OG Image / WhatsApp Card)"
                    value={data.wedding.ogImage || ""}
                    onChange={(url) =>
                      setData({ ...data, wedding: { ...data.wedding, ogImage: url } })
                    }
                    helpText="Image displayed when sharing the invitation link on WhatsApp, Facebook, iMessage, and Twitter (recommended size: 1200 x 630 px). Leaving empty uses the default royal invitation banner."
                  />

                  <RichTextEditorField
                    label="Introduction Text"
                    value={data.wedding.introText || ""}
                    onChange={(val) =>
                      setData({ ...data, wedding: { ...data.wedding, introText: val } })
                    }
                    defaultOriginalValue={initialWeddingData.wedding.introText}
                    placeholder="e.g. With the divine blessings of Almighty..."
                    helpText="Format text with bold, italic, custom color, font size, and fonts."
                  />

                  <RichTextEditorField
                    label="Closing Gratitude Message"
                    value={data.wedding.closingMessage || ""}
                    onChange={(val) =>
                      setData({ ...data, wedding: { ...data.wedding, closingMessage: val } })
                    }
                    defaultOriginalValue={initialWeddingData.wedding.closingMessage}
                    placeholder="e.g. Thank you for being part of our story and blessing our new beginning."
                    helpText="Format text with bold, italic, custom color, font size, and fonts."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-8 py-3 rounded-full bg-[#202020] text-[#FCFAF6] text-xs font-medium tracking-[0.2em] uppercase hover:bg-[#38332E] transition-colors shadow-md disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "SAVE CHANGES"}
                </button>
              </form>
            )}

            {/* TAB: TYPOGRAPHY & THEME SETTINGS */}
            {activeTab === "typography" && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div>
                  <h2 className="font-editorial-serif text-3xl text-[#202020]">Typography &amp; Color Theme</h2>
                  <p className="text-xs text-[#736B63] mt-1">
                    Customize primary heading fonts, size scales, and luxury color accents. Changes update live across the invitation.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-[#E9E1D5] shadow-sm">
                  <TypographySettingsSection
                    styling={data.wedding.textStyling || {
                      headingFont: "editorial-serif",
                      bodyFont: "sans",
                      fontSizeScale: "normal",
                      headingColor: "#202020",
                      accentColor: "#9E814D",
                      bodyColor: "#665E55",
                      isBoldHeading: false,
                      isItalicHeading: false,
                    }}
                    onChange={(updatedStyling) =>
                      setData({
                        ...data,
                        wedding: {
                          ...data.wedding,
                          textStyling: updatedStyling,
                        },
                      })
                    }
                    groomName={data.wedding.groomName}
                    brideName={data.wedding.brideName}
                    onGlobalResetStyling={handleGlobalResetStyling}
                  />
                </div>

                <button
                  type="button"
                  onClick={saveWeddingDetails}
                  disabled={isSaving}
                  className="px-8 py-3 rounded-full bg-[#202020] text-[#FCFAF6] text-xs font-medium tracking-[0.2em] uppercase hover:bg-[#38332E] transition-colors shadow-md disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "SAVE STYLING CHANGES"}
                </button>
              </div>
            )}

            {/* TAB: COUPLE */}
            {activeTab === "couple" && (
              <form onSubmit={saveCoupleInfo} className="max-w-3xl mx-auto space-y-6">
                <div>
                  <h2 className="font-editorial-serif text-3xl text-[#202020]">The Couple</h2>
                  <p className="text-xs text-[#736B63] mt-1">
                    Groom profile (first) and Bride profile (second) with photos, titles, and couple quote. Each text field supports individual colors, fonts, and bold/italic styling.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-[#E9E1D5] shadow-sm space-y-6">
                  {/* Groom Section - First */}
                  <div className="space-y-4 pb-6 border-b border-[#E9E1D5]">
                    <h3 className="font-editorial-serif text-xl text-blue-950">Groom Profile (First)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <RichTextEditorField
                        label="Groom Full Name"
                        rows={1}
                        value={data.couple.groomName}
                        onChange={(val) =>
                          setData({ ...data, couple: { ...data.couple, groomName: val } })
                        }
                        defaultOriginalValue={initialWeddingData.couple.groomName}
                      />
                      <RichTextEditorField
                        label="Sub-Title / Lineage"
                        rows={1}
                        value={data.couple.groomTitle || ""}
                        onChange={(val) =>
                          setData({ ...data, couple: { ...data.couple, groomTitle: val } })
                        }
                        defaultOriginalValue={initialWeddingData.couple.groomTitle}
                      />
                    </div>
                    <ImageUploadField
                      label="Groom Portrait Photo"
                      value={data.couple.groomPhoto}
                      onChange={(url) =>
                        setData({ ...data, couple: { ...data.couple, groomPhoto: url } })
                      }
                      helpText="Square or portrait photo of the groom."
                    />
                    <RichTextEditorField
                      label="Bio / Notes"
                      rows={2}
                      value={data.couple.groomBio}
                      onChange={(val) =>
                        setData({ ...data, couple: { ...data.couple, groomBio: val } })
                      }
                      defaultOriginalValue={initialWeddingData.couple.groomBio}
                    />
                  </div>

                  {/* Bride Section - Second */}
                  <div className="space-y-4 pb-6 border-b border-[#E9E1D5]">
                    <h3 className="font-editorial-serif text-xl text-rose-950">Bride Profile (Second)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <RichTextEditorField
                        label="Bride Full Name"
                        rows={1}
                        value={data.couple.brideName}
                        onChange={(val) =>
                          setData({ ...data, couple: { ...data.couple, brideName: val } })
                        }
                        defaultOriginalValue={initialWeddingData.couple.brideName}
                      />
                      <RichTextEditorField
                        label="Sub-Title / Lineage"
                        rows={1}
                        value={data.couple.brideTitle || ""}
                        onChange={(val) =>
                          setData({ ...data, couple: { ...data.couple, brideTitle: val } })
                        }
                        defaultOriginalValue={initialWeddingData.couple.brideTitle}
                      />
                    </div>
                    <ImageUploadField
                      label="Bride Portrait Photo"
                      value={data.couple.bridePhoto}
                      onChange={(url) =>
                        setData({ ...data, couple: { ...data.couple, bridePhoto: url } })
                      }
                      helpText="Square or portrait photo of the bride."
                    />
                    <RichTextEditorField
                      label="Bio / Notes"
                      rows={2}
                      value={data.couple.brideBio}
                      onChange={(val) =>
                        setData({ ...data, couple: { ...data.couple, brideBio: val } })
                      }
                      defaultOriginalValue={initialWeddingData.couple.brideBio}
                    />
                  </div>

                  {/* Couple Quote */}
                  <RichTextEditorField
                    label="Featured Couple Quote"
                    rows={2}
                    value={data.couple.quote}
                    onChange={(val) =>
                      setData({ ...data, couple: { ...data.couple, quote: val } })
                    }
                    defaultOriginalValue={initialWeddingData.couple.quote}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-8 py-3 rounded-full bg-[#202020] text-[#FCFAF6] text-xs font-medium tracking-[0.2em] uppercase hover:bg-[#38332E] transition-colors shadow-md disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "SAVE COUPLE PROFILE"}
                </button>
              </form>
            )}

            {/* TAB: STORY */}
            {activeTab === "story" && (
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-editorial-serif text-3xl text-[#202020]">Our Story Timeline</h2>
                    <p className="text-xs text-[#736B63]">
                      Milestones from the first meeting to forever.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddStory}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#202020] text-[#FCFAF6] text-xs font-medium tracking-wider uppercase hover:bg-[#38332E]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Milestone</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {data.story.map((item) => (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl bg-white border border-[#E9E1D5] shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <input
                          type="text"
                          value={item.year}
                          onChange={(e) => handleUpdateStoryItem(item.id, "year", e.target.value)}
                          className="w-24 px-3 py-1.5 rounded-lg border border-[#E9E1D5] text-xs font-semibold text-[#9E814D]"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteStory(item.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Delete milestone"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <RichTextEditorField
                        label="Milestone Title"
                        rows={1}
                        value={item.title}
                        onChange={(val) => handleUpdateStoryItem(item.id, "title", val)}
                        placeholder="Title (e.g. The First Hello)"
                      />

                      <RichTextEditorField
                        label="Milestone Story Details"
                        rows={2}
                        value={item.description}
                        onChange={(val) => handleUpdateStoryItem(item.id, "description", val)}
                        placeholder="Story details..."
                      />

                      <ImageUploadField
                        label="Milestone Photo"
                        value={item.image || ""}
                        onChange={(url) => handleUpdateStoryItem(item.id, "image", url)}
                        placeholder="Milestone photo URL or upload from disk..."
                      />
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleSaveAllStory}
                  disabled={isSaving}
                  className="px-8 py-3 rounded-full bg-[#202020] text-[#FCFAF6] text-xs font-medium tracking-[0.2em] uppercase hover:bg-[#38332E] transition-colors shadow-md disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "SAVE ALL STORY CHANGES"}
                </button>
              </div>
            )}

            {/* TAB: EVENTS */}
            {activeTab === "events" && (
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-editorial-serif text-3xl text-[#202020]">Wedding Events</h2>
                    <p className="text-xs text-[#736B63]">
                      Add, reorder, and configure celebrations (Haldi, Mehendi, Sangeet, Ceremony, Reception).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewEventModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#202020] text-[#FCFAF6] text-xs font-medium tracking-wider uppercase hover:bg-[#38332E]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Event</span>
                  </button>
                </div>

                {/* Edit Event Modal */}
                {editingEvent && (
                  <form
                    onSubmit={handleSaveEditedEvent}
                    className="p-6 rounded-2xl bg-white border-2 border-[#9E814D] shadow-xl space-y-4 animate-fade-in"
                  >
                    <div className="flex items-center justify-between border-b border-[#E9E1D5] pb-3">
                      <h3 className="font-editorial-serif text-2xl text-[#202020]">Edit Celebration</h3>
                      <button
                        type="button"
                        onClick={() => setEditingEvent(null)}
                        className="text-stone-400 hover:text-stone-800 text-sm font-semibold"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <RichTextEditorField
                        label="Event Name"
                        required
                        rows={1}
                        placeholder="e.g. Sangeet & Cocktail"
                        value={editingEvent.name}
                        onChange={(val) => setEditingEvent({ ...editingEvent, name: val })}
                      />
                      <RichTextEditorField
                        label="Date"
                        required
                        rows={1}
                        placeholder="e.g. 17 December 2026"
                        value={editingEvent.date}
                        onChange={(val) => setEditingEvent({ ...editingEvent, date: val })}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <RichTextEditorField
                        label="Time"
                        rows={1}
                        placeholder="07:00 PM onwards"
                        value={editingEvent.time}
                        onChange={(val) => setEditingEvent({ ...editingEvent, time: val })}
                      />
                      <RichTextEditorField
                        label="Dress Code"
                        rows={1}
                        placeholder="e.g. Royal Velvet & Sparkles"
                        value={editingEvent.dressCode || ""}
                        onChange={(val) => setEditingEvent({ ...editingEvent, dressCode: val })}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <RichTextEditorField
                        label="Venue Hall / Lawn"
                        rows={1}
                        placeholder="e.g. Royal Courtyard"
                        value={editingEvent.venue}
                        onChange={(val) => setEditingEvent({ ...editingEvent, venue: val })}
                      />
                      <RichTextEditorField
                        label="Address"
                        rows={1}
                        placeholder="City, State"
                        value={editingEvent.address || ""}
                        onChange={(val) => setEditingEvent({ ...editingEvent, address: val })}
                      />
                    </div>

                    <RichTextEditorField
                      label="Description"
                      rows={2}
                      placeholder="An evening of celebration and music..."
                      value={editingEvent.description || ""}
                      onChange={(val) => setEditingEvent({ ...editingEvent, description: val })}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <ImageUploadField
                        label="Event Photo"
                        value={editingEvent.image || ""}
                        onChange={(url) => setEditingEvent({ ...editingEvent, image: url })}
                      />
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#5A524A] uppercase tracking-wider block">Google Maps URL</label>
                        <input
                          type="url"
                          value={editingEvent.mapsUrl || ""}
                          onChange={(e) => setEditingEvent({ ...editingEvent, mapsUrl: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-[#E9E1D5] text-xs bg-[#FCFAF6]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={isSavingEvent}
                        className="px-6 py-2.5 rounded-full bg-[#202020] text-[#FCFAF6] text-xs font-medium tracking-wider uppercase hover:bg-[#38332E] disabled:opacity-50"
                      >
                        {isSavingEvent ? "Saving..." : "Save Event Details"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingEvent(null)}
                        className="px-4 py-2.5 rounded-full text-xs text-[#736B63] hover:text-[#202020]"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Add Event Modal */}
                {newEventModal && (
                  <form
                    onSubmit={handleAddEvent}
                    className="p-6 rounded-2xl bg-white border-2 border-[#C9B38C] shadow-lg space-y-4"
                  >
                    <h3 className="font-editorial-serif text-2xl text-[#202020]">Add New Celebration</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <RichTextEditorField
                        label="Event Name"
                        required
                        rows={1}
                        placeholder="e.g. Sangeet & Cocktail"
                        value={newEvent.name || ""}
                        onChange={(val) => setNewEvent({ ...newEvent, name: val })}
                      />
                      <RichTextEditorField
                        label="Date"
                        required
                        rows={1}
                        placeholder="e.g. 17 December 2026"
                        value={newEvent.date || ""}
                        onChange={(val) => setNewEvent({ ...newEvent, date: val })}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <RichTextEditorField
                        label="Time"
                        rows={1}
                        placeholder="07:00 PM onwards"
                        value={newEvent.time || ""}
                        onChange={(val) => setNewEvent({ ...newEvent, time: val })}
                      />
                      <RichTextEditorField
                        label="Dress Code"
                        rows={1}
                        placeholder="e.g. Royal Velvet & Sparkles"
                        value={newEvent.dressCode || ""}
                        onChange={(val) => setNewEvent({ ...newEvent, dressCode: val })}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <RichTextEditorField
                        label="Venue Hall / Lawn"
                        rows={1}
                        placeholder="e.g. Royal Courtyard"
                        value={newEvent.venue || ""}
                        onChange={(val) => setNewEvent({ ...newEvent, venue: val })}
                      />
                      <RichTextEditorField
                        label="Address"
                        rows={1}
                        placeholder="City, State"
                        value={newEvent.address || ""}
                        onChange={(val) => setNewEvent({ ...newEvent, address: val })}
                      />
                    </div>

                    <RichTextEditorField
                      label="Description"
                      rows={2}
                      placeholder="An evening of celebration and music..."
                      value={newEvent.description || ""}
                      onChange={(val) => setNewEvent({ ...newEvent, description: val })}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <ImageUploadField
                        label="Event Photo"
                        value={newEvent.image || ""}
                        onChange={(url) => setNewEvent({ ...newEvent, image: url })}
                      />
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#5A524A] uppercase tracking-wider block">Google Maps URL</label>
                        <input
                          type="url"
                          value={newEvent.mapsUrl}
                          onChange={(e) => setNewEvent({ ...newEvent, mapsUrl: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-[#E9E1D5] text-xs bg-[#FCFAF6]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-full bg-[#202020] text-[#FCFAF6] text-xs font-medium tracking-wider uppercase hover:bg-[#38332E]"
                      >
                        Create Event
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewEventModal(false)}
                        className="px-4 py-2.5 rounded-full text-xs text-[#736B63]"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Events List */}
                <div className="space-y-4">
                  {data.events.map((evt, idx) => (
                    <div
                      key={evt.id}
                      className="p-5 rounded-2xl bg-white border border-[#E9E1D5] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-editorial-serif text-lg font-semibold text-[#9E814D]">
                            0{idx + 1}
                          </span>
                          <RichText content={evt.name} as="h4" className="font-editorial-serif text-2xl text-[#202020]" />
                        </div>
                        <div className="text-xs text-[#736B63] flex flex-wrap items-center gap-1.5">
                          <RichText content={evt.date} as="span" />
                          <span>•</span>
                          <RichText content={evt.time} as="span" />
                          <span>|</span>
                          <RichText content={evt.venue} as="span" />
                        </div>
                        {evt.dressCode && (
                          <div className="text-[11px] text-[#A8A096] flex items-center gap-1">
                            <span>Attire:</span>
                            <RichText content={evt.dressCode} as="span" />
                          </div>
                        )}
                      </div>

                      {/* Controls: Edit, Reorder, and Delete */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => setEditingEvent(evt)}
                          className="p-2 rounded-lg border border-[#C9B38C]/60 hover:bg-[#F8F5EF] text-[#7A5C28]"
                          title="Edit celebration and style text"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveEvent(idx, "up")}
                          className="p-2 rounded-lg border border-[#E9E1D5] hover:bg-[#F8F5EF] disabled:opacity-30"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === data.events.length - 1}
                          onClick={() => handleMoveEvent(idx, "down")}
                          className="p-2 rounded-lg border border-[#E9E1D5] hover:bg-[#F8F5EF] disabled:opacity-30"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEvent(evt.id)}
                          className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 ml-1"
                          title="Delete Event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: TIMELINE */}
            {activeTab === "timeline" && (
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-editorial-serif text-3xl text-[#202020]">Day Itinerary Schedule</h2>
                    <p className="text-xs text-[#736B63]">
                      Step-by-step ceremony timeline (e.g. Baraat, Varmala, Pheras, Dinner).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTimeline}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#202020] text-[#FCFAF6] text-xs font-medium tracking-wider uppercase hover:bg-[#38332E]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Step</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {data.timeline.map((item) => (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl bg-white border border-[#E9E1D5] shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="w-48">
                          <RichTextEditorField
                            label="Step Time"
                            rows={1}
                            value={item.time}
                            onChange={(val) => {
                              const updated = data.timeline.map((t) =>
                                t.id === item.id ? { ...t, time: val } : t
                              );
                              setData({ ...data, timeline: updated });
                            }}
                            placeholder="e.g. 04:30 PM"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteTimeline(item.id)}
                          className="text-red-500 hover:text-red-700 p-2 rounded-lg border border-red-100 hover:bg-red-50 self-start mt-4"
                          title="Delete timeline step"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <RichTextEditorField
                        label="Step Title & Details"
                        rows={1}
                        value={item.title}
                        onChange={(val) => {
                          const updated = data.timeline.map((t) =>
                            t.id === item.id ? { ...t, title: val } : t
                          );
                          setData({ ...data, timeline: updated });
                        }}
                        placeholder="e.g. Royal Baraat Arrival & Swagat"
                      />
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleSaveAllTimeline}
                  disabled={isSaving}
                  className="px-8 py-3 rounded-full bg-[#202020] text-[#FCFAF6] text-xs font-medium tracking-[0.2em] uppercase hover:bg-[#38332E] transition-colors shadow-md disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "SAVE TIMELINE CHANGES"}
                </button>
              </div>
            )}

            {/* TAB: VENUE */}
            {activeTab === "venue" && (
              <form onSubmit={saveVenueInfo} className="max-w-3xl mx-auto space-y-6">
                <div>
                  <h2 className="font-editorial-serif text-3xl text-[#202020]">Venue &amp; Accommodations</h2>
                  <p className="text-xs text-[#736B63] mt-1">
                    Details for destination palace, Google Maps location, and hospitality instructions.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-[#E9E1D5] shadow-sm space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <RichTextEditorField
                      label="Venue Name"
                      rows={1}
                      value={data.venue.name}
                      onChange={(val) =>
                        setData({ ...data, venue: { ...data.venue, name: val } })
                      }
                      defaultOriginalValue={initialWeddingData.venue.name}
                      placeholder="e.g. The Leela Palace"
                    />
                    <RichTextEditorField
                      label="City / State"
                      rows={1}
                      value={data.venue.cityState}
                      onChange={(val) =>
                        setData({ ...data, venue: { ...data.venue, cityState: val } })
                      }
                      defaultOriginalValue={initialWeddingData.venue.cityState}
                      placeholder="e.g. Udaipur, Rajasthan"
                    />
                  </div>

                  <RichTextEditorField
                    label="Street Address"
                    rows={1}
                    value={data.venue.address}
                    onChange={(val) =>
                      setData({ ...data, venue: { ...data.venue, address: val } })
                    }
                    defaultOriginalValue={initialWeddingData.venue.address}
                    placeholder="e.g. Lake Pichola, Udaipur, Rajasthan 313001"
                  />

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#5A524A] uppercase tracking-wider block">Google Maps Link</label>
                    <input
                      type="url"
                      value={data.venue.mapsUrl}
                      onChange={(e) =>
                        setData({ ...data, venue: { ...data.venue, mapsUrl: e.target.value } })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E1D5] text-sm bg-[#FCFAF6]"
                    />
                  </div>

                  <ImageUploadField
                    label="Venue Photograph"
                    value={data.venue.image || ""}
                    onChange={(url) =>
                      setData({ ...data, venue: { ...data.venue, image: url } })
                    }
                    helpText="Photo of the wedding resort, palace, or mandap location."
                  />

                  <RichTextEditorField
                    label="Venue Description"
                    rows={3}
                    value={data.venue.description}
                    onChange={(val) =>
                      setData({ ...data, venue: { ...data.venue, description: val } })
                    }
                    defaultOriginalValue={initialWeddingData.venue.description}
                    placeholder="Grand heritage palace nestled on the serene waters..."
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <RichTextEditorField
                      label="Airport / Transfers Note"
                      rows={2}
                      value={data.venue.airportInfo || ""}
                      onChange={(val) =>
                        setData({ ...data, venue: { ...data.venue, airportInfo: val } })
                      }
                      defaultOriginalValue={initialWeddingData.venue.airportInfo}
                      placeholder="Maharana Pratap Airport (UDR) is 45 mins away..."
                    />
                    <RichTextEditorField
                      label="Accommodations Note"
                      rows={2}
                      value={data.venue.accommodations || ""}
                      onChange={(val) =>
                        setData({ ...data, venue: { ...data.venue, accommodations: val } })
                      }
                      defaultOriginalValue={initialWeddingData.venue.accommodations}
                      placeholder="Luxury suites reserved for esteemed guests..."
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-8 py-3 rounded-full bg-[#202020] text-[#FCFAF6] text-xs font-medium tracking-[0.2em] uppercase hover:bg-[#38332E] transition-colors shadow-md disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "SAVE VENUE DETAILS"}
                </button>
              </form>
            )}

            {/* TAB: GALLERY */}
            {activeTab === "gallery" && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-editorial-serif text-3xl text-[#202020]">Photo Gallery</h2>
                    <p className="text-xs text-[#736B63]">
                      Manage editorial photographs, captions, and layout categories.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewGalleryModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#202020] text-[#FCFAF6] text-xs font-medium tracking-wider uppercase hover:bg-[#38332E]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Photo</span>
                  </button>
                </div>

                {newGalleryModal && (
                  <form
                    onSubmit={handleAddGallery}
                    className="p-6 rounded-2xl bg-white border-2 border-[#C9B38C] shadow-lg space-y-4"
                  >
                    <h3 className="font-editorial-serif text-2xl text-[#202020]">Add Gallery Image</h3>
                    <div>
                      <ImageUploadField
                        label="Image File or URL *"
                        value={newGalleryItem.url || ""}
                        onChange={(url) => setNewGalleryItem({ ...newGalleryItem, url })}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-medium text-[#5A524A] block mb-1">Caption</label>
                        <input
                          type="text"
                          placeholder="e.g. The first dance"
                          value={newGalleryItem.caption}
                          onChange={(e) => setNewGalleryItem({ ...newGalleryItem, caption: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[#5A524A] block mb-1">Category</label>
                        <select
                          value={newGalleryItem.category}
                          onChange={(e) => setNewGalleryItem({ ...newGalleryItem, category: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border text-sm"
                        >
                          <option value="ceremony">Ceremony</option>
                          <option value="pre-wedding">Pre-Wedding</option>
                          <option value="details">Details</option>
                          <option value="candid">Candid</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[#5A524A] block mb-1">Layout Aspect</label>
                        <select
                          value={newGalleryItem.aspect}
                          onChange={(e) =>
                            setNewGalleryItem({
                              ...newGalleryItem,
                              aspect: e.target.value as "portrait" | "landscape" | "square",
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border text-sm"
                        >
                          <option value="landscape">Landscape</option>
                          <option value="portrait">Portrait (Tall)</option>
                          <option value="square">Square</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="submit"
                        className="px-6 py-2 rounded-full bg-[#202020] text-[#FCFAF6] text-xs font-medium tracking-wider uppercase"
                      >
                        Add to Gallery
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewGalleryModal(false)}
                        className="px-4 py-2 rounded-full text-xs text-[#736B63]"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {data.gallery.map((g) => (
                    <div
                      key={g.id}
                      className="group relative rounded-2xl overflow-hidden border border-[#E9E1D5] bg-white shadow-sm flex flex-col justify-between"
                    >
                      <div className="relative w-full h-40 bg-stone-100 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={g.url} alt={g.caption} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleDeleteGallery(g.id)}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600 text-white shadow-md hover:bg-red-700 transition-colors"
                          title="Delete photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="p-3 space-y-1">
                        <p className="text-xs font-medium text-[#202020] truncate">
                          {g.caption || "Untitled"}
                        </p>
                        <span className="text-[10px] text-[#9E814D] uppercase font-semibold">
                          {g.category} • {g.aspect}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: FAMILY */}
            {activeTab === "family" && (
              <form onSubmit={saveFamilyInfo} className="max-w-3xl mx-auto space-y-6">
                <div>
                  <h2 className="font-editorial-serif text-3xl text-[#202020]">Family Blessings</h2>
                  <p className="text-xs text-[#736B63] mt-1">
                    Groom&apos;s family first, then Bride&apos;s family and elder blessings.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-[#E9E1D5] shadow-sm space-y-5">
                  {/* Groom Family - First */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <RichTextEditorField
                      label="Groom Family Title (First)"
                      rows={1}
                      value={data.family.groomFamilyTitle}
                      onChange={(val) =>
                        setData({ ...data, family: { ...data.family, groomFamilyTitle: val } })
                      }
                      defaultOriginalValue={initialWeddingData.family.groomFamilyTitle}
                      placeholder="e.g. Groom's Family"
                    />
                    <RichTextEditorField
                      label="Groom Parents"
                      rows={1}
                      value={data.family.groomParents}
                      onChange={(val) =>
                        setData({ ...data, family: { ...data.family, groomParents: val } })
                      }
                      defaultOriginalValue={initialWeddingData.family.groomParents}
                      placeholder="e.g. Smt. Rekha & Shri Nilesh Shah"
                    />
                  </div>

                  {/* Bride Family - Second */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <RichTextEditorField
                      label="Bride Family Title (Second)"
                      rows={1}
                      value={data.family.brideFamilyTitle}
                      onChange={(val) =>
                        setData({ ...data, family: { ...data.family, brideFamilyTitle: val } })
                      }
                      defaultOriginalValue={initialWeddingData.family.brideFamilyTitle}
                      placeholder="e.g. Bride's Family"
                    />
                    <RichTextEditorField
                      label="Bride Parents"
                      rows={1}
                      value={data.family.brideParents}
                      onChange={(val) =>
                        setData({ ...data, family: { ...data.family, brideParents: val } })
                      }
                      defaultOriginalValue={initialWeddingData.family.brideParents}
                      placeholder="e.g. Smt. Bhavna & Shri Rajesh Patel"
                    />
                  </div>

                  <RichTextEditorField
                    label="Elder Blessings & Message"
                    rows={2}
                    value={data.family.blessingQuote}
                    onChange={(val) =>
                      setData({ ...data, family: { ...data.family, blessingQuote: val } })
                    }
                    defaultOriginalValue={initialWeddingData.family.blessingQuote}
                    placeholder="e.g. Seeking blessings from our ancestors and elders..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-8 py-3 rounded-full bg-[#202020] text-[#FCFAF6] text-xs font-medium tracking-[0.2em] uppercase hover:bg-[#38332E] transition-colors shadow-md disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "SAVE FAMILY DETAILS"}
                </button>
              </form>
            )}

            {/* TAB: RSVPS */}
            {activeTab === "rsvp" && (
              <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-editorial-serif text-3xl text-[#202020]">RSVP Responses</h2>
                    <p className="text-xs text-[#736B63]">
                      Total: {totalRsvps} | Attending: {attendingRsvps.length} ({totalGuestsAttending} guests) | Declined: {declinedRsvps.length}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={exportRsvpsCsv}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#202020] text-[#FCFAF6] text-xs font-medium tracking-wider uppercase hover:bg-[#38332E] self-start sm:self-auto shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5 text-[#C9B38C]" />
                    <span>Export CSV</span>
                  </button>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 text-[#8C847B] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by guest name, phone, dietary..."
                      value={rsvpSearch}
                      onChange={(e) => setRsvpSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E9E1D5] bg-white text-xs text-[#202020] focus:ring-2 focus:ring-[#C9B38C]"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setRsvpFilter("all")}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                        rsvpFilter === "all" ? "bg-[#202020] text-white" : "bg-white text-[#736B63] border"
                      }`}
                    >
                      All ({totalRsvps})
                    </button>
                    <button
                      type="button"
                      onClick={() => setRsvpFilter("yes")}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                        rsvpFilter === "yes" ? "bg-emerald-800 text-white" : "bg-white text-emerald-700 border"
                      }`}
                    >
                      Attending ({attendingRsvps.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setRsvpFilter("no")}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                        rsvpFilter === "no" ? "bg-stone-800 text-white" : "bg-white text-[#736B63] border"
                      }`}
                    >
                      Declined ({declinedRsvps.length})
                    </button>
                  </div>
                </div>

                {/* RSVP Table */}
                <div className="rounded-2xl border border-[#E9E1D5] bg-white shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F8F5EF] border-b border-[#E9E1D5] text-[#5A524A] uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="p-3.5">Guest</th>
                          <th className="p-3.5">Phone</th>
                          <th className="p-3.5">Attendance</th>
                          <th className="p-3.5">Party Size</th>
                          <th className="p-3.5">Dietary</th>
                          <th className="p-3.5">Note</th>
                          <th className="p-3.5">Date</th>
                          <th className="p-3.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E9E1D5]">
                        {filteredRsvps.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-xs text-[#8C847B]">
                              No RSVP responses found matching criteria.
                            </td>
                          </tr>
                        ) : (
                          filteredRsvps.map((r) => (
                            <tr key={r.id} className="hover:bg-[#FCFAF6] transition-colors">
                              <td className="p-3.5 font-medium text-[#202020] whitespace-nowrap">
                                {r.name}
                              </td>
                              <td className="p-3.5 text-[#736B63] whitespace-nowrap">
                                {r.phone || "—"}
                              </td>
                              <td className="p-3.5 whitespace-nowrap">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                                    r.attending === "yes"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-stone-200 text-stone-700"
                                  }`}
                                >
                                  {r.attending === "yes" ? "Attending" : "Declined"}
                                </span>
                              </td>
                              <td className="p-3.5 text-[#202020]">
                                {r.attending === "yes" ? r.guestsCount : "—"}
                              </td>
                              <td className="p-3.5 text-[#5A524A]">{r.dietaryPreference || "None"}</td>
                              <td className="p-3.5 text-[#5A524A] max-w-xs truncate" title={r.message}>
                                {r.message || "—"}
                              </td>
                              <td className="p-3.5 text-[#A8A096] whitespace-nowrap">
                                {new Date(r.submittedAt).toLocaleDateString()}
                              </td>
                              <td className="p-3.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRsvp(r.id)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                  title="Delete response"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: WISHES */}
            {activeTab === "wishes" && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div>
                  <h2 className="font-editorial-serif text-3xl text-[#202020]">Guestbook Moderation</h2>
                  <p className="text-xs text-[#736B63]">
                    Review guest blessings before they appear publicly on the wedding invitation.
                  </p>
                </div>

                {/* Sub-tabs */}
                <div className="flex items-center gap-2 border-b border-[#E9E1D5] pb-2">
                  <button
                    type="button"
                    onClick={() => setWishesTab("pending")}
                    className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
                      wishesTab === "pending"
                        ? "bg-[#202020] text-[#FAF8F5]"
                        : "bg-white text-[#736B63] hover:text-[#202020]"
                    }`}
                  >
                    Pending Review ({data.wishes.filter((w) => w.status === "pending").length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setWishesTab("approved")}
                    className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
                      wishesTab === "approved"
                        ? "bg-emerald-800 text-[#FAF8F5]"
                        : "bg-white text-[#736B63] hover:text-[#202020]"
                    }`}
                  >
                    Approved &amp; Live ({data.wishes.filter((w) => w.status === "approved").length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setWishesTab("hidden")}
                    className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
                      wishesTab === "hidden"
                        ? "bg-stone-800 text-[#FAF8F5]"
                        : "bg-white text-[#736B63] hover:text-[#202020]"
                    }`}
                  >
                    Hidden ({data.wishes.filter((w) => w.status === "hidden").length})
                  </button>
                </div>

                {/* Wishes List */}
                <div className="space-y-3">
                  {filteredWishes.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-white border border-[#E9E1D5] text-center text-xs text-[#8C847B]">
                      No blessings in this category.
                    </div>
                  ) : (
                    filteredWishes.map((w) => (
                      <div
                        key={w.id}
                        className="p-5 rounded-2xl bg-white border border-[#E9E1D5] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <p className="font-editorial-serif text-base text-[#202020] italic">
                            &ldquo;{w.message}&rdquo;
                          </p>
                          <p className="text-xs font-medium text-[#9E814D]">
                            — {w.name}{" "}
                            <span className="text-[#A8A096] font-normal">
                              ({new Date(w.submittedAt).toLocaleDateString()})
                            </span>
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {w.status !== "approved" && (
                            <button
                              type="button"
                              onClick={() => handleUpdateWishStatus(w.id, "approved")}
                              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium"
                            >
                              Approve
                            </button>
                          )}
                          {w.status !== "hidden" && (
                            <button
                              type="button"
                              onClick={() => handleUpdateWishStatus(w.id, "hidden")}
                              className="px-3 py-1.5 rounded-lg bg-stone-700 hover:bg-stone-800 text-white text-xs font-medium"
                            >
                              Hide
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteWish(w.id)}
                            className="p-1.5 text-red-500 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Optional Split-Screen Live Preview Column */}
          {splitPreview && (
            <div className="hidden lg:block w-1/2 border-l border-[#E9E1D5] bg-[#161514] overflow-y-auto relative">
              <div className="sticky top-0 z-10 bg-[#1F1D1B] border-b border-[#38332E] px-4 py-2 flex items-center justify-between text-xs text-white">
                <span className="flex items-center gap-2 text-[#C9B38C]">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Live Invitation Preview</span>
                </span>
                <span className="text-[10px] text-[#A8A096]">Interactive simulation</span>
              </div>
              <div className="w-full">
                <PublicInvitationView initialData={data} isEmbedPreview={true} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Shagun Delete Confirmation Modal */}
      <ShagunDeleteModal
        isOpen={!!shagunToDelete}
        record={shagunToDelete}
        onClose={() => setShagunToDelete(null)}
        onConfirm={handleConfirmDeleteShagun}
        isDeleting={isDeletingShagun}
      />

      {/* Audio Trimmer & Song Editor Modal */}
      <AudioTrimmerModal
        isOpen={audioTrimmerModal}
        track={trackToTrim}
        onClose={() => setAudioTrimmerModal(false)}
        onSave={handleSaveTrimmedTrack}
      />
    </div>
  );
}
