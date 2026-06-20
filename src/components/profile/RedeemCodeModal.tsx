"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { X, Ticket, Loader2, CheckCircle2 } from "lucide-react";
import { useBalance } from "@/contexts/BalanceContext";

interface RedeemCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RedeemCodeModal({ isOpen, onClose }: RedeemCodeModalProps) {
  const { refreshBalance } = useBalance();
  const { update } = useSession();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
    setTimeout(() => { setCode(""); setResult(null); }, 300);
  };

  const handleSubmit = async () => {
    if (!code.trim() || submitting) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/user/redeem-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, message: data.error || "เกิดข้อผิดพลาด" });
        return;
      }
      setResult({ ok: true, message: data.message || "แลกโค้ดสำเร็จ!" });
      setCode("");
      refreshBalance();
      update();
    } catch {
      setResult({ ok: false, message: "เกิดข้อผิดพลาด กรุณาลองใหม่" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm" onClick={handleClose}>
      <div className="bg-white w-full max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-base">แลกโค้ด</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
            <Ticket size={18} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-700 text-sm">กรอกโค้ดของคุณ</p>
              <p className="text-xs text-red-600 mt-1">รับรางวัลทันทีหลังกรอกโค้ดที่ถูกต้อง — โค้ดแต่ละอันใช้ได้ครั้งเดียวต่อบัญชี</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-700">โค้ด</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="กรอกโค้ด..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono font-black text-gray-800 uppercase outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/10"
            />
          </div>

          {result && (
            <div className={`rounded-xl p-3 text-sm font-bold flex items-center gap-2 ${result.ok ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"}`}>
              {result.ok && <CheckCircle2 size={16} className="shrink-0" />}
              {result.message}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button onClick={handleClose} className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors text-sm">
            ปิด
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !code.trim()}
            className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 disabled:bg-gray-400 transition-colors text-sm flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
            {submitting ? "กำลังตรวจสอบ..." : "แลกโค้ด"}
          </button>
        </div>
      </div>
    </div>
  );
}
