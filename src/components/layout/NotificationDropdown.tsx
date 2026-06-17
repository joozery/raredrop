"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X, CheckCheck, Info, CheckCircle, AlertTriangle, Inbox } from "lucide-react";
import Link from "next/link";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning";
  link?: string;
  isRead: boolean;
  createdAt: string;
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "เมื่อกี้";
  if (m < 60) return `${m} นาทีที่แล้ว`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ชม.ที่แล้ว`;
  return `${Math.floor(h / 24)} วันที่แล้ว`;
}

const typeIcon = {
  info: <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />,
  success: <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />,
  warning: <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />,
};

const typeBg = {
  info: "bg-blue-50",
  success: "bg-emerald-50",
  warning: "bg-amber-50",
};

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/user/notifications");
      if (res.ok) setNotifications(await res.json());
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markAllRead = async () => {
    await fetch("/api/user/notifications", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open && unread > 0) markAllRead();
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative text-gray-500 hover:text-gray-800 transition-colors"
      >
        <Bell size={22} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-black text-gray-900 text-sm">การแจ้งเตือน</span>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[10px] font-bold text-primary flex items-center gap-1 hover:text-red-700"
                >
                  <CheckCheck size={12} /> อ่านทั้งหมด
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
                <Inbox size={32} className="opacity-30" />
                <p className="text-xs font-medium">ยังไม่มีการแจ้งเตือน</p>
              </div>
            ) : (
              notifications.map((n) => {
                const content = (
                  <div className={`flex gap-3 px-4 py-3 transition-colors hover:bg-gray-50 ${!n.isRead ? typeBg[n.type] : ""}`}>
                    {typeIcon[n.type]}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold text-gray-900 leading-snug ${!n.isRead ? "text-gray-900" : "text-gray-600"}`}>
                        {n.title}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.isRead && <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1" />}
                  </div>
                );
                return n.link ? (
                  <Link key={n._id} href={n.link} onClick={() => setOpen(false)}>
                    {content}
                  </Link>
                ) : (
                  <div key={n._id}>{content}</div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
