"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Gift, Plus, Pencil, Trash2, X, Save, Loader2,
  ChevronDown, ChevronUp, Coins, Package, Users, Clock,
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Gift size={22} className="text-rose-500" /> ซองแดง (Red Envelope)
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">ตั้งรอบแจกซองแดง กำหนดเงื่อนไขยอดใช้จ่ายและจำนวนคนที่ต้องครบก่อนจับรางวัล</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 bg-red-600 text-white font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-red-700 transition-colors shadow-sm shrink-0"
        >
          <Plus size={16} /> เพิ่มรอบ
        </button>
      </div>

      {/* Item catalog management — แยกจากไอเทมร้านค้า/กล่องสุ่มโดยสิ้นเชิง */}
      <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Package size={16} className="text-slate-400" /> ไอเทมรางวัลซองแดง (แยกจากไอเทมร้านค้า/กล่องสุ่ม)
          </h2>
          <button
            onClick={openCreateItem}
            className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 transition-colors"
          >
            <Plus size={14} /> เพิ่มไอเทม
          </button>
        </div>
        {items.length === 0 ? (
          <div className="px-5 py-6 text-center text-slate-400 text-sm">ยังไม่มีไอเทม — เพิ่มได้เลย</div>
        ) : (
          <div className="flex flex-wrap gap-2 p-4">
            {items.map((it) => (
              <div key={it._id} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl pl-2 pr-1.5 py-1.5">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                  {it.image ? <img src={it.image} alt="" className="w-full h-full object-contain" /> : <Package size={14} className="text-slate-300" />}
                </div>
                <span className="text-xs font-bold text-slate-700">{it.name}</span>
                {itemDeleteConfirm === it._id ? (
                  <div className="flex items-center gap-1 ml-1">
                    <button onClick={() => handleDeleteItem(it._id)} className="text-[10px] font-bold bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700">ยืนยัน</button>
                    <button onClick={() => setItemDeleteConfirm(null)} className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-300">ยกเลิก</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-0.5 ml-1">
                    <button onClick={() => openEditItem(it)} className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors">
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => setItemDeleteConfirm(it._id)} className="w-6 h-6 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-100 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
        </div>
      ) : rounds.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400 bg-white rounded-2xl border border-slate-100">
          <Gift size={48} className="opacity-20" />
          <p className="font-bold">ยังไม่มีรอบซองแดง</p>
          <button onClick={openCreate} className="bg-red-600 text-white font-bold px-5 py-2 rounded-xl text-sm hover:bg-red-700">
            เพิ่มรอบแรก
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rounds.map((r) => {
            const status = STATUS_CONFIG[r.status];
            const isExpanded = expandedId === r._id;
            const hasParticipants = r.participants.length > 0;
            return (
              <div key={r._id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${r.isActive ? "border-slate-100" : "border-slate-100 opacity-60"}`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggleActive(r)}
                      title={r.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${r.isActive ? "bg-emerald-500" : "bg-slate-300"}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${r.isActive ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                    <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center shrink-0 overflow-hidden">
                      {r.image ? (
                        <img src={r.image} alt="" className="w-full h-full object-cover" />
                      ) : r.rewardType === "item" && r.itemId?.image ? (
                        <img src={r.itemId.image} alt="" className="w-full h-full object-contain p-1" />
                      ) : r.rewardType === "cash" ? (
                        <Coins size={20} className="text-amber-500" />
                      ) : (
                        <Package size={20} className="text-rose-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-slate-800 truncate">{r.label}</p>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${status.cls}`}>{status.label}</span>
                        {!r.isActive && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-200 text-slate-500">ปิดใช้งาน</span>}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        รางวัล <strong className="text-rose-600">{rewardLabel(r)}</strong>
                        {" · "}เงื่อนไขใช้จ่าย ฿{r.conditionAmount.toLocaleString()}
                        {r.conditionLevel > 0 && <> · ต้องเป็น Lv.{r.conditionLevel}+</>}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock size={11} />
                        {new Date(r.scheduledAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        {" – "}
                        {new Date(r.endsAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        {" · "}<Users size={11} className="inline" /> {r.participants.length}/{r.maxPeople} คน
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {deleteConfirm === r._id ? (
                      <>
                        <button onClick={() => handleDelete(r._id)} className="text-xs font-bold bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700">
                          {hasParticipants ? "ยืนยันลบ (มีคนเข้าร่วมแล้ว)" : "ยืนยัน"}
                        </button>
                        <button onClick={() => setDeleteConfirm(null)} className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200">ยกเลิก</button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => openEdit(r)}
                          title={hasParticipants ? "แก้ไข (จะรีเซ็ตผู้เข้าร่วมเดิม)" : "แก้ไข"}
                          className="w-8 h-8 rounded-lg border bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 flex items-center justify-center transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(r._id)}
                          title={hasParticipants ? "ลบ (มีคนเข้าร่วมแล้ว)" : "ลบ"}
                          className="w-8 h-8 rounded-lg border bg-red-50 border-red-100 text-red-400 hover:bg-red-100 flex items-center justify-center transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                        <button onClick={() => setExpandedId(isExpanded ? null : r._id)} className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 p-4 bg-slate-50/50">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ผู้เข้าร่วม ({r.participants.length})</p>
                    {r.participants.length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 text-center bg-white border border-slate-100 rounded-xl">ยังไม่มีคนเข้าร่วม</p>
                    ) : (
                      <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-50 max-h-72 overflow-y-auto">
                        {r.participants.map((p, i) => (
                          <div key={i} className="flex items-center gap-2.5 px-3 py-2 text-xs">
                            <div className="w-6 h-6 rounded-full bg-slate-100 overflow-hidden shrink-0">
                              {p.userId?.avatar ? <img src={p.userId.avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">{p.userId?.name?.charAt(0) || "?"}</div>}
                            </div>
                            <span className="font-bold text-slate-700 flex-1 truncate">{p.userId?.name || "ผู้ใช้ถูกลบ"}</span>
                            {r.status === "resolved" ? (
                              r.rewardType === "cash" ? (
                                <span className="font-bold text-rose-600">+฿{(p.rewardAmount || 0).toLocaleString()}</span>
                              ) : (
                                <span className={`font-bold ${p.isWinner ? "text-rose-600" : "text-slate-400"}`}>{p.isWinner ? "🎉 ผู้โชคดี" : "ไม่ได้รับ"}</span>
                              )
                            ) : (
                              <span className="text-slate-400">{new Date(p.joinedAt).toLocaleTimeString("th-TH", { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit" })}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeModal}>
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
                label="รูปซองแดง (ไม่บังคับ — ไม่ตั้งจะใช้กราฟิกซองแดงปกติ)"
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
                      ยังไม่มีไอเทมในคลังซองแดง — เพิ่มได้ที่ section "ไอเทมรางวัลซองแดง" ด้านล่างก่อน
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
                  <p className="text-[11px] text-slate-400">สุ่มผู้โชคดี 1 คนจากผู้เข้าร่วมทั้งหมดได้รับไอเทมนี้ไป — ไอเทมชุดนี้แยกจากไอเทมร้านค้า/กล่องสุ่มโดยสิ้นเชิง</p>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">เริ่มรับสมัคร *</label>
                  <input
                    type="datetime-local"
                    value={form.scheduledAt}
                    onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 font-medium text-slate-800"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">ปิดรับ/เส้นตาย *</label>
                  <input
                    type="datetime-local"
                    value={form.endsAt}
                    onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 font-medium text-slate-800"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 -mt-2">ถ้าครบจำนวนคนก่อน จะจับรางวัลทันที ถ้าไม่ครบจะจับรางวัลจากคนที่เข้าร่วมไว้ตอนถึงเส้นตาย</p>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeItemModal}>
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

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600">รายละเอียด (ไม่บังคับ)</label>
                <textarea
                  value={itemForm.description}
                  onChange={(e) => setItemForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 font-medium text-slate-800 resize-none"
                />
              </div>
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

      {toast && (
        <div className={`fixed bottom-6 left-6 right-6 sm:left-auto sm:right-6 z-[300] px-5 py-3 rounded-2xl shadow-xl font-bold text-sm text-white flex items-center justify-center gap-2 ${toast.ok ? "bg-emerald-600" : "bg-red-600"}`}>
          {toast.ok ? "✓" : "✕"} {toast.msg}
        </div>
      )}
    </div>
  );
}
