import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ScoreSynth — Sheet Music Library & Community",
  description:
    "Discover, upload and share classical sheet music. Browse piano, strings, chamber, orchestral scores and more. Free and premium scores from musicians worldwide.",
  metadataBase: new URL("https://scoresynth.com"),
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-48.png", type: "image/png", sizes: "48x48" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    url: "https://scoresynth.com",
    title: "ScoreSynth — Sheet Music Library & Community",
    description:
      "Discover, upload and share classical sheet music. Browse piano, strings, chamber, orchestral scores and more.",
    siteName: "ScoreSynth",
    images: [
      {
        url: "/logos/logo-scoresynth.svg",
        width: 1200,
        height: 630,
        alt: "ScoreSynth",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ScoreSynth — Sheet Music Library & Community",
    description:
      "Discover, upload and share classical sheet music. Free and premium scores from musicians worldwide.",
    images: ["/logos/logo-scoresynth.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
