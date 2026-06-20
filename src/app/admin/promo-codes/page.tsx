"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Coins, Gem, Package, Box as BoxIcon, Ticket } from "lucide-react";

interface RarityData { _id: string; name: string; color: string }
interface BoxOption { _id: string; name: string; image: string; price: number }
interface ItemOption { _id: string; name: string; image: string; type: string; coinRewardAmount: number; rarityId: RarityData }
interface PromoCode {
  _id: string;
  code: string;
  description?: string;
  rewardType: "coins" | "gemCoins" | "item" | "box";
  rewardAmount?: number;
  itemId?: ItemOption;
  boxId?: BoxOption;
  boxOpenTimes?: number;
  maxUses: number;
  usedCount: number;
  expiresAt?: string | null;
  isActive: boolean;
  createdAt: string;
}

function formatLocalDatetime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const emptyForm = {
  code: "", description: "",
  rewardType: "coins" as "coins" | "gemCoins" | "item" | "box",
  rewardAmount: 100,
  itemId: "",
  boxId: "", boxOpenTimes: 1,
  maxUses: 0,
  expiresAt: "",
  isActive: true,
};

export default function PromoCodesPage() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [boxes, setBoxes] = useState<BoxOption[]>([]);
  const [items, setItems] = useState<ItemOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [form, setForm] = useState({ ...emptyForm });
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [cRes, bRes, iRes] = await Promise.all([
        fetch("/api/admin/promo-codes"),
        fetch("/api/admin/boxes"),
        fetch("/api/admin/items"),
      ]);
      if (cRes.ok) setCodes(await cRes.json());
      if (bRes.ok) setBoxes(await bRes.json());
      if (iRes.ok) setItems(await iRes.json());
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const openAdd = () => {
    setModalMode("add");
    setForm({ ...emptyForm });
    setEditId(null);
    setIsModalOpen(true);
  };

  const openEdit = (c: PromoCode) => {
    setModalMode("edit");
    setEditId(c._id);
    setForm({
      code: c.code,
      description: c.description || "",
      rewardType: c.rewardType,
      rewardAmount: c.rewardAmount || 100,
      itemId: c.itemId ? c.itemId._id : "",
      boxId: c.boxId ? c.boxId._id : "",
      boxOpenTimes: c.boxOpenTimes || 1,
      maxUses: c.maxUses,
      expiresAt: c.expiresAt ? formatLocalDatetime(c.expiresAt) : "",
      isActive: c.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.code.trim()) { alert("กรุณากรอกโค้ด"); return; }
    if ((form.rewardType === "coins" || form.rewardType === "gemCoins") && !form.rewardAmount) { alert("กรุณาระบุจำนวน"); return; }
    if (form.rewardType === "item" && !form.itemId) { alert("กรุณาเลือกไอเทม"); return; }
    if (form.rewardType === "box" && !form.boxId) { alert("กรุณาเลือกกล่องสุ่ม"); return; }
    setSaving(true);
    try {
      const url = modalMode === "add" ? "/api/admin/promo-codes" : `/api/admin/promo-codes/${editId}`;
      const method = modalMode === "add" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, expiresAt: form.expiresAt || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาด");
      setIsModalOpen(false);
      fetchAll();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/promo-codes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("ลบไม่สำเร็จ");
      setDeleteConfirm(null);
      fetchAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getTypeLabel = (c: PromoCode) => {
    if (c.rewardType === "coins") return { label: "🪙 เหรียญ", sub: `${c.rewardAmount?.toLocaleString()} coins`, cls: "bg-amber-50 text-amber-700" };
    if (c.rewardType === "gemCoins") return { label: "💎 GemCoin", sub: `${c.rewardAmount?.toLocaleString()} GemCoin`, cls: "bg-purple-50 text-purple-700" };
    if (c.rewardType === "item") return { label: "📦 ไอเทม", sub: c.itemId?.name || "", cls: "bg-green-50 text-green-700" };
    return { label: "🎁 กล่องสุ่ม", sub: c.boxId ? `${c.boxId.name} × ${c.boxOpenTimes} ครั้ง` : "", cls: "bg-blue-50 text-blue-700" };
  };

  const isExpired = (c: PromoCode) => !!c.expiresAt && new Date(c.expiresAt) <= new Date();
  const isMaxedOut = (c: PromoCode) => c.maxUses > 0 && c.usedCount >= c.maxUses;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">โค้ดแลกของ</h1>
          <p className="text-sm text-slate-500 mt-1">จัดการโค้ดสำหรับแลกรางวัล (เหรียญ/GemCoin/ไอเทม/กล่องสุ่ม)</p>
        </div>
        <button onClick={openAdd} className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm shrink-0">
          <Plus size={16} />
          เพิ่มโค้ด
        </button>
      </div>

      <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">โค้ด</th>
              <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">รางวัล</th>
              <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">ใช้ไป</th>
              <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">หมดอายุ</th>
              <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">สถานะ</th>
              <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100/80">
            {loading ? (
              <tr><td colSpan={6} className="py-12 text-center text-slate-400">กำลังโหลด...</td></tr>
            ) : codes.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-slate-400">ยังไม่มีโค้ด</td></tr>
            ) : codes.map((c) => {
              const { label, sub, cls } = getTypeLabel(c);
              const expired = isExpired(c);
              const maxedOut = isMaxedOut(c);
              return (
                <tr key={c._id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Ticket size={15} className="text-red-400" />
                      <span className="font-mono font-black text-slate-900">{c.code}</span>
                    </div>
                    {c.description && <div className="text-xs text-slate-400 mt-0.5">{c.description}</div>}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col gap-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded w-max ${cls}`}>{label}</span>
                      {sub && <span className="text-xs text-slate-500">{sub}</span>}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`font-bold text-sm ${maxedOut ? "text-red-500" : "text-slate-700"}`}>
                      {c.usedCount} / {c.maxUses === 0 ? "∞" : c.maxUses}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-xs">
                    {c.expiresAt ? (
                      <span className={expired ? "text-red-500 font-bold" : "text-slate-500"}>
                        {new Date(c.expiresAt).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "2-digit" })}
                        {expired && " (หมดแล้ว)"}
                      </span>
                    ) : (
                      <span className="text-slate-400">ไม่มีกำหนด</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${c.isActive && !expired && !maxedOut ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {c.isActive && !expired && !maxedOut ? "เปิด" : "ปิด"}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    {deleteConfirm === c._id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleDelete(c._id)} className="text-xs font-bold bg-red-600 text-white px-3 py-1.5 rounded-lg">ยืนยัน</button>
                        <button onClick={() => setDeleteConfirm(null)} className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg">ยกเลิก</button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(c)} className="text-blue-600 bg-blue-50 border border-blue-100 rounded-lg p-2 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => setDeleteConfirm(c._id)} className="text-red-500 bg-red-50 border border-red-100 rounded-lg p-2 hover:bg-red-600 hover:text-white transition-all shadow-sm">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <h2 className="text-lg font-bold text-slate-800">
                {modalMode === "add" ? "เพิ่มโค้ดใหม่" : "แก้ไขโค้ด"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">โค้ด <span className="text-red-500">*</span></label>
                <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-red-500 font-mono font-black text-slate-800 uppercase"
                  placeholder="เช่น WELCOME100" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">คำอธิบาย (ไม่บังคับ)</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-red-500 font-medium text-slate-800"
                  placeholder="รายละเอียดเพิ่มเติม..." />
              </div>

              {/* Type selector — 4 ประเภท */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">ประเภทรางวัล <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { value: "coins", icon: Coins, label: "เหรียญ", color: "amber" },
                    { value: "gemCoins", icon: Gem, label: "GemCoin", color: "purple" },
                    { value: "item", icon: Package, label: "ไอเทม", color: "green" },
                    { value: "box", icon: BoxIcon, label: "กล่องสุ่ม", color: "blue" },
                  ].map(({ value, icon: Icon, label, color }) => (
                    <button key={value} type="button" onClick={() => setForm({ ...form, rewardType: value as any })}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${form.rewardType === value ? `border-${color}-500 bg-${color}-50` : "border-slate-200 hover:border-slate-300"}`}>
                      <Icon size={20} className={form.rewardType === value ? `text-${color}-600` : "text-slate-400"} />
                      <div className={`text-xs font-bold ${form.rewardType === value ? `text-${color}-700` : "text-slate-700"}`}>{label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Coins / GemCoin amount */}
              {(form.rewardType === "coins" || form.rewardType === "gemCoins") && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">จำนวน <span className="text-red-500">*</span></label>
                  <input type="number" min="1" value={form.rewardAmount}
                    onChange={(e) => setForm({ ...form, rewardAmount: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500 font-black text-slate-800" />
                </div>
              )}

              {/* Item selector */}
              {form.rewardType === "item" && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">ไอเทม <span className="text-red-500">*</span></label>
                  <select value={form.itemId} onChange={(e) => setForm({ ...form, itemId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500 font-medium text-slate-800">
                    <option value="">-- เลือกไอเทม --</option>
                    {items.map((i) => <option key={i._id} value={i._id}>{i.name}</option>)}
                  </select>
                </div>
              )}

              {/* Box selector */}
              {form.rewardType === "box" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">กล่องสุ่ม <span className="text-red-500">*</span></label>
                    <select value={form.boxId} onChange={(e) => setForm({ ...form, boxId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500 font-medium text-slate-800">
                      <option value="">-- เลือกกล่อง --</option>
                      {boxes.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">จำนวนครั้ง</label>
                    <input type="number" min="1" value={form.boxOpenTimes}
                      onChange={(e) => setForm({ ...form, boxOpenTimes: parseInt(e.target.value) || 1 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500 font-black text-slate-800" />
                  </div>
                </div>
              )}

              {/* Max uses + expiry + status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">จำนวนครั้งที่ใช้ได้ทั้งหมด (0=ไม่จำกัด)</label>
                  <input type="number" min="0" value={form.maxUses}
                    onChange={(e) => setForm({ ...form, maxUses: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500 font-black text-slate-800" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">วันหมดอายุ (ไม่บังคับ)</label>
                  <input type="datetime-local" value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500 font-medium text-slate-800" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">สถานะ</label>
                <div className="flex gap-2 mt-1">
                  <button type="button" onClick={() => setForm({ ...form, isActive: true })}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${form.isActive ? "border-green-500 bg-green-50 text-green-700" : "border-slate-200 text-slate-500"}`}>
                    เปิด
                  </button>
                  <button type="button" onClick={() => setForm({ ...form, isActive: false })}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${!form.isActive ? "border-red-400 bg-red-50 text-red-600" : "border-slate-200 text-slate-500"}`}>
                    ปิด
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                ยกเลิก
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2.5 rounded-lg text-sm font-bold bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white transition-colors shadow-sm">
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
