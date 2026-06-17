"use client";

import { useState, useEffect } from "react";
import { Bell, Send, Users, User, Loader2, Info, CheckCircle, AlertTriangle } from "lucide-react";

interface UserOption {
  _id: string;
  name: string;
  email: string;
}

const TYPE_OPTIONS = [
  { value: "info", label: "ข้อมูล", icon: <Info size={14} className="text-blue-500" />, bg: "bg-blue-50 border-blue-200" },
  { value: "success", label: "สำเร็จ", icon: <CheckCircle size={14} className="text-emerald-500" />, bg: "bg-emerald-50 border-emerald-200" },
  { value: "warning", label: "แจ้งเตือน", icon: <AlertTriangle size={14} className="text-amber-500" />, bg: "bg-amber-50 border-amber-200" },
] as const;

export default function AdminNotificationsPage() {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [form, setForm] = useState({ title: "", message: "", type: "info" as "info" | "success" | "warning", link: "", userId: "", broadcast: false });
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [search, setSearch] = useState("");

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => setUsers(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const filteredUsers = users.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      showToast("กรุณากรอกหัวข้อและข้อความ", false);
      return;
    }
    if (!form.broadcast && !form.userId) {
      showToast("กรุณาเลือกผู้รับ หรือเลือกส่งทุกคน", false);
      return;
    }
    setSending(true);
    try {
      const body = {
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
        link: form.link.trim() || undefined,
        broadcast: form.broadcast,
        userId: form.broadcast ? undefined : form.userId,
      };
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "เกิดข้อผิดพลาด", false); return; }
      showToast(form.broadcast ? `ส่งสำเร็จ ${data.sent} คน` : "ส่งสำเร็จ");
      setForm({ title: "", message: "", type: "info", link: "", userId: "", broadcast: false });
      setSearch("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Bell size={22} className="text-primary" /> ส่งการแจ้งเตือน
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">ส่ง notification ให้ผู้เล่นแบบเฉพาะเจาะจงหรือทุกคน</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 flex flex-col gap-5">
        {/* Target */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-600">ส่งถึง *</label>
          <div className="flex gap-3">
            <button
              onClick={() => setForm((f) => ({ ...f, broadcast: false, userId: "" }))}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-bold transition-all ${!form.broadcast ? "bg-red-600 text-white border-red-600" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}
            >
              <User size={15} /> ผู้เล่นคนเดียว
            </button>
            <button
              onClick={() => setForm((f) => ({ ...f, broadcast: true, userId: "" }))}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-bold transition-all ${form.broadcast ? "bg-red-600 text-white border-red-600" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}
            >
              <Users size={15} /> ทุกคน
            </button>
          </div>
        </div>

        {/* User picker */}
        {!form.broadcast && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-600">เลือกผู้เล่น *</label>
            <input
              type="text"
              placeholder="ค้นหาชื่อหรืออีเมล..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 font-medium text-slate-800"
            />
            {search && (
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-44 overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">ไม่พบผู้เล่น</p>
                ) : filteredUsers.slice(0, 8).map((u) => (
                  <button
                    key={u._id}
                    onClick={() => { setForm((f) => ({ ...f, userId: u._id })); setSearch(u.name); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors ${form.userId === u._id ? "bg-red-50" : ""}`}
                  >
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                      {u.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{u.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                    </div>
                    {form.userId === u._id && <span className="ml-auto text-red-500 text-xs font-bold">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Type */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-600">ประเภท</label>
          <div className="flex gap-2">
            {TYPE_OPTIONS.map((t) => (
              <button
                key={t.value}
                onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-bold transition-all ${form.type === t.value ? t.bg + " border-current" : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"}`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-600">หัวข้อ *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 font-medium text-slate-800"
            placeholder="เช่น เติมเงินสำเร็จ, มีสินค้าใหม่!"
          />
        </div>

        {/* Message */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-600">ข้อความ *</label>
          <textarea
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            rows={3}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 font-medium text-slate-800 resize-none"
            placeholder="รายละเอียดของการแจ้งเตือน..."
          />
        </div>

        {/* Link (optional) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-600">ลิงก์ (ไม่บังคับ)</label>
          <input
            type="text"
            value={form.link}
            onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 font-medium text-slate-800"
            placeholder="/shop, /inventory, ..."
          />
        </div>

        <button
          onClick={handleSend}
          disabled={sending}
          className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 disabled:bg-slate-400 transition-colors flex items-center justify-center gap-2"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {sending ? "กำลังส่ง..." : form.broadcast ? "ส่งให้ทุกคน" : "ส่ง Notification"}
        </button>
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 z-[300] px-5 py-3 rounded-2xl shadow-xl font-bold text-sm text-white flex items-center gap-2 ${toast.ok ? "bg-emerald-600" : "bg-red-600"}`}>
          {toast.ok ? "✓" : "✕"} {toast.msg}
        </div>
      )}
    </div>
  );
}
