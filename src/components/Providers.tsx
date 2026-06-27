"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // MetaMask ขว้าง unhandled rejection จาก internal reconnect loop ของตัวเอง
    // Next.js dev overlay แสดงทุก unhandled rejection — suppress เฉพาะของ MetaMask
    const handle = (e: PromiseRejectionEvent) => {
      if (e.reason?.message === "Failed to connect to MetaMask") {
        e.preventDefault();
      }
    };
    window.addEventListener("unhandledrejection", handle);
    return () => window.removeEventListener("unhandledrejection", handle);
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
}
