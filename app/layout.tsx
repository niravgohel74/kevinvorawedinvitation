import type { Viewport, Metadata } from "next";
import { Cormorant_Garamond, Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { headers } from "next/headers";
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

export async function generateMetadata(): Promise<Metadata> {
  const headersList = headers();
  const host = headersList.get("x-forwarded-host") || headersList.get("host") || "localhost:3000";
  const proto = headersList.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const siteUrl = `${proto}://${host}`;

  const title = "Kevin & Moksha | Royal Wedding Celebration";
  const description = "Join us to celebrate the wedding of Kevin & Moksha. Friday, Dec 18, 2026 • The Leela Palace, Udaipur.";
  const ogImageUrl = `${siteUrl}/og-image.jpg`;

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    keywords: ["Kevin and Moksha", "Wedding Invitation", "Udaipur Wedding", "The Leela Palace"],
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
      title,
      description,
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
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = headers();
  const host = headersList.get("x-forwarded-host") || headersList.get("host") || "localhost:3000";
  const proto = headersList.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const siteUrl = `${proto}://${host}`;
  const ogImageUrl = `${siteUrl}/og-image.jpg`;

  return (
    <html lang="en" className={`${cormorant.variable} ${playfair.variable} ${jakarta.variable}`}>
      <head>
        {/* Explicit fallback meta tags for WhatsApp, iMessage, Facebook, and Telegram */}
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:image:secure_url" content={ogImageUrl} />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Kevin & Moksha Royal Wedding Invitation" />
        <link rel="image_src" href={ogImageUrl} />
      </head>
      <body className="antialiased min-h-screen selection:bg-[#E9E1D5] selection:text-[#202020] bg-[#F8F5EF] text-[#202020]">
        {children}
      </body>
    </html>
  );
}
