"use client";

import React, { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";

interface RecentPurchase {
  _id: string;
  userId: { name: string; avatar?: string };
  listingTitle: string;
  listingImage?: string;
  pricePaid: number;
  createdAt: string;
}

export default function MobileRecentPurchases() {
  const [purchases, setPurchases] = useState<RecentPurchase[]>([]);

  useEffect(() => {
    fetch("/api/recent-purchases")
      .then((r) => r.json())
      .then((data) => setPurchases(Array.isArray(data) ? data.slice(0, 6) : []))
      .catch(() => setPurchases([]));
  }, []);

  if (purchases.length === 0) return null;

  return (
    <section className="block lg:hidden mt-2 mb-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold flex items-center gap-2">
          <ShoppingBag size={15} className="text-primary" />
          การสั่งซื้อล่าสุด
        </h3>
      </div>

      <div className="flex overflow-x-auto gap-3 hide-scrollbar -mx-4 px-4 pb-2">
        {purchases.map((p) => (
          <div key={p._id} className="w-[130px] shrink-0 bg-white border border-gray-100 rounded-xl p-3 shadow-sm flex flex-col items-center text-center">
            <div className="flex items-center justify-center gap-2 mb-2 w-full">
              <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0 border-2 border-white shadow-sm overflow-hidden">
                <img
                  src={p.userId?.avatar || `https://api.dicebear.com/9.x/adventurer/svg?seed=${p.userId?.name}`}
                  alt={p.userId?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {p.listingImage ? (
                <div className="w-10 h-10 bg-gray-100 rounded-md shrink-0 overflow-hidden shadow-sm border border-gray-100">
                  <img
                    src={p.listingImage}
                    alt={p.listingTitle}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              ) : (
                <div className="w-10 h-10 bg-gray-50 rounded-md shrink-0 border border-gray-100 flex items-center justify-center">
                  <ShoppingBag size={14} className="text-gray-300" />
                </div>
              )}
            </div>
            <p className="text-xs font-bold text-gray-900 truncate w-full">{p.userId?.name}</p>
            <p className="text-[9px] text-gray-500 truncate w-full mt-0.5">ซื้อ {p.listingTitle}</p>
            <p className="text-[10px] text-primary font-semibold mt-1">฿{p.pricePaid?.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
