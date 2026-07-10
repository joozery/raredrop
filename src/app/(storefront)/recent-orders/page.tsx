"use client";

import React, { useEffect, useState } from "react";
import { ShoppingBag, ChevronLeft } from "lucide-react";
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

export default function RecentOrdersPage() {
  const [purchases, setPurchases] = useState<RecentPurchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/recent-purchases?limit=50")
      .then((r) => r.json())
      .then((data) => {
        setPurchases(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 pb-20">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors">
          <ChevronLeft size={20} className="text-gray-600" />
        </Link>
        <h1 className="text-xl font-bold flex items-center gap-2 text-gray-900">
          <ShoppingBag size={24} className="text-[#E04631]" />
          คำสั่งซื้อล่าสุด
        </h1>
      </div>

      <div className="bg-white rounded-2xl p-2 sm:p-4 shadow-sm border border-gray-100 flex flex-col gap-2">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-xl animate-pulse">
              <div className="w-14 h-14 bg-gray-200 rounded-lg shrink-0"></div>
              <div className="flex flex-col gap-2 flex-1">
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))
        ) : purchases.length === 0 ? (
          <div className="py-12 text-center text-gray-500 font-medium">
            ยังไม่มีคำสั่งซื้อล่าสุด
          </div>
        ) : (
          purchases.map((p) => {
            const timeAgo = p.createdAt 
              ? formatDistanceToNow(new Date(p.createdAt), { addSuffix: true, locale: th })
                  .replace('ประมาณ ', '')
                  .replace('กว่า', '')
                  .replace('ที่แล้ว', 'ที่แล้ว')
              : "เมื่อกี้";
              
            return (
              <div key={p._id} className="flex items-center gap-3 sm:gap-4 bg-[#F8FAFC] rounded-xl p-3 sm:p-4 hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-black shrink-0 overflow-hidden shadow-sm flex items-center justify-center">
                  {p.listingImage ? (
                    <img
                      src={p.listingImage}
                      alt={p.listingTitle}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/product/pokemon.webp"; }}
                    />
                  ) : (
                    <ShoppingBag size={24} className="text-gray-400" />
                  )}
                </div>
                
                <div className="flex flex-col flex-1 min-w-0 justify-center">
                  <span className="text-sm sm:text-base font-bold text-gray-900 truncate mb-0.5">{p.listingTitle}</span>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="truncate max-w-[120px]">
                      โดย {p.userId?.name || "ผู้ใช้ทั่วไป"}
                    </span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span>{timeAgo}</span>
                  </div>
                </div>
                
                <div className="shrink-0 flex items-center">
                  <span className="text-base sm:text-lg font-bold text-[#E04631] bg-red-50 px-3 py-1 rounded-lg border border-red-100">
                    ฿{p.pricePaid?.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
