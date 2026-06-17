"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, Truck, Users, Package, Headset, Scale, Gift, ShoppingBag } from "lucide-react";
import PromoBanner from "./PromoBanner";

interface RecentPurchase {
  _id: string;
  userId: { name: string; avatar?: string };
  listingTitle: string;
  listingImage?: string;
  pricePaid: number;
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  totalBoxesOpened: number;
  totalItems: number;
  totalValue: number;
}

export default function RightPanel() {
  const [purchases, setPurchases] = useState<RecentPurchase[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/recent-purchases")
      .then((r) => r.json())
      .then((d) => setPurchases(Array.isArray(d) ? d.slice(0, 5) : []))
      .catch(() => {});

    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {});
  }, []);

  return (
    <div className="w-[320px] shrink-0 flex flex-col gap-6 hide-scrollbar">

      {/* Recent Purchases */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2">
            <ShoppingBag size={15} className="text-primary" />
            การสั่งซื้อล่าสุด
          </h3>
        </div>

        <div className="flex flex-col gap-3">
          {purchases.length === 0
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 bg-gray-100 rounded w-2/3" />
                    <div className="h-2 bg-gray-100 rounded w-1/2" />
                  </div>
                  <div className="w-10 h-10 bg-gray-100 rounded-md shrink-0" />
                </div>
              ))
            : purchases.map((p) => (
                <div key={p._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0 border-2 border-white shadow-sm overflow-hidden">
                    <img
                      src={p.userId?.avatar || `https://api.dicebear.com/9.x/adventurer/svg?seed=${p.userId?.name}`}
                      alt={p.userId?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">{p.userId?.name}</p>
                    <p className="text-[10px] text-gray-500 truncate">ซื้อ {p.listingTitle}</p>
                    <p className="text-[10px] text-primary font-semibold">฿{p.pricePaid?.toLocaleString()}</p>
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
              ))}
        </div>
      </div>

      {/* Promo Banner */}
      <PromoBanner />

      {/* Why RareDrop */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <h3 className="font-bold mb-4">ทำไมต้อง RareDrop?</h3>
        <div className="grid grid-cols-4 gap-2">
          <div className="p-2 bg-gray-50 rounded-lg text-center flex flex-col items-center gap-1.5">
            <ShieldCheck size={16} className="text-primary" />
            <p className="text-[8px] font-medium text-gray-800 leading-tight">ของแท้ 100%<br /><span className="text-gray-400">ผ่านการคัดสรร</span></p>
          </div>
          <div className="p-2 bg-gray-50 rounded-lg text-center flex flex-col items-center gap-1.5">
            <Truck size={16} className="text-primary" />
            <p className="text-[8px] font-medium text-gray-800 leading-tight">จัดส่งทั่วไทย<br /><span className="text-gray-400">รวดเร็ว ปลอดภัย</span></p>
          </div>
          <div className="p-2 bg-gray-50 rounded-lg text-center flex flex-col items-center gap-1.5">
            <Scale size={16} className="text-primary" />
            <p className="text-[8px] font-medium text-gray-800 leading-tight">ระบบยุติธรรม<br /><span className="text-gray-400">โอกาสเท่าเทียม</span></p>
          </div>
          <div className="p-2 bg-gray-50 rounded-lg text-center flex flex-col items-center gap-1.5">
            <Headset size={16} className="text-primary" />
            <p className="text-[8px] font-medium text-gray-800 leading-tight">ซัพพอร์ต 24/7<br /><span className="text-gray-400">พร้อมดูแลคุณ</span></p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">สถิติวันนี้</h3>
        </div>
        <div className="border-t border-gray-100 mb-4" />
        <div className="grid grid-cols-4 gap-1 text-center">
          <div className="flex flex-col items-center">
            <Users size={16} className="text-primary mb-1.5" />
            <p className="text-[8px] text-gray-500 mb-1">ผู้เล่นทั้งหมด</p>
            <p className="font-bold text-gray-900 text-[11px]">
              {stats ? stats.totalUsers.toLocaleString() : "—"}
            </p>
          </div>
          <div className="flex flex-col items-center">
            <Package size={16} className="text-primary mb-1.5" />
            <p className="text-[8px] text-gray-500 mb-1">กล่องที่เปิด</p>
            <p className="font-bold text-gray-900 text-[11px]">
              {stats ? stats.totalBoxesOpened.toLocaleString() : "—"}
            </p>
          </div>
          <div className="flex flex-col items-center">
            <Gift size={16} className="text-primary mb-1.5" />
            <p className="text-[8px] text-gray-500 mb-1">ไอเท็มทั้งหมด</p>
            <p className="font-bold text-gray-900 text-[11px]">
              {stats ? stats.totalItems.toLocaleString() : "—"}
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 mb-1.5 flex items-center justify-center bg-primary rounded-full">
              <span className="text-[10px] text-white font-bold">฿</span>
            </div>
            <p className="text-[8px] text-gray-500 mb-1">มูลค่ารวม</p>
            <p className="font-bold text-gray-900 text-[11px]">
              {stats ? stats.totalValue.toLocaleString() : "—"}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
