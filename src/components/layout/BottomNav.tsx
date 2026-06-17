"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Package, Store, User, LayoutGrid,
  PackageCheck, LibrarySquare, Trophy, Users, HelpCircle, X,
} from "lucide-react";

const MAIN_NAV = [
  { href: "/",           icon: Home,    label: "หน้าหลัก" },
  { href: "/boxes",      icon: Package, label: "กล่องสุ่ม" },
  { href: "/shop",        icon: Store,   label: "ร้านค้า" },
  { href: "/profile",    icon: User,    label: "ฉัน" },
];

const MORE_MENU = [
  { href: "/open",       icon: PackageCheck, label: "ไลฟ์เปิดกล่อง",    color: "bg-red-100 text-red-600" },
  { href: "/inventory",  icon: LibrarySquare,label: "คอลเลกชันของฉัน",   color: "bg-blue-100 text-blue-600" },
  { href: "/rewards",    icon: Trophy,       label: "รางวัล & ภารกิจ",   color: "bg-amber-100 text-amber-600" },
  { href: "/leaderboard",icon: Users,        label: "อันดับผู้เล่น",      color: "bg-purple-100 text-purple-600" },
  { href: "/help",       icon: HelpCircle,   label: "ช่วยเหลือ",          color: "bg-green-100 text-green-600" },
];

export function BottomNav() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (pathname.match(/^\/boxes\/[^/]+$/)) return null;

  return (
    <>
      {/* Bottom Nav Bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-around pb-safe pt-1 px-2 h-16">
          {MAIN_NAV.map(({ href, icon: Icon, label }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center gap-0.5 w-14 h-full transition-colors ${
                  active ? "text-primary" : "text-gray-400"
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${active ? "bg-red-50" : ""}`}>
                  <Icon size={21} strokeWidth={active ? 2.5 : 2} className={active ? "text-primary" : ""} />
                </div>
                <span className={`text-[10px] font-${active ? "bold" : "medium"} leading-none`}>{label}</span>
              </Link>
            );
          })}

          {/* More Button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className={`flex flex-col items-center justify-center gap-0.5 w-14 h-full transition-colors ${
              drawerOpen ? "text-primary" : "text-gray-400"
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${drawerOpen ? "bg-red-50" : ""}`}>
              <LayoutGrid size={21} strokeWidth={drawerOpen ? 2.5 : 2} className={drawerOpen ? "text-primary" : ""} />
            </div>
            <span className={`text-[10px] font-${drawerOpen ? "bold" : "medium"} leading-none`}>เพิ่มเติม</span>
          </button>
        </div>
      </div>

      {/* Backdrop */}
      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`lg:hidden fixed bottom-0 inset-x-0 z-[70] bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out ${
          drawerOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h3 className="font-black text-gray-900 text-base">เมนูทั้งหมด</h3>
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-3 gap-3 p-5 pb-8">
          {MORE_MENU.map(({ href, icon: Icon, label, color }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setDrawerOpen(false)}
                className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border transition-all active:scale-95 ${
                  active
                    ? "border-primary bg-red-50"
                    : "border-gray-100 bg-gray-50 hover:border-gray-200"
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${active ? "bg-red-100" : color}`}>
                  <Icon size={22} strokeWidth={2} />
                </div>
                <span className={`text-[11px] font-bold text-center leading-tight ${active ? "text-primary" : "text-gray-700"}`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
