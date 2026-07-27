"use client";

import { useState, useRef, useEffect, createContext, useContext } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useBalance } from "@/contexts/BalanceContext";
import {
  Calculator, BookOpen, Search, Copy, Check, Printer,
  MessageCircle, RefreshCw, X, FileText,
  Info, ChevronRight, Sparkles, Gamepad2,
  ShieldCheck, Download,
} from "lucide-react";
import { toBlob } from "html-to-image";

// ─── Types ───────────────────────────────────────────────────────────────────

type PlanType = "daily" | "weekly" | "monthly";

interface PriceRangeAPI {
  id: string;
  priceMin: number;
  priceMax: number;
  markupDaily: number;
  markupWeekly: number;
  markupMonthly: number;
  enableMonthly: boolean;
}
type BillStatus = "pending" | "active" | "completed" | "cancelled";

interface InstallmentItem {
  installmentNo: number;
  amount: number;
  dueDate: string;
  status: "pending" | "paid";
  paidAt?: string;
}

interface Bill {
  id: string;
  productCode: string;
  totalPrice: number;
  downPercent: number;
  downAmount: number;
  remainingAmount: number;
  planType: PlanType;
  planCount: number;
  amountPerInstallment: number;
  installments: InstallmentItem[];
  status: BillStatus;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DOWN_OPTIONS = [
  { pct: 10, label: "10%" },
  { pct: 40, label: "40%" },
  { pct: 50, label: "50%" },
  { pct: 80, label: "80%" },
];

const PLAN_TYPES: { id: PlanType; label: string; desc: string }[] = [
  { id: "daily",   label: "รายวัน",    desc: "ชำระทุกวัน"       },
  { id: "weekly",  label: "รายสัปดาห์", desc: "ชำระทุกสัปดาห์"  },
  { id: "monthly", label: "รายเดือน",  desc: "ชำระทุกวันที่ 1"  },
];

const PLAN_OPTIONS: Record<PlanType, { count: number; label: string }[]> = {
  daily:   [7, 14, 21, 30].map((n) => ({ count: n, label: `${n} วัน` })),
  weekly:  [2, 3, 4, 6, 8, 12].map((n) => ({ count: n, label: `${n} สัปดาห์` })),
  monthly: [2, 3, 4, 6, 12].map((n) => ({ count: n, label: `${n} เดือน` })),
};

const PLAN_META: Record<PlanType, { name: string; unit: string; markup: number }> = {
  daily:   { name: "รายวัน",    unit: "วัน",      markup: 0    },
  weekly:  { name: "รายสัปดาห์", unit: "สัปดาห์", markup: 0.05 },
  monthly: { name: "รายเดือน",  unit: "เดือน",    markup: 0.10 },
};

const TERMS = [
  "ลูกค้าต้องชำระยอดเปิดบิลตามจำนวนที่เลือกก่อนเริ่มรายการ",
  "ต้องชำระแต่ละงวดตามกำหนดของแผนรายวัน รายสัปดาห์ หรือรายเดือน",
  "แผนรายเดือนกำหนดชำระทุกวันที่ 1 ของเดือน",
  "รายการจะสมบูรณ์เมื่อแอดมินตรวจสอบและยืนยันผ่านแชทแล้วเท่านั้น",
  "กรุณาตรวจสอบราคา รหัสสินค้า ยอดเปิดบิล และยอดต่องวดก่อนยืนยัน",
  "เงื่อนไขเพิ่มเติมให้เป็นไปตามที่ร้านแจ้งในแชทและหน้าประกาศของร้าน",
];

const LINE_ADMIN  = "https://line.me/ti/p/~@352eusln";
const STORAGE_KEY = "luxusx_bills";

const DEFAULT_PRICE_RANGES: PriceRangeAPI[] = [
  { id: "r1", priceMin: 1000, priceMax: 2999, markupDaily: 10, markupWeekly: 20, markupMonthly: 25, enableMonthly: false },
  { id: "r2", priceMin: 3000, priceMax: 3999, markupDaily: 35, markupWeekly: 25, markupMonthly: 20, enableMonthly: false },
  { id: "r3", priceMin: 4000, priceMax: 4999, markupDaily: 35, markupWeekly: 25, markupMonthly: 20, enableMonthly: true },
  { id: "r4", priceMin: 5000, priceMax: 9999, markupDaily: 30, markupWeekly: 20, markupMonthly: 15, enableMonthly: true },
];

// ─── Settings Context ─────────────────────────────────────────────────────────

interface HowToStep { title: string; desc: string; }

interface LatePenaltyTier {
  fromDay: number;
  toDay: number;   // 0 = ขึ้นไป
  ratePercent: number;
}

type PlanCountMarkups = { daily: Record<string,number>; weekly: Record<string,number>; monthly: Record<string,number> };

interface PageSettings {
  lineUrl:          string;
  coverImage:       string;
  terms:            string[];
  downOptions:      { pct: number; label: string }[];
  planMeta:         Record<PlanType, { name: string; unit: string; markup: number }>;
  planOptions:      Record<PlanType, { count: number; label: string }[]>;
  priceRanges:      PriceRangeAPI[];
  howtoSteps:       HowToStep[];
  latePenaltyTiers: Record<PlanType, LatePenaltyTier[]>;
  planCountMarkups: PlanCountMarkups;
}

const DEFAULT_HOWTO_STEPS: HowToStep[] = [
  { title: "กรอกราคา & เลือกแผนผ่อน", desc: "ระบุราคาไอดี เลือกเงินเปิดบิล (40%, 50%, 80%) และเลือกระยะเวลาผ่อน (รายวัน/สัปดาห์/เดือน) ระบบจะคำนวณยอดทันที" },
  { title: "กดยืนยัน & แคปรูปบิลผ่อน", desc: "กดยอมรับเงื่อนไขและสร้างบิล จากนั้นถ่ายรูปหรือแคปหน้าจอบิลผ่อนอ้างอิงที่มี QR Code และเลขบิล" },
  { title: "โอนเปิดบิล & ส่งแชทแอดมิน", desc: "โอนเงินเปิดบิลตามยอดที่คำนวณ พร้อมส่งสลิปการโอนและภาพบิลผ่อนทางช่องทางแชท LINE แอดมิน" },
  { title: "รับไอดีเล่นทันที!", desc: "แอดมินตรวจสอบการโอนและอนุมัติบิล พร้อมส่งมอบข้อมูลไอดีเกมให้คุณนำไปเล่นได้ทันที" },
];

const DEFAULT_LATE_PENALTY_TIERS: Record<PlanType, LatePenaltyTier[]> = {
  daily:   [{ fromDay: 1, toDay: 3, ratePercent: 1 }, { fromDay: 4, toDay: 7, ratePercent: 2 }, { fromDay: 8, toDay: 14, ratePercent: 3 }, { fromDay: 15, toDay: 0, ratePercent: 5 }],
  weekly:  [{ fromDay: 1, toDay: 3, ratePercent: 1 }, { fromDay: 4, toDay: 7, ratePercent: 2 }, { fromDay: 8, toDay: 0, ratePercent: 3 }],
  monthly: [{ fromDay: 1, toDay: 7, ratePercent: 1 }, { fromDay: 8, toDay: 14, ratePercent: 2 }, { fromDay: 15, toDay: 0, ratePercent: 3 }],
};

const DEFAULT_PLAN_COUNT_MARKUPS: PlanCountMarkups = {
  daily:   { "7": 0, "14": 2, "21": 4, "30": 6 },
  weekly:  { "2": 0, "3": 2, "4": 4, "6": 8, "8": 12, "12": 20 },
  monthly: { "2": 0, "3": 5, "6": 15, "12": 35 },
};

const DEFAULT_PAGE_SETTINGS: PageSettings = {
  lineUrl:          LINE_ADMIN,
  coverImage:       "",
  terms:            TERMS,
  downOptions:      DOWN_OPTIONS,
  planMeta:         PLAN_META,
  planOptions:      PLAN_OPTIONS,
  priceRanges:      DEFAULT_PRICE_RANGES,
  howtoSteps:       DEFAULT_HOWTO_STEPS,
  latePenaltyTiers: DEFAULT_LATE_PENALTY_TIERS,
  planCountMarkups: DEFAULT_PLAN_COUNT_MARKUPS,
};

const SettingsCtx = createContext<PageSettings>(DEFAULT_PAGE_SETTINGS);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolveMarkup(
  ranges: PriceRangeAPI[],
  price: number,
  planType: PlanType,
  fallback: number,
): number {
  if (price <= 0) return fallback;
  const range = ranges.find((r) => price >= r.priceMin && price <= r.priceMax);
  if (!range) return fallback;
  const pct: Record<PlanType, number> = {
    daily:   range.markupDaily,
    weekly:  range.markupWeekly,
    monthly: range.markupMonthly,
  };
  return pct[planType] / 100;
}

function resolveMarkupWithCount(
  markups: PlanCountMarkups,
  ranges: PriceRangeAPI[],
  price: number,
  planType: PlanType,
  planCount: number | null,
  fallback: number,
): number {
  const base = resolveMarkup(ranges, price, planType, fallback);
  if (planCount != null) {
    const extra = markups[planType]?.[String(planCount)] ?? 0;
    return base + extra / 100;
  }
  return base;
}

function isMonthlyEnabled(ranges: PriceRangeAPI[], price: number): boolean {
  if (price <= 0) return true;
  const range = ranges.find((r) => price >= r.priceMin && price <= r.priceMax);
  return range ? range.enableMonthly : true;
}

function generateBillId() {
  const d = new Date();
  const ds = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
  return `LX-${ds}-${Math.floor(1000 + Math.random() * 9000)}`;
}

const fmt = (n: number) =>
  n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function fmtDate(d: Date) {
  return d.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
}

function buildBill(
  productCode: string, totalPrice: number,
  downPercent: number, planType: PlanType, planCount: number,
  meta: Record<PlanType, { name: string; unit: string; markup: number }> = PLAN_META,
  markupOverride?: number,
): Bill {
  const markup = markupOverride !== undefined ? markupOverride : meta[planType].markup;
  const downAmount         = Math.round(totalPrice * downPercent / 100);
  const remaining          = totalPrice - downAmount;
  const remainingWithFee   = Math.ceil(remaining * (1 + markup));
  const perInstallment     = Math.ceil(remainingWithFee / planCount);
  const now                = new Date();

  const installments: InstallmentItem[] = Array.from({ length: planCount }, (_, i) => {
    const n   = i + 1;
    const due = new Date(now);
    if (planType === "daily")        due.setDate(due.getDate() + n);
    else if (planType === "weekly")  due.setDate(due.getDate() + n * 7);
    else { due.setMonth(due.getMonth() + n); due.setDate(1); }
    return {
      installmentNo: n,
      amount: n === planCount ? remainingWithFee - perInstallment * (planCount - 1) : perInstallment,
      dueDate: fmtDate(due),
      status: "pending",
    };
  });

  return {
    id: generateBillId(),
    productCode: productCode.trim().toUpperCase(),
    totalPrice, downPercent, downAmount,
    remainingAmount: remainingWithFee,
    planType, planCount,
    amountPerInstallment: perInstallment,
    installments,
    status: "pending",
    createdAt: new Date().toLocaleString("th-TH"),
  };
}

function getDeviceId(): string {
  const KEY = "luxusx_device_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = `d-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(KEY, id);
  }
  return id;
}

function loadBills(): Bill[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}

function saveBill(b: Bill) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([b, ...loadBills()]));
  // บันทึกลง server ด้วย (best-effort)
  try {
    fetch("/api/installment/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bill: b, deviceId: getDeviceId() }),
    }).catch(() => {});
  } catch { /* ไม่บล็อก UI ถ้า server error */ }
}

// ─── Small components ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BillStatus }) {
  const cfg: Record<BillStatus, { label: string; cls: string }> = {
    pending:   { label: "รอตรวจสอบ",      cls: "bg-amber-50  text-amber-700  border-amber-200"  },
    active:    { label: "กำลังผ่อนชำระ",   cls: "bg-blue-50   text-blue-700   border-blue-200"   },
    completed: { label: "ชำระครบแล้ว",     cls: "bg-green-50  text-green-700  border-green-200"  },
    cancelled: { label: "ยกเลิก",          cls: "bg-slate-50  text-slate-500  border-slate-200"  },
  };
  const { label, cls } = cfg[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${cls}`}>
      {label}
    </span>
  );
}

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 ${className}`}>
      {children}
    </div>
  );
}

function StepBadge({ n }: { n: number }) {
  return (
    <span className="w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
      {n}
    </span>
  );
}

// ─── Terms Modal ─────────────────────────────────────────────────────────────

function TermsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { terms, latePenaltyTiers } = useContext(SettingsCtx);
  if (!open) return null;

  const planLabels: Record<PlanType, string> = {
    daily: "รายวัน", weekly: "รายสัปดาห์", monthly: "รายเดือน",
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-red-600" />
            <p className="font-bold text-slate-900">เงื่อนไขการผ่อนชำระ</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500">
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 space-y-3">
          {terms.map((term, i) => (
            <div key={i} className="flex gap-3">
              <span className="shrink-0 w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[10px] font-bold mt-0.5">{i + 1}</span>
              <p className="text-sm text-slate-600 leading-relaxed">{term}</p>
            </div>
          ))}


        </div>
        <div className="px-5 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors"
          >
            รับทราบแล้ว
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Live Preview Panel ───────────────────────────────────────────────────────

function PreviewPanel({
  productCode, totalPrice, downPct, planType, planCount, perInstallment, downAmount, markup,
}: {
  productCode: string; totalPrice: number; downPct: number | null;
  planType: PlanType; planCount: number | null;
  perInstallment: number; downAmount: number; markup: number;
}) {
  const isReady = totalPrice > 0 && downPct != null && planCount != null;

  return (
    <div className="bg-[#0f172a] rounded-2xl overflow-hidden">
      {/* top accent */}
      <div className="h-0.5 bg-gradient-to-r from-red-600 via-red-400 to-red-600" />

      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center">
            <Calculator size={14} className="text-red-400" />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">ตัวอย่างบิล</p>
        </div>

        {isReady ? (
          <div className="space-y-3">
            {/* Main amount */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-slate-400 text-[11px] mb-1">ยอดชำระต่องวด</p>
              <p className="text-3xl font-black text-white font-num tracking-tight">
                {fmt(perInstallment)}
                <span className="text-lg font-semibold text-slate-400 ml-1">฿</span>
              </p>
              <p className="text-slate-500 text-xs mt-1">{planCount} งวด · {PLAN_META[planType as PlanType]?.name ?? planType}</p>
            </div>

            {/* Details */}
            <div className="space-y-2 text-xs">
              {[
                ["รหัสสินค้า",          productCode.toUpperCase() || "—"],
                ["ราคาไอดี",           `${fmt(totalPrice)} บาท`],
                [`เงินเปิดบิล (${downPct}%)`, `${fmt(downAmount)} บาท`],
                markup > 0 ? [`ค่าบริการ (${markup * 100}%)`, `${fmt(Math.ceil((totalPrice - downAmount) * markup))} บาท`] : null,
              ].filter((x): x is string[] => x !== null).map(([l, v], i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-slate-500">{l}</span>
                  <span className={`font-semibold ${i === 0 ? "font-mono text-slate-300" : i === 2 ? "text-red-400" : "text-slate-300"}`}>{v}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 pt-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">ยอดรวมผ่อนทั้งหมด</span>
                <span className="font-bold text-white">{fmt(downAmount + perInstallment * (planCount! - 1) + (Math.ceil((totalPrice - downAmount) * (1 + markup)) - perInstallment * (planCount! - 1)))} บาท</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
              <Calculator size={20} className="text-slate-600" />
            </div>
            <p className="text-slate-500 text-sm">กรอกข้อมูลเพื่อดู</p>
            <p className="text-slate-600 text-xs mt-0.5">ตัวอย่างการคำนวณ</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Installment Detail Modal (Popup) ─────────────────────────────────────────

function InstallmentDetailModal({
  open,
  onClose,
  productCode,
  totalPrice,
  downPct,
  planType,
  planCount,
  initialImage,
  fromShop,
  listingId,
  onConfirmViewBill,
  onBalanceChanged,
}: {
  open: boolean;
  onClose: () => void;
  productCode: string;
  totalPrice: number;
  downPct: number;
  planType: PlanType;
  planCount: number;
  initialImage?: string;
  fromShop?: boolean;
  listingId?: string;
  onConfirmViewBill: (bill: Bill) => void;
  onBalanceChanged?: () => void;
}) {
  const { planMeta, planOptions, coverImage, priceRanges, planCountMarkups } = useContext(SettingsCtx);
  const { data: session } = useSession();
  const displayImage = initialImage || coverImage;
  const [selectedCount, setSelectedCount] = useState<number>(planCount);
  const [isSaving,          setIsSaving]          = useState(false);
  const [isConfirming,      setIsConfirming]      = useState(false);
  const [confirmError,      setConfirmError]      = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [paymentSuccess,    setPaymentSuccess]    = useState(false);
  const [paidBill,          setPaidBill]          = useState<Bill | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setSelectedCount(planCount);
      setShowConfirmDialog(false);
      setPaymentSuccess(false);
      setPaidBill(null);
      setConfirmError("");
    }
  }, [open, planCount]);

  if (!open) return null;

  const markup = resolveMarkupWithCount(planCountMarkups ?? DEFAULT_PLAN_COUNT_MARKUPS, priceRanges, totalPrice, planType, selectedCount, planMeta[planType].markup);
  const unitName = planMeta[planType].unit;
  const downAmount = Math.round((totalPrice * downPct) / 100);
  const remaining = totalPrice - downAmount;
  const remainingWithFee = Math.ceil(remaining * (1 + markup));
  const perInstallment = Math.ceil(remainingWithFee / selectedCount);

  const availableCounts = planOptions[planType].map((o) => o.count);

  const handleSaveImage = async () => {
    if (!cardRef.current) return;
    setIsSaving(true);

    const source = cardRef.current;

    // Walk ขึ้น ancestor chain — ลบ overflow/height ทุกชั้นชั่วคราว
    type Saved = { el: HTMLElement; overflow: string; overflowY: string; maxHeight: string; height: string; flex: string; minHeight: string };
    const saved: Saved[] = [];
    let cur: HTMLElement | null = source;
    while (cur && cur !== document.body) {
      saved.push({
        el: cur,
        overflow:  cur.style.overflow,
        overflowY: cur.style.overflowY,
        maxHeight: cur.style.maxHeight,
        height:    cur.style.height,
        flex:      cur.style.flex,
        minHeight: cur.style.minHeight,
      });
      cur.style.overflow  = "visible";
      cur.style.overflowY = "visible";
      cur.style.maxHeight = "none";
      cur.style.height    = "auto";
      cur.style.flex      = "none";
      cur.style.minHeight = "0";
      cur = cur.parentElement;
    }
    // กำหนด height ของ source ให้ = scrollHeight ทั้งหมด
    source.style.height = `${source.scrollHeight}px`;
    source.scrollTop = 0;

    // รอ 2 frame ให้ browser layout เสร็จ
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    try {
      const filename = `บิลผ่อนชำระ-${productCode || "LUXUSX"}.png`;

      const blob = await toBlob(source, {
        pixelRatio: 2,
        skipAutoScale: true,
        cacheBust: true,
        fetchRequestInit: { cache: "no-cache" },
      }).catch(async () => {
        // fallback: ซ่อนรูป CORS แล้วลองใหม่
        source.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
          img.style.visibility = "hidden";
        });
        const b = await toBlob(source, { pixelRatio: 2, skipAutoScale: true });
        source.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
          img.style.visibility = "";
        });
        return b;
      });

      if (!blob) throw new Error("ไม่สามารถสร้างภาพได้");

      const file = new File([blob], filename, { type: "image/png" });

      // มือถือ: Web Share API (iOS Safari / Android Chrome)
      if (
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({ files: [file], title: "บิลผ่อนชำระ LUXUSX" });
          return;
        } catch (e: any) {
          if (e?.name === "AbortError") return;
        }
      }

      // Desktop / fallback: download
      const url = URL.createObjectURL(blob);
      const a   = document.createElement("a");
      a.href     = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err: any) {
      console.error("Failed to save image:", err);
      alert(`บันทึกภาพไม่สำเร็จ: ${err?.message ?? "กรุณาลองใหม่"}`);
    } finally {
      // คืนค่า style ทุกชั้น
      for (const s of saved) {
        s.el.style.overflow  = s.overflow;
        s.el.style.overflowY = s.overflowY;
        s.el.style.maxHeight = s.maxHeight;
        s.el.style.height    = s.height;
        s.el.style.flex      = s.flex;
        s.el.style.minHeight = s.minHeight;
      }
      setIsSaving(false);
    }
  };

  const handleConfirm = async () => {
    setConfirmError("");
    const bill = buildBill(
      productCode,
      totalPrice,
      downPct,
      planType,
      selectedCount,
      planMeta,
      markup,
    );

    if (fromShop) {
      if (!(session?.user as any)?.id) {
        setConfirmError("กรุณาเข้าสู่ระบบก่อนชำระเงิน");
        return;
      }
      setIsConfirming(true);
      try {
        const res = await fetch("/api/installment/bills", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bill, deviceId: getDeviceId(), deductCoins: true, listingId }),
        });
        const data = await res.json();
        if (!res.ok) {
          setConfirmError(data.error || "เกิดข้อผิดพลาด กรุณาลองใหม่");
          return;
        }
        // บันทึก localStorage ด้วยเพื่อค้นหาในแท็บค้นหา
        localStorage.setItem(STORAGE_KEY, JSON.stringify([bill, ...loadBills()]));
        onBalanceChanged?.();

        // เปิด chat หาแอดมิน
        try {
          const chatRes = await fetch("/api/user/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subject: `เปิดบิลผ่อนชำระ: ${productCode}`,
              text: `สวัสดีครับ/ค่ะ ชำระเงินเปิดบิลผ่อนชำระสำเร็จแล้ว\nรหัสสินค้า: ${productCode}\nเลขบิล: ${bill.id}\nยอดเปิดบิล: ฿${fmt(downAmount)}\nแผน: ${planType} × ${selectedCount} งวด\nรบกวนแอดมินตรวจสอบและดำเนินการต่อด้วยนะครับ/ค่ะ`,
            }),
          });
          const chatData = await chatRes.json();
          if (chatRes.ok && chatData.conversationId) {
            window.dispatchEvent(new CustomEvent("open-livechat", { detail: { conversationId: chatData.conversationId } }));
          }
        } catch { /* ไม่ block flow ถ้า chat ล้มเหลว */ }

        // ไม่ปิด modal ทันที — โชว์ success state ให้บันทึกภาพก่อน
        // onConfirmViewBill จะถูกเรียกตอนกดปิด เพื่อไม่ให้ parent unmount modal ทันที
        setPaidBill(bill);
        setPaymentSuccess(true);
      } catch {
        setConfirmError("เกิดข้อผิดพลาด กรุณาลองใหม่");
      } finally {
        setIsConfirming(false);
      }
      return;
    }

    saveBill(bill);
    onConfirmViewBill(bill);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex sm:items-center sm:justify-center sm:p-5 bg-black/60 backdrop-blur-sm sm:overflow-y-auto">
      <div className="relative bg-white w-full h-full sm:h-auto sm:rounded-3xl sm:shadow-2xl sm:max-w-xl sm:max-h-[92vh] flex flex-col overflow-hidden text-slate-800 sm:my-auto animate-in fade-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-white shrink-0">
          {paymentSuccess ? (
            <div className="flex items-center gap-2">
              <span className="text-xl">✅</span>
              <h2 className="text-xl font-bold text-green-700">ชำระเงินสำเร็จ</h2>
            </div>
          ) : (
            <h2 className="text-xl font-bold text-slate-900">บันทึกภาพ</h2>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body (Captured area for image save) */}
        <div ref={cardRef} className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-4 bg-white">
          {/* Product Header Card */}
          <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-24 h-16 sm:w-28 sm:h-18 rounded-xl overflow-hidden relative shrink-0 border border-slate-200 bg-slate-900 group">
                <img
                  src={displayImage || "/coverrandon.png"}
                  alt={productCode}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-1.5">
                  <span className="text-[10px] text-white font-bold tracking-wider uppercase">
                    LUXUSX
                  </span>
                </div>
              </div>
              <div>
                <p className="text-lg font-extrabold text-slate-900 font-mono tracking-tight">
                  {productCode || "S1457"}
                </p>
                <p className="text-xl sm:text-2xl font-black text-red-600 font-num">
                  ฿{fmt(totalPrice)}
                </p>
              </div>
            </div>

            {/* Security Badge */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2.5 flex items-center gap-2 text-left shrink-0">
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0">
                <ShieldCheck size={16} className="text-emerald-400" />
              </div>
              <div className="hidden sm:block">
                <p className="text-[11px] font-bold text-slate-900 leading-tight">
                  ปลอดภัย 100%
                </p>
                <p className="text-[9px] text-slate-400">
                  ข้อมูลของคุณจะไม่ถูกเปิดเผย
                </p>
              </div>
            </div>
          </div>

          {/* 3-Column Summary Bar */}
          <div className="bg-slate-50/90 border border-slate-100 rounded-2xl p-3.5 grid grid-cols-3 divide-x divide-slate-200 text-center">
            <div className="px-1">
              <p className="text-xs text-slate-400 font-medium">ราคาเดิม</p>
              <p className="text-base sm:text-lg font-black text-red-600 font-num mt-0.5">
                ฿{fmt(totalPrice)}
              </p>
            </div>
            <div className="px-1">
              <p className="text-xs text-slate-400 font-medium">
                มัดจำเริ่มต้น ({downPct}%)
              </p>
              <p className="text-base sm:text-lg font-black text-slate-900 font-num mt-0.5">
                ฿{fmt(downAmount)}
              </p>
            </div>
            <div className="px-1">
              <p className="text-xs text-slate-400 font-medium">ยอดเริ่มผ่อน</p>
              <p className="text-base sm:text-lg font-black text-slate-900 font-num mt-0.5">
                ฿{fmt(remaining)}
              </p>
            </div>
          </div>

          {/* Plan Selection ("เลือกแผนการผ่อน") */}
          <div className="space-y-2.5">
            <p className="font-bold text-slate-900 text-sm">เลือกแผนการผ่อน</p>
            <div className="space-y-2">
              {availableCounts.map((count, index) => {
                const perMonth = Math.ceil(remainingWithFee / count);
                const isSelected = selectedCount === count;
                const isRecommended = index === 0;

                return (
                  <div
                    key={count}
                    onClick={() => setSelectedCount(count)}
                    className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between
                      ${
                        isSelected
                          ? "border-red-500 bg-red-50/20 ring-1 ring-red-500/20 shadow-sm"
                          : "border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      {isRecommended && (
                        <span className="px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-bold shrink-0">
                          แนะนำ
                        </span>
                      )}
                      <span className="font-semibold text-slate-800 text-xs sm:text-sm">
                        ผ่อน {count} {unitName}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-5">
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 mr-1.5 hidden sm:inline">
                          {planType === "daily" ? "ผ่อนวันละ" : planType === "weekly" ? "ผ่อนสัปดาห์ละ" : "ผ่อนเดือนละ"}
                        </span>
                        <span className="text-sm sm:text-base font-black text-red-600 font-num">
                          ฿{fmt(perMonth)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                            isSelected
                              ? "border-red-600 bg-red-600 text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && <Check size={11} strokeWidth={3} />}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Summary Box */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 space-y-3">
            <p className="font-bold text-slate-900 text-xs sm:text-sm">
              สรุปรายละเอียดการผ่อน (ผ่อน {selectedCount} {unitName})
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
              <div className="bg-white p-2 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400">ราคาสินค้า</p>
                <p className="font-bold text-slate-900 font-num mt-0.5">
                  ฿{fmt(totalPrice)}
                </p>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400">มัดจำ ({downPct}%)</p>
                <p className="font-bold text-slate-900 font-num mt-0.5">
                  ฿{fmt(downAmount)}
                </p>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400">ยอดเริ่มผ่อน</p>
                <p className="font-bold text-slate-900 font-num mt-0.5">
                  ฿{fmt(remaining)}
                </p>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400">จำนวนงวด</p>
                <p className="font-bold text-slate-900 mt-0.5">
                  {selectedCount} {unitName}
                </p>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400">
                  {planType === "daily" ? "ยอดผ่อนต่อวัน" : planType === "weekly" ? "ยอดผ่อนต่อสัปดาห์" : "ยอดผ่อนต่อเดือน"}
                </p>
                <p className="font-black text-red-600 font-num mt-0.5">
                  ฿{fmt(perInstallment)}
                </p>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400">ดอกเบี้ย</p>
                <p className="font-bold text-slate-900 font-num mt-0.5">
                  ฿{markup > 0 ? fmt(remainingWithFee - remaining) : "0"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 pt-1.5 text-[11px] text-slate-400">
              <Info size={13} className="shrink-0 text-slate-400" />
              <span>สามารถชำระค่างวดล่วงหน้าได้ ทำให้ยอดดอกเบี้ยลดลง</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        {paymentSuccess ? (
          <>
            <div className="px-5 py-3 bg-green-50 border-t border-green-100 shrink-0">
              <p className="text-xs text-green-700 text-center font-semibold">
                บันทึกภาพเอาไว้เพื่อยืนยันการผ่อนชำระกับแอดมิน
              </p>
            </div>
            <div className="px-5 py-3.5 bg-white border-t border-slate-100 grid grid-cols-2 gap-3 shrink-0">
              <button
                onClick={handleSaveImage}
                disabled={isSaving}
                className="col-span-1 w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Download size={16} />
                {isSaving ? "กำลังบันทึก..." : "บันทึกภาพ"}
              </button>
              <button
                onClick={() => { if (paidBill) onConfirmViewBill(paidBill); onClose(); }}
                className="col-span-1 w-full py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </>
        ) : (
          <>
            {fromShop && (
              <div className="px-5 py-3 bg-amber-50 border-t border-amber-100 shrink-0">
                <p className="text-xs text-amber-800 text-center">
                  ระบบจะหัก <strong>฿{fmt(downAmount)}</strong> จาก wallet ของคุณทันทีเมื่อกดยืนยัน
                </p>
                {confirmError && (
                  <p className="text-xs text-red-600 text-center mt-1 font-semibold">{confirmError}</p>
                )}
              </div>
            )}
            <div className="px-5 py-3.5 bg-white border-t border-slate-100 grid grid-cols-2 gap-3 shrink-0">
              <button
                onClick={handleSaveImage}
                disabled={isSaving}
                className="w-full py-3 rounded-xl border border-red-500 bg-white hover:bg-red-50 text-red-600 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Download size={16} />
                {isSaving ? "กำลังบันทึก..." : "บันทึกภาพ"}
              </button>
              <button
                onClick={fromShop ? () => setShowConfirmDialog(true) : handleConfirm}
                disabled={isConfirming}
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                <FileText size={16} />
                {isConfirming
                  ? "กำลังชำระ..."
                  : fromShop
                    ? `ชำระเงินเปิดบิล ฿${fmt(downAmount)}`
                    : "ดูรายละเอียดการผ่อน"}
              </button>
            </div>
          </>
        )}

        {/* Confirmation Dialog Overlay */}
        {showConfirmDialog && (
          <div className="absolute inset-0 z-10 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:rounded-3xl">
            <div className="bg-white w-full sm:rounded-3xl rounded-t-3xl shadow-2xl p-6 sm:mx-4 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <FileText size={20} className="text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">ยืนยันการชำระเงิน</h3>
                  <p className="text-xs text-slate-500">ตรวจสอบรายละเอียดก่อนยืนยัน</p>
                </div>
              </div>

              <div className="space-y-2 mb-5 bg-slate-50 rounded-2xl p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">รหัสสินค้า</span>
                  <span className="font-semibold text-slate-900 font-mono">{productCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ยอดเปิดบิล</span>
                  <span className="font-bold text-red-600 text-base">฿{fmt(downAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">แผนผ่อน</span>
                  <span className="font-semibold text-slate-700">
                    {PLAN_TYPES.find((p) => p.id === planType)?.label || planType} × {selectedCount} งวด
                  </span>
                </div>
              </div>

              <p className="text-xs text-amber-700 bg-amber-50 rounded-xl p-3 mb-5 text-center">
                ระบบจะหัก <strong>฿{fmt(downAmount)}</strong> จาก wallet ของคุณทันที
              </p>

              {confirmError && (
                <p className="text-xs text-red-600 text-center mb-3 font-semibold">{confirmError}</p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  disabled={isConfirming}
                  className="w-full py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => { setShowConfirmDialog(false); handleConfirm(); }}
                  disabled={isConfirming}
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-60"
                >
                  {isConfirming ? "กำลังชำระ..." : "ยืนยันชำระเงิน"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Calculator Form ──────────────────────────────────────────────────────────

function CalcForm({ onCreated, initialTitle, initialPrice, initialImage, fromShop, listingId, onBalanceChanged, noMonthly }: {
  onCreated: (bill: Bill) => void;
  initialTitle?: string;
  initialPrice?: string;
  initialImage?: string;
  fromShop?: boolean;
  listingId?: string;
  onBalanceChanged?: () => void;
  noMonthly?: boolean;
}) {
  const { downOptions, planOptions, planMeta, priceRanges, latePenaltyTiers, planCountMarkups } = useContext(SettingsCtx);
  const [productCode, setProductCode] = useState(initialTitle || "");
  const [price,       setPrice]       = useState(initialPrice || "");
  const [downPct,     setDownPct]     = useState<number | null>(null);
  const [planType,    setPlanType]    = useState<PlanType>("monthly");
  const [planCount,   setPlanCount]   = useState<number | null>(null);
  const [accepted,    setAccepted]    = useState(false);
  const [termsOpen,   setTermsOpen]   = useState(false);
  const [modalOpen,   setModalOpen]   = useState(false);
  const [error,       setError]       = useState("");

  const totalPrice      = parseFloat(price);
  const validPrice      = !isNaN(totalPrice) && totalPrice > 0;
  const markup          = resolveMarkupWithCount(planCountMarkups ?? DEFAULT_PLAN_COUNT_MARKUPS, priceRanges, validPrice ? totalPrice : 0, planType, planCount, planMeta[planType].markup);
  const monthlyEnabled  = !noMonthly && (!validPrice || isMonthlyEnabled(priceRanges, totalPrice));
  const availablePlanTypes = PLAN_TYPES.filter((pt) => pt.id !== "monthly" || monthlyEnabled);
  const downAmount   = validPrice && downPct != null ? Math.round(totalPrice * downPct / 100) : 0;
  const remaining    = validPrice && downPct != null ? totalPrice - downAmount : 0;
  const withFee      = Math.ceil(remaining * (1 + markup));
  const perInstall   = planCount ? Math.ceil(withFee / planCount) : 0;

  function handleCreate() {
    setError("");
    if (!productCode.trim())  return setError("กรุณากรอกรหัสสินค้า / รหัสไอดี");
    if (!validPrice)           return setError("กรุณากรอกราคาสินค้าให้ถูกต้อง");
    if (downPct == null)       return setError("กรุณาเลือกจำนวนเงินเปิดบิล");
    if (planCount == null)     return setError("กรุณาเลือกแผนผ่อนชำระ");
    if (!accepted)             return setError("กรุณายอมรับเงื่อนไขการผ่อนชำระ");

    setModalOpen(true);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">
      {/* ── Left: Form ── */}
      <div className="space-y-4">
        {/* Step 1 */}
        <SectionCard className="p-5">
          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
            <StepBadge n={1} />
            <h2 className="font-semibold text-slate-900">กรอกข้อมูลไอดี</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">รหัสสินค้า / หมายเลขไอดี</label>
              <input
                type="text"
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                placeholder="เช่น S1400, ROV-VVIP-99"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-mono text-sm font-semibold focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all placeholder:text-slate-300 placeholder:font-normal"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">ราคาไอดี (บาท)</label>
              <div className="relative">
                <input
                  type="number"
                  value={price}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPrice(v);
                    setPlanCount(null);
                    const np = parseFloat(v);
                    if (!isNaN(np) && !isMonthlyEnabled(priceRanges, np) && planType === "monthly") {
                      setPlanType("weekly");
                    }
                  }}
                  placeholder="0"
                  min="0"
                  className="w-full px-3.5 py-2.5 pr-12 text-xl font-black rounded-xl border border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all text-slate-900 font-num"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">฿</span>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Step 2 */}
        <SectionCard className="p-5">
          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
            <StepBadge n={2} />
            <div>
              <h2 className="font-semibold text-slate-900">เงินเปิดบิล</h2>
              <p className="text-xs text-slate-400 mt-0.5">จำนวนที่ต้องชำระก่อนเริ่มรายการ</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {downOptions.map((opt) => {
              const amt    = validPrice ? Math.round(totalPrice * opt.pct / 100) : 0;
              const active = downPct === opt.pct;
              return (
                <button
                  key={opt.pct}
                  onClick={() => setDownPct(opt.pct)}
                  className={`relative py-3 rounded-xl border text-center transition-all cursor-pointer
                    ${active
                      ? "border-red-500 bg-red-50 ring-1 ring-red-500/30"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}
                >
                  <p className={`text-lg font-black font-num ${active ? "text-red-600" : "text-slate-800"}`}>{opt.pct}%</p>
                  <p className={`text-[10px] mt-0.5 ${active ? "text-red-500 font-semibold" : "text-slate-400"}`}>
                    {validPrice && amt > 0 ? `${amt.toLocaleString("th-TH")} ฿` : "เปิดบิล"}
                  </p>
                  {active && (
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center">
                      <Check size={8} className="text-white" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {validPrice && downPct != null && (
            <div className="mt-3 flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
              <span className="text-slate-500">คงเหลือผ่อนต่องวด</span>
              <span className="font-semibold text-slate-700 font-num">{fmt(remaining)} บาท</span>
            </div>
          )}
        </SectionCard>

        {/* Step 3 */}
        <SectionCard className="p-5">
          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
            <StepBadge n={3} />
            <div>
              <h2 className="font-semibold text-slate-900">แผนผ่อนชำระ</h2>
              <p className="text-xs text-slate-400 mt-0.5">เลือกประเภทและจำนวนงวด</p>
            </div>
          </div>

          {/* Plan type */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {availablePlanTypes.map((pt) => {
              const active = planType === pt.id;
              return (
                <button
                  key={pt.id}
                  onClick={() => { setPlanType(pt.id); setPlanCount(null); }}
                  className={`py-2.5 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer
                    ${active
                      ? "border-red-500 bg-red-600 text-white"
                      : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}
                >
                  <p className="font-bold">{pt.label}</p>
                  <p className={`text-[10px] mt-0.5 ${active ? "text-red-100" : "text-slate-400"}`}>{pt.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Plan count */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {planOptions[planType].map((opt) => {
              const active = planCount === opt.count;
              return (
                <button
                  key={opt.count}
                  onClick={() => setPlanCount(opt.count)}
                  className={`py-2.5 px-2 rounded-xl border text-center text-sm font-semibold transition-all cursor-pointer relative
                    ${active
                      ? "border-red-500 bg-red-50 text-red-700 ring-1 ring-red-500/30"
                      : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"}`}
                >
                  {opt.label}
                  {active && (
                    <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                      <Check size={7} className="text-white" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Markup notice */}
          {markup > 0 && (
            <p className="mt-3 text-[11px] text-slate-400 flex items-center gap-1.5">
              <Info size={11} className="shrink-0 text-slate-400" />
              แผนนี้มีค่าบริการ {parseFloat((markup * 100).toFixed(2))}% จากยอดหลังหักเงินเปิดบิล
            </p>
          )}

        </SectionCard>

        {/* Terms + Submit */}
        <SectionCard className="p-5">
          <label className="flex items-start gap-3 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 accent-red-600 w-4 h-4 shrink-0"
            />
            <span className="text-sm text-slate-600 leading-relaxed">
              ข้าพเจ้าอ่านและยอมรับ{" "}
              <button
                type="button"
                onClick={() => setTermsOpen(true)}
                className="text-red-600 font-semibold underline underline-offset-2 hover:text-red-700"
              >
                เงื่อนไขการผ่อนชำระ
              </button>
              {" "}ของ LuxusX แล้ว
            </span>
          </label>

          {error && (
            <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-600 font-medium">
              <Info size={13} className="shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleCreate}
            className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-bold text-sm transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles size={16} />
            สร้างบิลผ่อนชำระ
            <ChevronRight size={16} />
          </button>
        </SectionCard>
      </div>

      {/* ── Right: Sticky Preview ── */}
      <div className="lg:sticky lg:top-4 space-y-3">
        <PreviewPanel
          productCode={productCode}
          totalPrice={validPrice ? totalPrice : 0}
          downPct={downPct}
          planType={planType}
          planCount={planCount}
          perInstallment={perInstall}
          downAmount={downAmount}
          markup={markup}
        />

        {/* How it works (compact) */}
        <SectionCard className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">ขั้นตอนการใช้งาน</p>
          <div className="space-y-2.5">
            {[
              "กรอกรหัสสินค้าและราคาไอดี",
              "เลือกเงินเปิดบิลและแผนผ่อน",
              "สร้างบิล แคปรูปส่งแอดมิน LINE",
              "โอนเงิน รับไอดีเล่นทันที",
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="shrink-0 w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                <p className="text-xs text-slate-600 leading-relaxed">{s}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />

      {validPrice && downPct != null && planCount != null && (
        <InstallmentDetailModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          productCode={productCode}
          totalPrice={totalPrice}
          downPct={downPct}
          planType={planType}
          planCount={planCount}
          initialImage={initialImage}
          fromShop={fromShop}
          listingId={listingId}
          onConfirmViewBill={(bill) => onCreated(bill)}
          onBalanceChanged={onBalanceChanged}
        />
      )}
    </div>
  );
}

// ─── Bill Result View ─────────────────────────────────────────────────────────

function BillView({ bill, onReset }: { bill: Bill; onReset: () => void }) {
  const { lineUrl, planMeta } = useContext(SettingsCtx);
  const [copied, setCopied] = useState(false);
  const paidCount = bill.installments.filter((i) => i.status === "paid").length;
  const progress  = (paidCount / bill.installments.length) * 100;

  const copyId = () => {
    navigator.clipboard.writeText(bill.id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 items-start">
      {/* ── Left: Bill details ── */}
      <div className="space-y-4">
        {/* Bill ID card */}
        <div className="bg-[#0f172a] rounded-2xl overflow-hidden relative">
          <div className="h-0.5 bg-gradient-to-r from-red-600 via-red-400 to-red-600" />
          <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />

          <div className="p-5 relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-[11px] font-medium mb-1 uppercase tracking-wider">เลขที่บิล</p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-white tracking-wider">{bill.id}</span>
                  <button onClick={copyId} className="p-1 rounded-md hover:bg-white/10 text-slate-500 hover:text-white transition-colors">
                    {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                  </button>
                </div>
                <p className="text-slate-600 text-[11px] mt-1">สร้างเมื่อ {bill.createdAt}</p>
              </div>
              <StatusBadge status={bill.status} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-slate-500 text-[11px]">ยอดชำระต่องวด</p>
                <p className="text-xl font-black text-white font-num mt-0.5">{fmt(bill.amountPerInstallment)} <span className="text-sm font-medium text-slate-400">฿</span></p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-slate-500 text-[11px]">เงินเปิดบิล</p>
                <p className="text-xl font-black text-red-400 font-num mt-0.5">{fmt(bill.downAmount)} <span className="text-sm font-medium text-slate-400">฿</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <SectionCard className="divide-y divide-slate-100">
          <div className="px-5 py-3.5 flex items-center justify-between text-sm">
            <span className="text-slate-500 font-medium">รหัสสินค้า</span>
            <span className="font-mono font-bold text-slate-900">{bill.productCode}</span>
          </div>
          <div className="px-5 py-3.5 flex items-center justify-between text-sm">
            <span className="text-slate-500 font-medium">ราคาไอดี</span>
            <span className="font-bold text-slate-900 font-num">{fmt(bill.totalPrice)} บาท</span>
          </div>
          <div className="px-5 py-3.5 flex items-center justify-between text-sm">
            <span className="text-slate-500 font-medium">แผนที่เลือก</span>
            <span className="font-semibold text-slate-900">{planMeta[bill.planType]?.name ?? bill.planType} × {bill.planCount} งวด</span>
          </div>
          <div className="px-5 py-3.5 flex items-center justify-between text-sm">
            <span className="text-slate-500 font-medium">ยอดผ่อนทั้งหมด</span>
            <span className="font-bold text-slate-900 font-num">{fmt(bill.remainingAmount)} บาท</span>
          </div>
        </SectionCard>

        {/* Progress */}
        <SectionCard className="p-5">
          <div className="flex items-center justify-between mb-2.5">
            <p className="font-semibold text-slate-900 text-sm">ความคืบหน้า</p>
            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full">{paidCount}/{bill.installments.length} งวด</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-rose-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </SectionCard>

        {/* Installment table */}
        <SectionCard className="overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="font-semibold text-slate-900 text-sm">ตารางงวดผ่อนชำระ</p>
          </div>
          <div className="divide-y divide-slate-50">
            {bill.installments.map((inst) => (
              <div
                key={inst.installmentNo}
                className={`flex items-center justify-between px-5 py-3 transition-colors
                  ${inst.status === "paid" ? "bg-green-50" : "hover:bg-slate-50"}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0
                    ${inst.status === "paid" ? "bg-green-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                    {inst.status === "paid" ? <Check size={12} strokeWidth={3} /> : inst.installmentNo}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">งวดที่ {inst.installmentNo}</p>
                    <p className="text-[11px] text-slate-400">{inst.dueDate}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900 font-num">{fmt(inst.amount)} ฿</p>
                  {inst.status === "paid"
                    ? <span className="text-[10px] text-green-600 font-semibold">ชำระแล้ว</span>
                    : <span className="text-[10px] text-slate-400">รอชำระ</span>}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* ── Right: Actions ── */}
      <div className="lg:sticky lg:top-4 space-y-3">
        {/* Next steps */}
        <SectionCard className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">ขั้นตอนต่อไป</p>
          <div className="space-y-2.5">
            {[
              { step: "แคปหน้าจอบิลนี้ หรือกดบันทึก PDF", highlight: false },
              { step: `โอนเงินเปิดบิล ${fmt(bill.downAmount)} บาท`, highlight: true },
              { step: "ส่งสลิป + รูปบิลให้แอดมินทาง LINE", highlight: false },
              { step: "รอแอดมินยืนยัน รับไอดีเล่นทันที", highlight: false },
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="shrink-0 w-5 h-5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                <p className={`text-xs leading-relaxed ${s.highlight ? "font-bold text-red-600" : "text-slate-600"}`}>{s.step}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Buttons */}
        <a
          href={lineUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white font-bold text-sm transition-all shadow-lg shadow-green-500/20"
        >
          <MessageCircle size={16} />
          ทักไลน์แอดมิน
        </a>
        <button
          onClick={() => window.print()}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors"
        >
          <Printer size={15} />
          พิมพ์ / บันทึก PDF
        </button>
        <button
          onClick={onReset}
          className="flex items-center justify-center gap-2 w-full py-2.5 text-slate-400 text-sm hover:text-slate-600 transition-colors"
        >
          <RefreshCw size={13} />
          คำนวณรายการใหม่
        </button>
      </div>
    </div>
  );
}

// ─── How To Tab ───────────────────────────────────────────────────────────────


// ─── Search Tab ───────────────────────────────────────────────────────────────

function SearchTab() {
  const { planMeta } = useContext(SettingsCtx);
  const [query,     setQuery]     = useState("");
  const [results,   setResults]   = useState<Bill[] | null>(null);
  const [searching, setSearching] = useState(false);

  async function handleSearch() {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    try {
      const deviceId = getDeviceId();
      const res = await fetch(
        `/api/installment/bills?q=${encodeURIComponent(q)}&deviceId=${encodeURIComponent(deviceId)}`,
      );
      const data = await res.json();
      const serverBills: Bill[] = (data.bills ?? []).map((b: any) => ({
        id:                   b.billId,
        productCode:          b.productCode,
        totalPrice:           b.totalPrice,
        downPercent:          b.downPercent,
        downAmount:           b.downAmount,
        remainingAmount:      b.remainingAmount,
        planType:             b.planType,
        planCount:            b.planCount,
        amountPerInstallment: b.amountPerInstallment,
        installments:         b.installments,
        status:               b.status,
        createdAt:            new Date(b.createdAt).toLocaleString("th-TH"),
      }));

      // merge กับ localStorage (บิลเก่าที่สร้างก่อนระบบนี้)
      const localBills = loadBills().filter((b) =>
        b.id.toUpperCase().includes(q.toUpperCase()) ||
        b.productCode.toUpperCase().includes(q.toUpperCase()),
      );
      const merged = [
        ...serverBills,
        ...localBills.filter((lb) => !serverBills.some((sb) => sb.id === lb.id)),
      ];
      setResults(merged);
    } catch {
      // fallback: ค้นจาก localStorage ถ้า server error
      const q2 = q.toUpperCase();
      setResults(loadBills().filter((b) => b.id.includes(q2) || b.productCode.includes(q2)));
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <SectionCard className="p-5">
        <p className="font-semibold text-slate-900 mb-1">ค้นหาบิลของคุณ</p>
        <p className="text-xs text-slate-500 mb-4">กรอกเลขบิล (LX-...) หรือรหัสสินค้า</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setResults(null); }}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="LX-20260726-1234 หรือ S1400"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching}
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors shrink-0 flex items-center gap-2"
          >
            {searching ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
            ค้นหา
          </button>
        </div>
      </SectionCard>

      {results !== null && (
        results.length === 0 ? (
          <SectionCard className="py-12 text-center">
            <FileText size={36} className="text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">ไม่พบบิลที่ค้นหา</p>
            <p className="text-xs text-slate-400 mt-1">ตรวจสอบเลขบิลหรือรหัสสินค้าอีกครั้ง</p>
          </SectionCard>
        ) : (
          <div className="space-y-3">
            {results.map((bill) => {
              const paid = bill.installments.filter((i) => i.status === "paid").length;
              return (
                <SectionCard key={bill.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-mono font-bold text-red-600 text-sm">{bill.id}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{bill.createdAt}</p>
                    </div>
                    <StatusBadge status={bill.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
                    {([
                      ["รหัสสินค้า", bill.productCode],
                      ["ราคาไอดี",  `${fmt(bill.totalPrice)} ฿`],
                      ["แผน",       `${planMeta[bill.planType]?.name ?? bill.planType} × ${bill.planCount}`],
                      ["ต่องวด",    `${fmt(bill.amountPerInstallment)} ฿`],
                    ] as [string, string][]).map(([l, v], i) => (
                      <div key={i}>
                        <p className="text-[11px] text-slate-400">{l}</p>
                        <p className={`text-sm font-semibold mt-0.5 ${i === 3 ? "text-red-600" : "text-slate-800"} ${i === 0 || i === 3 ? "font-mono" : ""}`}>{v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                    <span>ความคืบหน้า</span>
                    <span>{paid}/{bill.installments.length} งวด</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-rose-500 rounded-full"
                      style={{ width: `${(paid / bill.installments.length) * 100}%` }}
                    />
                  </div>
                </SectionCard>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

// ─── How To Tab ───────────────────────────────────────────────────────────────

function HowToTab({ onGoCalc }: { onGoCalc: () => void }) {
  const { howtoSteps } = useContext(SettingsCtx);
  const STEP_ICONS = [Calculator, FileText, MessageCircle, Gamepad2];

  return (
    <div className="space-y-6">

      {/* Hero text */}
      <div className="text-center pt-2">
        <h2 className="text-xl font-bold text-slate-900">วิธีใช้งานระบบผ่อนไอดี LUXUSX</h2>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          ไม่ต้องใช้เอกสาร ไม่ต้องค้ำประกัน<br className="sm:hidden" />
          {" "}ออกบิลผ่อนพร้อมเล่นไอดีได้ภายใน 1 นาที
        </p>
      </div>

      {/* 4 Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {howtoSteps.map((step, i) => {
          const Icon = STEP_ICONS[i] ?? Calculator;
          return (
            <SectionCard key={i} className="p-5">
              <div className="flex items-start gap-3">
                <div className="shrink-0 flex flex-col items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                    <Icon size={16} className="text-red-600" />
                  </div>
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm leading-snug">{step.title}</p>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            </SectionCard>
          );
        })}
      </div>

      {/* CTA card */}
      <div className="bg-[#0f172a] rounded-2xl overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-red-600 via-red-400 to-red-600" />
        <div className="p-6 text-center">
          <div className="w-10 h-10 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <Sparkles size={18} className="text-red-400" />
          </div>
          <h3 className="text-base font-bold text-white">พร้อมเริ่มต้นผ่อนไอดี LUXUSX แล้วหรือยัง?</h3>
          <p className="text-slate-400 text-xs mt-2 leading-relaxed">
            คำนวณยอดเงินผ่อนและออกบิลผ่อนชำระได้ทันที ไม่ต้องรอนาน
          </p>
          <button
            onClick={onGoCalc}
            className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all shadow-lg shadow-red-900/40 active:scale-95"
          >
            <Calculator size={15} />
            เริ่มคำนวณและออกบิลตอนนี้
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InstallmentPage() {
  const [tab,         setTab]         = useState<"calc" | "search" | "howto">("calc");
  const [createdBill, setCreatedBill] = useState<Bill | null>(null);
  const [settings,    setSettings]    = useState<PageSettings>(DEFAULT_PAGE_SETTINGS);

  useEffect(() => {
    fetch("/api/installment-settings")
      .then((r) => r.json())
      .then((d) => {
        const parseOpts = (arr: number[], unit: string) =>
          arr.map((n) => ({ count: n, label: `${n} ${unit}` }));
        setSettings({
          lineUrl:    d.lineUrl    ?? LINE_ADMIN,
          coverImage: d.coverImage ?? "",
          terms:      Array.isArray(d.terms) ? d.terms : TERMS,
          downOptions: Array.isArray(d.downOptions)
            ? d.downOptions.map((p: number) => ({ pct: p, label: `${p}%` }))
            : DOWN_OPTIONS,
          planMeta: {
            daily:   { name: "รายวัน",    unit: "วัน",      markup: d.markups?.daily   ?? 0    },
            weekly:  { name: "รายสัปดาห์", unit: "สัปดาห์", markup: d.markups?.weekly  ?? 0.05 },
            monthly: { name: "รายเดือน",  unit: "เดือน",    markup: d.markups?.monthly ?? 0.10 },
          },
          planOptions: {
            daily:   parseOpts(d.planOptions?.daily   ?? [7, 14, 21, 30],  "วัน"),
            weekly:  parseOpts(d.planOptions?.weekly  ?? [2, 3, 4, 6, 8, 12], "สัปดาห์"),
            monthly: parseOpts(d.planOptions?.monthly ?? [2, 3, 4, 6, 12], "เดือน"),
          },
          priceRanges:      Array.isArray(d.priceRanges) ? d.priceRanges : DEFAULT_PRICE_RANGES,
          howtoSteps:       Array.isArray(d.howtoSteps) ? d.howtoSteps : DEFAULT_HOWTO_STEPS,
          latePenaltyTiers: d.latePenaltyTiers ?? DEFAULT_LATE_PENALTY_TIERS,
          planCountMarkups: d.planCountMarkups ?? DEFAULT_PLAN_COUNT_MARKUPS,
        });
      })
      .catch(() => {}); // fallback ใช้ defaults
  }, []);

  const searchParams = useSearchParams();
  const initialTitle   = searchParams.get("title")     || "";
  const initialPrice   = searchParams.get("price")     || "";
  const initialImage   = searchParams.get("image")     || "";
  const initialListing = searchParams.get("listingId") || "";
  const noMonthlyParam = searchParams.get("noMonthly") === "1";

  // fetch installmentMonthlyDisabled จาก DB โดยตรง (ป้องกัน bypass ด้วย URL)
  const [noMonthlyFromDB, setNoMonthlyFromDB] = useState(false);
  useEffect(() => {
    if (!initialListing) return;
    fetch(`/api/shop/${initialListing}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setNoMonthlyFromDB(!!d.installmentMonthlyDisabled))
      .catch(() => {});
  }, [initialListing]);

  const noMonthly = noMonthlyParam || noMonthlyFromDB;

  // มาจาก shop redirect — ตัดเงิน wallet + stock อัตโนมัติ
  const fromShop = !!(initialTitle && initialPrice);
  const { refreshBalance } = useBalance();

  return (
    <SettingsCtx.Provider value={settings}>
    <div className="p-4 lg:p-6 pb-24 lg:pb-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-sm shrink-0">
            <Calculator size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">ผ่อนชำระไอดีเกม</h1>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600 uppercase tracking-wide">LUXUSX</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">คำนวณยอดผ่อนและออกบิลชำระเงินได้ทันที ไม่ต้องรอนาน</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1 shrink-0 self-start sm:self-auto">
          {[
            { id: "calc"   as const, label: "คำนวณผ่อน",   icon: Calculator },
            { id: "search" as const, label: "ค้นหาผ่อน",   icon: Search     },
            { id: "howto"  as const, label: "วิธีใช้งาน",  icon: BookOpen   },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setTab(id); if (id === "calc") setCreatedBill(null); }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer
                ${tab === id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"}`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {tab === "calc" && (
        createdBill
          ? <BillView bill={createdBill} onReset={() => setCreatedBill(null)} />
          : <CalcForm onCreated={setCreatedBill} initialTitle={initialTitle} initialPrice={initialPrice} initialImage={initialImage} fromShop={fromShop} listingId={initialListing} onBalanceChanged={refreshBalance} noMonthly={noMonthly} />
      )}
      {tab === "search" && <SearchTab />}
      {tab === "howto"  && <HowToTab onGoCalc={() => setTab("calc")} />}
    </div>
    </SettingsCtx.Provider>
  );
}
