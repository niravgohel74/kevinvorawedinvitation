import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-playfair",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#161514",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://kevin-vora-wedding.vercel.app"
  ),
  title: "Kevin & Moksha | The Wedding Celebration",
  description:
    "Join us in celebrating the wedding celebration of Kevin and Moksha. View event schedules, royal ceremony itinerary, destination guide, and RSVP.",
  keywords: [
    "Kevin and Moksha",
    "Wedding Invitation",
    "Udaipur Wedding",
    "The Leela Palace",
    "Indian Wedding Invitation",
    "Save The Date",
  ],
  authors: [{ name: "Kevin & Moksha" }],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "Kevin & Moksha | The Royal Wedding Celebration",
    description:
      "An intimate celebration of love, heritage, and forever in Udaipur, Rajasthan. Save our date: Friday, December 18, 2026.",
    url: "/",
    siteName: "Kevin & Moksha Wedding Invitation",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Kevin & Moksha Royal Wedding Invitation",
        type: "image/jpeg",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kevin & Moksha | The Royal Wedding Celebration",
    description:
      "An intimate celebration of love, heritage, and forever in Udaipur, Rajasthan. Save our date: Friday, December 18, 2026.",
    images: ["/og-image.jpg"],
    creator: "@KevinAndMoksha",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${playfair.variable} ${jakarta.variable}`}>
      <body className="antialiased min-h-screen selection:bg-[#E9E1D5] selection:text-[#202020] bg-[#F8F5EF] text-[#202020]">
        {children}
      </body>
    </html>
  );
}
