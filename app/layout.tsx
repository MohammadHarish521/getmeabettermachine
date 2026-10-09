import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { getAppUrl } from "@/lib/env";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const title = "Raise My Mac";
const description =
  "Take a numbered spot on my next Mac. Every placement unlocks a better configuration.";

export const metadata: Metadata = {
  metadataBase: new URL(getAppUrl()),
  title: {
    default: title,
    template: `%s · ${title}`,
  },
  description,
  applicationName: title,
  openGraph: {
    title,
    description,
    type: "website",
    siteName: title,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-paper text-ink">
        <Script
          src="https://datafa.st/js/script.js"
          data-website-id="dfid_B3o3P3Z0FETAZbOhZRj49"
          data-domain="www.raisemymini.com"
          strategy="afterInteractive"
        />
        <div className="page-noise" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
