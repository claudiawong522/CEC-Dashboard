import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// The same two faces cornellec.com loads: DM Sans for body copy and UI, Space
// Grotesk for display type and every uppercase label.
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  weight: ["500", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CEC Dashboard",
  description: "Cornell Entrepreneurship Club internal tooling",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
