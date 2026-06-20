"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard, Package, FolderTree, Percent,
  Box, Boxes, Diamond, Users, Wallet, UserPlus,
  ArrowRightLeft, Store, ShoppingCart, BarChart3,
  Settings, ScrollText, Bell, Calendar, Search, Menu, HelpCircle, ChevronRight, LogOut, Zap, Send, TrendingUp, MessageCircle, Ticket, Gift, ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuGroups = [
  {
    title: "จัดการกล่องสุ่ม",
    items: [
      { name: "กล่องสุ่มทั้งหมด", icon: Package, href: "/admin/boxes" },
      { name: "หมวดหมู่", icon: FolderTree, href: "/admin/categories" },
      { name: "อัตราดรอป", icon: Percent, href: "/admin/probabilities" },
    ]
  },
  {
    title: "จัดการไอเทม",
    items: [
      { name: "คลังไอเทม", icon: Box, href: "/admin/items" },
      { name: "สต็อกสินค้า", icon: Boxes, href: "/admin/inventories" },
      { name: "ระดับความหายาก", icon: Diamond, href: "/admin/rarities" },
    ]
  },
  {
    title: "ผู้ใช้และการเงิน",
    items: [
      { name: "จัดการผู้เล่น", icon: Users, href: "/admin/users" },
      { name: "จัดการแอดมิน", icon: UserPlus, href: "/admin/manage-admins" },
      { name: "กระเป๋าเงิน (Wallet)", icon: Wallet, href: "/admin/wallet" },
      { name: "ระบบเลเวล & EXP", icon: TrendingUp, href: "/admin/levels" },
      { name: "ประวัติธุรกรรม", icon: ArrowRightLeft, href: "/admin/transactions" },
      { name: "ส่งการแจ้งเตือน", icon: Send, href: "/admin/notifications" },
    ]
  },
  {
    title: "ร้านค้า",
    items: [
      { name: "Flash Sale", icon: Zap, href: "/admin/flash-sale" },
      { name: "จัดการร้านค้า", icon: Store, href: "/admin/shop" },
      { name: "ออเดอร์คำสั่งซื้อ", icon: ShoppingCart, href: "/admin/orders" },
      { name: "แลก GemCoin", icon: Diamond, href: "/admin/gem-rewards" },
      { name: "โค้ดแลกของ", icon: Ticket, href: "/admin/promo-codes" },
      { name: "ซองแดง", icon: Gift, href: "/admin/red-envelope" },
      { name: "Live Chat", icon: MessageCircle, href: "/admin/chat" },
    ]
  },
  {
    title: "วิเคราะห์ข้อมูล",
    items: [
      { name: "รายงานและสถิติ", icon: BarChart3, href: "/admin/reports" },
    ]
  },
  {
    title: "ตั้งค่าระบบ",
    items: [
      { name: "ศูนย์ช่วยเหลือ (FAQ)", icon: HelpCircle, href: "/admin/help" },
      { name: "ตั้งค่าเว็บไซต์", icon: Settings, href: "/admin/settings" },
      { name: "บันทึกระบบ (Logs)", icon: ScrollText, href: "/admin/logs" },
    ]
  }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/admin-login");
    } else if (status === "authenticated") {
      const role = (session?.user as any)?.role;
      if (role !== "admin" && role !== "super_admin") {
        router.replace("/admin-login");
      } else if (role === "admin" && pathname === "/admin") {
        router.replace("/admin/shop");
      }
    }
  }, [status, session, router, pathname]);

  const role = (session?.user as any)?.role;
  const isSuperAdmin = role === "super_admin";
  const isAdmin = role === "admin";

  const isRestrictedPath = isAdmin && pathname !== "/admin" && !pathname.startsWith("/admin/shop") && !pathname.startsWith("/admin/chat");

  const filteredMenuGroups = isSuperAdmin ? menuGroups : menuGroups.map(g => {
    if (g.title === "ร้านค้า") {
      return {
        ...g,
        items: g.items.filter(i => i.href === "/admin/shop" || i.href === "/admin/chat")
      };
    }
    return null;
  }).filter(Boolean) as typeof menuGroups;

  // ใต้จอ lg ลดจอบังคับให้ sidebar เป็นโหมดเต็ม (มีตัวหนังสือ) เสมอ — โหมดย่อไอคอนมีไว้สำหรับจอใหญ่เท่านั้น
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const syncOnMobile = () => { if (mq.matches) setIsSidebarOpen(true); };
    syncOnMobile();
    mq.addEventListener("change", syncOnMobile);
    return () => mq.removeEventListener("change", syncOnMobile);
  }, []);

  // ปิดเมนูมือถืออัตโนมัติทุกครั้งที่เปลี่ยนหน้า
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
          <span className="text-sm font-medium">กำลังตรวจสอบสิทธิ์...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden">
      {/* Mobile drawer backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-white border-r border-slate-200 flex flex-col shrink-0 transition-all duration-300 z-50",
          "fixed inset-y-0 left-0 lg:relative",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className={cn("flex flex-col h-full", isSidebarOpen ? "w-64" : "w-20")}>
          <div className={cn("h-20 flex items-center shrink-0 border-b border-slate-100", isSidebarOpen ? "px-6" : "px-0 justify-center")}>
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-black text-xl leading-none shrink-0">R</div>
              {isSidebarOpen && (
                <div className="flex flex-col overflow-hidden">
                  <span className="font-black text-sm tracking-tight leading-none text-slate-900 truncate">RAREDROP</span>
                  <span className="text-[9px] font-bold text-slate-400 tracking-wider truncate">ADMIN PANEL</span>
                </div>
              )}
            </Link>
          </div>

          <div className={cn("flex-1 overflow-y-auto hide-scrollbar py-6", isSidebarOpen ? "px-4" : "px-3")}>
            {isSuperAdmin && (
              <Link 
                href="/admin"
                title={!isSidebarOpen ? "Dashboard" : undefined}
                className={cn(
                  "flex items-center rounded-lg mb-6 transition-colors group",
                  isSidebarOpen ? "gap-3 px-3 py-2.5" : "justify-center py-3",
                  pathname === "/admin" 
                    ? "bg-red-600 text-white shadow-md shadow-red-500/20" 
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <LayoutDashboard size={isSidebarOpen ? 18 : 22} strokeWidth={pathname === "/admin" ? 2.5 : 2} className={cn(!isSidebarOpen && pathname !== "/admin" && "text-slate-400 group-hover:text-slate-600")} />
                {isSidebarOpen && <span className={cn("text-sm", pathname === "/admin" ? "font-bold" : "font-medium")}>Dashboard</span>}
              </Link>
            )}

            {filteredMenuGroups.map((group, i) => (
              <div key={i} className="mb-6">
                {isSidebarOpen ? (
                  <h3 className="px-3 text-[10px] font-bold text-slate-400 tracking-wider mb-2">{group.title}</h3>
                ) : (
                  <div className="w-full flex justify-center mb-2"><div className="w-4 h-[1px] bg-slate-200"></div></div>
                )}
                <div className="flex flex-col gap-1">
                  {group.items.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={!isSidebarOpen ? item.name : undefined}
                        className={cn(
                          "flex items-center rounded-lg transition-colors group",
                          isSidebarOpen ? "gap-3 px-3 py-2" : "justify-center py-3",
                          isActive ? "text-red-600 bg-red-50" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                      >
                        <item.icon size={isSidebarOpen ? 18 : 22} className={isActive ? "text-red-600" : "text-slate-400 group-hover:text-slate-600"} strokeWidth={2} />
                        {isSidebarOpen && <span className={cn("text-sm truncate", isActive ? "font-bold" : "font-medium")}>{item.name}</span>}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Need Help Box */}
          <div className="p-4 shrink-0 border-t border-slate-100">
            {isSidebarOpen ? (
              <div className="bg-red-50 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-red-100 transition-colors border border-red-100/50">
                <div className="flex items-center gap-3">
                  <div className="text-red-500"><HelpCircle size={20} strokeWidth={2.5} /></div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-slate-800">Need Help?</span>
                    <span className="text-[10px] text-slate-500 font-medium">Contact Support</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-red-400" />
              </div>
            ) : (
              <div className="flex justify-center" title="Need Help? Contact Support">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center cursor-pointer hover:bg-red-100 transition-colors border border-red-100/50 text-red-500">
                  <HelpCircle size={22} strokeWidth={2.5} />
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 lg:h-20 bg-white border-b border-slate-200 px-3 sm:px-6 lg:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden text-slate-400 hover:text-slate-600 transition-colors shrink-0"><Menu size={22} /></button>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="hidden lg:block text-slate-400 hover:text-slate-600 transition-colors shrink-0"><Menu size={20} /></button>
            <h1 className="text-base sm:text-xl font-bold text-slate-800 truncate">Dashboard</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 shrink-0">
            <button className="hidden md:flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 shadow-sm">
              <Calendar size={14} className="text-slate-400" />
              13 พ.ค. 2025 - 19 พ.ค. 2025
            </button>

            <button className="relative text-slate-500 hover:text-slate-700">
              <Bell size={20} />
              <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">12</span>
            </button>

            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 lg:pl-6 border-l border-slate-200 cursor-pointer group relative">
              <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden shrink-0">
                <img src={session?.user?.image || `https://api.dicebear.com/9.x/avataaars/svg?seed=${session?.user?.name || 'Admin'}`} alt="Admin" className="w-full h-full object-cover" />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-sm font-bold text-slate-800 leading-tight">{session?.user?.name || "Loading..."}</span>
                <span className="text-[10px] text-slate-500 font-medium uppercase">{(session?.user as any)?.role || "Admin"}</span>
              </div>
              
              {/* Dropdown Menu */}
              <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="p-2 flex flex-col">
                  <button 
                    onClick={() => signOut({ callbackUrl: '/admin-login' })}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full text-left"
                  >
                    <LogOut size={16} />
                    ออกจากระบบ (Logout)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
          {isRestrictedPath ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <ShieldAlert size={60} className="text-red-500 mb-4" />
              <h2 className="text-2xl font-black text-slate-800">ไม่มีสิทธิ์เข้าถึง</h2>
              <p className="text-slate-500 mt-2">ระดับ Admin ของคุณไม่สามารถเข้าถึงหน้านี้ได้</p>
              <Link href="/admin/shop" className="mt-6 bg-red-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm hover:bg-red-700 transition-colors">
                กลับไปหน้าร้านค้า
              </Link>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
