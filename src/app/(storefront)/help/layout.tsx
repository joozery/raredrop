import type { Metadata } from "next";

const BASE = "https://luxusx.com";

export const metadata: Metadata = {
  title: "ช่วยเหลือ & ติดต่อเรา",
  description: "ศูนย์ช่วยเหลือ LuxusX ติดต่อทีมงานได้ทุกช่องทาง LINE, Facebook, Email พร้อมตอบทุกคำถาม",
  alternates: { canonical: `${BASE}/help` },
  openGraph: {
    title: "ช่วยเหลือ & ติดต่อเรา | LuxusX",
    description: "ศูนย์ช่วยเหลือ LuxusX ติดต่อทีมงานได้ทุกช่องทาง LINE, Facebook, Email",
    url: `${BASE}/help`,
    type: "website",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "กล่องสุ่มคืออะไร?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "กล่องสุ่มคือการสุ่มรับสินค้าพรีเมียม โดยจ่ายเงินซื้อกล่องแล้วลุ้นรับของรางวัลที่มีมูลค่าหลากหลาย ตั้งแต่ของสะสมหายากไปจนถึงของรางวัลพิเศษ",
      },
    },
    {
      "@type": "Question",
      name: "จ่ายเงินได้ช่องทางไหนบ้าง?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "รองรับการชำระเงินผ่าน PromptPay, TrueWallet และ QR Code ธนาคาร ปลอดภัยและรวดเร็ว",
      },
    },
    {
      "@type": "Question",
      name: "ได้รับสินค้าเมื่อไหร่?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "สินค้า Digital และบัญชีเกมได้รับทันทีหลังเปิดกล่อง สินค้าจริงจัดส่งภายใน 3-7 วันทำการ",
      },
    },
    {
      "@type": "Question",
      name: "สามารถขายสินค้าที่ได้รับได้ไหม?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ได้เลย! สามารถนำสินค้าที่ได้รับไปลงขายในตลาดกลาง (Marketplace) ของ LuxusX เพื่อแลกเปลี่ยนกับผู้เล่นคนอื่นได้",
      },
    },
  ],
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {children}
    </>
  );
}
