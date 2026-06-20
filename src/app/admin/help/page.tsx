"use client";

import { useState, useEffect, useCallback } from "react";
import { HelpCircle, Plus, Trash2, X, Save, Loader2, Eye, EyeOff, Pencil } from "lucide-react";

interface FaqItem {
  _id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isActive: boolean;
}

const EMPTY_FORM = { question: "", answer: "", category: "", order: "0" };

export default function AdminHelpPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<FaqItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [filterCat, setFilterCat] = useState("ทั้งหมด");

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchFaqs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/faqs");
      if (res.ok) setFaqs(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFaqs(); }, [fetchFaqs]);

  const categories = ["ทั้งหมด", ...Array.from(new Set(faqs.map((f) => f.category)))];

  const filtered = filterCat === "ทั้งหมด" ? faqs : faqs.filter((f) => f.category === filterCat);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModal("create");
  };

  const openEdit = (f: FaqItem) => {
    setEditing(f);
    setForm({ question: f.question, answer: f.answer, category: f.category, order: String(f.order) });
    setModal("edit");
  };

  const closeModal = () => { setModal(null); setEditing(null); };

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim() || !form.category.trim()) {
      showToast("กรุณากรอกข้อมูลให้ครบ", false);
      return;
    }
    setSaving(true);
    try {
      const body = { question: form.question.trim(), answer: form.answer.trim(), category: form.category.trim(), order: Number(form.order) };
      const url = editing ? `/api/admin/faqs/${editing._id}` : "/api/admin/faqs";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "เกิดข้อผิดพลาด", false); return; }
      showToast(editing ? "อัปเดตสำเร็จ" : "เพิ่ม FAQ สำเร็จ");
      closeModal();
      fetchFaqs();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, q: string) => {
    if (!confirm(`ลบคำถาม "${q}" ใช่ไหม?`)) return;
    const res = await fetch(`/api/admin/faqs/${id}`, { method: "DELETE" });
    if (res.ok) { showToast("ลบสำเร็จ"); fetchFaqs(); }
    else showToast("ลบไม่สำเร็จ", false);
  };

  const toggleActive = async (f: FaqItem) => {
    const res = await fetch(`/api/admin/faqs/${f._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !f.isActive }),
    });
    if (res.ok) fetchFaqs();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle size={22} className="text-blue-500" /> ศูนย์ช่วยเหลือ (FAQ)
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">จัดการคำถามที่พบบ่อยบนหน้า Help</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 bg-red-600 text-white font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-red-700 transition-colors shadow-sm shrink-0"
        >
          <Plus size={16} /> เพิ่มคำถาม
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilterCat(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterCat === c ? "bg-red-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400 bg-white rounded-2xl border border-slate-100">
          <HelpCircle size={48} className="opacity-20" />
          <p className="font-bold">ยังไม่มี FAQ</p>
          <button onClick={openCreate} className="bg-red-600 text-white font-bold px-5 py-2 rounded-xl text-sm hover:bg-red-700">
            เพิ่มคำถามแรก
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-8">#</th>
                <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">คำถาม</th>
                <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">หมวดหมู่</th>
                <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">สถานะ</th>
                <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100/80">
              {filtered.map((f, i) => (
                <tr key={f._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6 text-slate-400 text-xs font-bold">{f.order || i + 1}</td>
                  <td className="py-4 px-6">
                    <p className="font-bold text-slate-800 text-xs line-clamp-1">{f.question}</p>
                    <p className="text-slate-400 text-[11px] mt-0.5 line-clamp-1">{f.answer}</p>
                  </td>
                  <td className="py-4 px-6">
                    <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-1 rounded-full">{f.category}</span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button onClick={() => toggleActive(f)}>
                      {f.isActive
                        ? <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100"><Eye size={11} /> แสดง</span>
                        : <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200"><EyeOff size={11} /> ซ่อน</span>
                      }
                    </button>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(f)}
                        className="text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 p-1.5 rounded-lg transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(f._id, f.question)}
                        className="text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 p-1.5 rounded-lg transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeModal}>
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-slate-900">{editing ? "แก้ไข FAQ" : "เพิ่มคำถามใหม่"}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4 overflow-y-auto">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">หมวดหมู่ *</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 font-medium text-slate-800"
                    placeholder="เช่น การเปิดกล่อง, การเงิน"
                    list="cat-options"
                  />
                  <datalist id="cat-options">
                    {Array.from(new Set(faqs.map((f) => f.category))).map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                <div className="w-full sm:w-24 flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">ลำดับ</label>
                  <input
                    type="number"
                    value={form.order}
                    onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 font-medium text-slate-800"
                    min={0}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600">คำถาม *</label>
                <input
                  type="text"
                  value={form.question}
                  onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 font-medium text-slate-800"
                  placeholder="คำถามที่พบบ่อย..."
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600">คำตอบ *</label>
                <textarea
                  value={form.answer}
                  onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
                  rows={5}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 font-medium text-slate-800 resize-none"
                  placeholder="คำตอบโดยละเอียด..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3 shrink-0">
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
        <div className={`fixed bottom-6 left-6 right-6 sm:left-auto sm:right-6 z-[300] px-5 py-3 rounded-2xl shadow-xl font-bold text-sm text-white flex items-center justify-center gap-2 ${toast.ok ? "bg-emerald-600" : "bg-red-600"}`}>
          {toast.ok ? "✓" : "✕"} {toast.msg}
        </div>
      )}
    </div>
  );
}
