"use client";

import { useState, useEffect, useCallback } from "react";
import { Zap, Plus, Trash2, X, Save, Loader2, Eye, EyeOff, Package } from "lucide-react";

interface BoxOption {
  _id: string;
  name: string;
  image: string;
  price: number;
}

interface FlashSaleItem {
  _id: string;
  boxId: { _id: string; name: string; image: string; price: number };
  salePrice: number;
  endsAt: string;
  isActive: boolean;
  createdAt: string;
}

const EMPTY_FORM = { boxId: "", salePrice: "", endsAt: "" };

function formatLocalDatetime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function timeLeft(endsAt: string) {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return "หมดแล้ว";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 24) return `${Math.floor(h / 24)} วัน`;
  return `${h} ชม. ${m} นาที`;
}

export default function FlashSalePage() {
  const [sales, setSales] = useState<FlashSaleItem[]>([]);
  const [boxes, setBoxes] = useState<BoxOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<FlashSaleItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resSales, resBoxes] = await Promise.all([
        fetch("/api/admin/flash-sale"),
        fetch("/api/admin/boxes"),
      ]);
      if (resSales.ok) setSales(await resSales.json());
      if (resBoxes.ok) setBoxes(await resBoxes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModal("create");
  };

  const openEdit = (s: FlashSaleItem) => {
    setEditing(s);
    setForm({
      boxId: s.boxId._id,
      salePrice: String(s.salePrice),
      endsAt: formatLocalDatetime(s.endsAt),
    });
    setModal("edit");
  };

  const closeModal = () => { setModal(null); setEditing(null); };

  const handleSave = async () => {
    if (!form.boxId || !form.salePrice || !form.endsAt) {
      showToast("กรุณากรอกข้อมูลให้ครบ", false);
      return;
    }
    setSaving(true);
    try {
      const body = { boxId: form.boxId, salePrice: Number(form.salePrice), endsAt: form.endsAt };
      const url = editing ? `/api/admin/flash-sale/${editing._id}` : "/api/admin/flash-sale";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "เกิดข้อผิดพลาด", false); return; }
      showToast(editing ? "อัปเดตสำเร็จ" : "เพิ่ม Flash Sale สำเร็จ");
      closeModal();
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`ลบ Flash Sale ของ "${name}" ใช่ไหม?`)) return;
    const res = await fetch(`/api/admin/flash-sale/${id}`, { method: "DELETE" });
    if (res.ok) { showToast("ลบสำเร็จ"); fetchData(); }
    else showToast("ลบไม่สำเร็จ", false);
  };

  const toggleActive = async (s: FlashSaleItem) => {
    const res = await fetch(`/api/admin/flash-sale/${s._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !s.isActive }),
    });
    if (res.ok) fetchData();
  };

  const selectedBox = boxes.find((b) => b._id === form.boxId);
  const discount = selectedBox && form.salePrice
    ? Math.round((1 - Number(form.salePrice) / selectedBox.price) * 100)
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Zap size={22} className="text-yellow-500 fill-yellow-400" /> Flash Sale
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">จัดการสินค้าลดราคาพิเศษบนหน้าแรก</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-red-600 text-white font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-red-700 transition-colors shadow-sm"
        >
          <Plus size={16} /> เพิ่ม Flash Sale
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
        </div>
      ) : sales.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400 bg-white rounded-2xl border border-slate-100">
          <Zap size={48} className="opacity-20" />
          <p className="font-bold">ยังไม่มี Flash Sale</p>
          <button onClick={openCreate} className="bg-red-600 text-white font-bold px-5 py-2 rounded-xl text-sm hover:bg-red-700">
            เพิ่ม Flash Sale แรก
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">กล่องสุ่ม</th>
                <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">ราคาปกติ</th>
                <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">ราคา Sale</th>
                <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">ลด</th>
                <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">เหลือเวลา</th>
                <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">สถานะ</th>
                <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100/80">
              {sales.map((s) => {
                const disc = Math.round((1 - s.salePrice / s.boxId.price) * 100);
                const expired = new Date(s.endsAt) <= new Date();
                return (
                  <tr key={s._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
                          <img src={s.boxId.image} alt={s.boxId.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="font-bold text-slate-800 text-xs">{s.boxId.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right text-xs text-slate-400 line-through font-medium">
                      ฿{s.boxId.price.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="font-black text-red-600 text-sm">฿{s.salePrice.toLocaleString()}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="bg-red-100 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                        -{disc}%
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs font-medium">
                      <span className={expired ? "text-slate-400" : "text-emerald-600 font-bold"}>
                        {timeLeft(s.endsAt)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button onClick={() => toggleActive(s)} title={s.isActive ? "ซ่อน" : "เปิดใช้"}>
                        {s.isActive && !expired
                          ? <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100"><Eye size={11} /> เปิดอยู่</span>
                          : <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200"><EyeOff size={11} /> ปิดอยู่</span>
                        }
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(s)}
                          className="text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(s._id, s.boxId.name)}
                          className="text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeModal}>
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">{editing ? "แก้ไข Flash Sale" : "เพิ่ม Flash Sale"}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5">
              {/* Box selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600">กล่องสุ่ม *</label>
                <select
                  value={form.boxId}
                  onChange={(e) => setForm((f) => ({ ...f, boxId: e.target.value }))}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 font-medium text-slate-800"
                >
                  <option value="">-- เลือกกล่องสุ่ม --</option>
                  {boxes.map((b) => (
                    <option key={b._id} value={b._id}>{b.name} (ราคาปกติ ฿{b.price.toLocaleString()})</option>
                  ))}
                </select>
              </div>

              {/* Preview box */}
              {selectedBox && (
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <img src={selectedBox.image} alt={selectedBox.name} className="w-12 h-12 rounded-lg object-cover border border-slate-100" />
                  <div>
                    <p className="font-bold text-sm text-slate-800">{selectedBox.name}</p>
                    <p className="text-xs text-slate-500">ราคาปกติ <span className="font-bold text-slate-700">฿{selectedBox.price.toLocaleString()}</span></p>
                  </div>
                </div>
              )}

              {/* Sale price */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600">ราคา Sale (฿) *</label>
                <input
                  type="number"
                  value={form.salePrice}
                  onChange={(e) => setForm((f) => ({ ...f, salePrice: e.target.value }))}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 font-medium text-slate-800"
                  placeholder="0"
                  min={0}
                />
                {discount !== null && discount > 0 && (
                  <p className="text-xs text-red-600 font-bold">ลด {discount}% จากราคาปกติ</p>
                )}
              </div>

              {/* End date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600">หมดเขต *</label>
                <input
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 font-medium text-slate-800"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3">
              <button onClick={closeModal} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors text-sm">
                ยกเลิก
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 disabled:bg-slate-400 transition-colors text-sm flex items-center justify-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-[300] px-5 py-3 rounded-2xl shadow-xl font-bold text-sm text-white flex items-center gap-2 ${toast.ok ? "bg-emerald-600" : "bg-red-600"}`}>
          {toast.ok ? "✓" : "✕"} {toast.msg}
        </div>
      )}
    </div>
  );
}
