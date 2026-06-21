"use client";

import Link from "next/link";
import { Gift, ChevronRight } from "lucide-react";

export default function RedEnvelopeBanner() {
  return (
    <Link
      href="/red-envelope"
      className="relative overflow-hidden w-full rounded-2xl bg-gradient-to-r from-red-700 via-amber-500 to-red-600 animate-gradient-shift shadow-sm border border-red-400 group block"
    >
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      
      {/* Shimmer Effect */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] z-0 pointer-events-none"></div>
      
      <div className="relative p-4 sm:p-5 flex items-center justify-between z-10">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0 border border-white/30 shadow-inner group-hover:scale-105 transition-transform duration-300">
            <Gift className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-white font-black text-lg sm:text-xl drop-shadow-sm flex items-center gap-2">
              กิจกรรมชิงรางวัลซองแดง 🧧
            </h3>
            <p className="text-red-100 text-xs sm:text-sm font-medium mt-0.5">
              กดรับอั่งเปาฟรี ลุ้นรับเครดิตและไอเทมแรร์มากมาย!
            </p>
          </div>
        </div>
        
        <div className="hidden sm:flex shrink-0 items-center gap-1 bg-white text-red-600 font-bold px-4 py-2 rounded-xl text-sm shadow-sm group-hover:bg-red-50 transition-colors">
          ร่วมสนุกเลย <ChevronRight size={16} />
        </div>
        <div className="sm:hidden shrink-0 text-white flex items-center">
          <ChevronRight size={24} />
        </div>
      </div>
      
      {/* Decorative floating shapes */}
      <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
      <div className="absolute -bottom-6 right-20 w-20 h-20 bg-yellow-400/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700 delay-100"></div>
    </Link>
  );
}
