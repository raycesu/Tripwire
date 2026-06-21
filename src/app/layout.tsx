import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
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

export const metadata: Metadata = {
  title: "Tripwire",
  description: "Contrarian asset score machine",
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
