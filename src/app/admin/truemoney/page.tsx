"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Wallet, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface TopupRecord {
  _id: string;
  userId?: { _id: string; name?: string; email?: string; image?: string } | null;
  amount: number;
  matchCode?: string;
  status: "pending" | "completed" | "expired";
  transactionId?: string;
  createdAt: string;
  completedAt?: string;
}

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  pending: { text: "รอเงินเข้า", cls: "bg-amber-100 text-amber-700" },
  completed: { text: "เข้าเครดิตแล้ว", cls: "bg-green-100 text-green-700" },
  expired: { text: "ยกเลิก", cls: "bg-slate-100 text-slate-500" },
};

export default function TrueMoneyTopupsPage() {
  const [records, setRecords] = useState<TopupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "completed" | "expired">("pending");
  const [acting, setActing] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; action: "approve" | "expire" } | null>(null);

  const fetchData = () => {
    setLoading(true);
    fetch("/api/admin/truemoney-topups")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setRecords(d); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const doAction = async (id: string, action: "approve" | "expire") => {
    setActing(id);
    setConfirm(null);
    try {
      const res = await fetch(`/api/admin/truemoney-topups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "เกิดข้อผิดพลาด"); return; }
      fetchData();
    } catch {
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setActing(null);
    }
  };

  const filtered = filter === "all" ? records : records.filter((r) => r.status === filter);
  const pendingCount = records.filter((r) => r.status === "pending").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">เติมเงิน TrueMoney</h1>
          <p className="text-sm text-slate-500 mt-1">
            รายการเติมเงินผ่าน TrueMoney Wallet — รายการที่ค้าง &quot;รอเงินเข้า&quot; ให้เทียบกับเงินเข้าจริงในแอปทรูก่อนกดยืนยัน
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 shadow-sm transition-colors shrink-0"
        >
          <RefreshCw size={14} /> รีเฟรช
        </button>
      </div>

      <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-wrap items-center gap-2 bg-slate-50/50">
          {([
            ["pending", `รอเงินเข้า (${pendingCount})`],
            ["completed", "เข้าเครดิตแล้ว"],
            ["expired", "ยกเลิก"],
            ["all", "ทั้งหมด"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                filter === key ? "bg-red-600 text-white border-red-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-white">
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">เวลา</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ผู้เล่น</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">จำนวน (บาท)</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">โค้ดอ้างอิง</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">สถานะ</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100/80">
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-slate-400 font-medium">กำลังโหลดข้อมูล...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-slate-400 font-medium">ไม่มีรายการ</td></tr>
              ) : filtered.map((r) => {
                const st = STATUS_LABEL[r.status] || STATUS_LABEL.pending;
                return (
                  <tr key={r._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 text-slate-600 whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "medium" })}
                      {r.completedAt && (
                        <div className="text-[10px] text-green-600">
                          เข้าเครดิต {new Date(r.completedAt).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "medium" })}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-800">{r.userId?.name || "(ไม่พบผู้ใช้)"}</div>
                      <div className="text-[11px] text-slate-400">{r.userId?.email || "-"}</div>
                    </td>
                    <td className="py-4 px-6 text-right font-black text-slate-800">{r.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="py-4 px-6">
                      <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{r.matchCode || "-"}</span>
                      {r.transactionId && (
                        <div className="text-[10px] text-slate-400 mt-1 font-mono truncate max-w-[160px]" title={r.transactionId}>
                          {r.transactionId.startsWith("manual:") ? "ยืนยันโดยแอดมิน" : `TX: ${r.transactionId}`}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${st.cls}`}>{st.text}</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {r.status !== "pending" ? (
                        <span className="text-xs text-slate-300">—</span>
                      ) : confirm?.id === r._id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => doAction(r._id, confirm.action)}
                            className={`text-xs font-bold text-white px-3 py-1.5 rounded-lg ${confirm.action === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
                          >
                            ยืนยัน{confirm.action === "approve" ? "เข้าเครดิต" : "ยกเลิก"}
                          </button>
                          <button onClick={() => setConfirm(null)} className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200">กลับ</button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          {acting === r._id ? (
                            <Loader2 size={16} className="animate-spin text-slate-400" />
                          ) : (
                            <>
                              <button
                                onClick={() => setConfirm({ id: r._id, action: "approve" })}
                                className="flex items-center gap-1.5 text-xs font-bold bg-green-50 text-green-700 border border-green-100 px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white transition-colors"
                                title="เช็คเงินเข้าในแอปทรูแล้ว กดเพื่อเข้าเครดิตให้ลูกค้า"
                              >
                                <CheckCircle2 size={13} /> เข้าเครดิต
                              </button>
                              <button
                                onClick={() => setConfirm({ id: r._id, action: "expire" })}
                                className="flex items-center gap-1.5 text-xs font-bold bg-slate-50 text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                                title="ลูกค้าไม่ได้โอนจริง — ปิดรายการ"
                              >
                                <XCircle size={13} /> ยกเลิก
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl px-5 py-4 text-xs text-amber-700 flex items-start gap-2">
        <Wallet size={14} className="shrink-0 mt-0.5" />
        <div>
          ระบบมี poller ฝั่ง server คอยจับคู่เงินเข้าอัตโนมัติทุก 5 วินาทีอยู่แล้ว — รายการที่ยังค้าง &quot;รอเงินเข้า&quot; นาน ๆ
          มักเป็นเคสเงินเข้าโดนรายการใหม่ทับก่อนระบบเห็น ให้เปิดแอป TrueMoney เทียบยอด+เวลาโอนก่อนกด &quot;เข้าเครดิต&quot; ทุกครั้ง
        </div>
      </div>
    </div>
  );
}
