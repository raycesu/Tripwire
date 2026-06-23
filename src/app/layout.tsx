import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { ui } from "@clerk/ui";
import { Geist, Geist_Mono } from "next/font/google";
import { AppTooltipProvider } from "@/components/ui/app-tooltip-provider";
import { clerkProviderAppearance } from "@/lib/auth/clerk-appearance";
import "./globals.css";
import "@/styles/auth-clerk.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: {
    default: "Tripwire",
    template: "%s · Tripwire",
  },
  description:
    "Contrarian asset score machine for crypto and equities. Tripwire scores your watchlist and sends Telegram alerts when opportunities qualify.",
  openGraph: {
    title: "Tripwire",
    description:
      "Contrarian asset score machine for crypto and equities. Know when to stop watching the market yourself.",
    type: "website",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tripwire",
    description:
      "Contrarian asset score machine for crypto and equities. Know when to stop watching the market yourself.",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider appearance={clerkProviderAppearance} ui={ui}>
          <AppTooltipProvider>{children}</AppTooltipProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
