"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { LoginModal } from "@/components/auth/LoginModal";
import { TopupModal } from "@/components/payment/TopupModal";
import { NotificationDropdown } from "@/components/layout/NotificationDropdown";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isTopupOpen, setIsTopupOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState("https://pub-ee29977ae9524b05b628923eee00188a.r2.dev/logo/logo.png");
  const { data: session } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/public-settings")
      .then((r) => r.json())
      .then((d) => { if (d.site_logo) setLogoUrl(d.site_logo); })
      .catch(() => {});
  }, []);

  // Hide on box detail page
  if (pathname.match(/^\/boxes\/[^/]+$/)) {
    return null;
  }

  return (
    <>
      <header className="bg-white border-b border-gray-100 shrink-0 flex flex-col z-40 relative">
        {/* Mobile Top Bar */}
        <div className="flex lg:hidden w-full items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <img src={logoUrl} alt="RareDrop Logo" className="h-7 w-auto object-contain" />
          </div>
          <div className="flex items-center gap-4">
            {session && <NotificationDropdown />}
            {session ? (
              <Link href="/profile" className="w-8 h-8 rounded-full border-2 border-gray-100 overflow-hidden shadow-sm flex items-center justify-center bg-gray-100">
                {session.user?.image ? (
                  <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-500 font-bold text-xs">{(session.user?.name || "U").charAt(0).toUpperCase()}</span>
                )}
              </Link>
            ) : (
              <button 
                onClick={() => setIsLoginOpen(true)}
                className="bg-primary text-white text-xs font-bold px-4 py-1.5 rounded-full hover:bg-primary/90 transition-colors shadow-sm"
              >
                เข้าสู่ระบบ
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="flex lg:hidden w-full px-4 pb-3">
          <div className="relative w-full">
            <input 
              type="text" 
              placeholder="ค้นหากล่อง, สินค้า หรือคอลเลกชัน..." 
              className="w-full bg-gray-50 border border-gray-200 rounded-full py-2 pl-10 pr-4 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <button className="absolute left-3.5 top-1/2 -translate-y-1/2 p-0 text-gray-400">
              <Search size={16} />
            </button>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:flex w-full items-center justify-between px-6 h-20">
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <input 
                type="text" 
                placeholder="ค้นหากล่อง, สินค้า หรือคอลเลกชัน..." 
                className="w-full bg-gray-50 border border-gray-200 rounded-full py-2.5 pl-5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-primary transition-colors">
                <Search size={18} />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {session && (
              <div className="flex items-center gap-4 bg-gray-50 py-1.5 px-3 rounded-full border border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center shadow-sm">
                    <span className="text-white text-xs font-bold">฿</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900 text-sm leading-none">
                      {((session.user as any)?.coins || 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-gray-500">THB</span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsTopupOpen(true)}
                  className="bg-primary text-white text-xs font-bold px-4 py-1.5 rounded-full hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
                >
                  เติมเงิน
                </button>
              </div>
            )}
            
            {session && <NotificationDropdown />}

            {session ? (
              <Link href="/profile" className="w-10 h-10 rounded-full border-2 border-gray-100 overflow-hidden shadow-sm flex items-center justify-center bg-gray-100 hover:border-gray-300 transition-colors">
                {session.user?.image ? (
                  <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-500 font-bold text-sm">{(session.user?.name || "U").charAt(0).toUpperCase()}</span>
                )}
              </Link>
            ) : (
              <button 
                onClick={() => setIsLoginOpen(true)}
                className="bg-primary text-white text-[13px] font-bold px-6 py-2.5 rounded-full hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
              >
                เข้าสู่ระบบ
              </button>
            )}
          </div>
        </div>
      </header>
      
      {/* Modals */}
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <TopupModal isOpen={isTopupOpen} onClose={() => setIsTopupOpen(false)} />
    </>
  );
}
