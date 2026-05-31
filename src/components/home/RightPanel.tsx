import React from 'react';
import { ShieldCheck, Truck, Users, Package, Headset, Scale, Gift, Coins } from "lucide-react";
import PromoBanner from "./PromoBanner";

export default function RightPanel() {
  return (
    <div className="w-[320px] shrink-0 flex flex-col gap-6 hide-scrollbar">
      
      {/* Live Openings */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2">
            ไลฟ์เปิดกล่อง
            <span className="bg-red-100 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" /> LIVE
            </span>
          </h3>
          <button className="text-[10px] text-gray-400 hover:text-primary">ดูทั้งหมด ›</button>
        </div>
        
        <div className="flex flex-col gap-3">
          {[
            { u: "Player123", i: "Labubu Secret", p: "฿12,900" },
            { u: "HunterX", i: "Pikachu PSA 10", p: "฿9,800" },
            { u: "MightyBear", i: "Bearbrick 400%", p: "฿6,500" },
            { u: "SneakerHead", i: "Nike Dunk Low", p: "฿4,200" }
          ].map((feed, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-100">
              <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0 border-2 border-white shadow-sm overflow-hidden">
                <img src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${feed.u}`} alt={feed.u} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">{feed.u}</p>
                <p className="text-[10px] text-gray-500 truncate">เปิดได้ {feed.i}</p>
                <p className="text-[10px] text-primary font-semibold">ราคา {feed.p}</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-md shrink-0 overflow-hidden shadow-sm border border-gray-100">
                <img src={`https://picsum.photos/seed/${feed.i.replace(/\s+/g, '')}/100/100`} alt={feed.i} className="w-full h-full object-cover" />
              </div>
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
              <p className="text-[8px] font-medium text-gray-800 leading-tight">ของแท้ 100%<br/><span className="text-gray-400">ผ่านการคัดสรร</span></p>
           </div>
           <div className="p-2 bg-gray-50 rounded-lg text-center flex flex-col items-center gap-1.5">
              <Truck size={16} className="text-primary" />
              <p className="text-[8px] font-medium text-gray-800 leading-tight">จัดส่งทั่วไทย<br/><span className="text-gray-400">รวดเร็ว ปลอดภัย</span></p>
           </div>
           <div className="p-2 bg-gray-50 rounded-lg text-center flex flex-col items-center gap-1.5">
              <Scale size={16} className="text-primary" />
              <p className="text-[8px] font-medium text-gray-800 leading-tight">ระบบยุติธรรม<br/><span className="text-gray-400">โอกาสเท่าเทียม</span></p>
           </div>
           <div className="p-2 bg-gray-50 rounded-lg text-center flex flex-col items-center gap-1.5">
              <Headset size={16} className="text-primary" />
              <p className="text-[8px] font-medium text-gray-800 leading-tight">ซัพพอร์ต 24/7<br/><span className="text-gray-400">พร้อมดูแลคุณ</span></p>
           </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">สถิติวันนี้</h3>
          <button className="text-[10px] text-primary font-semibold hover:underline flex items-center gap-0.5">ดูทั้งหมด ›</button>
        </div>
        <div className="border-t border-gray-100 mb-4"></div>
        <div className="grid grid-cols-4 gap-1 text-center">
           <div className="flex flex-col items-center">
              <Users size={16} className="text-primary mb-1.5" />
              <p className="text-[8px] text-gray-500 mb-1">ผู้เล่นทั้งหมด</p>
              <p className="font-bold text-gray-900 text-[11px]">24,591</p>
           </div>
           <div className="flex flex-col items-center">
              <Package size={16} className="text-primary mb-1.5" />
              <p className="text-[8px] text-gray-500 mb-1">กล่องที่เปิด</p>
              <p className="font-bold text-gray-900 text-[11px]">58,207</p>
           </div>
           <div className="flex flex-col items-center">
              <Gift size={16} className="text-primary mb-1.5" />
              <p className="text-[8px] text-gray-500 mb-1">ไอเท็มที่ได้รับ</p>
              <p className="font-bold text-gray-900 text-[11px]">12,488</p>
           </div>
           <div className="flex flex-col items-center">
              <div className="w-4 h-4 mb-1.5 flex items-center justify-center bg-primary rounded-full">
                <span className="text-[10px] text-white font-bold">฿</span>
              </div>
              <p className="text-[8px] text-gray-500 mb-1">มูลค่ารวม (THB)</p>
              <p className="font-bold text-gray-900 text-[11px]">8,245,320</p>
           </div>
        </div>
      </div>

    </div>
  );
}
