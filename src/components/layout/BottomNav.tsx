"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, Store, User } from "lucide-react";

const MAIN_NAV = [
  { href: "/",           icon: Home,    label: "หน้าหลัก" },
  { href: "/boxes",      icon: Package, label: "กล่องสุ่ม" },
  { href: "/shop",        icon: Store,   label: "ร้านค้า" },
  { href: "/profile",    icon: User,    label: "ฉัน" },
];

export function BottomNav() {
  const pathname = usePathname();

  if (pathname.match(/^\/boxes\/[^/]+$/)) return null;

  return (
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
      </div>
    </div>
  );
}
