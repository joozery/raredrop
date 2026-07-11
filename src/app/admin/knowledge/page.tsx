"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Gamepad2, Plus, Trash2, X, Save, Loader2, Pencil, Video, ImagePlus } from "lucide-react";

interface TopicItem {
  _id: string;
  title: string;
  youtubeUrl: string;
  coverImage?: string;
  order: number;
}

const EMPTY_FORM = { title: "", youtubeUrl: "", coverImage: "", order: "0" };

export default function AdminKnowledgePage() {
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<TopicItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/knowledge-topics");
      if (res.ok) setTopics(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTopics(); }, [fetchTopics]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModal("create");
  };

  const openEdit = (t: TopicItem) => {
    setEditing(t);
    setForm({ title: t.title, youtubeUrl: t.youtubeUrl, coverImage: t.coverImage || "", order: String(t.order) });
    setModal("edit");
  };

  const closeModal = () => { setModal(null); setEditing(null); };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "knowledge");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) setForm((f) => ({ ...f, coverImage: data.url }));
      else showToast(data.error || "อัปโหลดรูปไม่สำเร็จ", false);
    } catch {
      showToast("อัปโหลดรูปไม่สำเร็จ", false);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.youtubeUrl.trim()) {
      showToast("กรุณากรอกข้อมูลให้ครบ", false);
      return;
    }
    setSaving(true);
    try {
      const body = { title: form.title.trim(), youtubeUrl: form.youtubeUrl.trim(), coverImage: form.coverImage.trim(), order: Number(form.order) };
      const url = editing ? `/api/admin/knowledge-topics/${editing._id}` : "/api/admin/knowledge-topics";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "เกิดข้อผิดพลาด", false); return; }
      showToast(editing ? "อัปเดตสำเร็จ" : "เพิ่มหัวข้อสำเร็จ");
      closeModal();
      fetchTopics();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`ลบหัวข้อ "${title}" ใช่ไหม?`)) return;
    const res = await fetch(`/api/admin/knowledge-topics/${id}`, { method: "DELETE" });
    if (res.ok) { showToast("ลบสำเร็จ"); fetchTopics(); }
    else showToast("ลบไม่สำเร็จ", false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Gamepad2 size={22} className="text-blue-500" /> วิธีการเล่น
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">จัดการหัวข้อและลิงก์ YouTube บนหน้าวิธีการเล่น</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 bg-red-600 text-white font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-red-700 transition-colors shadow-sm shrink-0"
        >
          <Plus size={16} /> เพิ่มหัวข้อ
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
        </div>
      ) : topics.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400 bg-white rounded-2xl border border-slate-100">
          <Gamepad2 size={48} className="opacity-20" />
          <p className="font-bold">ยังไม่มีหัวข้อ</p>
          <button onClick={openCreate} className="bg-red-600 text-white font-bold px-5 py-2 rounded-xl text-sm hover:bg-red-700">
            เพิ่มหัวข้อแรก
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-8">#</th>
                <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ภาพปก</th>
                <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">หัวข้อ</th>
                <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ลิงก์ YouTube</th>
                <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100/80">
              {topics.map((t, i) => (
                <tr key={t._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6 text-slate-400 text-xs font-bold">{t.order || i + 1}</td>
                  <td className="py-4 px-6">
                    {t.coverImage ? (
                      <img src={t.coverImage} alt={t.title} className="w-16 h-10 rounded-lg object-cover border border-slate-100" />
                    ) : (
                      <div className="w-16 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                        <ImagePlus size={14} className="text-slate-300" />
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-bold text-slate-800 text-xs line-clamp-1">{t.title}</p>
                  </td>
                  <td className="py-4 px-6">
                    <a
                      href={t.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] font-medium text-red-500 hover:underline max-w-xs truncate"
                    >
                      <Video size={13} className="shrink-0" /> {t.youtubeUrl}
                    </a>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(t)}
                        className="text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 p-1.5 rounded-lg transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(t._id, t.title)}
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
              <h3 className="font-bold text-slate-900">{editing ? "แก้ไขหัวข้อ" : "เพิ่มหัวข้อใหม่"}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4 overflow-y-auto">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600">ชื่อหัวข้อ *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 font-medium text-slate-800"
                  placeholder="เช่น วิธีเปิดกล่องสุ่มครั้งแรก"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600">ลิงก์ YouTube *</label>
                <input
                  type="text"
                  value={form.youtubeUrl}
                  onChange={(e) => setForm((f) => ({ ...f, youtubeUrl: e.target.value }))}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 font-medium text-slate-800"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600">ภาพปก</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                    e.target.value = "";
                  }}
                />
                {form.coverImage ? (
                  <div className="relative w-full h-40 rounded-xl overflow-hidden border border-slate-200 group">
                    <img src={form.coverImage} alt="ภาพปก" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="bg-white/90 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-white"
                      >
                        เปลี่ยนรูป
                      </button>
                      <button
                        onClick={() => setForm((f) => ({ ...f, coverImage: "" }))}
                        className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-700"
                      >
                        ลบรูป
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full h-40 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-red-300 transition-colors flex flex-col items-center justify-center gap-2 text-slate-400"
                  >
                    {uploading ? <Loader2 size={22} className="animate-spin" /> : <ImagePlus size={22} />}
                    <span className="text-xs font-bold">{uploading ? "กำลังอัปโหลด..." : "อัปโหลดภาพปก"}</span>
                    <span className="text-[10px] text-slate-400">jpg, png, webp, gif</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-1.5 w-28">
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
