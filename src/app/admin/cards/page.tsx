"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, X, Sparkles, Save, CheckCircle2, Loader2, Play, Search, Package } from "lucide-react";
import { UploadInput } from "@/components/ui/UploadInput";

interface CardPrizeData {
  _id: string;
  name: string;
  title: string;
  icon?: string;
  type?: "coin" | "gemcoin" | "item" | "custom";
  amount?: number;
  itemId?: string;
  weight: number;
  isSpecial?: boolean;
  isActive: boolean;
  order: number;
}

interface ItemOption {
  _id: string;
  name: string;
  image?: string;
  price?: number;
  stock?: number;
  unlimitedStock?: boolean;
  type?: string;
  rarityId?: { name?: string; color?: string } | null;
  categoryId?: { name?: string } | null;
}

interface RoundInfo {
  roundNumber: number;
  status: "active" | "completed" | "none";
  cards: { opened: boolean }[];
}

const TYPE_LABEL: Record<string, string> = {
  coin: "เหรียญ (บาท)",
  gemcoin: "GemCoin",
  item: "ไอเทม (เข้าคอลเลกชัน)",
  custom: "กำหนดเอง",
};

export default function ManageCardPrizes() {
  const [prizes, setPrizes] = useState<CardPrizeData[]>([]);
  const [items, setItems] = useState<ItemOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCost, setOpenCost] = useState<number>(50);
  const [costSaving, setCostSaving] = useState(false);
  const [costSaved, setCostSaved] = useState(false);
  // จำนวนการ์ดต่อรอบ (1-50) — มีผลกับรอบถัดไปที่เปิด
  const [cardsPerRound, setCardsPerRound] = useState<number>(10);
  const [perRoundSaving, setPerRoundSaving] = useState(false);
  const [perRoundSaved, setPerRoundSaved] = useState(false);
  const [backImage, setBackImage] = useState("");
  const [backImageSaving, setBackImageSaving] = useState(false);
  const [backImageSaved, setBackImageSaved] = useState(false);
  const [pageBg, setPageBg] = useState("");
  const [pageBgSaving, setPageBgSaving] = useState(false);
  const [pageBgSaved, setPageBgSaved] = useState(false);
  // ข้อความที่โชว์หน้าเว็บตอนการ์ดถูกเปิดครบรอบ
  const [completedTitle, setCompletedTitle] = useState("🎉 การ์ดทั้งหมดถูกเปิดออกหมดแล้ว");
  const [completedSubtitle, setCompletedSubtitle] = useState("รอแอดมินเปิดรอบใหม่ แล้วกลับมาลุ้นกันอีกครั้ง!");
  const [completedSaving, setCompletedSaving] = useState(false);
  const [completedSaved, setCompletedSaved] = useState(false);
  // รอบ event ปัจจุบัน — รอบใหม่ไม่เปิดอัตโนมัติ แอดมินกดเปิดจากหน้านี้
  const [roundInfo, setRoundInfo] = useState<RoundInfo | null>(null);
  const [roundStarting, setRoundStarting] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [current, setCurrent] = useState<Partial<CardPrizeData>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  // popup เลือกไอเทมจากคลัง — เห็นรูป/rarity/สต็อก + ค้นหาได้
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [itemSearch, setItemSearch] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resPrizes, resSettings, resItems, resRound] = await Promise.all([
        fetch("/api/admin/card-prizes"),
        fetch("/api/admin/settings"),
        fetch("/api/admin/items"),
        fetch("/api/admin/card-rounds", { cache: "no-store" }),
      ]);
      if (resPrizes.ok) setPrizes(await resPrizes.json());
      if (resRound.ok) setRoundInfo(await resRound.json());
      if (resItems.ok) {
        const d = await resItems.json();
        // ตัดไอเทมประเภทรางวัลเหรียญออก — เข้าคอลเลกชันไม่ได้
        if (Array.isArray(d)) setItems(d.filter((it: ItemOption) => it.type !== "coin_reward"));
      }
      if (resSettings.ok) {
        const settings = await resSettings.json();
        const cost = Array.isArray(settings) ? settings.find((s: any) => s.key === "cards_open_cost") : null;
        if (cost) setOpenCost(Number(cost.value) || 50);
        const perRound = Array.isArray(settings) ? settings.find((s: any) => s.key === "cards_per_round") : null;
        if (perRound) setCardsPerRound(Math.min(50, Math.max(1, Math.floor(Number(perRound.value)) || 10)));
        const back = Array.isArray(settings) ? settings.find((s: any) => s.key === "cards_back_image") : null;
        if (back) setBackImage(String(back.value || ""));
        const bg = Array.isArray(settings) ? settings.find((s: any) => s.key === "cards_page_bg") : null;
        if (bg) setPageBg(String(bg.value || ""));
        const ct = Array.isArray(settings) ? settings.find((s: any) => s.key === "cards_completed_title") : null;
        if (ct && ct.value) setCompletedTitle(String(ct.value));
        const cs = Array.isArray(settings) ? settings.find((s: any) => s.key === "cards_completed_subtitle") : null;
        if (cs && cs.value) setCompletedSubtitle(String(cs.value));
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const saveCost = async () => {
    setCostSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "cards_open_cost", value: openCost }),
      });
      if (res.ok) {
        setCostSaved(true);
        setTimeout(() => setCostSaved(false), 2000);
      }
    } finally {
      setCostSaving(false);
    }
  };

  const savePerRound = async () => {
    const value = Math.min(50, Math.max(1, Math.floor(cardsPerRound) || 10));
    setCardsPerRound(value);
    setPerRoundSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "cards_per_round", value }),
      });
      if (res.ok) {
        setPerRoundSaved(true);
        setTimeout(() => setPerRoundSaved(false), 2000);
      }
    } finally {
      setPerRoundSaving(false);
    }
  };

  const saveBackImage = async () => {
    setBackImageSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "cards_back_image", value: backImage }),
      });
      if (res.ok) {
        setBackImageSaved(true);
        setTimeout(() => setBackImageSaved(false), 2000);
      }
    } finally {
      setBackImageSaving(false);
    }
  };

  const savePageBg = async () => {
    setPageBgSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "cards_page_bg", value: pageBg }),
      });
      if (res.ok) {
        setPageBgSaved(true);
        setTimeout(() => setPageBgSaved(false), 2000);
      }
    } finally {
      setPageBgSaving(false);
    }
  };

  // เปิดรอบใหม่ (เริ่ม event) — server จะไม่ยอมถ้ายังมีรอบเล่นค้างอยู่
  const startRound = async () => {
    setRoundStarting(true);
    try {
      const res = await fetch("/api/admin/card-rounds", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาด");
      setRoundInfo(data);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRoundStarting(false);
    }
  };

  const saveCompletedText = async () => {
    setCompletedSaving(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch("/api/admin/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "cards_completed_title", value: completedTitle }),
        }),
        fetch("/api/admin/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "cards_completed_subtitle", value: completedSubtitle }),
        }),
      ]);
      if (r1.ok && r2.ok) {
        setCompletedSaved(true);
        setTimeout(() => setCompletedSaved(false), 2000);
      }
    } finally {
      setCompletedSaving(false);
    }
  };

  const openAddModal = () => {
    setModalMode("add");
    setCurrent({ type: "custom", amount: 0, weight: 1, isActive: true, order: prizes.length });
    setIsModalOpen(true);
  };

  // เปลี่ยนประเภท — เติมป้าย/ชื่อให้อัตโนมัติถ้ายังว่างหรือเป็นค่า default ของประเภทเดิม
  const handleTypeChange = (type: "coin" | "gemcoin" | "item" | "custom") => {
    const next: Partial<CardPrizeData> = { ...current, type };
    if (type === "coin" && (!current.title || ["GEMCOIN", "ITEM"].includes(current.title))) next.title = "COIN";
    if (type === "gemcoin" && (!current.title || ["COIN", "ITEM"].includes(current.title))) next.title = "GEMCOIN";
    if (type === "item" && (!current.title || ["COIN", "GEMCOIN"].includes(current.title))) next.title = "ITEM";
    setCurrent(next);
  };

  // เลือกไอเทมจากคลัง — เติมชื่อ/รูปให้อัตโนมัติ (แก้ทับได้)
  const handleItemPick = (itemId: string) => {
    const item = items.find((it) => it._id === itemId);
    setCurrent({
      ...current,
      itemId,
      name: item ? item.name : current.name,
      icon: current.icon || item?.image || "",
    });
  };

  // กรอกจำนวน — sync ชื่อที่โชว์บนการ์ดให้เอง (แก้ทับทีหลังได้)
  const handleAmountChange = (amount: number) => {
    setCurrent({ ...current, amount, name: amount > 0 ? amount.toLocaleString() : current.name });
  };

  const openEditModal = (p: CardPrizeData) => {
    setModalMode("edit");
    setCurrent({ ...p });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!current.name || !current.title) {
      alert("กรุณากรอกชื่อรางวัลและประเภทให้ครบ");
      return;
    }
    if (current.type === "item" && !current.itemId) {
      alert("กรุณาเลือกไอเทมจากคลังสำหรับรางวัลประเภทไอเทม");
      return;
    }
    try {
      const url = modalMode === "add" ? "/api/admin/card-prizes" : `/api/admin/card-prizes/${current._id}`;
      const res = await fetch(url, {
        method: modalMode === "add" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(current),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาด");
      setIsModalOpen(false);
      setCurrent({});
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/card-prizes/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาด");
      setDeleteConfirm(null);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // ระบบ 1:1 — รางวัลที่เปิดใช้ต้องมีครบ 10 ตัวพอดี (1 รางวัลต่อการ์ด 1 ใบ) ถึงเปิดรอบได้
  const activeCount = prizes.filter((p) => p.isActive).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">สุ่มการ์ดพิเศษ</h1>
          <p className="text-sm text-slate-500 mt-1">จัดการรางวัลและโอกาสออกของหน้าสุ่มการ์ด (/cards)</p>
        </div>
        <button onClick={openAddModal} className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm shadow-red-500/20 shrink-0">
          <Plus size={16} /> เพิ่มรางวัล
        </button>
      </div>

      {/* รอบ event ปัจจุบัน — แอดมินเป็นคนกดเปิดรอบใหม่เอง */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-800">รอบ Event ปัจจุบัน</p>
          {!roundInfo || roundInfo.status === "none" ? (
            <p className="text-xs text-slate-500 mt-0.5">ยังไม่เคยเปิดรอบ — กด &quot;เปิดรอบใหม่&quot; เพื่อเริ่ม event แรก</p>
          ) : roundInfo.status === "active" ? (
            <p className="text-xs text-slate-500 mt-0.5">
              รอบ #{roundInfo.roundNumber} กำลังเล่นอยู่ — เปิดแล้ว{" "}
              <span className="font-black text-red-600">{roundInfo.cards.filter((c) => c.opened).length} / {roundInfo.cards.length}</span> ใบ
            </p>
          ) : (
            <p className="text-xs text-slate-500 mt-0.5">รอบ #{roundInfo.roundNumber} เปิดครบทุกใบแล้ว — หน้าเว็บขึ้น &quot;รอแอดมินเปิดรอบใหม่&quot; จนกว่าจะกดเปิด</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${roundInfo?.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
            {roundInfo?.status === "active" ? "กำลังเล่น" : roundInfo?.status === "completed" ? "จบรอบแล้ว" : "ยังไม่เริ่ม"}
          </span>
          <button
            onClick={startRound}
            disabled={roundStarting || roundInfo?.status === "active"}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title={roundInfo?.status === "active" ? "ต้องรอผู้เล่นเปิดการ์ดครบก่อน" : undefined}
          >
            {roundStarting ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
            เปิดรอบใหม่
          </button>
        </div>
      </div>

      {/* ค่าเปิดต่อครั้ง */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-800">ค่าเปิดการ์ดต่อครั้ง (เหรียญ)</p>
          <p className="text-xs text-slate-500 mt-0.5">จำนวนเหรียญที่หักต่อการเปิดการ์ด 1 ใบ</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={openCost}
            onChange={(e) => setOpenCost(Number(e.target.value) || 0)}
            className="w-28 px-3 py-2 text-sm font-black text-red-600 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
          />
          <button
            onClick={saveCost}
            disabled={costSaving}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {costSaving ? <Loader2 size={13} className="animate-spin" /> : costSaved ? <CheckCircle2 size={13} /> : <Save size={13} />}
            {costSaved ? "บันทึกแล้ว!" : "บันทึก"}
          </button>
        </div>
      </div>

      {/* จำนวนการ์ดต่อรอบ */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-800">จำนวนการ์ดต่อรอบ (1-50 ใบ)</p>
          <p className="text-xs text-slate-500 mt-0.5">
            ต้องมีรางวัลเปิดใช้งานเท่ากับจำนวนนี้พอดีถึงกดเปิดรอบได้ — มีผลกับรอบถัดไป รอบที่กำลังเล่นอยู่ไม่เปลี่ยน
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={50}
            value={cardsPerRound}
            onChange={(e) => setCardsPerRound(Number(e.target.value) || 0)}
            className="w-28 px-3 py-2 text-sm font-black text-red-600 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
          />
          <button
            onClick={savePerRound}
            disabled={perRoundSaving}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {perRoundSaving ? <Loader2 size={13} className="animate-spin" /> : perRoundSaved ? <CheckCircle2 size={13} /> : <Save size={13} />}
            {perRoundSaved ? "บันทึกแล้ว!" : "บันทึก"}
          </button>
        </div>
      </div>

      {/* ภาพหน้าการ์ดก่อนเปิด */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm px-6 py-5 flex flex-col gap-4">
        <div>
          <p className="text-sm font-bold text-slate-800">ภาพหน้าการ์ด (ก่อนเปิด)</p>
          <p className="text-xs text-slate-500 mt-0.5">รูปที่แสดงบนการ์ดตอนยังคว่ำอยู่ ทั้งการ์ดใหญ่และการ์ดในแถบ 10 ใบ — เว้นว่าง = ใช้ดีไซน์โลโก้ X เริ่มต้น</p>
        </div>
        <UploadInput
          label=""
          value={backImage}
          onChange={setBackImage}
          folder="cards"
          accept="image/png,image/jpeg,image/webp,image/gif"
          placeholder="https://... หรืออัพโหลดรูป (แนะนำสัดส่วนแนวตั้ง 2:3)"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={saveBackImage}
            disabled={backImageSaving}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {backImageSaving ? <Loader2 size={13} className="animate-spin" /> : backImageSaved ? <CheckCircle2 size={13} /> : <Save size={13} />}
            {backImageSaved ? "บันทึกแล้ว!" : "บันทึกภาพหน้าการ์ด"}
          </button>
          {backImage && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>ตัวอย่าง:</span>
              <img src={backImage} alt="card back preview" className="h-14 aspect-[2/3] object-cover border border-slate-200 rounded-md" />
            </div>
          )}
        </div>
      </div>

      {/* พื้นหลังหน้าสุ่มการ์ด */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm px-6 py-5 flex flex-col gap-4">
        <div>
          <p className="text-sm font-bold text-slate-800">พื้นหลังหน้าสุ่มการ์ด (รูป/วิดีโอ)</p>
          <p className="text-xs text-slate-500 mt-0.5">แสดงเป็นพื้นหลังทั้งหน้า /cards — เว้นว่าง = พื้นเทาอ่อนเดิม</p>
        </div>
        <UploadInput
          label=""
          value={pageBg}
          onChange={setPageBg}
          folder="cards"
          accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm"
          placeholder="https://... หรืออัพโหลดรูป/วิดีโอ"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={savePageBg}
            disabled={pageBgSaving}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {pageBgSaving ? <Loader2 size={13} className="animate-spin" /> : pageBgSaved ? <CheckCircle2 size={13} /> : <Save size={13} />}
            {pageBgSaved ? "บันทึกแล้ว!" : "บันทึกพื้นหลัง"}
          </button>
        </div>
      </div>

      {/* ข้อความตอนเปิดครบรอบ */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm px-6 py-5 flex flex-col gap-4">
        <div>
          <p className="text-sm font-bold text-slate-800">ข้อความตอนการ์ดถูกเปิดครบรอบ</p>
          <p className="text-xs text-slate-500 mt-0.5">โชว์ในหน้าสุ่มการ์ด (/cards) เมื่อการ์ดทุกใบในรอบถูกเปิดหมดแล้ว จนกว่าจะเปิดรอบใหม่</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">บรรทัดหลัก</label>
            <input
              type="text"
              value={completedTitle}
              onChange={(e) => setCompletedTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-red-500 transition-all font-medium text-slate-800"
              placeholder="🎉 การ์ดทั้งหมดถูกเปิดออกหมดแล้ว"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">บรรทัดรอง</label>
            <input
              type="text"
              value={completedSubtitle}
              onChange={(e) => setCompletedSubtitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-red-500 transition-all font-medium text-slate-800"
              placeholder="รอแอดมินเปิดรอบใหม่ แล้วกลับมาลุ้นกันอีกครั้ง!"
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* ตัวอย่างหน้าตาแบนเนอร์จริงบนหน้าเว็บ */}
          <div className="flex-1 min-w-[240px] bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-center">
            <p className="text-xs font-black">{completedTitle || "🎉 การ์ดทั้งหมดถูกเปิดออกหมดแล้ว"}</p>
            <p className="text-[10px] font-bold text-red-400 mt-0.5">{completedSubtitle || "รอแอดมินเปิดรอบใหม่ แล้วกลับมาลุ้นกันอีกครั้ง!"}</p>
          </div>
          <button
            onClick={saveCompletedText}
            disabled={completedSaving}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shrink-0"
          >
            {completedSaving ? <Loader2 size={13} className="animate-spin" /> : completedSaved ? <CheckCircle2 size={13} /> : <Save size={13} />}
            {completedSaved ? "บันทึกแล้ว!" : "บันทึกข้อความ"}
          </button>
        </div>
      </div>

      {/* ตารางรางวัล */}
      <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="text-xs font-bold text-slate-500">
            รางวัลทั้งหมด: <span className="text-red-600 font-black">{prizes.length}</span>
          </div>
          <div className="text-xs font-bold text-slate-500">
            เปิดใช้งาน: <span className={`font-black ${activeCount === cardsPerRound ? "text-green-600" : "text-amber-500"}`}>{activeCount} / {cardsPerRound}</span>
            {activeCount !== cardsPerRound && <span className="ml-2 text-amber-500">(ต้องครบ {cardsPerRound} พอดีถึงเปิดรอบได้ — 1 รางวัลต่อการ์ด 1 ใบ)</span>}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-white">
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">รางวัล</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ประเภท (ป้าย)</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">สถานะ</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100/80">
              {loading ? (
                <tr><td colSpan={4} className="py-12 text-center text-slate-400 font-medium">กำลังโหลดข้อมูล...</td></tr>
              ) : prizes.length === 0 ? (
                <tr><td colSpan={4} className="py-12 text-center text-slate-400 font-medium">ยังไม่มีรางวัล — กด &quot;เพิ่มรางวัล&quot; เพื่อเริ่มต้น</td></tr>
              ) : prizes.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 p-1">
                        {p.icon ? (
                          <img src={p.icon} alt={p.name} className="w-full h-full object-contain" />
                        ) : (
                          <Sparkles size={18} className="text-slate-400" />
                        )}
                      </div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        {p.name}
                        {p.isSpecial && (
                          <span className="text-[9px] font-black bg-amber-100 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full whitespace-nowrap">⭐ พิเศษ — จบรอบทันที</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded uppercase">{p.title}</span>
                    <div className={`text-[10px] font-bold mt-1 ${p.type === "gemcoin" ? "text-purple-600" : p.type === "coin" ? "text-amber-600" : "text-slate-400"}`}>
                      {TYPE_LABEL[p.type || "custom"]}{p.type !== "custom" && p.amount ? ` +${p.amount.toLocaleString()}` : ""}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${p.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {p.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    {deleteConfirm === p._id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleDelete(p._id)} className="text-xs font-bold bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700">ยืนยัน</button>
                        <button onClick={() => setDeleteConfirm(null)} className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200">ยกเลิก</button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(p)} className="text-blue-600 bg-blue-50 border border-blue-100 rounded-lg p-2 hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="แก้ไข">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => setDeleteConfirm(p._id)} className="text-red-500 bg-red-50 border border-red-100 rounded-lg p-2 hover:bg-red-600 hover:text-white transition-all shadow-sm" title="ลบ">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <h2 className="text-lg font-bold text-slate-800">{modalMode === "add" ? "เพิ่มรางวัลใหม่" : "แก้ไขรางวัล"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">ประเภทรางวัล</label>
                  <select
                    value={current.type || "custom"}
                    onChange={(e) => handleTypeChange(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-red-500 transition-all font-medium text-slate-800"
                  >
                    <option value="custom">กำหนดเอง (แสดงผลอย่างเดียว)</option>
                    <option value="coin">เหรียญ (บาท) — เข้ากระเป๋าเงิน</option>
                    <option value="gemcoin">GemCoin — เข้ากระเป๋า GemCoin</option>
                    <option value="item">ไอเทม — เข้าคอลเลกชันผู้เล่น</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">
                    จำนวนที่ได้รับ {(current.type === "coin" || current.type === "gemcoin") && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="number"
                    value={current.amount ?? 0}
                    onChange={(e) => handleAmountChange(Number(e.target.value) || 0)}
                    disabled={current.type === "custom" || current.type === "item"}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-red-500 transition-all font-black text-red-600 disabled:opacity-40"
                    placeholder="เช่น 100"
                  />
                </div>
              </div>

              {current.type === "item" && (() => {
                const selectedItem = items.find((it) => it._id === current.itemId);
                return (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">ไอเทมจากคลัง <span className="text-red-500">*</span></label>
                    <button
                      type="button"
                      onClick={() => { setItemSearch(""); setItemPickerOpen(true); }}
                      className="w-full flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-left hover:border-red-400 transition-colors"
                    >
                      {selectedItem ? (
                        <>
                          <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 p-1">
                            {selectedItem.image ? (
                              <img src={selectedItem.image} alt={selectedItem.name} className="w-full h-full object-contain" />
                            ) : (
                              <Package size={18} className="text-slate-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{selectedItem.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-2">
                              {selectedItem.rarityId?.name && (
                                <span style={{ color: selectedItem.rarityId.color || undefined }}>{selectedItem.rarityId.name}</span>
                              )}
                              <span>{selectedItem.unlimitedStock ? "สต็อกไม่จำกัด" : `คงเหลือ ${selectedItem.stock ?? 0}`}</span>
                            </p>
                          </div>
                          <span className="text-xs font-bold text-blue-600 shrink-0">เปลี่ยน</span>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-lg bg-white border border-dashed border-slate-300 flex items-center justify-center shrink-0">
                            <Package size={18} className="text-slate-300" />
                          </div>
                          <span className="flex-1 text-sm font-medium text-slate-400">— แตะเพื่อเลือกไอเทม —</span>
                          <span className="text-xs font-bold text-red-500 shrink-0">เลือก</span>
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-slate-400 mt-1">ผู้เล่นที่เปิดได้จะได้ไอเทมนี้เข้าคอลเลกชัน — สต็อกถูกจองตั้งแต่ตอนแอดมินเปิดรอบ</p>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">ชื่อ/มูลค่ารางวัล <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={current.name || ""}
                    onChange={(e) => setCurrent({ ...current, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-red-500 transition-all font-medium text-slate-800"
                    placeholder="เช่น 1,000 หรือ 100 บาท"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">ประเภท (ป้ายบนการ์ด) <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={current.title || ""}
                    onChange={(e) => setCurrent({ ...current, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-red-500 transition-all font-medium text-slate-800"
                    placeholder="เช่น COIN / GEM / VOUCHER"
                  />
                </div>
              </div>

              <UploadInput
                label="ไอคอนรางวัล"
                value={current.icon || ""}
                onChange={(url) => setCurrent({ ...current, icon: url })}
                folder="cards"
                accept="image/png,image/jpeg,image/webp,image/gif"
                placeholder="https://... หรืออัพโหลดรูป"
              />

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">ลำดับการแสดง</label>
                <input
                  type="number"
                  value={current.order ?? 0}
                  onChange={(e) => setCurrent({ ...current, order: Number(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-red-500 transition-all font-medium text-slate-800"
                />
                <p className="text-[10px] text-slate-400 mt-1">แต่ละรอบรางวัลทุกตัวออก 1 ครั้งพอดี (คละตำแหน่งการ์ดตอนเปิดรอบ) — ไม่มีน้ำหนักโอกาสออกแล้ว</p>
              </div>

              {/* รางวัลพิเศษ — เปิดเจอใบที่ซ่อนรางวัลนี้ รอบจบทันที */}
              <label className={`flex items-start gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${current.isSpecial ? "border-amber-400 bg-amber-50" : "border-slate-200 bg-slate-50 hover:border-amber-300"}`}>
                <input
                  type="checkbox"
                  checked={!!current.isSpecial}
                  onChange={(e) => setCurrent({ ...current, isSpecial: e.target.checked })}
                  className="accent-amber-500 w-4 h-4 mt-0.5"
                />
                <span className="flex flex-col">
                  <span className="text-sm font-bold text-slate-800">⭐ รางวัลพิเศษ (Jackpot)</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">ใครเปิดเจอใบที่ซ่อนรางวัลนี้ <span className="font-bold text-amber-600">รอบจบทันที</span> — ใบที่เหลือเปิดต่อไม่ได้ และสต็อกไอเทมที่จองไว้ของใบที่ไม่ถูกเปิดจะถูกคืน</span>
                  <span className="text-[10px] font-bold text-amber-600 mt-1">ตั้งได้เพียง 1 รางวัลเท่านั้น — ติ๊กตัวนี้แล้วป้ายพิเศษของตัวเดิม (ถ้ามี) จะถูกปลดออกอัตโนมัติ</span>
                </span>
              </label>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">สถานะ</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                    <input type="radio" name="isActive" checked={current.isActive !== false} onChange={() => setCurrent({ ...current, isActive: true })} className="accent-red-600 w-4 h-4" /> เปิดใช้งาน
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                    <input type="radio" name="isActive" checked={current.isActive === false} onChange={() => setCurrent({ ...current, isActive: false })} className="accent-red-600 w-4 h-4" /> ปิดใช้งาน
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">ยกเลิก</button>
              <button onClick={handleSave} className="px-5 py-2.5 rounded-lg text-sm font-bold bg-red-600 hover:bg-red-700 text-white transition-colors shadow-sm">บันทึกข้อมูล</button>
            </div>
          </div>
        </div>
      )}

      {/* popup เลือกไอเทมจากคลัง — grid รูปสินค้า + ค้นหา */}
      {itemPickerOpen && (() => {
        const q = itemSearch.trim().toLowerCase();
        const filtered = q
          ? items.filter((it) =>
              it.name.toLowerCase().includes(q) ||
              (it.categoryId?.name || "").toLowerCase().includes(q) ||
              (it.rarityId?.name || "").toLowerCase().includes(q)
            )
          : items;
        return (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
                <h2 className="text-lg font-bold text-slate-800">เลือกไอเทมจากคลัง</h2>
                <button onClick={() => setItemPickerOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="px-6 py-3 border-b border-slate-100 shrink-0">
                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    autoFocus
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    placeholder="ค้นหาชื่อไอเทม / หมวดหมู่ / ระดับความหายาก..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:border-red-500 transition-all font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="p-5 overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="py-14 text-center text-slate-400 text-sm font-medium">
                    {items.length === 0 ? "ยังไม่มีไอเทมในคลัง — ไปเพิ่มที่หน้าจัดการสินค้าก่อน" : "ไม่พบไอเทมที่ค้นหา"}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {filtered.map((it) => {
                      const outOfStock = !it.unlimitedStock && (it.stock ?? 0) <= 0;
                      const isSelected = it._id === current.itemId;
                      return (
                        <button
                          key={it._id}
                          type="button"
                          onClick={() => { handleItemPick(it._id); setItemPickerOpen(false); }}
                          className={`flex flex-col text-left rounded-xl border-2 overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md ${
                            isSelected ? "border-red-500 ring-2 ring-red-500/20" : "border-slate-200 hover:border-red-300"
                          }`}
                        >
                          <div className="aspect-square bg-slate-50 flex items-center justify-center p-3 relative">
                            {it.image ? (
                              <img src={it.image} alt={it.name} className="w-full h-full object-contain" />
                            ) : (
                              <Package size={28} className="text-slate-300" />
                            )}
                            {outOfStock && (
                              <span className="absolute top-2 right-2 text-[9px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full">ของหมด</span>
                            )}
                            {isSelected && (
                              <span className="absolute top-2 left-2 text-red-500"><CheckCircle2 size={18} /></span>
                            )}
                          </div>
                          <div className="px-3 py-2.5 border-t border-slate-100 bg-white">
                            <p className="text-xs font-bold text-slate-800 truncate">{it.name}</p>
                            <p className="text-[10px] font-bold mt-0.5 flex items-center justify-between gap-2">
                              <span style={{ color: it.rarityId?.color || "#94a3b8" }} className="truncate">{it.rarityId?.name || "-"}</span>
                              <span className="text-slate-400 shrink-0">{it.unlimitedStock ? "ไม่จำกัด" : `เหลือ ${it.stock ?? 0}`}</span>
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 mt-0.5 flex items-center justify-between gap-2">
                              <span className="truncate">{it.categoryId?.name || "ไม่มีหมวดหมู่"}</span>
                              {typeof it.price === "number" && <span className="text-red-500 shrink-0">฿{it.price.toLocaleString()}</span>}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
