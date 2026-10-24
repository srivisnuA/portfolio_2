import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Srivisnu A — The Personal Atlas",
  description: "A cinematic expedition through software, intelligence, and data. Explore Srivisnu A’s projects in an interactive 3D world.",
  keywords: ["Srivisnu A", "software engineer", "machine learning", "data analytics", "Chennai", "FaceFare"],
  authors: [{ name: "Srivisnu A" }],
  openGraph: {
    title: "Srivisnu A — The Personal Atlas",
    description: "Software Engineering · AI & Machine Learning · Data Analytics",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Srivisnu A — The Personal Atlas",
    description: "Software Engineering · AI & Machine Learning · Data Analytics",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#070c14", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
