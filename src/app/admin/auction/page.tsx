"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Gavel, Plus, Pencil, Trash2, X, CheckCircle2,
  Clock, Users, AlertCircle, RefreshCw,
  Shield, Flame, Tag, TriangleAlert, Trophy, Crown,
} from "lucide-react";
import { UploadInput } from "@/components/ui/UploadInput";
import { MultiMediaUpload } from "@/components/ui/MultiMediaUpload";

interface Auction {
  _id: string;
  title: string;
  gameImage: string;
  accountLevel: number;
  description: string;
  highlights: string[];
  tag: string;
  tagColor: string;
  server: string;
  startBid: number;
  currentBid: number;
  minBidStep: number;
  endsAt: string;
  status: "active" | "ended" | "cancelled";
  isHot: boolean;
  verified: boolean;
  topBidder?: string;
  totalBids: number;
  createdAt: string;
}

interface Category {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
  order: number;
  isActive: boolean;
}

const EMPTY_CAT = { name: "", slug: "", image: "" };

const EMPTY_FORM = {
  title: "", gameImages: [] as string[], accountLevel: 1, description: "",
  highlightsRaw: "", tag: "", tagColor: "#6b7280", server: "TH",
  startBid: 100, minBidStep: 100, endsAt: "", isHot: false, verified: true,
};

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
interface ConfirmOptions {
  title: string;
  message: string;
  warning?: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
}

function ConfirmDialog({ opts, onClose }: { opts: ConfirmOptions; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">
        <div className={`px-5 pt-5 pb-4 flex items-start gap-3`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${opts.danger ? "bg-red-100" : "bg-amber-100"}`}>
            <TriangleAlert size={20} className={opts.danger ? "text-red-600" : "text-amber-600"} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-gray-900 text-base leading-tight">{opts.title}</p>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">{opts.message}</p>
            {opts.warning && (
              <p className={`text-xs font-bold mt-2 px-3 py-2 rounded-xl ${opts.danger ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}>
                ⚠️ {opts.warning}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
            ยกเลิก
          </button>
          <button onClick={() => { opts.onConfirm(); onClose(); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-black text-white transition-colors ${opts.danger ? "bg-red-600 hover:bg-red-700" : "bg-amber-500 hover:bg-amber-600"}`}>
            {opts.confirmLabel || "ยืนยัน"}
          </button>
        </div>
      </div>
    </div>
  );
}

function timeLeft(endsAt: string) {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return "หมดเวลา";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}ช. ${m}น.` : `${m} นาที`;
}

interface WinnerRecord {
  _id: string;
  title: string;
  gameImage: string;
  tag: string;
  tagColor: string;
  topBidder: string | null;
  winnerBid: number;
  winnerClaimed: boolean;
  totalBids: number;
  uniqueBidders: number;
  endsAt: string;
  startBid: number;
}

export default function AdminAuctionPage() {
  const [activeTab, setActiveTab] = useState<"auctions" | "categories" | "winners">("auctions");

  // ── Auction state ──
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<Auction | null>(null);
  const [form, setForm]         = useState({ ...EMPTY_FORM });
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState<{ msg: string; ok: boolean } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // ── Category state ──
  const [categories, setCategories]   = useState<Category[]>([]);
  const [catLoading, setCatLoading]   = useState(false);
  const [catForm, setCatForm]         = useState({ ...EMPTY_CAT });
  const [editingCat, setEditingCat]   = useState<Category | null>(null);
  const [showCatForm, setShowCatForm] = useState(false);
  const [catSaving, setCatSaving]     = useState(false);
  const [deletingCat, setDeletingCat] = useState<string | null>(null);

  // ── Winners state ──
  const [winners, setWinners]         = useState<WinnerRecord[]>([]);
  const [winnersLoading, setWinnersLoading] = useState(false);

  // ── Confirm dialog ──
  const [confirmOpts, setConfirmOpts] = useState<ConfirmOptions | null>(null);

  const confirm = (opts: ConfirmOptions) => setConfirmOpts(opts);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/auction");
    if (res.ok) setAuctions(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh ทุก 30 วิ ซิงค์กับ auto-end poller
  useEffect(() => {
    if (activeTab !== "auctions") return;
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [activeTab, load]);

  const loadWinners = useCallback(async () => {
    setWinnersLoading(true);
    const res = await fetch("/api/admin/auction/winners");
    if (res.ok) setWinners(await res.json());
    setWinnersLoading(false);
  }, []);

  useEffect(() => {
    if (activeTab === "winners") loadWinners();
  }, [activeTab, loadWinners]);

  // ── Category functions ──
  const loadCats = useCallback(async () => {
    setCatLoading(true);
    const res = await fetch("/api/admin/categories?type=auction");
    if (res.ok) setCategories(await res.json());
    setCatLoading(false);
  }, []);

  useEffect(() => { loadCats(); }, [loadCats]);

  const openAddCat = () => {
    setEditingCat(null);
    setCatForm({ ...EMPTY_CAT });
    setShowCatForm(true);
  };

  const openEditCat = (c: Category) => {
    setEditingCat(c);
    setCatForm({ name: c.name, slug: c.slug || "", image: c.image || "" });
    setShowCatForm(true);
  };

  const saveCat = async () => {
    if (!catForm.name.trim()) { showToast("กรุณากรอกชื่อหมวดหมู่", false); return; }
    setCatSaving(true);
    const url    = editingCat ? `/api/admin/categories/${editingCat._id}` : "/api/admin/categories";
    const method = editingCat ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: catForm.name.trim(), slug: catForm.slug.trim() || undefined, image: catForm.image.trim() || undefined, isActive: true, type: "auction" }) });
    if (res.ok) { showToast(editingCat ? "แก้ไขหมวดหมู่แล้ว" : "เพิ่มหมวดหมู่แล้ว"); setShowCatForm(false); loadCats(); }
    else showToast("เกิดข้อผิดพลาด", false);
    setCatSaving(false);
  };

  const deleteCat = (id: string, name: string) => {
    confirm({
      title: "ลบหมวดหมู่",
      message: `ต้องการลบหมวดหมู่ "${name}" ใช่ไหม?`,
      confirmLabel: "ลบหมวดหมู่",
      danger: true,
      onConfirm: async () => {
        setDeletingCat(id);
        const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
        if (res.ok) { showToast("ลบหมวดหมู่แล้ว"); loadCats(); }
        else showToast("เกิดข้อผิดพลาด", false);
        setDeletingCat(null);
      },
    });
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  };

  const openEdit = (a: Auction) => {
    setEditing(a);
    const d = new Date(a.endsAt);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const imgs = (a as any).gameImages?.length
      ? (a as any).gameImages
      : a.gameImage ? [a.gameImage] : [];
    setForm({
      title: a.title, gameImages: imgs, accountLevel: a.accountLevel,
      description: a.description, highlightsRaw: (a.highlights || []).join(", "),
      tag: a.tag, tagColor: a.tagColor, server: a.server,
      startBid: a.startBid, minBidStep: a.minBidStep,
      endsAt: local, isHot: a.isHot, verified: a.verified,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || form.gameImages.length === 0 || !form.startBid || !form.endsAt) {
      showToast("กรุณากรอกข้อมูลให้ครบ (ชื่อ, รูป, ราคา, วันสิ้นสุด)", false);
      return;
    }
    setSaving(true);
    const body = {
      ...form,
      gameImage: form.gameImages[0],
      highlights: form.highlightsRaw.split(",").map((s) => s.trim()).filter(Boolean),
      endsAt: new Date(form.endsAt).toISOString(),
    };
    const url    = editing ? `/api/admin/auction/${editing._id}` : "/api/admin/auction";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) { showToast(data.error || "เกิดข้อผิดพลาด", false); setSaving(false); return; }
    showToast(editing ? "แก้ไขสำเร็จ" : "สร้างการประมูลสำเร็จ");
    setShowForm(false);
    load();
    setSaving(false);
  };

  const handleDelete = (id: string, title: string) => {
    confirm({
      title: "ลบการประมูล",
      message: `ต้องการลบ "${title}" ใช่ไหม?`,
      warning: "เหรียญจะถูกคืนให้ผู้ประมูลสูงสุดอัตโนมัติ",
      confirmLabel: "ลบการประมูล",
      danger: true,
      onConfirm: async () => {
        setDeleting(id);
        const res = await fetch(`/api/admin/auction/${id}`, { method: "DELETE" });
        if (res.ok) { showToast("ลบสำเร็จ"); load(); }
        else showToast("เกิดข้อผิดพลาด", false);
        setDeleting(null);
      },
    });
  };

  const handleStatus = (id: string, title: string, status: string) => {
    const label = status === "ended" ? "สิ้นสุดการประมูล" : status === "cancelled" ? "ยกเลิกการประมูล" : "เปิดการประมูล";
    const isDanger = status === "cancelled";
    confirm({
      title: label,
      message: `ต้องการ${label} "${title}" ใช่ไหม?`,
      warning: status === "cancelled" ? "เหรียญจะถูกคืนให้ผู้ประมูลสูงสุดอัตโนมัติ" : undefined,
      confirmLabel: label,
      danger: isDanger,
      onConfirm: async () => {
        const res = await fetch(`/api/admin/auction/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (res.ok) { showToast(`${label}แล้ว`); load(); }
        else showToast("เกิดข้อผิดพลาด", false);
      },
    });
  };

  const now = new Date();
  const active    = auctions.filter((a) => a.status === "active" && new Date(a.endsAt) > now);
  const expired   = auctions.filter((a) => a.status === "active" && new Date(a.endsAt) <= now);
  const ended     = auctions.filter((a) => a.status === "ended");
  const cancelled = auctions.filter((a) => a.status === "cancelled");

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <Gavel size={22} className="text-red-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">จัดการประมูลไอดีเกม</h1>
            <p className="text-xs text-gray-400 font-medium">สร้าง แก้ไข และติดตามการประมูลทั้งหมด</p>
          </div>
        </div>
        <div className="flex gap-2">
          {activeTab === "auctions" && (
            <>
              <button onClick={load} className="flex items-center gap-1.5 bg-gray-100 text-gray-600 font-bold text-sm px-3 py-2 rounded-xl hover:bg-gray-200 transition-colors">
                <RefreshCw size={14} /> รีเฟรช
              </button>
              <button onClick={openCreate} className="flex items-center gap-2 bg-red-600 text-white font-bold text-sm px-4 py-2 rounded-xl hover:bg-red-700 transition-colors">
                <Plus size={16} /> สร้างการประมูล
              </button>
            </>
          )}
          {activeTab === "categories" && (
            <button onClick={openAddCat} className="flex items-center gap-2 bg-red-600 text-white font-bold text-sm px-4 py-2 rounded-xl hover:bg-red-700 transition-colors">
              <Plus size={16} /> เพิ่มหมวดหมู่
            </button>
          )}
          {activeTab === "winners" && (
            <button onClick={loadWinners} className="flex items-center gap-1.5 bg-gray-100 text-gray-600 font-bold text-sm px-3 py-2 rounded-xl hover:bg-gray-200 transition-colors">
              <RefreshCw size={14} /> รีเฟรช
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit mb-6">
        {([
          { key: "auctions",   label: "รายการประมูล",  icon: <Gavel size={14} /> },
          { key: "categories", label: "หมวดหมู่เกม",   icon: <Tag size={14} /> },
          { key: "winners",    label: "ประวัติผู้ชนะ",  icon: <Trophy size={14} /> },
        ] as const).map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <span className={activeTab === key ? "text-red-600" : ""}>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* ── CATEGORIES TAB ── */}
      {activeTab === "categories" && (
        <div>
          {catLoading ? (
            <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {categories.map((cat) => (
                <div key={cat._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3 group hover:shadow-md transition-all">
                  {/* Image */}
                  <div className="w-full aspect-square rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                    {cat.image ? (
                      <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "/product/pokemon.webp"; }} />
                    ) : (
                      <span className="text-3xl font-black text-gray-300">{cat.name.charAt(0)}</span>
                    )}
                  </div>
                  {/* Name + slug */}
                  <div className="flex-1">
                    <p className="font-black text-gray-900 text-sm">{cat.name}</p>
                    <p className="text-[11px] text-gray-400 font-medium">/{cat.slug || cat.name.toLowerCase().replace(/\s+/g, "-")}</p>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-1.5">
                    <button onClick={() => openEditCat(cat)} className="flex-1 flex items-center justify-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 py-1.5 rounded-lg transition-colors">
                      <Pencil size={12} /> แก้ไข
                    </button>
                    <button onClick={() => deleteCat(cat._id, cat.name)} disabled={deletingCat === cat._id} className="flex-1 flex items-center justify-center gap-1 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 py-1.5 rounded-lg transition-colors disabled:opacity-40">
                      <Trash2 size={12} /> ลบ
                    </button>
                  </div>
                </div>
              ))}

              {/* Add card */}
              <button onClick={openAddCat} className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 hover:border-red-300 hover:bg-red-50/30 transition-all flex flex-col items-center justify-center gap-2 aspect-square text-gray-400 hover:text-red-500 cursor-pointer">
                <Plus size={28} />
                <span className="text-xs font-bold">เพิ่มหมวดหมู่</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── AUCTIONS TAB ── */}
      {activeTab === "auctions" && <>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "กำลังประมูล",    val: active.length,   color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "หมดเวลา รอปิด", val: expired.length,  color: "text-amber-600",   bg: "bg-amber-50" },
          { label: "สิ้นสุดแล้ว",   val: ended.length,    color: "text-gray-500",    bg: "bg-gray-50" },
          { label: "ยกเลิก",         val: cancelled.length, color: "text-orange-500", bg: "bg-orange-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
              <Gavel size={18} className={s.color} />
            </div>
            <div>
              <p className={`font-black text-2xl leading-tight ${s.color}`}>{s.val}</p>
              <p className="text-xs text-gray-400 font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
        </div>
      ) : auctions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <Gavel size={48} className="opacity-20" />
          <p className="font-bold">ยังไม่มีการประมูล กด "สร้างการประมูล" เพื่อเริ่ม</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["ชื่อ / เกม", "ราคาปัจจุบัน", "ประมูล", "สิ้นสุด", "สถานะ", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-black text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {auctions.map((a) => (
                <tr key={a._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={a.gameImage} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = "/product/pokemon.webp"; }} />
                      <div>
                        <p className="font-bold text-gray-900 text-sm leading-tight line-clamp-1">{a.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: a.tagColor }}>{a.tag}</span>
                          {a.isHot && <Flame size={12} className="text-orange-500" />}
                          {a.verified && <Shield size={12} className="text-emerald-500" />}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-black text-red-600">฿{a.currentBid.toLocaleString()}</p>
                    {a.topBidder && <p className="text-[10px] text-gray-400 font-medium">{a.topBidder}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-gray-600 font-bold">
                      <Users size={13} /> {a.totalBids}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      const isExpired = a.status === "active" && new Date(a.endsAt) <= new Date();
                      return (
                        <div className="flex items-center gap-1 text-gray-600">
                          <Clock size={13} className={isExpired ? "text-amber-500" : ""} />
                          <span className={`text-xs font-medium ${isExpired ? "text-amber-600 font-bold" : ""}`}>
                            {a.status === "active" ? timeLeft(a.endsAt) : new Date(a.endsAt).toLocaleDateString("th-TH")}
                          </span>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      const isExpired = a.status === "active" && new Date(a.endsAt) <= new Date();
                      return (
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                          isExpired            ? "bg-amber-100 text-amber-700 animate-pulse" :
                          a.status === "active"  ? "bg-emerald-100 text-emerald-700" :
                          a.status === "ended"   ? "bg-gray-100 text-gray-500" :
                                                   "bg-orange-100 text-orange-600"
                        }`}>
                          {isExpired ? "⏰ หมดเวลา รอปิด" : a.status === "active" ? "กำลังประมูล" : a.status === "ended" ? "สิ้นสุดแล้ว" : "ยกเลิก"}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      {a.status === "active" && new Date(a.endsAt) <= new Date() && (
                        <button onClick={() => handleStatus(a._id, a.title, "ended")} className="text-[10px] font-bold text-white bg-amber-500 hover:bg-amber-600 px-2.5 py-1 rounded-lg transition-colors">
                          ปิด + ตัดสินผู้ชนะ
                        </button>
                      )}
                      {a.status === "active" && new Date(a.endsAt) > new Date() && (
                        <button onClick={() => handleStatus(a._id, a.title, "ended")} className="text-[10px] font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-lg transition-colors">
                          ปิดประมูล
                        </button>
                      )}
                      {a.status === "ended" && (
                        <button onClick={() => handleStatus(a._id, a.title, "active")} className="text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors">
                          เปิดใหม่
                        </button>
                      )}
                      <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(a._id, a.title)} disabled={deleting === a._id} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      </> /* end auctions tab */}

      {/* ── WINNERS TAB ── */}
      {activeTab === "winners" && (
        <div>
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "ทั้งหมด",       val: winners.length,                               color: "text-gray-700",    bg: "bg-gray-50" },
              { label: "รับรางวัลแล้ว", val: winners.filter(w => w.winnerClaimed).length,  color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "รอรับรางวัล",   val: winners.filter(w => !w.winnerClaimed && w.topBidder).length, color: "text-amber-600", bg: "bg-amber-50" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <Trophy size={18} className={s.color} />
                </div>
                <div>
                  <p className={`font-black text-2xl leading-tight ${s.color}`}>{s.val}</p>
                  <p className="text-xs text-gray-400 font-medium">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {winnersLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
            </div>
          ) : winners.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
              <Trophy size={48} className="opacity-20" />
              <p className="font-bold">ยังไม่มีการประมูลที่สิ้นสุด</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["ชื่อ / เกม", "ผู้ชนะ", "ราคาที่ชนะ", "ผู้เข้าร่วม", "สถานะ", "วันสิ้นสุด"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-black text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {winners.map((w) => (
                    <tr key={String(w._id)} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={w.gameImage} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = "/product/pokemon.webp"; }} />
                          <div>
                            <p className="font-bold text-gray-900 text-sm leading-tight line-clamp-1">{w.title}</p>
                            <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: w.tagColor }}>{w.tag}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {w.topBidder ? (
                          <div className="flex items-center gap-1.5">
                            <Crown size={13} className="text-amber-500 shrink-0" />
                            <span className="font-bold text-gray-900 text-sm">{w.topBidder}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium">ไม่มีผู้ประมูล</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-black text-red-600">฿{w.winnerBid.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-400">เริ่ม ฿{w.startBid.toLocaleString()}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1 text-gray-700 font-bold text-xs">
                            <Users size={12} /> {w.uniqueBidders} คน
                          </div>
                          <div className="text-[10px] text-gray-400">{w.totalBids} ครั้งทั้งหมด</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {w.topBidder ? (
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${w.winnerClaimed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700 animate-pulse"}`}>
                            {w.winnerClaimed ? "✅ รับแล้ว" : "⏳ รอรับ"}
                          </span>
                        ) : (
                          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">ไม่มีผู้ชนะ</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500">{new Date(w.endsAt).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Category Form Modal */}
      {showCatForm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowCatForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-black text-gray-900">{editingCat ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่ใหม่"}</h2>
              <button onClick={() => setShowCatForm(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">ชื่อหมวดหมู่ *</label>
                <input
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  placeholder="เช่น ROV, Genshin, Free Fire"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-400 font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Slug (URL path — ถ้าว่างจะ auto-generate)</label>
                <input
                  value={catForm.slug}
                  onChange={(e) => setCatForm({ ...catForm, slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") })}
                  placeholder="เช่น rov, genshin, free-fire"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-400 font-medium font-mono"
                />
                {catForm.name && !catForm.slug && (
                  <p className="text-[11px] text-gray-400 mt-1">จะใช้ slug: <span className="font-mono text-gray-600">{catForm.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}</span></p>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">รูปภาพหมวดหมู่</label>
                <UploadInput
                  value={catForm.image}
                  onChange={(url) => setCatForm({ ...catForm, image: url })}
                  accept="image/*"
                />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowCatForm(false)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors text-sm">
                ยกเลิก
              </button>
              <button onClick={saveCat} disabled={catSaving} className="flex-1 bg-red-600 text-white font-black py-3 rounded-xl hover:bg-red-700 disabled:opacity-60 transition-colors text-sm flex items-center justify-center gap-2">
                {catSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle2 size={15} /> {editingCat ? "บันทึก" : "เพิ่มหมวดหมู่"}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auction Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-black text-gray-900">{editing ? "แก้ไขการประมูล" : "สร้างการประมูลใหม่"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 grid grid-cols-2 gap-4">
              {/* Title */}
              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-600 mb-1 block">ชื่อรายการประมูล *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="เช่น ROV Account Lv.50 Conqueror"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-400 font-medium" />
              </div>

              {/* Media Upload */}
              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-600 mb-2 block">รูปภาพ / GIF / วิดีโอ * <span className="text-gray-400 font-normal">(รูปแรก = ภาพหลัก)</span></label>
                <MultiMediaUpload
                  values={form.gameImages}
                  onChange={(urls) => setForm({ ...form, gameImages: urls })}
                  folder="auction"
                />
              </div>

              {/* Description */}
              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-600 mb-1 block">คำอธิบาย</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3} placeholder="รายละเอียดไอดี..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-400 font-medium resize-none" />
              </div>

              {/* Highlights */}
              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-600 mb-1 block">Highlights (คั่นด้วย ,)</label>
                <input value={form.highlightsRaw} onChange={(e) => setForm({ ...form, highlightsRaw: e.target.value })}
                  placeholder="Conqueror Rank, 140+ Skins, Full Arcana"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-400 font-medium" />
              </div>

              {/* Tag — dropdown จาก categories */}
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">หมวดหมู่เกม</label>
                <select
                  value={form.tag}
                  onChange={(e) => setForm({ ...form, tag: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-400 font-medium cursor-pointer bg-white"
                >
                  <option value="">-- เลือกหมวดหมู่ --</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Tag color */}
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">สี Tag</label>
                <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
                  <input type="color" value={form.tagColor} onChange={(e) => setForm({ ...form, tagColor: e.target.value })}
                    className="w-8 h-8 rounded-lg border-0 cursor-pointer" />
                  <span className="text-sm font-medium text-gray-700">{form.tagColor}</span>
                </div>
              </div>

              {/* Server + Level */}
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">เซิร์ฟเวอร์</label>
                <select value={form.server} onChange={(e) => setForm({ ...form, server: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-400 font-medium cursor-pointer">
                  {["TH", "Asia", "SEA", "NA", "EU", "Global"].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">ระดับ Account</label>
                <input type="number" min={1} value={form.accountLevel} onChange={(e) => setForm({ ...form, accountLevel: Number(e.target.value) })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-400 font-medium" />
              </div>

              {/* Start Bid + Step */}
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">ราคาเริ่มต้น (฿) *</label>
                <input type="number" min={1} value={form.startBid} onChange={(e) => setForm({ ...form, startBid: Number(e.target.value) })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-400 font-medium" />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">ขั้นต่ำต่อครั้ง (฿)</label>
                <input type="number" min={1} value={form.minBidStep} onChange={(e) => setForm({ ...form, minBidStep: Number(e.target.value) })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-400 font-medium" />
              </div>

              {/* Ends At */}
              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-600 mb-1 block">วันเวลาสิ้นสุด *</label>
                <input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-400 font-medium" />
              </div>

              {/* Toggles */}
              <div className="col-span-2 flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isHot} onChange={(e) => setForm({ ...form, isHot: e.target.checked })}
                    className="w-4 h-4 accent-red-600" />
                  <span className="text-sm font-bold text-gray-700 flex items-center gap-1"><Flame size={14} className="text-orange-500" /> Hot</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.verified} onChange={(e) => setForm({ ...form, verified: e.target.checked })}
                    className="w-4 h-4 accent-emerald-600" />
                  <span className="text-sm font-bold text-gray-700 flex items-center gap-1"><Shield size={14} className="text-emerald-500" /> การันตี</span>
                </label>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors text-sm">
                ยกเลิก
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-red-600 text-white font-black py-3 rounded-xl hover:bg-red-700 disabled:opacity-60 transition-colors text-sm flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle2 size={15} /> {editing ? "บันทึกการแก้ไข" : "สร้างการประมูล"}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmOpts && (
        <ConfirmDialog opts={confirmOpts} onClose={() => setConfirmOpts(null)} />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-2xl shadow-xl font-bold text-sm text-white flex items-center gap-2 whitespace-nowrap ${toast.ok ? "bg-emerald-600" : "bg-red-600"}`}>
          {toast.ok ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />} {toast.msg}
        </div>
      )}
    </div>
  );
}
