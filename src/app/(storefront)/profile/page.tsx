"use client";

import React from 'react';
import { useSession, signOut } from "next-auth/react";
import { Copy, ChevronRight, Wallet, Coins, Ticket, Gift, UserPlus, MessageCircle, Gamepad2, History, Swords, Truck, Settings, LogOut } from 'lucide-react';

export default function ProfilePage() {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col min-h-full bg-white pb-24">
      {/* Top Section (User Info & Level) */}
      <div className="bg-gradient-to-b from-orange-50 to-white pt-8 px-4 pb-4">
        {/* User Info */}
        <div className="flex items-center gap-4 relative">
          <div className="w-20 h-20 rounded-full bg-gray-200 shrink-0 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
            {session?.user?.image ? (
              <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-gray-400">{(session?.user?.name || "U").charAt(0).toUpperCase()}</span>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{session?.user?.name || "RareDrop User"}</h1>
              <div className="bg-gray-200 px-1.5 py-0.5 rounded text-[10px] font-bold text-gray-600 italic">V{(session?.user as any)?.vipLevel || 1}</div>
            </div>
            
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">{session?.user?.email || "ID 2837563"}</span>
              <button className="text-[10px] text-gray-400 underline hover:text-primary transition-colors">คัดลอก</button>
            </div>
            
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
              <div>ติดตาม <span className="font-bold text-gray-900">0</span></div>
              <div>ผู้ติดตาม <span className="font-bold text-gray-900">0</span></div>
            </div>
          </div>
          
          <button className="absolute right-0 top-2 bg-white/80 backdrop-blur-sm border border-gray-100 rounded-full py-1.5 pl-3 pr-2 flex items-center gap-1 text-[10px] font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
            หน้าโปรไฟล์ <ChevronRight size={14} className="text-gray-400" />
          </button>
        </div>

        {/* Level Card */}
        <div className="mt-6 bg-gradient-to-r from-gray-200 to-gray-100 rounded-2xl p-4 relative overflow-hidden shadow-sm border border-gray-200/50">
          <div className="relative z-10 w-2/3">
            <div className="flex items-end justify-between mb-2">
              <h2 className="text-2xl font-black text-gray-800 italic">Lv.1</h2>
              <p className="text-[10px] text-gray-600 font-medium flex items-center cursor-pointer hover:text-gray-900">เหลืออีก 8 XP เพื่อเลเวลอัป <ChevronRight size={12} /></p>
            </div>
            <div className="h-1.5 bg-black/10 rounded-full w-full overflow-hidden">
              <div className="h-full bg-gray-800 w-[0%] rounded-full"></div>
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-gray-500 font-bold">
              <span>0XP</span>
              <span>8XP</span>
            </div>
          </div>
          {/* Decorative graphic right side */}
          <div className="absolute -right-4 -bottom-4 w-32 h-32 opacity-80 pointer-events-none">
            <div className="absolute right-8 bottom-6 w-16 h-24 bg-gradient-to-br from-gray-300 to-gray-400 transform rotate-12 rounded-lg shadow-lg"></div>
            <div className="absolute right-2 bottom-10 w-12 h-16 bg-gradient-to-br from-gray-200 to-gray-300 transform -rotate-12 rounded-lg shadow-md"></div>
          </div>
        </div>
      </div>

      <div className="px-4 flex flex-col gap-4 mt-2">
        {/* Wallet Section */}
        <div className="bg-[#2A2A2A] rounded-2xl p-4 text-white shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium mb-1 cursor-pointer hover:text-gray-300 transition-colors">
                <Wallet size={14} /> ยอดเงินที่ใช้ได้ <ChevronRight size={14} />
              </div>
              <div className="text-2xl font-bold tracking-tight">
                ฿ 0.00
              </div>
            </div>
            <div className="flex gap-2">
              <button className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors active:scale-95">
                ถอนเงิน
              </button>
              <button className="bg-white text-black text-xs font-bold px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors active:scale-95 shadow-sm">
                + เติมเงิน
              </button>
            </div>
          </div>
        </div>

        {/* Points & Coupons */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-100 transition-colors border border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 shrink-0 shadow-sm">
              <Coins size={22} className="fill-orange-400 text-orange-200" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-gray-900 text-[15px]">0.00</div>
              <div className="text-[10px] text-gray-500 font-medium">คะแนนคงเหลือ</div>
            </div>
            <ChevronRight size={14} className="text-gray-300" />
          </div>
          <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-100 transition-colors border border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0 shadow-sm">
              <Ticket size={22} className="fill-red-400 text-red-200" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-gray-900 text-[15px]">0 <span className="text-[10px] font-normal text-gray-500">ใบ</span></div>
              <div className="text-[10px] text-gray-500 font-medium">คูปอง</div>
            </div>
            <ChevronRight size={14} className="text-gray-300" />
          </div>
        </div>

        {/* Other Menus */}
        <div className="mt-4">
          <h3 className="font-bold text-gray-900 mb-5 text-[15px]">เมนูอื่นๆ</h3>
          <div className="grid grid-cols-4 gap-y-7 gap-x-2">
            {[
              { icon: Gift, label: "แลกโค้ด" },
              { icon: UserPlus, label: "เชิญเพื่อน" },
              { icon: MessageCircle, label: "ชุมชน" },
              { icon: Gamepad2, label: "วิธีการเล่น" },
              { icon: History, label: "ประวัติการสุ่ม" },
              { icon: Swords, label: "ประวัติการแข่ง" },
              { icon: Truck, label: "ประวัติการจัดส่ง" },
              { icon: Settings, label: "การตั้งค่า" },
            ].map((menu, i) => (
              <div key={i} className="flex flex-col items-center gap-2.5 cursor-pointer group">
                <div className="text-gray-600 group-hover:text-primary transition-colors group-active:scale-95">
                  <menu.icon size={26} strokeWidth={1.5} />
                </div>
                <span className="text-[10px] font-medium text-gray-700 text-center">{menu.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Logout Button */}
        {session && (
          <div className="mt-8 px-2">
            <button 
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 font-bold rounded-xl py-3.5 flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <LogOut size={18} />
              ออกจากระบบ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
