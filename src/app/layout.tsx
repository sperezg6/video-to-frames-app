import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Footer } from "@/components/chrome/Footer";

const ppNeueMontreal = localFont({
  variable: "--font-pp-neue-montreal",
  display: "swap",
  src: [
    { path: "../../public/fonts/ppneuemontreal-book.otf", weight: "400", style: "normal" },
    { path: "../../public/fonts/ppneuemontreal-medium.otf", weight: "500", style: "normal" },
    { path: "../../public/fonts/ppneuemontreal-bold.otf", weight: "700", style: "normal" },
  ],
});

const ppEditorialNew = localFont({
  variable: "--font-pp-editorial-new",
  display: "swap",
  src: [
    { path: "../../public/fonts/pp-editorial-new-regular.otf", weight: "400", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "Frames — extract every frame from any video",
  description: "Drop an MP4, get a ZIP of every frame. Runs in your browser — your video never leaves your device.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${ppNeueMontreal.variable} ${ppEditorialNew.variable} antialiased`}
    >
      <body className="min-h-dvh flex flex-col">
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
