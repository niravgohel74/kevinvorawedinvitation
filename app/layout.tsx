import type { Viewport, Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#161514",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const SITE_TITLE = "Kevin & Moksha | Royal Wedding Celebration";
const SITE_DESC = "Join us to celebrate the royal wedding of Kevin & Moksha on Friday, December 18, 2026 at The Leela Palace, Udaipur.";
const PROD_URL = "https://kevin-moksha-wedding-invitation.vercel.app";

function getSiteUrl(): string {
  try {
    const headersList = headers();
    const host = headersList.get("x-forwarded-host") || headersList.get("host") || "";
    if (host.includes("localhost") || host.includes("127.0.0.1")) {
      const proto = headersList.get("x-forwarded-proto") || "http";
      return `${proto}://${host}`;
    }
  } catch {
    // fallback
  }
  return PROD_URL;
}

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  const ogImageUrl = `${siteUrl}/og-image.jpg?v=3`;

  return {
    metadataBase: new URL(siteUrl),
    title: SITE_TITLE,
    description: SITE_DESC,
    keywords: ["Kevin and Moksha", "Wedding Invitation", "Udaipur Wedding", "The Leela Palace", "Kevin Vora"],
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
      title: SITE_TITLE,
      description: SITE_DESC,
      url: siteUrl,
      siteName: "Kevin & Moksha Wedding",
      images: [
        {
          url: ogImageUrl,
          secureUrl: ogImageUrl,
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
      title: SITE_TITLE,
      description: SITE_DESC,
      images: [ogImageUrl],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteUrl = getSiteUrl();
  const ogImageUrl = `${siteUrl}/og-image.jpg?v=3`;

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Core meta and direct tags placed at top of head for fastest crawler detection */}
        <title>{SITE_TITLE}</title>
        <meta name="description" content={SITE_DESC} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Kevin & Moksha Wedding" />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:title" content={SITE_TITLE} />
        <meta property="og:description" content={SITE_DESC} />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:image:secure_url" content={ogImageUrl} />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Kevin & Moksha Royal Wedding Invitation" />
        <link rel="image_src" href={ogImageUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={SITE_TITLE} />
        <meta name="twitter:description" content={SITE_DESC} />
        <meta name="twitter:image" content={ogImageUrl} />
      </head>
      <body className="antialiased min-h-screen selection:bg-[#E9E1D5] selection:text-[#202020] bg-[#F8F5EF] text-[#202020]">
        {children}
      </body>
    </html>
  );
}
