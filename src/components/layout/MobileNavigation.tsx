"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Store, Package, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "หน้าหลัก", href: "/", icon: Home },
  { name: "ตลาด", href: "/marketplace", icon: Store },
  { name: "กระเป๋า", href: "/inventory", icon: Package },
  { name: "ฉัน", href: "/profile", icon: User },
];

export function MobileNavigation() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-t border-gray-100 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
      <div className="mx-auto max-w-md flex justify-around items-center h-16 px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-full gap-1 transition-all duration-200",
                isActive ? "text-primary" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <div
                className={cn(
                  "p-1.5 rounded-xl transition-all duration-300",
                  isActive ? "bg-primary/10 scale-110" : "bg-transparent scale-100"
                )}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={isActive ? "fill-primary/20" : ""}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-gray-400"
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
