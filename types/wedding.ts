export interface SectionVisibility {
  hero: boolean;
  dateReveal?: boolean;
  countdown: boolean;
  story: boolean;
  couple: boolean;
  events: boolean;
  timeline: boolean;
  venue: boolean;
  gallery: boolean;
  family: boolean;
  rsvp: boolean;
  wishes: boolean;
}

export interface TextStyling {
  headingFont: string; // "cormorant" | "playfair" | "cinzel" | "great-vibes" | "montserrat" | "inter"
  bodyFont: string;
  fontSizeScale: "normal" | "large" | "extra-large";
  headingColor: string; // Hex color code e.g. "#202020"
  accentColor: string; // Hex color code e.g. "#9E814D"
  bodyColor: string; // Hex color code e.g. "#665E55"
  isBoldHeading: boolean;
  isItalicHeading: boolean;
}

export interface WeddingDetails {
  groomName: string; // Groom first everywhere
  brideName: string;
  weddingDate: string; // e.g. "2026-12-18"
  weddingTime: string; // e.g. "04:30 PM"
  location: string;
  city: string;
  hashtag: string;
  heroImage: string;
  ogImage?: string; // Social share / Open Graph WhatsApp image
  invitationSubtitle: string;
  heroQuote?: string;
  heroTagline?: string;
  introText: string;
  closingMessage: string;
  ambientMusicUrl?: string;
  textStyling?: TextStyling;
  updatedAt: string;
}

export interface CoupleInfo {
  groomName: string;
  groomTitle?: string;
  groomBio: string;
  groomPhoto: string;
  brideName: string;
  brideTitle?: string;
  brideBio: string;
  bridePhoto: string;
  couplePhoto: string;
  quote: string;
}

export interface StoryItem {
  id: string;
  year: string;
  title: string;
  description: string;
  image?: string;
  order: number;
}

export interface WeddingEvent {
  id: string;
  name: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  description: string;
  dressCode: string;
  image: string;
  mapsUrl: string;
  order: number;
}

export interface TimelineItem {
  id: string;
  time: string;
  title: string;
  description?: string;
  order: number;
}

export interface VenueInfo {
  id: string;
  name: string;
  address: string;
  cityState: string;
  description: string;
  mapsUrl: string;
  image: string;
  airportInfo?: string;
  accommodations?: string;
}

export interface GalleryItem {
  id: string;
  url: string;
  caption: string;
  category?: string;
  aspect?: "portrait" | "landscape" | "square";
  order: number;
}

export interface FamilyInfo {
  groomFamilyTitle: string;
  groomParents: string;
  brideFamilyTitle: string;
  brideParents: string;
  blessingQuote: string;
  additionalNote?: string;
}

export interface RSVPRecord {
  id: string;
  name: string;
  phone: string;
  guestsCount: number;
  attending: "yes" | "no";
  dietaryPreference: string;
  message?: string;
  submittedAt: string;
}

export interface GuestWishRecord {
  id: string;
  name: string;
  message: string;
  status: "pending" | "approved" | "hidden";
  submittedAt: string;
}

export interface ShagunRecord {
  id: string;
  guestName: string;
  side: "groom" | "bride";
  relation?: string;
  city?: string;
  amount: number;
  paymentMode: "cash" | "upi" | "cheque" | "gift";
  event?: string;
  receivedBy?: string;
  notes?: string;
  date: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
  isActive: boolean;
  addedAt: string;
}

export interface WeddingData {
  wedding: WeddingDetails;
  couple: CoupleInfo;
  story: StoryItem[];
  events: WeddingEvent[];
  timeline: TimelineItem[];
  venue: VenueInfo;
  gallery: GalleryItem[];
  family: FamilyInfo;
  rsvps: RSVPRecord[];
  wishes: GuestWishRecord[];
  shagun: ShagunRecord[];
  musicLibrary: MusicTrack[];
  sectionVisibility: SectionVisibility;
}
