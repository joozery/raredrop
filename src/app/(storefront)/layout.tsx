import { Suspense } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { BalanceProvider } from "@/contexts/BalanceContext";
import { LiveChatWidget } from "@/components/chat/LiveChatWidget";
import { ReferralCapture } from "@/components/referral/ReferralCapture";
import { PopupAd } from "@/components/home/PopupAd";

export default function StorefrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <BalanceProvider>
      <Suspense fallback={null}>
        <ReferralCapture />
      </Suspense>
      <div className="hidden lg:flex">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header />
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          {children}
        </main>
        <BottomNav />
      </div>
      <LiveChatWidget />
      <PopupAd />
    </BalanceProvider>
  );
}
