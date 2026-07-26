"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, RefreshCw, ChevronLeft, ChevronRight,
  FileText, CheckCircle2, XCircle, Clock, PlayCircle,
  Upload, Check, ImageIcon, X, Bell,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type BillStatus = "pending" | "active" | "completed" | "cancelled";

interface InstallmentItem {
  installmentNo: number;
  amount: number;
  dueDate: string;
  status: "pending" | "paid";
  paidAt?: string;
  slipUrl?: string;
  confirmedBy?: string;
}

interface Bill {
  _id: string;
  billId: string;
  productCode: string;
  totalPrice: number;
  downPercent: number;
  downAmount: number;
  remainingAmount: number;
  planType: "daily" | "weekly" | "monthly";
  planCount: number;
  amountPerInstallment: number;
  installments: InstallmentItem[];
  status: BillStatus;
  deviceId: string;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PLAN_NAME: Record<string, string> = {
  daily: "รายวัน", weekly: "รายสัปดาห์", monthly: "รายเดือน",
};

const STATUS_CFG: Record<BillStatus, { label: string; cls: string; icon: React.ElementType }> = {
  pending:   { label: "รอตรวจสอบ",  cls: "bg-amber-50 text-amber-700 border-amber-200",  icon: Clock        },
  active:    { label: "กำลังผ่อน",  cls: "bg-blue-50  text-blue-700  border-blue-200",   icon: PlayCircle   },
  completed: { label: "ชำระครบ",    cls: "bg-green-50 text-green-700 border-green-200",  icon: CheckCircle2 },
  cancelled: { label: "ยกเลิก",     cls: "bg-slate-50 text-slate-500 border-slate-200",  icon: XCircle      },
};

function StatusBadge({ status }: { status: BillStatus }) {
  const { label, cls } = STATUS_CFG[status] ?? STATUS_CFG.pending;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${cls}`}>
      {label}
    </span>
  );
}

// ─── Installment Row (per installment inside expanded bill) ───────────────────

function InstallmentRow({
  inst,
  billId,
  onPaid,
}: {
  inst: InstallmentItem;
  billId: string;
  onPaid: (installmentNo: number, updated: InstallmentItem) => void;
}) {
  const [slipFile,    setSlipFile]    = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [confirming,  setConfirming]  = useState(false);
  const [slipOpen,    setSlipOpen]    = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setSlipFile(f);
    setSlipPreview(URL.createObjectURL(f));
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      let slipUrl: string | undefined;

      // อัปโหลดสลิปก่อน (ถ้ามี)
      if (slipFile) {
        const fd = new FormData();
        fd.append("file", slipFile);
        fd.append("folder", "installment-slips");
        const upRes  = await fetch("/api/upload", { method: "POST", body: fd });
        const upData = await upRes.json();
        if (!upRes.ok) throw new Error(upData.error ?? "อัปโหลดสลิปไม่สำเร็จ");
        slipUrl = upData.url;
      }

      // ยืนยันการชำระงวด
      const res  = await fetch("/api/admin/installment/bills", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          action:        "pay_installment",
          billId,
          installmentNo: inst.installmentNo,
          slipUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "เกิดข้อผิดพลาด");

      // ส่งข้อมูลงวดที่อัปเดตกลับไปให้ parent
      const updatedInst = data.bill.installments.find(
        (i: InstallmentItem) => i.installmentNo === inst.installmentNo,
      );
      if (updatedInst) onPaid(inst.installmentNo, updatedInst);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setConfirming(false);
    }
  };

  const isPaid = inst.status === "paid";

  return (
    <div className={`rounded-xl border overflow-hidden ${isPaid ? "border-green-200 bg-green-50/40" : "border-gray-200 bg-white"}`}>
      {/* Top row: installment info */}
      <div className="flex items-center justify-between px-3.5 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0
            ${isPaid ? "bg-green-500 text-white" : "bg-gray-100 text-gray-500"}`}>
            {isPaid ? <Check size={13} strokeWidth={3} /> : inst.installmentNo}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">งวดที่ {inst.installmentNo}</p>
            <p className="text-[11px] text-gray-400">ครบกำหนด {inst.dueDate}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <p className="font-bold text-gray-900 text-sm">฿{fmt(inst.amount)}</p>
          {isPaid && (
            <span className="px-2 py-0.5 rounded-md bg-green-100 text-green-700 text-[11px] font-semibold border border-green-200">
              จ่ายแล้ว
            </span>
          )}
        </div>
      </div>

      {/* Paid info */}
      {isPaid && (
        <div className="px-3.5 pb-2.5 flex items-center justify-between flex-wrap gap-2">
          <p className="text-[11px] text-gray-400">
            ยืนยันโดย <span className="font-semibold text-gray-600">{inst.confirmedBy ?? "—"}</span>
            {inst.paidAt && <> · {inst.paidAt}</>}
          </p>
          {inst.slipUrl && (
            <button
              onClick={() => setSlipOpen(true)}
              className="flex items-center gap-1.5 text-[11px] text-blue-600 font-semibold hover:underline cursor-pointer"
            >
              <ImageIcon size={12} />
              ดูสลิป
            </button>
          )}
        </div>
      )}

      {/* Pending: upload + confirm */}
      {!isPaid && (
        <div className="px-3.5 pb-3.5 border-t border-gray-100 pt-2.5 space-y-2.5">
          {/* Slip upload */}
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 hover:border-red-400 hover:bg-red-50 text-xs text-gray-500 hover:text-red-600 transition-all cursor-pointer"
            >
              <Upload size={12} />
              {slipFile ? slipFile.name : "อัปโหลดสลิป (ถ้ามี)"}
            </button>
            {slipPreview && (
              <div className="relative">
                <img
                  src={slipPreview}
                  className="w-10 h-10 rounded-lg object-cover border border-gray-200 cursor-pointer"
                  onClick={() => setSlipOpen(true)}
                  alt="slip preview"
                />
                <button
                  onClick={() => { setSlipFile(null); setSlipPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-gray-700 text-white rounded-full flex items-center justify-center cursor-pointer"
                >
                  <X size={9} />
                </button>
              </div>
            )}
          </div>

          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            {confirming
              ? <RefreshCw size={12} className="animate-spin" />
              : <CheckCircle2 size={12} />}
            {confirming ? "กำลังยืนยัน..." : "ยืนยันการชำระงวดนี้"}
          </button>
        </div>
      )}

      {/* Slip lightbox */}
      {slipOpen && (inst.slipUrl || slipPreview) && (
        <div
          className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSlipOpen(false)}
        >
          <div className="relative max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={inst.slipUrl ?? slipPreview!}
              alt="slip"
              className="w-full rounded-2xl shadow-2xl"
            />
            <button
              onClick={() => setSlipOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminInstallmentBillsPage() {
  const [bills,    setBills]    = useState<Bill[]>([]);
  const [total,    setTotal]    = useState(0);
  const [pages,    setPages]    = useState(1);
  const [page,     setPage]     = useState(1);
  const [q,        setQ]        = useState("");
  const [status,   setStatus]   = useState("");
  const [loading,  setLoading]  = useState(false);
  const [updating,  setUpdating]  = useState<string | null>(null);
  const [resending, setResending] = useState<string | null>(null);
  const [expanded,  setExpanded]  = useState<string | null>(null);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (q.trim()) params.set("q", q.trim());
      if (status)   params.set("status", status);
      const res  = await fetch(`/api/admin/installment/bills?${params}`);
      const data = await res.json();
      setBills(data.bills ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
      setPage(p);
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useEffect(() => { load(1); }, [load]);

  const updateBillStatus = async (billId: string, newStatus: BillStatus) => {
    setUpdating(billId);
    try {
      const res = await fetch("/api/admin/installment/bills", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "update_status", billId, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setBills((prev) => prev.map((b) => b.billId === billId ? { ...b, status: newStatus } : b));
      } else {
        alert(data.error ?? "เกิดข้อผิดพลาด");
      }
    } finally {
      setUpdating(null);
    }
  };

  const resendNotification = async (billId: string) => {
    setResending(billId);
    try {
      const res = await fetch("/api/admin/installment/bills", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "resend_notification", billId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "เกิดข้อผิดพลาด");
      alert(`ส่งแจ้งเตือน Discord สำเร็จ`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setResending(null);
    }
  };

  // รับข้อมูลงวดที่ชำระแล้วจาก InstallmentRow แล้วอัปเดต local state
  const handleInstallmentPaid = (billId: string, installmentNo: number, updated: InstallmentItem) => {
    setBills((prev) => prev.map((b) => {
      if (b.billId !== billId) return b;
      const newInsts = b.installments.map((i) =>
        i.installmentNo === installmentNo ? updated : i,
      );
      const allPaid  = newInsts.every((i) => i.status === "paid");
      const anyPaid  = newInsts.some((i) => i.status === "paid");
      return {
        ...b,
        installments: newInsts,
        status: allPaid ? "completed" : anyPaid ? "active" : b.status,
      };
    }));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">บิลผ่อนชำระทั้งหมด</h1>
          <p className="text-xs text-gray-400 mt-0.5">รวม {total.toLocaleString("th-TH")} รายการ</p>
        </div>
        <button
          onClick={() => load(page)}
          disabled={loading}
          className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500 cursor-pointer"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load(1)}
            placeholder="ค้นหาด้วยเลขบิล หรือรหัสสินค้า"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all cursor-pointer"
        >
          <option value="">ทุกสถานะ</option>
          <option value="pending">รอตรวจสอบ</option>
          <option value="active">กำลังผ่อน</option>
          <option value="completed">ชำระครบ</option>
          <option value="cancelled">ยกเลิก</option>
        </select>
        <button
          onClick={() => load(1)}
          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors cursor-pointer"
        >
          ค้นหา
        </button>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-400">
            <RefreshCw size={18} className="animate-spin mr-2" />
            กำลังโหลด...
          </div>
        ) : bills.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <FileText size={32} className="mb-2 text-gray-300" />
            <p className="text-sm">ไม่พบบิล</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {bills.map((bill) => {
              const isOpen = expanded === bill.billId;
              const paid   = bill.installments.filter((i) => i.status === "paid").length;
              return (
                <div key={bill._id}>
                  {/* Summary row */}
                  <div
                    className="px-5 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setExpanded(isOpen ? null : bill.billId)}
                  >
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                      <div className="min-w-[160px]">
                        <p className="font-mono font-bold text-sm text-red-600">{bill.billId}</p>
                        <p className="text-xs text-gray-500 mt-0.5 font-mono">{bill.productCode}</p>
                      </div>

                      <div className="flex gap-4 text-xs text-gray-600 flex-wrap">
                        <div>
                          <span className="text-gray-400">ราคา </span>
                          <span className="font-semibold text-gray-900">฿{fmt(bill.totalPrice)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">เปิดบิล </span>
                          <span className="font-semibold text-red-600">฿{fmt(bill.downAmount)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">ต่องวด </span>
                          <span className="font-semibold text-gray-900">฿{fmt(bill.amountPerInstallment)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">แผน </span>
                          <span className="font-semibold">{PLAN_NAME[bill.planType]} × {bill.planCount}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">คงเหลือ </span>
                          <span className={`font-semibold ${bill.remainingAmount > 0 ? "text-orange-600" : "text-green-600"}`}>
                            ฿{fmt(Math.max(0, bill.remainingAmount - bill.installments.filter(i => i.status === "paid").length * bill.amountPerInstallment))}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-500 rounded-full transition-all"
                            style={{ width: `${(paid / bill.installments.length) * 100}%` }}
                          />
                        </div>
                        <span>{paid}/{bill.installments.length} งวด</span>
                      </div>

                      <div className="ml-auto flex items-center gap-3">
                        <StatusBadge status={bill.status} />
                        <p className="text-[11px] text-gray-400 hidden sm:block">
                          {new Date(bill.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div className="px-5 pb-5 bg-gray-50/60 border-t border-gray-100 pt-4 space-y-4">
                      {/* Installment rows */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">งวดผ่อนชำระ</p>
                        <div className="space-y-2">
                          {bill.installments.map((inst) => (
                            <InstallmentRow
                              key={inst.installmentNo}
                              inst={inst}
                              billId={bill.billId}
                              onPaid={(no, updated) => handleInstallmentPaid(bill.billId, no, updated)}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Bill status override */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">เปลี่ยนสถานะบิล</p>
                        <div className="flex flex-wrap gap-2">
                          {(["pending", "active", "completed", "cancelled"] as BillStatus[]).map((s) => {
                            const { label, cls, icon: Icon } = STATUS_CFG[s];
                            const isActive = bill.status === s;
                            return (
                              <button
                                key={s}
                                onClick={() => updateBillStatus(bill.billId, s)}
                                disabled={isActive || updating === bill.billId}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer disabled:opacity-60
                                  ${isActive ? `${cls} ring-1` : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-white bg-white"}`}
                              >
                                <Icon size={13} />
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* ส่งแจ้งเตือน Discord อีกครั้ง */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">แจ้งเตือน</p>
                        <button
                          onClick={() => resendNotification(bill.billId)}
                          disabled={resending === bill.billId}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors cursor-pointer disabled:opacity-60"
                        >
                          {resending === bill.billId
                            ? <RefreshCw size={13} className="animate-spin" />
                            : <Bell size={13} />}
                          {resending === bill.billId ? "กำลังส่ง..." : "ส่งแจ้งเตือน Discord อีกครั้ง"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => load(page - 1)}
            disabled={page <= 1 || loading}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-600 px-2">หน้า {page} / {pages}</span>
          <button
            onClick={() => load(page + 1)}
            disabled={page >= pages || loading}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
