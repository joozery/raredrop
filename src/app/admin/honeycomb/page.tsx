"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Hexagon, Plus, Edit2, Trash2, Save, X, Loader2, CheckCircle2,
  Eye, EyeOff, AlertTriangle, ImageIcon, Coins, Package, Settings2,
  TriangleAlert, Lock, Unlock,
} from "lucide-react";
import { UploadInput } from "@/components/ui/UploadInput";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HoneycombItem {
  _id: string;
  name: string;
  description?: string;
  image: string;
  category: "legendary" | "epic" | "rare" | "common";
  type: "item" | "coin_reward";
  coinAmount: number;
  value: number;
  isActive: boolean;
}

interface BoxItem {
  itemId: HoneycombItem | string;
  rate: number;
  isLocked: boolean;
}

interface HoneycombBox {
  _id?: string;
  name: string;
  price: number;
  mainPrize: string;
  description: string;
  image: string;
  badge?: string;
  badgeBg?: string;
  isActive: boolean;
  sortOrder: number;
  eventStartDate?: string;
  eventEndDate?: string;
  items: BoxItem[];
}

interface ConfirmOpts {
  title: string;
  message: string;
  warning?: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CAT_META = {
  legendary: { label: "Legendary", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-300", dot: "bg-amber-500", badge: "bg-amber-100 text-amber-700" },
  epic:      { label: "Epic",      color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-300", dot: "bg-purple-500", badge: "bg-purple-100 text-purple-700" },
  rare:      { label: "Rare",      color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-300",   dot: "bg-blue-500",   badge: "bg-blue-100 text-blue-700"   },
  common:    { label: "Common",    color: "text-slate-500",  bg: "bg-slate-50",  border: "border-slate-200",  dot: "bg-slate-400",  badge: "bg-slate-100 text-slate-600" },
};

const EMPTY_BOX: HoneycombBox = {
  name: "", price: 50, mainPrize: "", description: "",
  image: "/product/pokemon.webp", badge: "", badgeBg: "bg-red-600 text-white",
  isActive: true, sortOrder: 1, eventStartDate: "", eventEndDate: "", items: [],
};

const EMPTY_ITEM: Omit<HoneycombItem, "_id"> = {
  name: "", description: "", image: "",
  category: "common", type: "item",
  coinAmount: 0, value: 0, isActive: true,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getItem(bi: BoxItem): HoneycombItem | null {
  if (typeof bi.itemId === "object" && bi.itemId !== null) return bi.itemId as HoneycombItem;
  return null;
}

// ─── ConfirmDialog ────────────────────────────────────────────────────────────

function ConfirmDialog({ opts, onClose }: { opts: ConfirmOpts; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm border border-slate-200 shadow-2xl p-6">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${opts.danger ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}>
          <TriangleAlert size={18} />
        </div>
        <h3 className="font-black text-slate-800 text-base mb-1">{opts.title}</h3>
        <p className="text-sm text-slate-600 mb-2">{opts.message}</p>
        {opts.warning && <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-4 border border-amber-200">{opts.warning}</p>}
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">ยกเลิก</button>
          <button onClick={() => { opts.onConfirm(); onClose(); }}
            className={`flex-1 px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors ${opts.danger ? "bg-red-600 hover:bg-red-700" : "bg-amber-500 hover:bg-amber-600"}`}>
            {opts.confirmLabel || "ยืนยัน"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Rate Bar ────────────────────────────────────────────────────────────────

function RateBar({ items }: { items: BoxItem[] }) {
  const total = items.reduce((s, r) => s + (r.rate || 0), 0);
  const ok = Math.abs(total - 100) < 0.01;
  const over = total > 100;
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold text-slate-500">รวมเรท</span>
          <span className={`text-sm font-black tabular-nums ${ok ? "text-emerald-600" : over ? "text-red-600" : "text-amber-600"}`}>
            {total.toFixed(1)}%
          </span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${ok ? "bg-emerald-500" : over ? "bg-red-500" : "bg-amber-400"}`}
            style={{ width: `${Math.min(total, 100)}%` }} />
        </div>
      </div>
      {!ok && (
        <div className={`flex items-center gap-1 text-[11px] font-bold shrink-0 ${over ? "text-red-600" : "text-amber-600"}`}>
          <AlertTriangle size={13} />
          {over ? `เกิน ${(total - 100).toFixed(1)}%` : `ขาด ${(100 - total).toFixed(1)}%`}
        </div>
      )}
      {ok && <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminHoneycombPage() {
  const [tab, setTab]             = useState<"boxes" | "items">("boxes");
  const [boxes, setBoxes]         = useState<HoneycombBox[]>([]);
  const [allItems, setAllItems]   = useState<HoneycombItem[]>([]);
  const [loadingBoxes, setLoadingBoxes] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);

  // Box modal
  const [boxModal, setBoxModal]   = useState(false);
  const [editingBox, setEditingBox] = useState<HoneycombBox | null>(null);
  const [boxForm, setBoxForm]     = useState<HoneycombBox>({ ...EMPTY_BOX });
  const [savingBox, setSavingBox] = useState(false);
  const [deletingBoxId, setDeletingBoxId] = useState<string | null>(null);

  // Item modal
  const [itemModal, setItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<HoneycombItem | null>(null);
  const [itemForm, setItemForm]   = useState<Omit<HoneycombItem, "_id">>(EMPTY_ITEM);
  const [savingItem, setSavingItem] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  // Rate modal (probabilities)
  const [rateModal, setRateModal] = useState<HoneycombBox | null>(null);
  const [rateItems, setRateItems] = useState<BoxItem[]>([]);
  const [savingRate, setSavingRate] = useState(false);

  // Global Settings
  const [globalBg, setGlobalBg] = useState("");
  const [savingGlobalBg, setSavingGlobalBg] = useState(false);
  const [howToPlayText, setHowToPlayText] = useState("");
  const [savingHowToPlay, setSavingHowToPlay] = useState(false);
  const [coinIcon, setCoinIcon] = useState("");
  const [savingCoinIcon, setSavingCoinIcon] = useState(false);
  const [coinExpiry, setCoinExpiry] = useState("");
  const [savingCoinExpiry, setSavingCoinExpiry] = useState(false);
  const [heroImage, setHeroImage] = useState("");
  const [heroLink, setHeroLink] = useState("");
  const [savingHero, setSavingHero] = useState(false);
  const [coinName, setCoinName] = useState("เหรียญรังผึ้ง");
  const [savingCoinName, setSavingCoinName] = useState(false);

  const [confirmOpts, setConfirmOpts] = useState<ConfirmOpts | null>(null);
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const confirm = (opts: ConfirmOpts) => setConfirmOpts(opts);

  // ── Fetchers ──────────────────────────────────────────────────────────────

  const fetchBoxes = useCallback(async () => {
    setLoadingBoxes(true);
    try {
      const res = await fetch("/api/honeycomb-boxes?admin=true");
      if (res.ok) setBoxes(await res.json());
    } finally { setLoadingBoxes(false); }
  }, []);

  const fetchItems = useCallback(async () => {
    setLoadingItems(true);
    try {
      const res = await fetch("/api/admin/honeycomb-items");
      if (res.ok) setAllItems(await res.json());
    } finally { setLoadingItems(false); }
  }, []);

  const fetchGlobalSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/public-settings");
      if (res.ok) {
        const data = await res.json();
        setGlobalBg(data.honeycomb_bg_animation || "");
        setHowToPlayText(data.honeycomb_how_to_play || "");
        setCoinIcon(data.honeycomb_coin_icon || "");
        setCoinExpiry(data.honeycomb_coin_expiry_date || "");
        setHeroImage(data.honeycomb_hero_image || "");
        setHeroLink(data.honeycomb_hero_link || "");
        setCoinName(data.honeycomb_coin_name || "เหรียญรังผึ้ง");
      }
    } catch {}
  }, []);

  useEffect(() => { fetchBoxes(); fetchItems(); fetchGlobalSettings(); }, [fetchBoxes, fetchItems, fetchGlobalSettings]);

  const saveGlobalBg = async () => {
    setSavingGlobalBg(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "honeycomb_bg_animation", value: globalBg }),
      });
      if (!res.ok) throw new Error("บันทึกไม่สำเร็จ");
      showToast("บันทึกพื้นหลังรวมสำเร็จ");
    } catch (e: any) {
      showToast(e.message, false);
    } finally {
      setSavingGlobalBg(false);
    }
  };

  const saveHowToPlay = async () => {
    setSavingHowToPlay(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "honeycomb_how_to_play", value: howToPlayText }),
      });
      if (!res.ok) throw new Error("บันทึกไม่สำเร็จ");
      showToast("บันทึกวิธีการเล่นสำเร็จ");
    } catch (e: any) {
      showToast(e.message, false);
    } finally {
      setSavingHowToPlay(false);
    }
  };

  const saveCoinIcon = async () => {
    setSavingCoinIcon(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "honeycomb_coin_icon", value: coinIcon }),
      });
      if (!res.ok) throw new Error("บันทึกไม่สำเร็จ");
      showToast("บันทึกไอคอนเหรียญสำเร็จ");
    } catch (e: any) {
      showToast(e.message, false);
    } finally {
      setSavingCoinIcon(false);
    }
  };

  const saveHero = async () => {
    setSavingHero(true);
    try {
      await Promise.all([
        fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: "honeycomb_hero_image", value: heroImage }) }),
        fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: "honeycomb_hero_link", value: heroLink }) }),
      ]);
      showToast("บันทึกแบนเนอร์สำเร็จ");
    } catch (e: any) {
      showToast(e.message, false);
    } finally {
      setSavingHero(false);
    }
  };

  const saveCoinName = async () => {
    setSavingCoinName(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "honeycomb_coin_name", value: coinName }),
      });
      if (!res.ok) throw new Error("บันทึกไม่สำเร็จ");
      showToast("บันทึกชื่อเหรียญสำเร็จ");
    } catch (e: any) {
      showToast(e.message, false);
    } finally {
      setSavingCoinName(false);
    }
  };

  const saveCoinExpiry = async () => {
    setSavingCoinExpiry(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "honeycomb_coin_expiry_date", value: coinExpiry }),
      });
      if (!res.ok) throw new Error("บันทึกไม่สำเร็จ");
      showToast("บันทึกวันหมดอายุสำเร็จ");
    } catch (e: any) {
      showToast(e.message, false);
    } finally {
      setSavingCoinExpiry(false);
    }
  };

  // ── Box CRUD ──────────────────────────────────────────────────────────────

  const openCreateBox = () => {
    setEditingBox(null);
    setBoxForm({ ...EMPTY_BOX });
    setBoxModal(true);
  };

  const toLocalDT = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const openEditBox = (box: HoneycombBox) => {
    setEditingBox(box);
    setBoxForm({
      ...box,
      eventStartDate: toLocalDT(box.eventStartDate),
      eventEndDate: toLocalDT(box.eventEndDate),
    });
    setBoxModal(true);
  };

  const handleSaveBox = async () => {
    if (!boxForm.name.trim()) { showToast("กรุณากรอกชื่อกล่อง", false); return; }
    setSavingBox(true);
    try {
      const url    = editingBox?._id ? `/api/honeycomb-boxes/${editingBox._id}` : "/api/honeycomb-boxes";
      const method = editingBox?._id ? "PATCH" : "POST";
      const body   = { 
        ...boxForm, 
        items: undefined,
        eventStartDate: boxForm.eventStartDate ? new Date(boxForm.eventStartDate).toISOString() : undefined,
        eventEndDate: boxForm.eventEndDate ? new Date(boxForm.eventEndDate).toISOString() : undefined,
      }; // items managed separately
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      showToast(editingBox ? "บันทึกสำเร็จ" : "สร้างกล่องสำเร็จ");
      setBoxModal(false);
      fetchBoxes();
    } catch (e: any) { showToast(e.message, false); }
    finally { setSavingBox(false); }
  };

  const handleDeleteBox = (id: string, name: string) => {
    confirm({
      title: `ลบรอบกิจกรรม "${name}"?`,
      message: "รอบกิจกรรมนี้จะถูกลบออกจากระบบถาวร",
      danger: true, confirmLabel: "ลบรอบกิจกรรม",
      onConfirm: async () => {
        setDeletingBoxId(id);
        try {
          const res = await fetch(`/api/honeycomb-boxes/${id}`, { method: "DELETE" });
          if (!res.ok) throw new Error("Delete failed");
          showToast("ลบสำเร็จ");
          fetchBoxes();
        } catch { showToast("ลบไม่สำเร็จ", false); }
        finally { setDeletingBoxId(null); }
      },
    });
  };

  const toggleBoxStatus = async (box: HoneycombBox) => {
    if (!box._id) return;
    await fetch(`/api/honeycomb-boxes/${box._id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !box.isActive }),
    });
    fetchBoxes();
  };

  // ── Item CRUD ──────────────────────────────────────────────────────────────

  const openCreateItem = () => {
    setEditingItem(null);
    setItemForm({ ...EMPTY_ITEM });
    setItemModal(true);
  };

  const openEditItem = (item: HoneycombItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name, description: item.description || "",
      image: item.image, category: item.category,
      type: item.type, coinAmount: item.coinAmount, value: item.value,
      isActive: item.isActive,
    });
    setItemModal(true);
  };

  const handleSaveItem = async () => {
    if (!itemForm.name.trim()) { showToast("กรุณากรอกชื่อไอเทม", false); return; }
    if (itemForm.type !== "coin_reward" && !itemForm.image) { showToast("กรุณาอัพโหลดรูปภาพ", false); return; }
    setSavingItem(true);
    try {
      const url    = editingItem?._id ? `/api/admin/honeycomb-items/${editingItem._id}` : "/api/admin/honeycomb-items";
      const method = editingItem?._id ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(itemForm) });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      showToast(editingItem ? "บันทึกสำเร็จ" : "สร้างไอเทมสำเร็จ");
      setItemModal(false);
      fetchItems();
      fetchBoxes(); // refresh boxes since item data may change
    } catch (e: any) { showToast(e.message, false); }
    finally { setSavingItem(false); }
  };

  const handleDeleteItem = (item: HoneycombItem) => {
    confirm({
      title: `ลบ "${item.name}"?`,
      message: "ไอเทมนี้จะถูกลบและนำออกจากรอบกิจกรรมทุกใบที่ใช้อยู่",
      danger: true, confirmLabel: "ลบไอเทม",
      onConfirm: async () => {
        setDeletingItemId(item._id);
        try {
          const res = await fetch(`/api/admin/honeycomb-items/${item._id}`, { method: "DELETE" });
          if (!res.ok) throw new Error("Failed");
          showToast("ลบสำเร็จ");
          fetchItems();
          fetchBoxes();
        } catch { showToast("ลบไม่สำเร็จ", false); }
        finally { setDeletingItemId(null); }
      },
    });
  };

  // ── Rate Modal ────────────────────────────────────────────────────────────

  const openRateModal = (box: HoneycombBox) => {
    setRateModal(box);
    setRateItems((box.items || []).map((bi) => ({ ...bi })));
  };

  const addItemToBox = (item: HoneycombItem) => {
    const already = rateItems.some((bi) => {
      const id = typeof bi.itemId === "object" ? (bi.itemId as HoneycombItem)._id : bi.itemId;
      return id === item._id;
    });
    if (already) { showToast("ไอเทมนี้มีอยู่แล้วในกล่อง", false); return; }
    setRateItems((prev) => [...prev, { itemId: item, rate: 10, isLocked: false }]);
  };

  const removeItemFromBox = (idx: number) => {
    setRateItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateRate = (idx: number, rate: number) => {
    setRateItems((prev) => prev.map((bi, i) => i === idx ? { ...bi, rate } : bi));
  };

  const toggleLock = (idx: number) => {
    setRateItems((prev) => prev.map((bi, i) => i === idx ? { ...bi, isLocked: !bi.isLocked } : bi));
  };

  const handleSaveRates = async () => {
    if (!rateModal?._id) return;
    setSavingRate(true);
    try {
      const payload = rateItems.map((bi) => ({
        itemId: typeof bi.itemId === "object" ? (bi.itemId as HoneycombItem)._id : bi.itemId,
        rate: bi.rate,
        isLocked: bi.isLocked,
      }));
      const res = await fetch(`/api/honeycomb-boxes/${rateModal._id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      showToast("บันทึกเรทดรอปสำเร็จ");
      setRateModal(null);
      fetchBoxes();
    } catch (e: any) { showToast(e.message, false); }
    finally { setSavingRate(false); }
  };

  const totalRate = rateItems.reduce((s, bi) => s + (bi.rate || 0), 0);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs mb-1">
            <Hexagon size={15} /> HONEYCOMB MANAGEMENT
          </div>
          <h1 className="text-2xl font-black text-slate-800">จัดการเกมรังผึ้ง</h1>
        </div>
        <div className="flex items-center gap-2">
          {tab === "boxes" && (
            <button onClick={openCreateBox}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors">
              <Plus size={15} /> เพิ่มรอบกิจกรรม
            </button>
          )}
          {tab === "items" && (
            <button onClick={openCreateItem}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors">
              <Plus size={15} /> เพิ่มไอเทมรางวัล
            </button>
          )}
        </div>
      </div>

      {/* Global Background Setting */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Settings2 size={15} className="text-slate-400" />
          <h2 className="text-sm font-bold text-slate-700">การตั้งค่าส่วนรวม (Global Settings)</h2>
        </div>
        <div className="px-6 py-5 flex flex-col gap-6">

          {/* Hero Banner */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="flex-1">
                <UploadInput
                  label="รูปภาพแบนเนอร์หน้าเกมรังผึ้ง (honeycomb_hero_image)"
                  value={heroImage}
                  onChange={setHeroImage}
                  folder="banner"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  placeholder="อัพโหลดรูปแบนเนอร์ (เว้นว่างไว้หากไม่ต้องการแสดงแบนเนอร์)"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-700 block mb-1">URL ลิงก์เมื่อคลิกแบนเนอร์</label>
                <input
                  type="text"
                  value={heroLink}
                  onChange={(e) => setHeroLink(e.target.value)}
                  placeholder="https://... (เว้นว่างไว้หากไม่มีลิงก์)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <button
                onClick={saveHero}
                disabled={savingHero}
                className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-900 disabled:opacity-50 transition-colors shrink-0"
              >
                {savingHero ? <Loader2 size={13} className="animate-spin" /> : "บันทึกแบนเนอร์"}
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100" />

          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <UploadInput
                label="ภาพพื้นหลัง / วิดีโอพื้นหลังขณะสุ่ม (ใช้กับทุกรอบกิจกรรม)"
                value={globalBg}
                onChange={setGlobalBg}
                folder="banner"
                accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm"
                placeholder="อัพโหลดพื้นหลัง (เว้นว่างไว้หากต้องการใช้รูปปกของรอบนั้นๆ แทน)"
              />
            </div>
            <button
              onClick={saveGlobalBg}
              disabled={savingGlobalBg}
              className="flex items-center gap-2 px-6 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-900 disabled:opacity-50 transition-colors h-11"
            >
              {savingGlobalBg ? <Loader2 size={13} className="animate-spin" /> : "บันทึกพื้นหลัง"}
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>ข้อความคำแนะนำ "วิธีการเล่นเกมวงล้อรังผึ้ง" (แต่ละบรรทัดคือ 1 ข้อ)</span>
              <span className="text-[10px] text-slate-400 font-normal">เว้นว่างไว้เพื่อใช้ค่าเริ่มต้นของระบบ</span>
            </label>
            <textarea
              value={howToPlayText}
              onChange={(e) => setHowToPlayText(e.target.value)}
              rows={4}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 transition-colors leading-relaxed"
              placeholder={`1. กดปุ่ม สุ่มเปิด 1 ครั้ง หรือ สุ่มเปิดแบบชุด โดยใช้ เหรียญรังผึ้ง ตามที่กำหนด\n2. ระบบจะทำการหมุนวงล้อรังผึ้ง และหยุดที่ช่องของรางวัลที่คุณได้รับ\n3. คุณสามารถสุ่มรับของรางวัลบนกระดานได้เรื่อยๆ ไม่มีจำกัดรอบ\n4. ไอเทมที่เห็นบนกระดานเป็นเพียงตัวแทนภาพรางวัลทั้งหมดในระบบ มีโอกาสได้รับรางวัลเหล่านั้นจริงตามอัตราเรทที่กำหนด`}
            />
            <div className="flex justify-end mt-1">
              <button
                onClick={saveHowToPlay}
                disabled={savingHowToPlay}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {savingHowToPlay ? <Loader2 size={13} className="animate-spin" /> : "บันทึกกติกา/วิธีการเล่น"}
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <UploadInput
                label="รูปภาพไอคอนเหรียญสำหรับเกมรังผึ้ง (Honey Coin / เหรียญรังผึ้ง)"
                value={coinIcon}
                onChange={setCoinIcon}
                folder="banner"
                accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                placeholder="อัพโหลดรูปไอคอนเหรียญ (เว้นว่างไว้เพื่อใช้ไอคอนเริ่มต้น)"
              />
            </div>
            <button
              onClick={saveCoinIcon}
              disabled={savingCoinIcon}
              className="flex items-center gap-2 px-6 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-900 disabled:opacity-50 transition-colors h-11"
            >
              {savingCoinIcon ? <Loader2 size={13} className="animate-spin" /> : "บันทึกไอคอนเหรียญ"}
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 block mb-1">ชื่อเหรียญ</label>
            <p className="text-[11px] text-slate-400 font-medium mb-3">ชื่อที่แสดงแทน "เหรียญรังผึ้ง" ทั่วทั้งระบบ</p>
            <div className="flex gap-3">
              <input
                type="text"
                value={coinName}
                onChange={(e) => setCoinName(e.target.value)}
                placeholder="เหรียญรังผึ้ง"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                onClick={saveCoinName}
                disabled={savingCoinName}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shrink-0"
              >
                {savingCoinName ? <Loader2 size={13} className="animate-spin" /> : "บันทึก"}
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 block mb-1">
              วันหมดอายุเหรียญ
            </label>
            <p className="text-[11px] text-slate-400 font-medium mb-3">
              เมื่อถึงวันและเวลานี้ เหรียญรังผึ้งของผู้เล่นทุกคนจะกลายเป็น 0 ทันที — เว้นว่าง = ไม่มีวันหมดอายุ
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <input
                type="datetime-local"
                value={coinExpiry}
                onChange={(e) => setCoinExpiry(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 transition-colors"
              />
              <div className="flex gap-2 shrink-0">
                {coinExpiry && (
                  <button
                    onClick={() => { setCoinExpiry(""); }}
                    className="px-4 py-2.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    ล้างค่า
                  </button>
                )}
                <button
                  onClick={saveCoinExpiry}
                  disabled={savingCoinExpiry}
                  className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white text-xs font-bold rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-colors"
                >
                  {savingCoinExpiry ? <Loader2 size={13} className="animate-spin" /> : "บันทึกวันหมดอายุ"}
                </button>
              </div>
            </div>
            {coinExpiry && (
              <p className="text-[11px] mt-2 font-bold text-amber-700">
                เหรียญจะหมดอายุ: {new Date(coinExpiry).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl mb-6 w-fit">
        <button onClick={() => setTab("boxes")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === "boxes" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
          <Hexagon size={13} /> รอบกิจกรรม ({boxes.length})
        </button>
        <button onClick={() => setTab("items")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === "items" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
          <Package size={13} /> ไอเทมรางวัล ({allItems.length})
        </button>
      </div>

      {/* ── TAB: BOXES ── */}
      {tab === "boxes" && (
        loadingBoxes ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
        ) : boxes.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <Hexagon className="mx-auto text-slate-300 mb-3" size={40} />
            <p className="font-bold text-slate-600 mb-3">ยังไม่มีรอบกิจกรรม</p>
            <button onClick={openCreateBox} className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl">
              <Plus size={13} className="inline mr-1" /> สร้างรอบแรก
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {boxes.map((box) => {
              const itemCount = (box.items || []).length;
              const rateTotal = (box.items || []).reduce((s, bi) => s + (bi.rate || 0), 0);
              const rateOk = Math.abs(rateTotal - 100) < 0.01;
              return (
                <div key={box._id} className={`bg-white border rounded-2xl overflow-hidden shadow-sm flex flex-col ${box.isActive ? "border-slate-200" : "border-slate-200 opacity-60"}`}>
                  <div className="relative aspect-square bg-slate-50">
                    <img src={box.image} alt={box.name} className="w-full h-full object-cover" />
                    {box.badge && (
                      <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${box.badgeBg}`}>{box.badge}</span>
                    )}
                    <button onClick={() => toggleBoxStatus(box)}
                      className={`absolute top-2 right-2 p-1.5 rounded-lg border bg-white transition-colors ${box.isActive ? "text-emerald-600 border-emerald-200" : "text-slate-400 border-slate-200"}`}>
                      {box.isActive ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
                  </div>
                  <div className="p-3 flex-1 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-black text-slate-800 line-clamp-1">{box.name}</p>
                      <span className="text-xs font-black text-indigo-600 shrink-0">฿{box.price}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 flex-1">{box.description}</p>

                    {/* Item rate preview */}
                    <div className="flex flex-col gap-1 pt-2 border-t border-slate-100">
                      {itemCount === 0 ? (
                        <p className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                          <AlertTriangle size={10} /> ยังไม่มีไอเทมในรอบ
                        </p>
                      ) : (
                        <>
                          {(box.items || []).slice(0, 3).map((bi, i) => {
                            const itm = getItem(bi);
                            const meta = CAT_META[itm?.category || "common"];
                            return (
                              <div key={i} className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dot}`} />
                                <span className="text-[10px] text-slate-600 flex-1 truncate">{itm?.name || "?"}</span>
                                <span className={`text-[10px] font-black tabular-nums ${meta.color}`}>{bi.rate}%</span>
                              </div>
                            );
                          })}
                          {itemCount > 3 && <p className="text-[10px] text-slate-400">+{itemCount - 3} รายการ</p>}
                          {!rateOk && itemCount > 0 && (
                            <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1 mt-0.5">
                              <AlertTriangle size={10} /> เรทรวม {rateTotal.toFixed(0)}% (ควรเป็น 100%)
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1 pt-1">
                      <button onClick={() => openRateModal(box)}
                        className="flex items-center gap-1 flex-1 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors justify-center">
                        <Settings2 size={12} /> จัดการรางวัล
                      </button>
                      <button onClick={() => openEditBox(box)} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => box._id && handleDeleteBox(box._id, box.name)}
                        disabled={deletingBoxId === box._id}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
                        {deletingBoxId === box._id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── TAB: ITEMS ── */}
      {tab === "items" && (
        loadingItems ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
        ) : allItems.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <Package className="mx-auto text-slate-300 mb-3" size={40} />
            <p className="font-bold text-slate-600 mb-3">ยังไม่มีไอเทมรางวัล</p>
            <p className="text-xs text-slate-400 mb-4">สร้างไอเทมก่อน แล้วค่อยกำหนดเรทดรอปในแต่ละรอบ</p>
            <button onClick={openCreateItem} className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl">
              <Plus size={13} className="inline mr-1" /> สร้างไอเทมแรก
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {allItems.map((item) => {
              const meta = CAT_META[item.category];
              return (
                <div key={item._id} className={`bg-white border rounded-2xl overflow-hidden shadow-sm flex flex-col ${item.isActive ? "border-slate-200" : "border-slate-200 opacity-60"}`}>
                  <div className="relative aspect-square bg-slate-100">
                    {item.type === "coin_reward" ? (
                      <div className="w-full h-full flex items-center justify-center flex-col gap-2">
                        {coinIcon ? (
                          <img src={coinIcon} className="w-12 h-12 object-contain drop-shadow-sm" />
                        ) : (
                          <Coins size={36} className="text-amber-500" />
                        )}
                        <span className="text-lg font-black text-amber-600">{item.coinAmount.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-500 font-bold">เหรียญรังผึ้ง</span>
                      </div>
                    ) : item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><ImageIcon size={32} className="text-slate-300" /></div>
                    )}
                    <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.badge}`}>{meta.label}</span>
                  </div>
                  <div className="p-3 flex-1 flex flex-col gap-2">
                    <p className="text-sm font-black text-slate-800 line-clamp-2">{item.name}</p>
                    {item.description && <p className="text-[11px] text-slate-500 line-clamp-2">{item.description}</p>}
                    <div className="flex items-center gap-1 mt-auto pt-1 text-[10px] font-bold text-slate-400">
                      {item.type === "coin_reward" ? (
                        <>
                          {coinIcon ? <img src={coinIcon} className="w-3 h-3 object-contain" /> : <Coins size={10} className="text-amber-500" />}
                          {item.coinAmount.toLocaleString()} เหรียญรังผึ้ง
                        </>
                      ) : (
                        <><Package size={10} /> มูลค่า ฿{item.value.toLocaleString()}</>
                      )}
                    </div>
                    <div className="flex items-center justify-end gap-1 pt-1 border-t border-slate-100">
                      <button onClick={() => openEditItem(item)} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => handleDeleteItem(item)}
                        disabled={deletingItemId === item._id}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
                        {deletingItemId === item._id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── BOX MODAL ── */}
      {boxModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-xl border border-slate-200 shadow-2xl flex flex-col max-h-[92vh]">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Hexagon size={16} className="text-indigo-600" />
                <h2 className="font-black text-slate-800 text-sm">{editingBox ? "แก้ไขรอบกิจกรรม" : "เพิ่มรอบกิจกรรมใหม่"}</h2>
              </div>
              <button onClick={() => setBoxModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600">ชื่อรอบ *</label>
                  <input value={boxForm.name} onChange={(e) => setBoxForm({ ...boxForm, name: e.target.value })}
                    className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-400 bg-slate-50"
                    placeholder="เช่น รอบกิจกรรม ROV" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600">ราคา (บาท) *</label>
                  <input type="number" value={boxForm.price} onChange={(e) => setBoxForm({ ...boxForm, price: Number(e.target.value) })}
                    className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-400 bg-slate-50" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600">รางวัลใหญ่สุด</label>
                  <input value={boxForm.mainPrize} onChange={(e) => setBoxForm({ ...boxForm, mainPrize: e.target.value })}
                    className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-400 bg-slate-50"
                    placeholder="เช่น ROV Conqueror" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600">Badge</label>
                  <input value={boxForm.badge || ""} onChange={(e) => setBoxForm({ ...boxForm, badge: e.target.value })}
                    className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-400 bg-slate-50"
                    placeholder="เช่น ยอดฮิต, การันตี" />
                </div>
                <div className="sm:col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600">คำบรรยาย</label>
                  <textarea value={boxForm.description} onChange={(e) => setBoxForm({ ...boxForm, description: e.target.value })}
                    className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-400 bg-slate-50 h-16 resize-none"
                    placeholder="คำบรรยายสั้นๆ" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600">วันเริ่มอีเว้น</label>
                  <input type="datetime-local" value={boxForm.eventStartDate || ""}
                    onChange={(e) => setBoxForm({ ...boxForm, eventStartDate: e.target.value })}
                    className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-400 bg-slate-50" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600">วันหมดอีเว้น</label>
                  <input type="datetime-local" value={boxForm.eventEndDate || ""}
                    onChange={(e) => setBoxForm({ ...boxForm, eventEndDate: e.target.value })}
                    className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-400 bg-slate-50" />
                  <p className="text-[10px] text-slate-400 font-medium">เว้นว่าง = ไม่มีวันหมดอายุ</p>
                </div>
                <div className="sm:col-span-2">
                  <UploadInput label="รูปภาพรอบ" value={boxForm.image}
                    onChange={(url) => setBoxForm({ ...boxForm, image: url })}
                    folder="honeycomb-boxes" accept="image/png,image/jpeg,image/webp,image/gif"
                    placeholder="อัพโหลดรูปภาพรอบ" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600">ลำดับแสดงผล</label>
                  <input type="number" value={boxForm.sortOrder} onChange={(e) => setBoxForm({ ...boxForm, sortOrder: Number(e.target.value) })}
                    className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-400 bg-slate-50" />
                </div>
                <div className="flex items-center gap-3 pt-5">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input type="checkbox" checked={boxForm.isActive} onChange={(e) => setBoxForm({ ...boxForm, isActive: e.target.checked })}
                      className="w-4 h-4 rounded accent-indigo-600" />
                    เปิดใช้งาน
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                {/* Step guide */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-xs text-indigo-800 space-y-2.5">
                  <p className="font-black text-indigo-700 flex items-center gap-1.5 text-sm">📋 วิธีสร้างรอบกิจกรรมเกมรังผึ้ง (ทำตามลำดับ)</p>
                  <div className="space-y-2 leading-relaxed">
                    <div className="flex items-start gap-2">
                      <span className="bg-indigo-600 text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <p><strong>กรอกข้อมูลรอบ</strong> — ชื่อรอบ, ราคาต่อครั้ง (บาท), คำบรรยาย และรูปภาพปก แล้วกด <strong>"สร้างรอบ"</strong></p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="bg-indigo-600 text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <p><strong>กำหนดของรางวัล</strong> — กด <strong>"จัดการรางวัล"</strong> บนการ์ดรอบที่สร้าง เพื่อเพิ่มไอเทมและกำหนด % เรทดรอปของแต่ละชิ้น</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="bg-indigo-600 text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center shrink-0 mt-0.5">3</span>
                      <p><strong>ล็อคไอเทม (ถ้าต้องการ)</strong> — กดไอคอน 🔒 บนไอเทมที่ต้องการพักชั่วคราว ไอเทมนั้นจะยังแสดงบนกระดานแต่จะไม่ถูกสุ่มออก</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="bg-indigo-600 text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center shrink-0 mt-0.5">4</span>
                      <p><strong>ตรวจสอบ % รวม = 100%</strong> — เรทดรอปของทุกไอเทมรวมกันต้องได้ 100% พอดี ระบบจะเตือนถ้ายังไม่ครบ</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="bg-indigo-600 text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center shrink-0 mt-0.5">5</span>
                      <p><strong>เปิดใช้งาน</strong> — ติ๊ก "เปิดใช้งาน" แล้วบันทึก รอบกิจกรรมจะปรากฏบนหน้าหลักให้ผู้เล่นเห็นทันที</p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
                  <span className="text-base shrink-0">⚠️</span>
                  <p>กล่องที่ยังไม่มีไอเทมหรือเรทดรอปไม่ครบ 100% จะยังสุ่มไม่ถูกต้อง ควรตั้งค่าไอเทมให้ครบก่อนเปิดใช้งาน</p>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
              <button onClick={() => setBoxModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors">ยกเลิก</button>
              <button onClick={handleSaveBox} disabled={savingBox}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors disabled:opacity-50">
                {savingBox ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                {editingBox ? "บันทึก" : "สร้างกล่อง"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ITEM MODAL ── */}
      {itemModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-xl border border-slate-200 shadow-2xl flex flex-col max-h-[92vh]">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Package size={16} className="text-indigo-600" />
                <h2 className="font-black text-slate-800 text-sm">{editingItem ? "แก้ไขไอเทมรางวัล" : "เพิ่มไอเทมรางวัลใหม่"}</h2>
              </div>
              <button onClick={() => setItemModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600">ชื่อไอเทม *</label>
                  <input value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-400 bg-slate-50"
                    placeholder="เช่น ROV Account Lv.50 Conqueror" />
                </div>

                {/* ประเภท */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600">ประเภทรางวัล</label>
                  <div className="flex gap-2">
                    {(["item", "coin_reward"] as const).map((t) => (
                      <button key={t} type="button"
                        onClick={() => setItemForm({ ...itemForm, type: t })}
                        className={`flex-1 flex items-center gap-2 justify-center px-3 py-2 rounded-xl border text-xs font-bold transition-colors ${itemForm.type === t ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300"}`}>
                        {t === "item" ? <Package size={12} /> : <Coins size={12} />}
                        {t === "item" ? "ไอเทม / ไอดีเกม" : "เหรียญรังผึ้ง"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ระดับ */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600">ระดับ (Category)</label>
                  <select value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value as any })}
                    className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-400 bg-slate-50">
                    <option value="legendary">Legendary</option>
                    <option value="epic">Epic</option>
                    <option value="rare">Rare</option>
                    <option value="common">Common</option>
                  </select>
                </div>

                {/* GemCoins / Value */}
                {itemForm.type === "coin_reward" ? (
                  <div className="sm:col-span-2 flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-600">จำนวนเหรียญรังผึ้ง *</label>
                    <input type="number" value={itemForm.coinAmount}
                      onChange={(e) => setItemForm({ ...itemForm, coinAmount: Number(e.target.value) })}
                      className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-400 bg-slate-50"
                      placeholder="เช่น 500" min={0} />
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-600">มูลค่า (บาท)</label>
                    <input type="number" value={itemForm.value}
                      onChange={(e) => setItemForm({ ...itemForm, value: Number(e.target.value) })}
                      className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-400 bg-slate-50"
                      placeholder="เช่น 12500" min={0} />
                  </div>
                )}

                {/* Description */}
                <div className={`${itemForm.type === "coin_reward" ? "hidden" : "flex"} flex-col gap-1`}>
                  <label className="text-xs font-bold text-slate-600">คำอธิบาย</label>
                  <input value={itemForm.description}
                    onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                    className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-400 bg-slate-50"
                    placeholder="รายละเอียดสั้นๆ" />
                </div>

                {/* Image */}
                {itemForm.type !== "coin_reward" && (
                  <div className="sm:col-span-2">
                    <UploadInput label="รูปภาพไอเทม *" value={itemForm.image}
                      onChange={(url) => setItemForm({ ...itemForm, image: url })}
                      folder="honeycomb-items" accept="image/png,image/jpeg,image/webp,image/gif"
                      placeholder="อัพโหลดรูปไอเทม" />
                  </div>
                )}

                <div className="sm:col-span-2 flex items-center gap-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input type="checkbox" checked={itemForm.isActive}
                      onChange={(e) => setItemForm({ ...itemForm, isActive: e.target.checked })}
                      className="w-4 h-4 rounded accent-indigo-600" />
                    เปิดใช้งาน
                  </label>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
              <button onClick={() => setItemModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors">ยกเลิก</button>
              <button onClick={handleSaveItem} disabled={savingItem}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors disabled:opacity-50">
                {savingItem ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                {editingItem ? "บันทึก" : "สร้างไอเทม"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RATE MODAL ── */}
      {rateModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-3xl border border-slate-200 shadow-2xl flex flex-col max-h-[92vh]">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <Settings2 size={15} className="text-indigo-600" />
                  <h2 className="font-black text-slate-800 text-sm">จัดการรางวัล — {rateModal.name}</h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{rateItems.length} รายการ ในกล่อง</p>
              </div>
              <button onClick={() => setRateModal(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <div className="flex flex-col lg:flex-row overflow-hidden flex-1 min-h-0">
              {/* Left: All available items */}
              <div className="lg:w-72 border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col shrink-0">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                  <p className="text-xs font-black text-slate-600">ไอเทมทั้งหมด — คลิกเพื่อเพิ่มลงกล่อง</p>
                </div>
                <div className="overflow-y-auto flex-1 p-3 space-y-2">
                  {allItems.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-4">ยังไม่มีไอเทม — สร้างที่แท็บ "ไอเทมรางวัล"</p>
                  )}
                  {allItems.map((item) => {
                    const meta = CAT_META[item.category];
                    const inBox = rateItems.some((bi) => {
                      const id = typeof bi.itemId === "object" ? (bi.itemId as HoneycombItem)._id : bi.itemId;
                      return id === item._id;
                    });
                    return (
                      <button key={item._id} type="button"
                        onClick={() => addItemToBox(item)}
                        disabled={inBox}
                        className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${inBox ? "border-slate-100 bg-slate-50 opacity-40 cursor-default" : `${meta.border} ${meta.bg} hover:shadow-sm cursor-pointer`}`}>
                        <div className="w-9 h-9 rounded-lg overflow-hidden bg-white border border-slate-200 shrink-0 flex items-center justify-center">
                          {item.type === "coin_reward"
                            ? <Coins size={16} className="text-amber-500" />
                            : item.image
                              ? <img src={item.image} alt="" className="w-full h-full object-cover" />
                              : <ImageIcon size={14} className="text-slate-300" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-slate-800 truncate">{item.name}</p>
                          <p className={`text-[10px] font-bold ${meta.color}`}>{meta.label}</p>
                        </div>
                        {inBox && <span className="text-[10px] text-slate-400 font-bold shrink-0">มีแล้ว</span>}
                        {!inBox && <Plus size={13} className={`${meta.color} shrink-0`} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right: Items in this box with rate sliders */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 shrink-0">
                  <RateBar items={rateItems} />
                </div>
                <div className="overflow-y-auto flex-1 p-4 space-y-2">
                  {rateItems.length === 0 && (
                    <div className="text-center py-10 text-slate-400">
                      <Settings2 size={28} className="mx-auto mb-2 opacity-30" />
                      <p className="text-xs font-medium">เลือกไอเทมจากซ้ายเพื่อเพิ่มลงกล่อง</p>
                    </div>
                  )}
                  {rateItems.map((bi, idx) => {
                    const item = getItem(bi);
                    if (!item) return null;
                    const meta = CAT_META[item.category];
                    return (
                      <div key={idx} className={`rounded-xl border-2 ${bi.isLocked ? "border-slate-300 bg-slate-50 opacity-70" : `${meta.border} ${meta.bg}`} p-3 transition-all`}>
                        <div className="flex items-center gap-2.5 mb-3">
                          <div className="w-9 h-9 rounded-lg overflow-hidden bg-white border border-slate-200 shrink-0 flex items-center justify-center">
                            {item.type === "coin_reward"
                              ? <Coins size={16} className="text-amber-500" />
                              : item.image
                                ? <img src={item.image} alt="" className="w-full h-full object-cover" />
                                : <ImageIcon size={14} className="text-slate-300" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-slate-800 truncate">{item.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-[10px] font-bold ${bi.isLocked ? "text-slate-400" : meta.color}`}>{meta.label}</span>
                              {bi.isLocked && (
                                <span className="text-[9px] font-black text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">ล็อค</span>
                              )}
                            </div>
                          </div>
                          {/* Lock toggle */}
                          <button type="button" onClick={() => toggleLock(idx)}
                            title={bi.isLocked ? "ปลดล็อค — เปิดให้สุ่มออกได้" : "ล็อค — ไม่ให้สุ่มออก"}
                            className={`p-1.5 rounded-lg transition-colors ${bi.isLocked ? "text-amber-600 bg-amber-100 hover:bg-amber-200" : "text-slate-400 hover:text-amber-600 hover:bg-amber-50"}`}>
                            {bi.isLocked ? <Lock size={13} /> : <Unlock size={13} />}
                          </button>
                          <button type="button" onClick={() => removeItemFromBox(idx)}
                            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
                            <X size={13} />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-500 shrink-0">เรท</span>
                          <input type="range" min={0} max={100} step={0.5} value={bi.rate}
                            onChange={(e) => updateRate(idx, Number(e.target.value))}
                            className="flex-1 accent-indigo-600" />
                          <input type="number" value={bi.rate}
                            onChange={(e) => updateRate(idx, Math.min(100, Math.max(0, Number(e.target.value))))}
                            className="w-16 border border-slate-200 rounded-lg px-2 py-1 text-xs font-black text-center outline-none focus:border-indigo-400 bg-white tabular-nums"
                            min={0} max={100} step={0.5} />
                          <span className="text-xs font-bold text-slate-400">%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
              <div className="flex flex-col gap-0.5">
                <div className="text-xs text-slate-400 font-medium">
                  {rateItems.length} ไอเทม • เรทรวม{" "}
                  <span className={Math.abs(totalRate - 100) < 0.01 ? "text-emerald-600 font-black" : "text-amber-600 font-black"}>
                    {totalRate.toFixed(1)}%
                  </span>
                  {rateItems.some((bi) => bi.isLocked) && (
                    <span className="ml-2 text-amber-600 font-bold">
                      • ล็อค {rateItems.filter((bi) => bi.isLocked).length} รายการ
                    </span>
                  )}
                </div>
                {rateItems.some((bi) => bi.isLocked) && (
                  <p className="text-[10px] text-amber-600 flex items-center gap-1">
                    <Lock size={9} /> ไอเทมที่ล็อคจะไม่ถูกสุ่มออกในเกม จนกว่าจะปลดล็อค
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setRateModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors">ยกเลิก</button>
                <button onClick={handleSaveRates} disabled={savingRate}
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors disabled:opacity-50">
                  {savingRate ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  บันทึกเรทดรอป
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmOpts && <ConfirmDialog opts={confirmOpts} onClose={() => setConfirmOpts(null)} />}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[200] px-5 py-3 rounded-2xl shadow-xl font-bold text-sm text-white flex items-center gap-2 ${toast.ok ? "bg-emerald-600" : "bg-red-600"}`}>
          {toast.ok ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />} {toast.msg}
        </div>
      )}
    </div>
  );
}
