"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Package, 
  PackageCheck, 
  Briefcase, 
  LibrarySquare, 
  Trophy, 
  Users, 
  HelpCircle,
  Apple,
  Play
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { name: "หน้าหลัก", icon: Home, href: "/" },
  { name: "กล่องสุ่ม", icon: Package, href: "/boxes" },
  { name: "เปิดกล่อง", icon: PackageCheck, href: "/open" },
  { name: "ตลาดซื้อขาย", icon: Briefcase, href: "/marketplace" },
  { name: "คอลเลกชันของฉัน", icon: LibrarySquare, href: "/inventory" },
  { name: "รางวัล & ภารกิจ", icon: Trophy, href: "/rewards" },
  { name: "อันดับผู้เล่น", icon: Users, href: "/leaderboard" },
  { name: "ช่วยเหลือ", icon: HelpCircle, href: "/help" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 bg-white border-r border-gray-100 flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="h-28 flex items-center px-6 shrink-0 mt-2">
        <Link href="/" className="flex items-center w-full justify-center">
          <Image
            src="https://pub-ee29977ae9524b05b628923eee00188a.r2.dev/logo/logo.png"
            alt="RareDrop Logo"
            width={400}
            height={100}
            className="w-full max-w-[240px] h-auto object-contain drop-shadow-sm"
            priority
          />
        </Link>
      </div>

      {/* Menu */}
      <div className="flex-1 overflow-y-auto px-5 flex flex-col hide-scrollbar pb-6">
        <div className="flex flex-col gap-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200",
                  isActive 
                    ? "bg-[#DC2626] text-white shadow-md shadow-red-500/20" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon size={22} className={cn(isActive ? "text-white" : "text-gray-500")} strokeWidth={isActive ? 2 : 1.5} />
                <span className={cn("text-[15px]", isActive ? "font-bold" : "font-medium")}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
        
        {/* App Promo Banner */}
        <div className="mt-8 relative shrink-0 overflow-hidden rounded-2xl cursor-pointer hover:opacity-95 transition-opacity shadow-sm border border-gray-100">
          <img 
            src="https://pub-ee29977ae9524b05b628923eee00188a.r2.dev/banner/bannerrare.jpg"
            alt="Download RareDrop App"
            className="w-full h-auto object-contain block"
          />
        </div>
      </div>

      {/* Footer / Socials */}
      <div className="px-5 pb-6 shrink-0 bg-white">
        <div className="border border-gray-100 rounded-2xl p-3 flex justify-between items-center mb-4 shadow-sm bg-gray-50/50">
          <a href="#" className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center hover:scale-110 transition-transform">
             <img src="/banner/cover/facebook.svg" alt="Facebook" className="w-5 h-5" />
          </a>
          <a href="#" className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center hover:scale-110 transition-transform">
             <img src="/banner/cover/line.svg" alt="Line" className="w-5 h-5" />
          </a>
          <a href="#" className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center hover:scale-110 transition-transform">
             <img src="/banner/cover/discord.svg" alt="Discord" className="w-5 h-5" />
          </a>
          <a href="#" className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-black hover:scale-110 transition-transform font-bold text-sm">
             <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 15.66a6.34 6.34 0 0010.86 4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.04-.52z"/></svg>
          </a>
          <a href="#" className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-[#FF0000] hover:scale-110 transition-transform font-bold text-sm">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 00-2.122 2.136C0 8.07 0 12 0 12s0 3.93.501 5.814a3.016 3.016 0 002.122 2.136C4.495 20.5 12 20.5 12 20.5s7.505 0 9.377-.55a3.016 3.016 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          </a>
        </div>
        <p className="text-[11px] text-gray-400 font-medium text-center">© 2024 RareDrop. All rights reserved.</p>
      </div>
    </aside>
  );
}
