"use client";

import { useState, useEffect } from "react";
import { Receipt, X, ChevronLeft, ChevronRight, ZoomIn, RefreshCw, User } from "lucide-react";

interface SlipTransaction {
  _id: string;
  userId: { _id: string; name: string; email?: string; avatar?: string } | null;
  amount: number;
  balanceAfter: number;
  slipUrl: string;
  description?: string;
  createdAt: string;
}

export default function TopupSlipsPage() {
  const [items, setItems] = useState<SlipTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<SlipTransaction | null>(null);

  const fetchData = (p = page) => {
    setLoading(true);
    fetch(`/api/admin/topup-slips?page=${p}`)
      .then((r) => r.json())
      .then((d) => {
        setItems(d.transactions || []);
        setTotal(d.total || 0);
        setPages(d.pages || 1);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(page); }, [page]);

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800">สลิปเติมเงิน</h1>
          <p className="text-sm text-slate-500 mt-0.5">บันทึกสลิปที่ผู้เล่นแนบมาตอนเติมเงินทั้งหมด {total > 0 && `(${total} รายการ)`}</p>
        </div>
        <button
          onClick={() => fetchData(page)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 shadow-sm transition-colors"
        >
          <RefreshCw size={14} />
          รีเฟรช
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">กำลังโหลด...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <Receipt size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-bold">ยังไม่มีสลิปที่บันทึกไว้</p>
            <p className="text-xs mt-1">สลิปจะบันทึกอัตโนมัติเมื่อผู้เล่นแนบสลิปผ่านหน้าเติมเงิน</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="py-3 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">สลิป</th>
                    <th className="py-3 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ผู้เล่น</th>
                    <th className="py-3 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">ยอด</th>
                    <th className="py-3 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">วันที่</th>
                    <th className="py-3 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">ดูสลิป</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {items.map((tx) => {
                    const date = new Date(tx.createdAt);
                    return (
                      <tr key={tx._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-5">
                          <button
                            onClick={() => setPreview(tx)}
                            className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 hover:border-red-400 transition-colors group shrink-0"
                          >
                            <img
                              src={tx.slipUrl}
                              alt="slip"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <ZoomIn size={14} className="text-white" />
                            </div>
                          </button>
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2.5">
                            {tx.userId?.avatar ? (
                              <img src={tx.userId.avatar} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                <User size={13} className="text-slate-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-800 text-xs">{tx.userId?.name || "ไม่ระบุ"}</p>
                              {tx.userId?.email && <p className="text-[10px] text-slate-400">{tx.userId.email}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <span className="font-black text-green-600">+฿{tx.amount.toLocaleString()}</span>
                          <p className="text-[10px] text-slate-400 mt-0.5">คงเหลือ ฿{tx.balanceAfter.toLocaleString()}</p>
                        </td>
                        <td className="py-3.5 px-5">
                          <p className="font-bold text-xs text-slate-700">
                            {date.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.
                          </p>
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <button
                            onClick={() => setPreview(tx)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 text-[11px] font-bold rounded-lg transition-colors"
                          >
                            <ZoomIn size={12} />
                            เปิดดู
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between gap-4">
                <p className="text-xs text-slate-500 font-medium">
                  หน้า {page} / {pages} — {total} รายการ
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                    const p = pages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= pages - 3 ? pages - 6 + i : page - 3 + i;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${page === p ? "bg-red-600 text-white shadow-sm" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                    disabled={page === pages}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Slip Preview Modal */}
      {preview && (
        <div
          className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="font-black text-slate-800 text-sm">{preview.userId?.name || "ไม่ระบุ"}</p>
                <p className="text-xs text-slate-400">
                  {new Date(preview.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}
                  {" · "}
                  {new Date(preview.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.
                </p>
              </div>
              <button
                onClick={() => setPreview(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="bg-slate-50 flex items-center justify-center p-4 min-h-[300px]">
              <img
                src={preview.slipUrl}
                alt="สลิปเติมเงิน"
                className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-sm"
              />
            </div>

            <div className="px-5 py-4 flex items-center justify-between border-t border-slate-100">
              <div>
                <p className="text-xs text-slate-500 font-medium">ยอดเติม</p>
                <p className="text-xl font-black text-green-600">+฿{preview.amount.toLocaleString()}</p>
              </div>
              <a
                href={preview.slipUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
              >
                <ZoomIn size={13} />
                เปิดรูปเต็ม
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
