import type { Metadata } from "next";
import { Inter, Noto_Sans_Thai } from "next/font/google";
import Script from "next/script";
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

export const dynamic = "force-dynamic";

const BASE = "https://luxusx.com";

async function getSiteSettings() {
  try {
    await connectToDatabase();
    const [n, d, og] = await Promise.all([
      Setting.findOne({ key: "site_name" }).lean(),
      Setting.findOne({ key: "site_description" }).lean(),
      Setting.findOne({ key: "site_og_image" }).lean(),
    ]);
    return {
      siteName: (n as any)?.value || "LuxusX",
      siteDesc: (d as any)?.value || "เปิดกล่องสุ่มสินค้าพรีเมียมออนไลน์ ลุ้นของสะสมสุดพิเศษ ราคาเริ่มต้นไม่กี่บาท",
      ogImage: (og as any)?.value || `${BASE}/logo.jpeg`,
    };
  } catch {
    return {
      siteName: "LuxusX",
      siteDesc: "เปิดกล่องสุ่มสินค้าพรีเมียมออนไลน์ ลุ้นของสะสมสุดพิเศษ ราคาเริ่มต้นไม่กี่บาท",
      ogImage: `${BASE}/logo.jpeg`,
    };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { siteName, siteDesc, ogImage } = await getSiteSettings();
  const title = `${siteName} - กล่องสุ่มสินค้าพรีเมียม`;
  return {
    metadataBase: new URL(BASE),
    title: { default: title, template: `%s | ${siteName}` },
    description: siteDesc,
    keywords: ["กล่องสุ่ม", "mystery box", "ลุ้นรางวัล", "สินค้าพรีเมียม", "ของสะสม", "luxusx", "loot box", "กล่องสุ่มออนไลน์"],
    authors: [{ name: siteName, url: BASE }],
    creator: siteName,
    robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
    alternates: { canonical: BASE },
    verification: { google: "bv74cjpKuiCRWSf5iptZ7vDVqHNUqObUBOxsoBjatV4" },
    openGraph: {
      type: "website",
      locale: "th_TH",
      url: BASE,
      siteName,
      title,
      description: siteDesc,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: siteDesc,
      images: [ogImage],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { siteName, siteDesc, ogImage } = await getSiteSettings();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${BASE}/#website`,
        url: BASE,
        name: siteName,
        description: siteDesc,
        inLanguage: "th-TH",
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${BASE}/shop?q={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": `${BASE}/#organization`,
        name: siteName,
        url: BASE,
        logo: { "@type": "ImageObject", url: ogImage, width: 200, height: 200 },
        description: siteDesc,
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          availableLanguage: "Thai",
        },
      },
    ],
  };

  return (
    <html lang="th" className={`${inter.variable} ${notoSansThai.variable}`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          suppressHydrationWarning
        />
      </head>
      <body suppressHydrationWarning className={`${notoSansThai.className} bg-[#F8F8F8] text-gray-900 flex h-screen overflow-hidden`}>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-TVBHCPH9"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <Providers>
          {children}
        </Providers>
        <Script
          id="gtm"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-TVBHCPH9');`,
          }}
        />
      </body>
    </html>
  );
}
