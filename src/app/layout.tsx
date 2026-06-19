import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { AppTooltipProvider } from "@/components/ui/app-tooltip-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const clerkAppearance = {
  variables: {
    colorBackground: "#000000",
    colorInputBackground: "rgba(255, 255, 255, 0.06)",
    colorPrimary: "#d8d8d8",
    colorText: "#ffffff",
    colorTextSecondary: "rgba(255, 255, 255, 0.55)",
    colorDanger: "#cc3333",
    colorNeutral: "rgba(255, 255, 255, 0.38)",
    borderRadius: "0.625rem",
  },
  elements: {
    card: "glass-popover shadow-none",
    modalContent: "glass-popover",
    formButtonPrimary:
      "bg-[linear-gradient(180deg,#f0f0f0_0%,#9a9a9a_100%)] text-black shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:brightness-110",
    formFieldInput:
      "border border-white/35 bg-white/5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
    footerActionLink: "text-[#cc3333] hover:text-[#e04545]",
    identityPreviewEditButton: "text-[#cc3333]",
    navbar: "bg-transparent",
    headerTitle: "text-metallic",
    socialButtonsBlockButton:
      "border border-white/35 bg-white/5 text-white hover:bg-white/10",
  },
} as const;

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
        <ClerkProvider appearance={clerkAppearance}>
          <AppTooltipProvider>{children}</AppTooltipProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
