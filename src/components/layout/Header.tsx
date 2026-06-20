"use client";

import { useState, useEffect } from "react";
import { Search, Coins } from "lucide-react";
import { LoginModal } from "@/components/auth/LoginModal";
import { TopupModal } from "@/components/payment/TopupModal";
import { NotificationDropdown } from "@/components/layout/NotificationDropdown";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBalance } from "@/contexts/BalanceContext";

export function Header() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isTopupOpen, setIsTopupOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState("https://pub-ee29977ae9524b05b628923eee00188a.r2.dev/logo/logo.png");
  const { data: session } = useSession();
  const { coins, gemCoins } = useBalance();
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
          <div className="flex items-center gap-3">
            {session && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsTopupOpen(true)}
                  className="flex items-center gap-1 bg-gray-900 px-2.5 py-1.5 rounded-full"
                >
                  <span className="text-xs font-black text-white">{coins.toLocaleString()}</span>
                  <span className="text-[10px] text-gray-400 font-medium">฿</span>
                </button>
                <div className="flex items-center gap-1 bg-purple-100 px-2.5 py-1.5 rounded-full">
                  <Coins size={13} className="text-purple-600" />
                  <span className="text-xs font-black text-purple-700">{gemCoins.toLocaleString()}</span>
                </div>
              </div>
            )}
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

        {/* Search removed for both Mobile and Desktop */}
        <div className="hidden lg:flex w-full items-center justify-end px-6 h-20">
          
          <div className="flex items-center gap-6">
            {session && (
              <div className="flex items-center gap-4 bg-gray-50 py-1.5 px-3 rounded-full border border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center shadow-sm">
                    <span className="text-white text-xs font-bold">฿</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900 text-sm leading-none">
                      {coins.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-gray-500">THB</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center shadow-sm">
                    <Coins size={13} className="text-purple-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-purple-700 text-sm leading-none">
                      {gemCoins.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-purple-400">GEM</span>
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
