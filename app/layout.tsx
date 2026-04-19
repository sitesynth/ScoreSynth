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
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: "/icon.svg",
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
