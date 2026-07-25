"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calculator, Save, Plus, Trash2, ToggleLeft, ToggleRight,
  Link, Image, Percent, Calendar, CheckCircle2, AlertCircle,
  RefreshCw, DollarSign, BookOpen,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface HowToStep {
  title: string;
  desc: string;
}

interface PriceRange {
  id: string;
  priceMin: number;
  priceMax: number;
  markupDaily: number;
  markupWeekly: number;
  markupMonthly: number;
  enableMonthly: boolean;
}

interface FormState {
  enabled: boolean;
  lineUrl: string;
  coverImage: string;
  downOptions: string;
  markupDaily: string;
  markupWeekly: string;
  markupMonthly: string;
  dailyOptions: string;
  weeklyOptions: string;
  monthlyOptions: string;
  terms: string[];
  priceRanges: PriceRange[];
  howtoSteps: HowToStep[];
}

const DEFAULT_RANGES: PriceRange[] = [
  { id: "r1", priceMin: 1000, priceMax: 2999, markupDaily: 10, markupWeekly: 20, markupMonthly: 25, enableMonthly: false },
  { id: "r2", priceMin: 3000, priceMax: 3999, markupDaily: 35, markupWeekly: 25, markupMonthly: 20, enableMonthly: false },
  { id: "r3", priceMin: 4000, priceMax: 4999, markupDaily: 35, markupWeekly: 25, markupMonthly: 20, enableMonthly: true },
  { id: "r4", priceMin: 5000, priceMax: 9999, markupDaily: 30, markupWeekly: 20, markupMonthly: 15, enableMonthly: true },
];

const DEFAULTS: FormState = {
  enabled: true,
  lineUrl: "https://line.me/ti/p/~@352eusln",
  coverImage: "",
  downOptions: "10,40,50,80",
  markupDaily: "0",
  markupWeekly: "5",
  markupMonthly: "10",
  dailyOptions: "7,14,21,30",
  weeklyOptions: "2,3,4,6,8,12",
  monthlyOptions: "2,3,4,6,12",
  terms: [
    "ลูกค้าต้องชำระยอดเปิดบิลตามจำนวนที่เลือกก่อนเริ่มรายการ",
    "ต้องชำระแต่ละงวดตามกำหนดของแผนรายวัน รายสัปดาห์ หรือรายเดือน",
    "แผนรายเดือนกำหนดชำระทุกวันที่ 1 ของเดือน",
    "รายการจะสมบูรณ์เมื่อแอดมินตรวจสอบและยืนยันผ่านแชทแล้วเท่านั้น",
    "กรุณาตรวจสอบราคา รหัสสินค้า ยอดเปิดบิล และยอดต่องวดก่อนยืนยัน",
    "เงื่อนไขเพิ่มเติมให้เป็นไปตามที่ร้านแจ้งในแชทและหน้าประกาศของร้าน",
  ],
  priceRanges: DEFAULT_RANGES,
  howtoSteps: [
    { title: "กรอกราคา & เลือกแผนผ่อน", desc: "ระบุราคาไอดี เลือกเงินเปิดบิล (40%, 50%, 80%) และเลือกระยะเวลาผ่อน (รายวัน/สัปดาห์/เดือน) ระบบจะคำนวณยอดทันที" },
    { title: "กดยืนยัน & แคปรูปบิลผ่อน", desc: "กดยอมรับเงื่อนไขและสร้างบิล จากนั้นถ่ายรูปหรือแคปหน้าจอบิลผ่อนอ้างอิงที่มี QR Code และเลขบิล" },
    { title: "โอนเปิดบิล & ส่งแชทแอดมิน", desc: "โอนเงินเปิดบิลตามยอดที่คำนวณ พร้อมส่งสลิปการโอนและภาพบิลผ่อนทางช่องทางแชท LINE แอดมิน" },
    { title: "รับไอดีเล่นทันที!", desc: "แอดมินตรวจสอบการโอนและอนุมัติบิล พร้อมส่งมอบข้อมูลไอดีเกมให้คุณนำไปเล่นได้ทันที" },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function genId() {
  return `r${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

async function patchSetting(key: string, value: unknown) {
  const res = await fetch("/api/admin/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value }),
  });
  if (!res.ok) throw new Error(`Failed to save ${key}`);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Card({ title, subtitle, icon: Icon, children }: {
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-start gap-2">
        <Icon size={16} className="text-red-600 mt-0.5 shrink-0" />
        <div>
          <h2 className="font-semibold text-gray-900 text-sm">{title}</h2>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, description, children }: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {description && <p className="text-xs text-gray-400 mb-2">{description}</p>}
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all"
    />
  );
}

function NumberInput({ value, onChange, min = 0, max = 100, suffix }: {
  value: string;
  onChange: (v: string) => void;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  return (
    <div className="relative max-w-[140px]">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        className="w-full px-3 py-2 pr-8 rounded-xl border border-gray-200 text-sm text-gray-900 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all"
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{suffix}</span>
      )}
    </div>
  );
}

// ─── Price Range Row ──────────────────────────────────────────────────────────

function PriceRangeRow({
  range,
  onUpdate,
  onDelete,
}: {
  range: PriceRange;
  onUpdate: (updated: PriceRange) => void;
  onDelete: () => void;
}) {
  const up = (field: keyof PriceRange, val: unknown) =>
    onUpdate({ ...range, [field]: val });

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      {/* Fields row */}
      <div className="grid grid-cols-5 divide-x divide-gray-100">
        <div className="p-3">
          <p className="text-xs text-gray-400 font-medium mb-1.5">ราคาเริ่มต้น</p>
          <input
            type="number"
            value={range.priceMin}
            onChange={(e) => up("priceMin", Number(e.target.value))}
            className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all"
          />
        </div>
        <div className="p-3">
          <p className="text-xs text-gray-400 font-medium mb-1.5">ราคาสิ้นสุด</p>
          <input
            type="number"
            value={range.priceMax}
            onChange={(e) => up("priceMax", Number(e.target.value))}
            className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all"
          />
        </div>
        <div className="p-3">
          <p className="text-xs text-gray-400 font-medium mb-1.5">รายวัน (%)</p>
          <input
            type="number"
            value={range.markupDaily}
            min={0}
            max={100}
            onChange={(e) => up("markupDaily", Number(e.target.value))}
            className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all"
          />
        </div>
        <div className="p-3">
          <p className="text-xs text-gray-400 font-medium mb-1.5">รายสัปดาห์ (%)</p>
          <input
            type="number"
            value={range.markupWeekly}
            min={0}
            max={100}
            onChange={(e) => up("markupWeekly", Number(e.target.value))}
            className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all"
          />
        </div>
        <div className="p-3">
          <p className="text-xs text-gray-400 font-medium mb-1.5">รายเดือน (%)</p>
          <input
            type="number"
            value={range.markupMonthly}
            min={0}
            max={100}
            onChange={(e) => up("markupMonthly", Number(e.target.value))}
            className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all"
          />
        </div>
      </div>

      {/* Footer row: checkbox + delete */}
      <div className="px-3 py-2.5 bg-gray-50/60 border-t border-gray-100 flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={range.enableMonthly}
            onChange={(e) => up("enableMonthly", e.target.checked)}
            className="w-4 h-4 accent-red-600 cursor-pointer"
          />
          <span className="text-xs text-gray-600">เปิดใช้รายเดือนในช่วงนี้</span>
        </label>
        <button
          onClick={onDelete}
          className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors cursor-pointer"
        >
          ลบช่วง
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminInstallmentPage() {
  const [form,    setForm]    = useState<FormState>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState<{ ok: boolean; msg: string } | null>(null);

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  }, []);

  // ── Load ──
  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((rows: any[]) => {
        const g = (k: string) => rows.find((r) => r.key === k);
        const loadedRanges = (() => {
          try {
            const v = g("installment_price_ranges")?.value;
            const parsed = typeof v === "string" ? JSON.parse(v) : v;
            return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_RANGES;
          } catch {
            return DEFAULT_RANGES;
          }
        })();
        setForm({
          enabled:       g("installment_enabled")?.value  ?? true,
          lineUrl:       g("installment_line_url")?.value ?? DEFAULTS.lineUrl,
          coverImage:    g("installment_cover_image")?.value ?? "",
          downOptions:   g("installment_down_options")?.value ?? DEFAULTS.downOptions,
          markupDaily:   String(g("installment_markup_daily")?.value   ?? 0),
          markupWeekly:  String(g("installment_markup_weekly")?.value  ?? 5),
          markupMonthly: String(g("installment_markup_monthly")?.value ?? 10),
          dailyOptions:  g("installment_daily_options")?.value   ?? DEFAULTS.dailyOptions,
          weeklyOptions: g("installment_weekly_options")?.value  ?? DEFAULTS.weeklyOptions,
          monthlyOptions:g("installment_monthly_options")?.value ?? DEFAULTS.monthlyOptions,
          terms: (() => {
            try { return JSON.parse(g("installment_terms")?.value ?? "[]"); } catch { return DEFAULTS.terms; }
          })(),
          priceRanges: loadedRanges,
          howtoSteps: (() => {
            try {
              const v = g("installment_howto_steps")?.value;
              const parsed = typeof v === "string" ? JSON.parse(v) : v;
              return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULTS.howtoSteps;
            } catch { return DEFAULTS.howtoSteps; }
          })(),
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ── Save ──
  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        patchSetting("installment_enabled",        form.enabled),
        patchSetting("installment_line_url",        form.lineUrl),
        patchSetting("installment_cover_image",     form.coverImage),
        patchSetting("installment_down_options",    form.downOptions),
        patchSetting("installment_markup_daily",    Number(form.markupDaily)),
        patchSetting("installment_markup_weekly",   Number(form.markupWeekly)),
        patchSetting("installment_markup_monthly",  Number(form.markupMonthly)),
        patchSetting("installment_daily_options",   form.dailyOptions),
        patchSetting("installment_weekly_options",  form.weeklyOptions),
        patchSetting("installment_monthly_options", form.monthlyOptions),
        patchSetting("installment_terms",           JSON.stringify(form.terms)),
        patchSetting("installment_price_ranges",    JSON.stringify(form.priceRanges)),
        patchSetting("installment_howto_steps",     JSON.stringify(form.howtoSteps)),
      ]);
      setToast({ ok: true, msg: "บันทึกการตั้งค่าเรียบร้อยแล้ว" });
    } catch (e: any) {
      setToast({ ok: false, msg: e.message ?? "เกิดข้อผิดพลาด" });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3500);
    }
  };

  const addRange = () => {
    const last = form.priceRanges[form.priceRanges.length - 1];
    const newMin = last ? last.priceMax + 1 : 0;
    set("priceRanges", [
      ...form.priceRanges,
      { id: genId(), priceMin: newMin, priceMax: newMin + 999, markupDaily: 0, markupWeekly: 5, markupMonthly: 10, enableMonthly: false },
    ]);
  };

  const updateRange = (id: string, updated: PriceRange) => {
    set("priceRanges", form.priceRanges.map((r) => r.id === id ? updated : r));
  };

  const deleteRange = (id: string) => {
    set("priceRanges", form.priceRanges.filter((r) => r.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <RefreshCw size={20} className="animate-spin mr-2" />
        กำลังโหลด...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center">
            <Calculator size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">ตั้งค่าระบบผ่อนไอดี</h1>
            <p className="text-xs text-gray-400 mt-0.5">จัดการเงื่อนไข แผนผ่อน และเนื้อหาหน้า /installment</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-all disabled:opacity-60 shadow-sm cursor-pointer"
        >
          <Save size={15} />
          {saving ? "กำลังบันทึก..." : "บันทึกทั้งหมด"}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border ${
          toast.ok
            ? "bg-green-50 border-green-200 text-green-700"
            : "bg-red-50 border-red-200 text-red-700"
        }`}>
          {toast.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* ── 1. General ── */}
      <Card title="ทั่วไป" icon={ToggleRight}>
        <div className="space-y-5">
          {/* Enable toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
            <div>
              <p className="text-sm font-semibold text-gray-800">เปิดใช้งานระบบผ่อนไอดี</p>
              <p className="text-xs text-gray-400 mt-0.5">ปิด = แสดงหน้า "ปิดชั่วคราว" ให้ลูกค้า</p>
            </div>
            <button
              onClick={() => set("enabled", !form.enabled)}
              className="shrink-0 cursor-pointer"
            >
              {form.enabled
                ? <ToggleRight size={36} className="text-red-600" />
                : <ToggleLeft  size={36} className="text-gray-300" />}
            </button>
          </div>

          <Field label="LINE แอดมิน URL" description="ลิงก์ที่ปุ่ม 'ทักไลน์แอดมิน' จะเปิด">
            <div className="relative">
              <Link size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={form.lineUrl}
                onChange={(e) => set("lineUrl", e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all"
              />
            </div>
          </Field>

          <Field label="รูปหน้าปกสินค้า (URL)" description="รูปที่แสดงในบิล popup — เว้นว่าง = ไม่แสดงรูป">
            <div className="relative">
              <Image size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={form.coverImage}
                onChange={(e) => set("coverImage", e.target.value)}
                placeholder="https://..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all"
              />
            </div>
          </Field>
        </div>
      </Card>

      {/* ── 2. Price Range Markup ── */}
      <Card
        title="ค่าบริการตามช่วงราคา"
        subtitle="ลูกค้าจะไม่เห็นเปอร์เซ็นต์ ระบบจะแสดงเฉพาะยอดที่ต้องชำระจริง"
        icon={DollarSign}
      >
        <div className="space-y-3">
          {form.priceRanges.map((range) => (
            <PriceRangeRow
              key={range.id}
              range={range}
              onUpdate={(updated) => updateRange(range.id, updated)}
              onDelete={() => deleteRange(range.id)}
            />
          ))}

          <button
            onClick={addRange}
            className="mt-1 flex items-center gap-2 text-sm text-red-600 font-semibold hover:text-red-700 transition-colors cursor-pointer"
          >
            <Plus size={15} />
            เพิ่มช่วงราคา
          </button>
        </div>
      </Card>

      {/* ── 3. Down options ── */}
      <Card title="ตัวเลือกเงินเปิดบิล (%)" icon={Percent}>
        <Field
          label="เปอร์เซ็นต์ที่ให้เลือก"
          description="ใส่ตัวเลขคั่นด้วยจุลภาค ไม่เกิน 6 ตัว เช่น 10,40,50,80"
        >
          <TextInput
            value={form.downOptions}
            onChange={(v) => set("downOptions", v)}
            placeholder="10,40,50,80"
          />
        </Field>
        <div className="mt-3 flex flex-wrap gap-2">
          {form.downOptions.split(",").map((s) => s.trim()).filter(Boolean).map((p, i) => (
            <span key={i} className="px-3 py-1 rounded-full bg-red-50 border border-red-100 text-red-700 text-xs font-bold">
              {p}%
            </span>
          ))}
        </div>
      </Card>

      {/* ── 4. Plan settings ── */}
      <Card title="แผนผ่อนชำระ (จำนวนงวดที่เลือกได้)" icon={Calendar}>
        <div className="space-y-4">
          {/* Daily */}
          <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 space-y-3">
            <p className="font-semibold text-gray-800 text-sm">แผนรายวัน</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="ค่าบริการเริ่มต้น (%)" description="ใช้เมื่อราคาไม่อยู่ในช่วงที่กำหนดข้างบน">
                <NumberInput
                  value={form.markupDaily}
                  onChange={(v) => set("markupDaily", v)}
                  suffix="%"
                />
              </Field>
              <Field label="จำนวนงวดที่เลือกได้" description="จำนวนวัน เช่น 7,14,21,30">
                <TextInput
                  value={form.dailyOptions}
                  onChange={(v) => set("dailyOptions", v)}
                  placeholder="7,14,21,30"
                />
              </Field>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.dailyOptions.split(",").map((s) => s.trim()).filter(Boolean).map((n, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-700 text-xs font-medium">
                  {n} วัน
                </span>
              ))}
            </div>
          </div>

          {/* Weekly */}
          <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 space-y-3">
            <p className="font-semibold text-gray-800 text-sm">แผนรายสัปดาห์</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="ค่าบริการเริ่มต้น (%)">
                <NumberInput
                  value={form.markupWeekly}
                  onChange={(v) => set("markupWeekly", v)}
                  suffix="%"
                />
              </Field>
              <Field label="จำนวนงวดที่เลือกได้" description="จำนวนสัปดาห์ เช่น 2,3,4,6,8,12">
                <TextInput
                  value={form.weeklyOptions}
                  onChange={(v) => set("weeklyOptions", v)}
                  placeholder="2,3,4,6,8,12"
                />
              </Field>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.weeklyOptions.split(",").map((s) => s.trim()).filter(Boolean).map((n, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-700 text-xs font-medium">
                  {n} สัปดาห์
                </span>
              ))}
            </div>
          </div>

          {/* Monthly */}
          <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 space-y-3">
            <p className="font-semibold text-gray-800 text-sm">แผนรายเดือน</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="ค่าบริการเริ่มต้น (%)">
                <NumberInput
                  value={form.markupMonthly}
                  onChange={(v) => set("markupMonthly", v)}
                  suffix="%"
                />
              </Field>
              <Field label="จำนวนงวดที่เลือกได้" description="จำนวนเดือน เช่น 2,3,4,6,12">
                <TextInput
                  value={form.monthlyOptions}
                  onChange={(v) => set("monthlyOptions", v)}
                  placeholder="2,3,4,6,12"
                />
              </Field>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.monthlyOptions.split(",").map((s) => s.trim()).filter(Boolean).map((n, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-700 text-xs font-medium">
                  {n} เดือน
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* ── 5. Terms ── */}
      <Card title="เงื่อนไขการผ่อนชำระ" icon={Calculator}>
        <div className="space-y-2 mb-4">
          {form.terms.map((term, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 text-[10px] font-bold flex items-center justify-center mt-1">
                {i + 1}
              </span>
              <textarea
                value={term}
                rows={2}
                onChange={(e) => {
                  const next = [...form.terms];
                  next[i] = e.target.value;
                  set("terms", next);
                }}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all resize-none"
              />
              <button
                onClick={() => set("terms", form.terms.filter((_, j) => j !== i))}
                className="shrink-0 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors mt-0.5 cursor-pointer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => set("terms", [...form.terms, ""])}
          className="flex items-center gap-2 text-sm text-red-600 font-semibold hover:text-red-700 transition-colors cursor-pointer"
        >
          <Plus size={15} />
          เพิ่มเงื่อนไข
        </button>
      </Card>

      {/* ── 6. How To Steps ── */}
      <Card
        title="วิธีใช้งาน (4 ขั้นตอน)"
        subtitle="ข้อความที่แสดงในแท็บ 'วิธีใช้งาน' หน้าผ่อนชำระ"
        icon={BookOpen}
      >
        <div className="space-y-3">
          {form.howtoSteps.map((step, i) => {
            const ICONS = ["🧮", "📄", "💬", "🎮"];
            return (
              <div key={i} className="rounded-xl border border-gray-200 bg-gray-50/50 overflow-hidden">
                <div className="px-3 py-2 bg-gray-100/60 border-b border-gray-200 flex items-center gap-2">
                  <span className="text-base">{ICONS[i] ?? `${i + 1}.`}</span>
                  <span className="text-xs font-semibold text-gray-500">ขั้นตอนที่ {i + 1}</span>
                </div>
                <div className="p-3 space-y-2.5">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">หัวข้อ</label>
                    <input
                      type="text"
                      value={step.title}
                      onChange={(e) => {
                        const next = [...form.howtoSteps];
                        next[i] = { ...next[i], title: e.target.value };
                        set("howtoSteps", next);
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">คำอธิบาย</label>
                    <textarea
                      value={step.desc}
                      rows={2}
                      onChange={(e) => {
                        const next = [...form.howtoSteps];
                        next[i] = { ...next[i], desc: e.target.value };
                        set("howtoSteps", next);
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all resize-none"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Bottom save */}
      <div className="flex justify-end pb-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-all disabled:opacity-60 shadow-sm cursor-pointer"
        >
          <Save size={15} />
          {saving ? "กำลังบันทึก..." : "บันทึกทั้งหมด"}
        </button>
      </div>
    </div>
  );
}

