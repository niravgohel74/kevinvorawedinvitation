import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Kevin & Moksha",
  description: "Join us in celebrating the wedding of Kevin and Moksha. View event schedules, ceremony timeline, venue directions, and RSVP.",
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
    title: "Kevin & Moksha",
    description: "An intimate celebration of love, heritage, and forever. Udaipur, Rajasthan.",
    type: "website",
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
