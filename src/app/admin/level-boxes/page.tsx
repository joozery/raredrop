"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Edit2, Trash2, X, Award, Package, Search, Check, AlertTriangle } from "lucide-react";
import { MediaImage } from "@/components/ui/MediaImage";

interface BoxOption { _id: string; name: string; image: string; price: number; isActive: boolean }
interface LevelBoxReward {
  _id: string;
  minLevel: number;
  boxId: BoxOption;
  isActive: boolean;
}

const emptyForm = { minLevel: "", boxId: "", isActive: true };

export default function LevelBoxesPage() {
  const [rewards, setRewards] = useState<LevelBoxReward[]>([]);
  const [boxes, setBoxes] = useState<BoxOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [form, setForm] = useState({ ...emptyForm });
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [boxSearch, setBoxSearch] = useState("");

  const filteredBoxes = useMemo(
    () => boxes.filter((b) => b.name.toLowerCase().includes(boxSearch.trim().toLowerCase())),
    [boxes, boxSearch]
  );
  const selectedBox = boxes.find((b) => b._id === form.boxId) || null;

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [rRes, bRes] = await Promise.all([
        fetch("/api/admin/level-boxes"),
        fetch("/api/admin/boxes"),
      ]);
      if (rRes.ok) setRewards(await rRes.json());
      if (bRes.ok) setBoxes(await bRes.json());
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const openAdd = () => {
    setModalMode("add");
    setForm({ ...emptyForm });
    setEditId(null);
    setError("");
    setBoxSearch("");
    setIsModalOpen(true);
  };

  const openEdit = (r: LevelBoxReward) => {
    setModalMode("edit");
    setEditId(r._id);
    setForm({ minLevel: String(r.minLevel), boxId: r.boxId?._id || "", isActive: r.isActive });
    setError("");
    setBoxSearch("");
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSave = async () => {
    if (!form.minLevel || !form.boxId) {
      setError("กรุณากรอกเลเวลขั้นต่ำและเลือกกล่องสุ่ม");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const url = modalMode === "add" ? "/api/admin/level-boxes" : `/api/admin/level-boxes/${editId}`;
      const method = modalMode === "add" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minLevel: Number(form.minLevel), boxId: form.boxId, isActive: form.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาด");
      closeModal();
      fetchAll();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/level-boxes/${id}`, { method: "DELETE" });
    if (res.ok) {
      setDeleteConfirm(null);
      fetchAll();
    }
  };

  const toggleActive = async (r: LevelBoxReward) => {
    const res = await fetch(`/api/admin/level-boxes/${r._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !r.isActive }),
    });
    if (res.ok) fetchAll();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">กล่องสุ่มฟรีตามเลเวล</h1>
          <p className="text-sm text-slate-500 mt-1">
            ตั้งค่ากล่องสุ่มที่แจกฟรี 1 ครั้ง/วัน ตามเลเวลผู้เล่น (รีเซ็ตทุกเที่ยงคืนเวลาไทย) — ผู้เล่นจะได้รับสิทธิ์จากเลเวลขั้นต่ำสูงสุดที่ตัวเองถึงแล้ว
          </p>
        </div>
        <button onClick={openAdd} className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm shadow-red-500/20 shrink-0">
          <Plus size={16} />
          เพิ่มเงื่อนไขเลเวล
        </button>
      </div>

      <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-white">
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">เลเวลขั้นต่ำ</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">กล่องสุ่มที่แจกฟรี</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">สถานะ</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100/80">
              {loading ? (
                <tr><td colSpan={4} className="py-12 text-center text-slate-400 font-medium">กำลังโหลดข้อมูล...</td></tr>
              ) : rewards.length === 0 ? (
                <tr><td colSpan={4} className="py-12 text-center text-slate-400 font-medium">ยังไม่มีการตั้งค่า — กดเพิ่มเงื่อนไขเลเวล</td></tr>
              ) : rewards.map((r) => (
                <tr key={r._id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1.5 text-xs font-black bg-amber-50 text-amber-700 px-3 py-1 rounded-full">
                      <Award size={12} /> Lv.{r.minLevel}+
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 p-1">
                        {r.boxId?.image ? (
                          <MediaImage src={r.boxId.image} alt={r.boxId.name} className="w-full h-full object-contain" />
                        ) : (
                          <Package size={16} className="text-slate-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{r.boxId?.name || "(กล่องถูกลบแล้ว)"}</div>
                        <div className="text-[11px] text-slate-400">฿{r.boxId?.price?.toLocaleString() ?? 0} / ครั้ง</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button
                      onClick={() => toggleActive(r)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors ${r.isActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                    >
                      {r.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                    </button>
                  </td>
                  <td className="py-4 px-6 text-right">
                    {deleteConfirm === r._id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleDelete(r._id)} className="text-xs font-bold bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700">ยืนยัน</button>
                        <button onClick={() => setDeleteConfirm(null)} className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200">ยกเลิก</button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(r)} className="text-blue-600 bg-blue-50 border border-blue-100 rounded-lg p-2 hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="แก้ไข">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => setDeleteConfirm(r._id)} className="text-red-500 bg-red-50 border border-red-100 rounded-lg p-2 hover:bg-red-600 hover:text-white transition-all shadow-sm" title="ลบ">
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
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">
                {modalMode === "add" ? "เพิ่มเงื่อนไขเลเวล" : "แก้ไขเงื่อนไขเลเวล"}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4 overflow-y-auto">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-bold px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">เลเวลขั้นต่ำ <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min={1}
                  value={form.minLevel}
                  onChange={(e) => setForm({ ...form, minLevel: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-red-500 transition-all font-black text-slate-800"
                  placeholder="เช่น 5"
                />
                <p className="text-[11px] text-slate-400 mt-1">ผู้เล่นเลเวลนี้ขึ้นไปจะได้สิทธิ์เปิดกล่องนี้ฟรี (จนกว่าจะถึงเงื่อนไขเลเวลถัดไปที่สูงกว่า)</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">กล่องสุ่มที่แจกฟรี <span className="text-red-500">*</span></label>

                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={boxSearch}
                    onChange={(e) => setBoxSearch(e.target.value)}
                    placeholder="ค้นหาชื่อกล่องสุ่ม..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs outline-none focus:border-red-500 transition-all font-medium text-slate-700"
                  />
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto p-1 bg-slate-50/60 rounded-xl border border-slate-100">
                  {filteredBoxes.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-xs text-slate-400 font-medium">ไม่พบกล่องสุ่ม</div>
                  ) : filteredBoxes.map((b) => {
                    const isSelected = form.boxId === b._id;
                    return (
                      <button
                        key={b._id}
                        type="button"
                        onClick={() => setForm({ ...form, boxId: b._id })}
                        className={`relative flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all bg-white ${isSelected ? "border-red-500 ring-2 ring-red-100" : "border-slate-200 hover:border-slate-300"}`}
                      >
                        {isSelected && (
                          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shadow">
                            <Check size={11} strokeWidth={3} />
                          </span>
                        )}
                        <div className="w-full aspect-square rounded-lg bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center p-1">
                          {b.image ? (
                            <MediaImage src={b.image} alt={b.name} className="w-full h-full object-contain" />
                          ) : (
                            <Package size={20} className="text-slate-300" />
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-slate-700 text-center line-clamp-2 leading-tight w-full">{b.name}</p>
                        <p className="text-[10px] font-black text-red-600">฿{b.price.toLocaleString()}</p>
                        {!b.isActive && (
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">ปิดอยู่</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {selectedBox && !selectedBox.isActive && (
                  <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold px-3 py-2 rounded-lg">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    กล่องนี้ปิดใช้งานอยู่ที่ /admin/boxes — ผู้เล่นจะเปิดกล่องนี้ไม่ได้จนกว่าจะเปลี่ยนสถานะกล่องเป็น &quot;เปิด&quot;
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">สถานะเงื่อนไข</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                    <input type="radio" name="isActive" checked={form.isActive === true} onChange={() => setForm({ ...form, isActive: true })} className="accent-red-600 w-4 h-4" /> เปิด
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                    <input type="radio" name="isActive" checked={form.isActive === false} onChange={() => setForm({ ...form, isActive: false })} className="accent-red-600 w-4 h-4" /> ปิด
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
              <button onClick={closeModal} className="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                ยกเลิก
              </button>
              <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-lg text-sm font-bold bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white transition-colors shadow-sm">
                บันทึกข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
