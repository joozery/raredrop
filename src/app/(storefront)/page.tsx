"use client";

import HeroBanner from "@/components/home/HeroBanner";
import TrendingBoxes from "@/components/home/TrendingBoxes";
import MarketplacePreview from "@/components/home/MarketplacePreview";
import RightPanel from "@/components/home/RightPanel";
import MobileLiveOpenings from "@/components/home/MobileLiveOpenings";
import PromoBanner from "@/components/home/PromoBanner";

export default function Home() {
  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 lg:p-6 pb-20 lg:pb-6">
      {/* Left Main Content */}
      <div className="flex-1 flex flex-col gap-6 lg:gap-8 min-w-0">
        <HeroBanner />
        <MobileLiveOpenings />
        <TrendingBoxes />
        <MarketplacePreview />
        <div className="block lg:hidden mt-2">
          <PromoBanner />
        </div>
      </div>

      {/* Right Side Panel */}
      <div className="hidden lg:flex">
        <RightPanel />
      </div>
    </div>
  );
}
