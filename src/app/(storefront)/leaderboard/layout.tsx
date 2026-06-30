import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "จัดอันดับผู้เล่น",
  description: "อันดับผู้เล่นที่มียอดเติมเงินสูงสุดประจำสัปดาห์ เดือน และตลอดกาล บน LuxusX",
  alternates: { canonical: "https://luxusx.com/leaderboard" },
  openGraph: {
    title: "จัดอันดับผู้เล่น | LuxusX",
    description: "อันดับผู้เล่นที่มียอดเติมเงินสูงสุดประจำสัปดาห์ เดือน และตลอดกาล",
    url: "https://luxusx.com/leaderboard",
    type: "website",
  },
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
