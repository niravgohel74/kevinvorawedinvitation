import type { Viewport, Metadata } from "next";
import { headers } from "next/headers";
import { getWeddingData } from "@/lib/db";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#161514",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const DEFAULT_TITLE = "Kevin & Moksha | Royal Wedding Celebration";
const DEFAULT_DESC = "Join us to celebrate the royal wedding of Kevin & Moksha on Friday, December 18, 2026 at The Leela Palace, Udaipur.";
const PROD_URL = "https://kevin-moksha-wedding-invitation.vercel.app";

function getSiteUrl(): string {
  try {
    const headersList = headers();
    const host = headersList.get("x-forwarded-host") || headersList.get("host") || "";
    if (host) {
      const proto = headersList.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
      return `${proto}://${host}`;
    }
  } catch {
    // fallback
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return PROD_URL;
}

function resolveOgImageUrl(siteUrl: string, weddingData: any): string {
  const timestamp = weddingData?.wedding?.updatedAt
    ? new Date(weddingData.wedding.updatedAt).getTime()
    : Date.now();
  return `${siteUrl}/api/og?v=${timestamp}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  let weddingData = null;
  try {
    weddingData = await getWeddingData();
  } catch {}

  const groom = (weddingData?.wedding?.groomName || "Kevin").replace(/<[^>]*>/g, "").trim();
  const bride = (weddingData?.wedding?.brideName || "Moksha").replace(/<[^>]*>/g, "").trim();
  const venue = (weddingData?.wedding?.location || "The Leela Palace").replace(/<[^>]*>/g, "").trim();
  const city = (weddingData?.wedding?.city || "Udaipur").replace(/<[^>]*>/g, "").trim();
  const siteTitle = `${groom} & ${bride} | Royal Wedding Celebration`;
  const siteDesc = weddingData?.wedding?.introText
    ? weddingData.wedding.introText.replace(/<[^>]*>/g, "").slice(0, 160)
    : `Join us to celebrate the royal wedding of ${groom} & ${bride} at ${venue}, ${city}.`;

  const ogImageUrl = resolveOgImageUrl(siteUrl, weddingData);

  return {
    metadataBase: new URL(siteUrl),
    title: siteTitle,
    description: siteDesc,
    keywords: [`${groom} and ${bride}`, "Wedding Invitation", `${city} Wedding`, venue, `${groom} Vora`],
    authors: [{ name: `${groom} & ${bride}` }],
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
      title: siteTitle,
      description: siteDesc,
      url: siteUrl,
      siteName: `${groom} & ${bride} Wedding`,
      images: [
        {
          url: ogImageUrl,
          secureUrl: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${groom} & ${bride} Royal Wedding Invitation`,
          type: "image/jpeg",
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description: siteDesc,
      images: [ogImageUrl],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteUrl = getSiteUrl();
  let weddingData = null;
  try {
    weddingData = await getWeddingData();
  } catch {}

  const groom = weddingData?.wedding?.groomName || "Kevin";
  const bride = weddingData?.wedding?.brideName || "Moksha";
  const siteTitle = `${groom} & ${bride} | Royal Wedding Celebration`;
  const siteDesc = weddingData?.wedding?.introText
    ? weddingData.wedding.introText.replace(/<[^>]*>/g, "").slice(0, 160)
    : DEFAULT_DESC;

  const ogImageUrl = resolveOgImageUrl(siteUrl, weddingData);

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Core meta and direct tags placed at top of head for fastest crawler detection */}
        <title>{siteTitle}</title>
        <meta name="description" content={siteDesc} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={`${groom} & ${bride} Wedding`} />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:title" content={siteTitle} />
        <meta property="og:description" content={siteDesc} />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:image:secure_url" content={ogImageUrl} />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={`${groom} & ${bride} Royal Wedding Invitation`} />
        <link rel="image_src" href={ogImageUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={siteTitle} />
        <meta name="twitter:description" content={siteDesc} />
        <meta name="twitter:image" content={ogImageUrl} />
      </head>
      <body className="antialiased min-h-screen selection:bg-[#E9E1D5] selection:text-[#202020] bg-[#F8F5EF] text-[#202020]">
        {children}
      </body>
    </html>
  );
}
