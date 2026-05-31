"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, Store, Wallet, User } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  // Hide on box detail page
  if (pathname.match(/^\/boxes\/[^/]+$/)) {
    return null;
  }

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 flex items-center justify-around pb-safe pt-2 px-2 z-50 shadow-[0_-5px_15px_-10px_rgba(0,0,0,0.1)]">
      <Link href="/" className={`flex flex-col items-center gap-1 p-2 transition-colors ${pathname === "/" ? "text-primary" : "text-gray-400 hover:text-gray-900"}`}>
        <Home size={22} className={pathname === "/" ? "fill-primary" : ""} />
        <span className={`text-[10px] ${pathname === "/" ? "font-bold" : "font-medium"}`}>หน้าหลัก</span>
      </Link>
      <Link href="/boxes" className={`flex flex-col items-center gap-1 p-2 transition-colors ${pathname === "/boxes" ? "text-primary" : "text-gray-400 hover:text-gray-900"}`}>
        <Package size={22} className={pathname === "/boxes" ? "fill-primary text-primary" : ""} />
        <span className={`text-[10px] ${pathname === "/boxes" ? "font-bold" : "font-medium"}`}>กล่อง</span>
      </Link>
      <Link href="/marketplace" className={`flex flex-col items-center gap-1 p-2 transition-colors ${pathname === "/marketplace" ? "text-primary" : "text-gray-400 hover:text-gray-900"}`}>
        <Store size={22} className={pathname === "/marketplace" ? "fill-primary text-primary" : ""} />
        <span className={`text-[10px] ${pathname === "/marketplace" ? "font-bold" : "font-medium"}`}>ตลาด</span>
      </Link>
      <Link href="/wallet" className={`flex flex-col items-center gap-1 p-2 transition-colors ${pathname === "/wallet" ? "text-primary" : "text-gray-400 hover:text-gray-900"}`}>
        <Wallet size={22} className={pathname === "/wallet" ? "fill-primary text-primary" : ""} />
        <span className={`text-[10px] ${pathname === "/wallet" ? "font-bold" : "font-medium"}`}>กระเป๋า</span>
      </Link>
      <Link href="/profile" className={`flex flex-col items-center gap-1 p-2 transition-colors ${pathname === "/profile" ? "text-primary" : "text-gray-400 hover:text-gray-900"}`}>
        <User size={22} className={pathname === "/profile" ? "fill-primary text-primary" : ""} />
        <span className={`text-[10px] ${pathname === "/profile" ? "font-bold" : "font-medium"}`}>ฉัน</span>
      </Link>
    </div>
  );
}
