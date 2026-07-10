"use client";

import React, { useEffect, useState } from "react";
import { ShoppingBag, ChevronRight } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

interface RecentPurchase {
  _id: string;
  userId: { name: string; avatar?: string };
  listingTitle: string;
  listingImage?: string;
  pricePaid: number;
  createdAt: string;
}

export default function RecentOrders() {
  const [purchases, setPurchases] = useState<RecentPurchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/recent-purchases")
      .then((r) => r.json())
      .then((data) => {
        setPurchases(Array.isArray(data) ? data.slice(0, 8) : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || purchases.length === 0) return null;

  return (
    <section className="w-full relative">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2 text-[15px] sm:text-base text-gray-900">
            <ShoppingBag size={18} className="text-[#E04631]" />
            คำสั่งซื้อล่าสุด
          </h3>
          <Link href="/recent-orders" className="text-xs font-bold text-[#E04631] flex items-center hover:underline">
            ดูทั้งหมด <ChevronRight size={14} />
          </Link>
        </div>

        <div className="flex overflow-x-auto hide-scrollbar gap-3 sm:gap-4 snap-x snap-mandatory pb-2 -mx-1 px-1">
          {purchases.map((p) => {
            const timeAgo = p.createdAt 
              ? formatDistanceToNow(new Date(p.createdAt), { addSuffix: true, locale: th })
                  .replace('ประมาณ ', '')
                  .replace('กว่า', '')
                  .replace('ที่แล้ว', 'ที่แล้ว')
              : "เมื่อกี้";
              
            return (
              <div key={p._id} className="flex items-center gap-3 w-[160px] sm:w-[200px] shrink-0 snap-start bg-[#F8FAFC] rounded-xl p-2.5 hover:bg-gray-50 transition-colors">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-black shrink-0 overflow-hidden shadow-sm flex items-center justify-center">
                  {p.listingImage ? (
                    <img
                      src={p.listingImage}
                      alt={p.listingTitle}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/product/pokemon.webp"; }}
                    />
                  ) : (
                    <ShoppingBag size={20} className="text-gray-400" />
                  )}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-[11px] sm:text-xs font-bold text-gray-900 truncate">{p.listingTitle}</span>
                  <span className="text-[12px] sm:text-sm font-bold text-[#E04631]">฿{p.pricePaid?.toLocaleString()}</span>
                  <span className="text-[9px] sm:text-[10px] text-gray-500 truncate mt-0.5">{timeAgo}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
