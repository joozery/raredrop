"use client";

import { useEffect, useState } from "react";
import { X, Copy, CheckCircle2, Users } from "lucide-react";

interface InvitedUser {
  _id: string;
  name: string;
  avatar?: string;
  createdAt: string;
  referralFlagged?: boolean;
}

interface InviteFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InviteFriendModal({ isOpen, onClose }: InviteFriendModalProps) {
  const [loading, setLoading] = useState(true);
  const [inviteUrl, setInviteUrl] = useState("");
  const [totalInvited, setTotalInvited] = useState(0);
  const [invited, setInvited] = useState<InvitedUser[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch("/api/user/referral")
      .then((r) => r.json())
      .then((d) => {
        setInviteUrl(d.code ? `${window.location.origin}/?ref=${d.code}` : "");
        setTotalInvited(d.totalInvited || 0);
        setInvited(Array.isArray(d.invited) ? d.invited : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-base">เชิญเพื่อน รับ GemCoin</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3">
            <Users size={18} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-700 text-sm">ส่งลิงก์นี้ให้เพื่อน</p>
              <p className="text-xs text-emerald-600 mt-1">เพื่อนสมัครสมาชิกสำเร็จผ่านลิงก์นี้ คุณจะได้รับ GemCoin ทันที</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-700">ลิงก์เชิญของคุณ</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={loading ? "กำลังโหลด..." : inviteUrl}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 outline-none"
              />
              <button
                onClick={handleCopy}
                disabled={loading || !inviteUrl}
                className="shrink-0 flex items-center gap-1.5 bg-red-600 text-white font-bold px-4 rounded-xl hover:bg-red-700 disabled:bg-gray-300 transition-colors text-sm"
              >
                {copied ? <CheckCircle2 size={15} /> : <Copy size={15} />}
                {copied ? "คัดลอกแล้ว" : "คัดลอก"}
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
            <span className="text-sm text-gray-600">เชิญแล้ว </span>
            <span className="font-black text-gray-900">{totalInvited}</span>
            <span className="text-sm text-gray-600"> คน</span>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-700">รายชื่อที่เชิญมาแล้ว</label>
            <div className="border border-gray-100 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
              {loading ? (
                <p className="text-xs text-gray-400 text-center py-5">กำลังโหลด...</p>
              ) : invited.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-5">ยังไม่มีเพื่อนสมัครผ่านลิงก์นี้</p>
              ) : (
                invited.map((u) => (
                  <div key={u._id} className="flex items-center gap-3 px-3 py-2.5 border-b border-gray-50 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0">
                      <img
                        src={u.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${u.name}`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{u.name}</p>
                      {u.referralFlagged && (
                        <p className="text-[10px] font-bold text-amber-600">ไม่ได้รับรางวัล (ตรวจพบ IP ซ้ำ)</p>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-400 shrink-0">
                      {new Date(u.createdAt).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "2-digit" })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
