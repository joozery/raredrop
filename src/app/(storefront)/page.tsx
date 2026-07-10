"use client";

import HeroBanner from "@/components/home/HeroBanner";

import FlashSale from "@/components/home/FlashSale";
import MenuShortcuts from "@/components/home/MenuShortcuts";
import RecentOrders from "@/components/home/RecentOrders";
import TrendingBoxes from "@/components/home/TrendingBoxes";
import ShopPreview from "@/components/home/ShopPreview";
import MobileLiveOpenings from "@/components/home/MobileLiveOpenings";

export default function Home() {
  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 lg:p-6 pb-20 lg:pb-6">
      {/* Left Main Content */}
      <div className="flex-1 flex flex-col gap-6 lg:gap-8 min-w-0">
        <HeroBanner />
        <MenuShortcuts />
        <FlashSale />
        <RecentOrders />
        <TrendingBoxes />
        <ShopPreview />
      </div>
    </div>
  );
}
