import type { Metadata } from "next";
import { Inter, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

import { Providers } from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto-sans-thai",
});

import { connectToDatabase } from "@/lib/mongoose";
import Setting from "@/models/Setting";

export async function generateMetadata(): Promise<Metadata> {
  try {
    await connectToDatabase();
    const siteNameSetting = await Setting.findOne({ key: "site_name" }).lean();
    const siteName = (siteNameSetting as any)?.value || "RareDrop";
    return {
      title: `${siteName} - Premium Mystery Box`,
      description: "เปิดลุ้นของสะสมสุดพิเศษ จากทั่วโลก",
      verification: {
        google: "bv74cjpKuiCRWSf5iptZ7vDVqHNUqObUBOxsoBjatV4",
      },
    };
  } catch (err) {
    return {
      title: "RareDrop - Premium Mystery Box",
      description: "เปิดลุ้นของสะสมสุดพิเศษ จากทั่วโลก",
      verification: {
        google: "bv74cjpKuiCRWSf5iptZ7vDVqHNUqObUBOxsoBjatV4",
      },
    };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${notoSansThai.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning className={`${notoSansThai.className} bg-[#F8F8F8] text-gray-900 flex h-screen overflow-hidden`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
