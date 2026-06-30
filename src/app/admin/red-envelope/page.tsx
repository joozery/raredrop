"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Gift, Plus, Pencil, Trash2, X, Save, Loader2,
  ChevronDown, ChevronUp, Coins, Package, Users, Clock, RefreshCw,
} from "lucide-react";
import { UploadInput } from "@/components/ui/UploadInput";

interface ItemOption { _id: string; name: string; image?: string; description?: string }

type ItemForm = { name: string; image: string; description: string };
const EMPTY_ITEM_FORM: ItemForm = { name: "", image: "", description: "" };

interface Participant {
  userId: { _id: string; name: string; avatar?: string } | null;
  joinedAt: string;
  rewardAmount?: number;
  isWinner?: boolean;
}

interface Round {
  _id: string;
  label: string;
  image?: string;
  rewardType: "cash" | "item";
  totalAmount?: number;
  itemId?: { _id: string; name: string; image?: string } | null;
  conditionAmount: number;
  conditionLevel: number;
  maxPeople: number;
  scheduledAt: string;
  endsAt: string;
  isActive: boolean;
  status: "scheduled" | "open" | "resolved" | "cancelled";
  participants: Participant[];
  resolvedAt?: string;
}

function formatLocalDatetime(iso: string) {
  const d = new Date(iso);
  // แปลงให้เป็นเวลาไทย (+07:00) เสมอ
  const thTime = new Date(d.getTime() + (7 * 60 * 60 * 1000));
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${thTime.getUTCFullYear()}-${pad(thTime.getUTCMonth() + 1)}-${pad(thTime.getUTCDate())}T${pad(thTime.getUTCHours())}:${pad(thTime.getUTCMinutes())}`;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const pad = (n: number) => n.toString().padStart(2, "0");

// คืน "YYYY-MM-DD" ของวันไทย + offsetDays
function thaiDateStr(offsetDays = 0) {
  const th = new Date(Date.now() + 7 * 60 * 60 * 1000 + offsetDays * DAY_MS);
  return `${th.getUTCFullYear()}-${pad(th.getUTCMonth() + 1)}-${pad(th.getUTCDate())}`;
}

// คืน datetime-local string จาก วัน + เวลา "HH:MM" (เวลาไทย)
function buildDatetimeLocal(dateStr: string, time: string) {
  return `${dateStr}T${time}`;
}

// บวก duration นาทีกับ datetime-local string
function addMinutes(datetimeLocal: string, minutes: number) {
  const ms = new Date(datetimeLocal + "+07:00").getTime() + minutes * 60 * 1000;
  const th = new Date(ms + 7 * 60 * 60 * 1000);
  return `${th.getUTCFullYear()}-${pad(th.getUTCMonth() + 1)}-${pad(th.getUTCDate())}T${pad(th.getUTCHours())}:${pad(th.getUTCMinutes())}`;
}

const DAY_PRESETS = [
  { label: "วันนี้", days: 0 },
  { label: "+1 วัน", days: 1 },
  { label: "+2 วัน", days: 2 },
  { label: "+3 วัน", days: 3 },
];
const TIME_PRESETS = ["18:00", "19:00", "20:00", "21:00", "22:00"];
const DURATION_PRESETS = [
  { label: "30น.", minutes: 30 },
  { label: "1ชม.", minutes: 60 },
  { label: "2ชม.", minutes: 120 },
  { label: "3ชม.", minutes: 180 },
  { label: "24ชม.", minutes: 1440 },
];

type RoundForm = {
  label: string; image: string; rewardType: "cash" | "item"; totalAmount: string; itemId: string;
  conditionAmount: string; conditionLevel: string; maxPeople: string; scheduledAt: string; endsAt: string;
};
const EMPTY_FORM: RoundForm = {
  label: "", image: "", rewardType: "cash", totalAmount: "", itemId: "",
  conditionAmount: "0", conditionLevel: "0", maxPeople: "20", scheduledAt: "", endsAt: "",
};

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  scheduled: { label: "ยังไม่เริ่ม", cls: "bg-amber-50 text-amber-600" },
  open: { label: "กำลังเปิดรับ", cls: "bg-emerald-50 text-emerald-700" },
  resolved: { label: "จับรางวัลแล้ว", cls: "bg-slate-100 text-slate-500" },
  cancelled: { label: "ยกเลิก", cls: "bg-red-50 text-red-500" },
};

export default function AdminRedEnvelopePage() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [items, setItems] = useState<ItemOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Round | null>(null);
  const [form, setForm] = useState<RoundForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [needsResetConfirm, setNeedsResetConfirm] = useState(false);
  const [presetTime, setPresetTime] = useState("20:00");
  const [presetDuration, setPresetDuration] = useState(60);

  // Item catalog management (แยกจากไอเทมร้านค้า/กล่องสุ่มโดยสิ้นเชิง)
  const [itemModal, setItemModal] = useState<"create" | "edit" | null>(null);
  const [editingItem, setEditingItem] = useState<ItemOption | null>(null);
  const [itemForm, setItemForm] = useState<ItemForm>(EMPTY_ITEM_FORM);
  const [itemSaving, setItemSaving] = useState(false);
  const [itemDeleteConfirm, setItemDeleteConfirm] = useState<string | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchRounds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/red-envelope/rounds");
      if (res.ok) setRounds(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRounds(); }, [fetchRounds]);

  const fetchItems = useCallback(async () => {
    const res = await fetch("/api/admin/red-envelope-items");
    if (res.ok) setItems(await res.json());
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openCreateItem = () => {
    setEditingItem(null);
    setItemForm(EMPTY_ITEM_FORM);
    setItemModal("create");
  };

  const openEditItem = (it: ItemOption) => {
    setEditingItem(it);
    setItemForm({ name: it.name, image: it.image || "", description: it.description || "" });
    setItemModal("edit");
  };

  const closeItemModal = () => { setItemModal(null); setEditingItem(null); };

  const handleSaveItem = async () => {
    if (!itemForm.name.trim()) { showToast("กรุณากรอกชื่อไอเทม", false); return; }
    setItemSaving(true);
    try {
      const body = { name: itemForm.name.trim(), image: itemForm.image || undefined, description: itemForm.description.trim() || undefined };
      const url = itemModal === "edit" && editingItem ? `/api/admin/red-envelope-items/${editingItem._id}` : "/api/admin/red-envelope-items";
      const method = itemModal === "edit" ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "เกิดข้อผิดพลาด", false); return; }
      showToast(itemModal === "edit" ? "อัปเดตไอเทมสำเร็จ" : "เพิ่มไอเทมสำเร็จ");
      closeItemModal();
      fetchItems();
    } finally {
      setItemSaving(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    const res = await fetch(`/api/admin/red-envelope-items/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok) { showToast("ลบไอเทมสำเร็จ"); setItemDeleteConfirm(null); fetchItems(); }
    else showToast(data.error || "ลบไม่สำเร็จ", false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setNeedsResetConfirm(false);
    setModal("create");
  };

  const openEdit = (r: Round) => {
    setEditing(r);
    setNeedsResetConfirm(false);
    setForm({
      label: r.label,
      image: r.image || "",
      rewardType: r.rewardType,
      totalAmount: r.totalAmount ? String(r.totalAmount) : "",
      itemId: r.itemId?._id || "",
      conditionAmount: String(r.conditionAmount),
      conditionLevel: String(r.conditionLevel || 0),
      maxPeople: String(r.maxPeople),
      scheduledAt: formatLocalDatetime(r.scheduledAt),
      endsAt: formatLocalDatetime(r.endsAt),
    });
    setModal("edit");
  };

  const closeModal = () => { setModal(null); setEditing(null); setNeedsResetConfirm(false); };

  const handleSave = async (resetConfirm = false) => {
    if (!form.label.trim() || !form.scheduledAt || !form.endsAt) {
      showToast("กรุณากรอกชื่อรอบและช่วงเวลาให้ครบ", false); return;
    }
    setSaving(true);
    try {
      const body: any = {
        label: form.label.trim(),
        image: form.image || undefined,
        rewardType: form.rewardType,
        totalAmount: form.rewardType === "cash" ? Number(form.totalAmount) : undefined,
        itemId: form.rewardType === "item" ? form.itemId : undefined,
        conditionAmount: Number(form.conditionAmount) || 0,
        conditionLevel: Number(form.conditionLevel) || 0,
        maxPeople: Number(form.maxPeople) || 1,
        scheduledAt: new Date(form.scheduledAt + "+07:00").toISOString(),
        endsAt: new Date(form.endsAt + "+07:00").toISOString(),
      };
      if (resetConfirm) body.resetConfirm = true;
      const url = modal === "edit" && editing ? `/api/admin/red-envelope/rounds/${editing._id}` : "/api/admin/red-envelope/rounds";
      const method = modal === "edit" ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) {
        if (data.needsResetConfirm) { setNeedsResetConfirm(true); return; }
        showToast(data.error || "เกิดข้อผิดพลาด", false);
        return;
      }
      showToast(modal === "edit" ? (resetConfirm ? "รีเซ็ตรอบและบันทึกสำเร็จ" : "อัปเดตรอบสำเร็จ") : "เพิ่มรอบสำเร็จ");
      closeModal();
      fetchRounds();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/red-envelope/rounds/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok) { showToast("ลบรอบสำเร็จ"); setDeleteConfirm(null); fetchRounds(); }
    else showToast(data.error || "ลบไม่สำเร็จ", false);
  };

  const handleToggleActive = async (r: Round) => {
    const res = await fetch(`/api/admin/red-envelope/rounds/${r._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !r.isActive }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(!r.isActive ? "เปิดใช้งานรอบนี้แล้ว" : "ปิดใช้งานรอบนี้แล้ว");
      fetchRounds();
    } else {
      showToast(data.error || "เกิดข้อผิดพลาด", false);
    }
  };

  const rewardLabel = (r: Round) => r.rewardType === "cash" ? `฿${(r.totalAmount || 0).toLocaleString()}` : (r.itemId?.name || "ไอเทม");

  return (
    <div className="flex flex-col xl:flex-row gap-6 min-h-screen">
      {/* LEFT COLUMN: Items */}
      <div className="w-full xl:w-80 flex flex-col gap-4 shrink-0">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-100px)]">
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-black text-slate-800 text-lg">1. ไอเทมรางวัลซองแดง</h2>
            <p className="text-xs text-slate-500 mt-1 mb-4">จัดการของรางวัลที่พร้อมให้เลือก</p>
            <button
              onClick={openCreateItem}
              className="w-full bg-red-600 text-white font-bold py-2.5 rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
            >
              <Plus size={16} /> เพิ่มไอเทมรางวัล
            </button>
            <div className="relative mt-4">
              <input
                type="text"
                placeholder="ค้นหาไอเทมรางวัล..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-red-400"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {items.map((it) => (
              <div
                key={it._id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", it._id);
                }}
                className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-2.5 cursor-grab active:cursor-grabbing hover:border-red-300 hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                  {it.image ? <img src={it.image} alt="" className="w-full h-full object-contain p-1" /> : <Package size={20} className="text-slate-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-800 truncate">{it.name}</p>
                  <p className="text-xs text-emerald-600 font-medium mt-0.5">มีในระบบ</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <button onClick={() => openEditItem(it)} className="text-slate-300 hover:text-slate-600">
                    <Pencil size={14} />
                  </button>
                  <div className="text-slate-300 group-hover:text-slate-400 cursor-grab">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16"/></svg>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="mt-4 border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-slate-400 gap-2 bg-slate-50/50">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"/></svg>
              <p className="text-xs text-center font-medium leading-relaxed">ลากไอเทมรางวัล<br/>มาวางในช่วงเวลาด้านขวา</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Matrix */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-100px)]">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h2 className="font-black text-slate-800 text-lg">2. ตั้งเวลาแจกกล่องล่วงหน้า 3 วัน</h2>
              <p className="text-xs text-slate-500 mt-1">กำหนดช่วงเวลาเปิดรับ - ปิดรับ - สุ่มแจก (ลากไอเทมมาวางได้เลย)</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button className="bg-white border border-slate-200 text-slate-600 font-bold py-2 px-3 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 text-xs shadow-sm">
                <RefreshCw size={14} /> คัดลอกจากวันนี้
              </button>
              <button className="bg-white border border-slate-200 text-slate-600 font-bold py-2 px-3 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 text-xs shadow-sm">
                <Plus size={14} /> เพิ่มรอบอิสระ
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto p-4 bg-slate-50/50">
            <div className="min-w-[800px]">
              {/* Table Header */}
              <div className="grid grid-cols-4 gap-4 mb-4 text-center sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10 py-2">
                <div className="font-bold text-slate-500 text-sm">ช่วงเวลา</div>
                {[0, 1, 2].map(offset => {
                  const d = new Date(Date.now() + 7*3600000 + offset*86400000);
                  const isToday = offset === 0;
                  return (
                    <div key={offset} className={`font-bold text-sm ${isToday ? "text-emerald-600" : "text-emerald-500"}`}>
                      {d.getUTCDate()} {["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."][d.getUTCMonth()]} {d.getUTCFullYear() + 543} {isToday && "(วันนี้)"}
                    </div>
                  );
                })}
              </div>
              
              {/* Table Body */}
              <div className="flex flex-col gap-3">
                {["19:00", "20:00", "21:00", "22:00", "23:00"].map(time => {
                  const [h] = time.split(":");
                  const nextHour = parseInt(h) + 1;
                  const nextH = nextHour >= 24 ? "00:00+1" : nextHour.toString().padStart(2,"0") + ":00";
                  const nextHForForm = nextHour >= 24 ? "23:59" : nextH;
                  return (
                    <div key={time} className="grid grid-cols-4 gap-4">
                      {/* Row Header (Time) */}
                      <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm flex flex-col justify-center">
                        <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700 mb-2">
                          <Clock size={14} className="text-slate-400" /> {time} - {nextH}
                        </div>
                        <div className="text-[10px] text-slate-500 space-y-1">
                          <p>เปิดรับ <span className="font-medium text-slate-700">{time}</span></p>
                          <p>ปิดรับ <span className="font-medium text-slate-700">{nextH}</span></p>
                          <p>สุ่มแจก <span className="font-medium text-slate-700">{nextH}</span></p>
                        </div>
                      </div>
                      
                      {/* Cells */}
                      {[0, 1, 2].map(offset => {
                        const dateStr = thaiDateStr(offset);
                        const matchStartStr = `${dateStr}T${time}`;
                        // Find rounds that roughly match this slot
                        const cellRounds = rounds.filter(r => r.scheduledAt.startsWith(matchStartStr));
                        
                        return (
                          <div 
                            key={offset}
                            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-red-400", "bg-red-50"); }}
                            onDragLeave={(e) => { e.currentTarget.classList.remove("border-red-400", "bg-red-50"); }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.currentTarget.classList.remove("border-red-400", "bg-red-50");
                              const itemId = e.dataTransfer.getData("text/plain");
                              if(!itemId) return;
                              const it = items.find(i => i._id === itemId);
                              if(it) {
                                setForm({
                                  ...EMPTY_FORM,
                                  label: `แจก ${it.name} รอบ ${time}`,
                                  rewardType: "item",
                                  itemId: it._id,
                                  scheduledAt: `${dateStr}T${time}`,
                                  endsAt: `${dateStr}T${nextHForForm}`,
                                  maxPeople: "100"
                                });
                                setModal("create");
                              }
                            }}
                            className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-2 min-h-[120px] flex flex-col gap-2 transition-colors relative"
                          >
                            {cellRounds.length === 0 ? (
                              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-300 pointer-events-none">
                                + วางรางวัลที่นี่
                              </div>
                            ) : (
                              cellRounds.map(r => (
                                <div key={r._id} onClick={() => openEdit(r)} className="bg-white border border-slate-200 rounded-lg p-2 flex items-center gap-2 shadow-sm cursor-pointer hover:border-red-300 transition-colors relative z-10 group">
                                  <div className="w-10 h-10 rounded bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                                    {r.image ? <img src={r.image} alt="" className="w-full h-full object-cover" /> :
                                     r.rewardType === "item" && r.itemId?.image ? <img src={r.itemId.image} alt="" className="w-full h-full object-contain" /> :
                                     r.rewardType === "cash" ? <Coins size={16} className="text-amber-500" /> : <Package size={16} className="text-rose-400" />
                                    }
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-[11px] text-slate-800 truncate">{rewardLabel(r)}</p>
                                    <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5"><Users size={10}/> {r.maxPeople} คน</p>
                                  </div>
                                  <button onClick={(e)=>{ e.stopPropagation(); setDeleteConfirm(r._id); }} className="text-slate-300 hover:text-red-500 p-1">
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
              
              {/* Other rounds that don't fit the matrix perfectly */}
              <div className="mt-8 pt-6 border-t border-slate-200">
                <h3 className="font-bold text-slate-700 text-sm mb-4">รอบอื่นๆ (นอกเหนือจากตาราง)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {rounds.filter(r => !["19:00","20:00","21:00","22:00","23:00"].some(t => r.scheduledAt.includes(`T${t}`))).map(r => (
                    <div key={r._id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 shadow-sm">
                       <div className="w-10 h-10 rounded bg-slate-50 flex items-center justify-center shrink-0">
                        {r.rewardType === "cash" ? <Coins size={16} className="text-amber-500" /> : <Package size={16} className="text-rose-400" />}
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs text-slate-800 truncate">{r.label}</p>
                          <p className="text-[10px] text-slate-500">{new Date(r.scheduledAt).toLocaleString("th-TH")}</p>
                       </div>
                       <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(r)} className="w-7 h-7 flex items-center justify-center rounded bg-slate-100 text-slate-500 hover:bg-slate-200"><Pencil size={12}/></button>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {/* Create/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeModal}>
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-slate-900">{modal === "edit" ? "แก้ไขรอบซองแดง" : "เพิ่มรอบซองแดง"}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4 overflow-y-auto">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600">ชื่อรอบ *</label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 font-medium text-slate-800"
                  placeholder="เช่น ฝนซองแดง รอบ 20:00"
                />
              </div>

              <UploadInput
                label="รูปซองแดง (ไม่บังคับ)"
                value={form.image}
                onChange={(url) => setForm((f) => ({ ...f, image: url }))}
                folder="red-envelope-rounds"
                accept="image/jpeg,image/png,image/webp,image/gif"
                placeholder="https://... หรืออัพโหลดรูปภาพ"
              />

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-600">ประเภทรางวัล</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, rewardType: "cash" }))}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${form.rewardType === "cash" ? "border-red-500 bg-red-50 text-red-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                  >
                    <Coins size={15} /> เงิน (สุ่มแบ่งให้ทุกคน)
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, rewardType: "item" }))}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${form.rewardType === "item" ? "border-red-500 bg-red-50 text-red-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                  >
                    <Package size={15} /> ไอเทม (สุ่ม 1 คน)
                  </button>
                </div>
              </div>

              {form.rewardType === "cash" ? (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">ยอดเงินรวมที่จะแบ่ง (฿) *</label>
                  <input
                    type="number" min="0"
                    value={form.totalAmount}
                    onChange={(e) => setForm((f) => ({ ...f, totalAmount: e.target.value }))}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 font-black text-red-600"
                    placeholder="เช่น 1288"
                  />
                  <p className="text-[11px] text-slate-400">ระบบจะสุ่มแบ่งยอดนี้ให้ทุกคนที่เข้าร่วม ได้ไม่เท่ากัน รวมแล้วเท่ายอดนี้เป๊ะ</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">ไอเทมรางวัล *</label>
                  {items.length === 0 ? (
                    <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      ยังไม่มีไอเทมในคลังซองแดง
                    </p>
                  ) : (
                    <select
                      value={form.itemId}
                      onChange={(e) => setForm((f) => ({ ...f, itemId: e.target.value }))}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 font-medium text-slate-800"
                    >
                      <option value="">-- เลือกไอเทม --</option>
                      {items.map((it) => <option key={it._id} value={it._id}>{it.name}</option>)}
                    </select>
                  )}
                  <p className="text-[11px] text-slate-400">สุ่มผู้โชคดี 1 คนจากผู้เข้าร่วมทั้งหมดได้รับไอเทมนี้ไป</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">เงื่อนไขยอดใช้จ่ายวันนี้ (฿)</label>
                  <input
                    type="number" min="0"
                    value={form.conditionAmount}
                    onChange={(e) => setForm((f) => ({ ...f, conditionAmount: e.target.value }))}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 font-bold text-slate-800"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">เลเวลขั้นต่ำ (0=ไม่จำกัด)</label>
                  <input
                    type="number" min="0"
                    value={form.conditionLevel}
                    onChange={(e) => setForm((f) => ({ ...f, conditionLevel: e.target.value }))}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 font-bold text-slate-800"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">จำนวนคนสูงสุด *</label>
                  <input
                    type="number" min="1"
                    value={form.maxPeople}
                    onChange={(e) => setForm((f) => ({ ...f, maxPeople: e.target.value }))}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 font-black text-slate-800"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-600">ช่วงเวลาแจก *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-slate-400 font-medium">เริ่มรับสมัคร</span>
                    <input
                      type="datetime-local"
                      value={form.scheduledAt}
                      onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 font-medium text-slate-800"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-slate-400 font-medium">ปิดรับ / เส้นตาย</span>
                    <input
                      type="datetime-local"
                      value={form.endsAt}
                      onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 font-medium text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {needsResetConfirm && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-col gap-2">
                  <p className="text-xs font-bold text-amber-700">
                    รอบนี้มีคนเข้าร่วมแล้ว — การบันทึกจะล้างผู้เข้าร่วมเดิมทั้งหมดและสุ่มผลใหม่ทั้งรอบ ยืนยันที่จะรีเซ็ตหรือไม่?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave(true)}
                      disabled={saving}
                      className="text-xs font-bold bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 disabled:opacity-60"
                    >
                      ยืนยันรีเซ็ตและบันทึก
                    </button>
                    <button onClick={() => setNeedsResetConfirm(false)} className="text-xs font-bold bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50">
                      ยกเลิก
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3 shrink-0">
              <button onClick={closeModal} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors text-sm">
                ยกเลิก
              </button>
              <button onClick={() => handleSave(false)} disabled={saving} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 disabled:bg-slate-400 transition-colors text-sm flex items-center justify-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Create/Edit Modal */}
      {itemModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeItemModal}>
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-slate-900">{itemModal === "edit" ? "แก้ไขไอเทม" : "เพิ่มไอเทมรางวัลซองแดง"}</h3>
              <button onClick={closeItemModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4 overflow-y-auto">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600">ชื่อไอเทม *</label>
                <input
                  type="text"
                  value={itemForm.name}
                  onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 font-medium text-slate-800"
                  placeholder="เช่น Luffy Gear 5 Figure"
                />
              </div>

              <UploadInput
                label="รูปไอเทม (ไม่บังคับ)"
                value={itemForm.image}
                onChange={(url) => setItemForm((f) => ({ ...f, image: url }))}
                folder="red-envelope-items"
                accept="image/jpeg,image/png,image/webp,image/gif"
                placeholder="https://... หรืออัพโหลดรูปภาพ"
              />
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3 shrink-0">
              <button onClick={closeItemModal} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors text-sm">
                ยกเลิก
              </button>
              <button onClick={handleSaveItem} disabled={itemSaving} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 disabled:bg-slate-400 transition-colors text-sm flex items-center justify-center gap-2">
                {itemSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {itemSaving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm dialogs */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full flex flex-col gap-4 text-center">
              <Trash2 size={48} className="text-red-500 mx-auto" />
              <h3 className="font-bold text-slate-900 text-lg">ยืนยันการลบ?</h3>
              <p className="text-sm text-slate-500">การกระทำนี้ไม่สามารถย้อนกลับได้</p>
              <div className="flex gap-3 mt-2">
                 <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-slate-100 text-slate-700 font-bold py-2.5 rounded-xl hover:bg-slate-200">ยกเลิก</button>
                 <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl hover:bg-red-700">ลบข้อมูล</button>
              </div>
           </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 left-6 right-6 sm:left-auto sm:right-6 z-[300] px-5 py-3 rounded-2xl shadow-xl font-bold text-sm text-white flex items-center justify-center gap-2 ${toast.ok ? "bg-emerald-600" : "bg-red-600"}`}>
          {toast.ok ? "✓" : "✕"} {toast.msg}
        </div>
      )}
    </div>
  );
}
