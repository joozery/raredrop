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
    const siteDescSetting = await Setting.findOne({ key: "site_description" }).lean();
    const siteOgSetting = await Setting.findOne({ key: "site_og_image" }).lean();
    
    const siteName = (siteNameSetting as any)?.value || "RareDrop";
    const siteDesc = (siteDescSetting as any)?.value || "เปิดลุ้นของสะสมสุดพิเศษ จากทั่วโลก";
    const ogImage = (siteOgSetting as any)?.value || "https://pub-ee29977ae9524b05b628923eee00188a.r2.dev/logo/logo.png";
    
    return {
      title: `${siteName} - Premium Mystery Box`,
      description: siteDesc,
      verification: {
        google: "bv74cjpKuiCRWSf5iptZ7vDVqHNUqObUBOxsoBjatV4",
      },
      openGraph: {
        title: `${siteName} - Premium Mystery Box`,
        description: siteDesc,
        images: [{ url: ogImage }],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${siteName} - Premium Mystery Box`,
        description: siteDesc,
        images: [ogImage],
      }
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
