"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShoppingBag, Plus, Pencil, Trash2, X, Save, Loader2,
  Eye, EyeOff, Package, ChevronDown, ChevronUp, PlusCircle,
  AlertCircle,
} from "lucide-react";
import { UploadInput } from "@/components/ui/UploadInput";

interface Account {
  _id: string;
  data: string;
  sold: boolean;
  soldAt?: string;
}

interface ShopListing {
  _id: string;
  title: string;
  description?: string;
  images: string[];
  price: number;
  accounts: Account[];
  status: "active" | "hidden";
  createdAt: string;
}

const EMPTY_FORM: { title: string; description: string; images: string[]; price: string; status: "active" | "hidden" } = { title: "", description: "", images: [""], price: "", status: "active" };

export default function AdminShopPage() {
  const [listings, setListings] = useState<ShopListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<ShopListing | null>(null);
  const [form, setForm] = useState<{ title: string; description: string; images: string[]; price: string; status: "active" | "hidden" }>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Add account states
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newAccountData, setNewAccountData] = useState("");
  const [addingAccount, setAddingAccount] = useState(false);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/shop");
      if (res.ok) setListings(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setModal("create");
  };

  const openEdit = (l: ShopListing) => {
    setEditing(l);
    setForm({
      title: l.title,
      description: l.description || "",
      images: l.images.length > 0 ? l.images : [""],
      price: String(l.price),
      status: l.status,
    });
    setModal("edit");
  };

  const closeModal = () => { setModal(null); setEditing(null); };

  const setImage = (idx: number, url: string) => {
    setForm((f) => {
      const imgs = [...f.images];
      imgs[idx] = url;
      return { ...f, images: imgs };
    });
  };

  const addImageSlot = () => setForm((f) => ({ ...f, images: [...f.images, ""] }));
  const removeImageSlot = (idx: number) =>
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));

  const handleSave = async () => {
    if (!form.title.trim() || !form.price) { showToast("กรุณากรอกชื่อและราคา", false); return; }
    setSaving(true);
    try {
      const body = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        images: form.images.filter(Boolean),
        price: Number(form.price),
        status: form.status,
      };
      const url = modal === "edit" && editing ? `/api/admin/shop/${editing._id}` : "/api/admin/shop";
      const method = modal === "edit" ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "เกิดข้อผิดพลาด", false); return; }
      showToast(modal === "edit" ? "อัปเดตสำเร็จ" : "เพิ่มสินค้าสำเร็จ");
      closeModal();
      fetchListings();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`ลบ "${title}" ใช่ไหม? ข้อมูล Account ทั้งหมดจะหายไปด้วย`)) return;
    const res = await fetch(`/api/admin/shop/${id}`, { method: "DELETE" });
    if (res.ok) { showToast("ลบสำเร็จ"); fetchListings(); }
    else showToast("ลบไม่สำเร็จ", false);
  };

  const handleAddAccount = async (listingId: string) => {
    if (!newAccountData.trim()) return;
    setAddingAccount(true);
    try {
      const res = await fetch(`/api/admin/shop/${listingId}/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: newAccountData }),
      });
      if (res.ok) {
        showToast("เพิ่ม Account สำเร็จ");
        setNewAccountData("");
        setAddingTo(null);
        fetchListings();
      } else {
        const d = await res.json();
        showToast(d.error || "เกิดข้อผิดพลาด", false);
      }
    } finally {
      setAddingAccount(false);
    }
  };

  const handleRemoveAccount = async (listingId: string, accountId: string, sold: boolean) => {
    if (sold) { showToast("ไม่สามารถลบ Account ที่ขายไปแล้ว", false); return; }
    if (!confirm("ลบ Account นี้ใช่ไหม?")) return;
    const res = await fetch(`/api/admin/shop/${listingId}/accounts`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId }),
    });
    if (res.ok) { showToast("ลบ Account สำเร็จ"); fetchListings(); }
    else showToast("ลบไม่สำเร็จ", false);
  };

  const toggleStatus = async (l: ShopListing) => {
    const newStatus = l.status === "active" ? "hidden" : "active";
    const res = await fetch(`/api/admin/shop/${l._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: l.title, description: l.description, images: l.images, price: l.price, status: newStatus }),
    });
    if (res.ok) fetchListings();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShoppingBag size={22} className="text-red-500" /> ร้านค้า
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">จัดการสินค้าและ Account ID สำหรับขาย</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-red-600 text-white font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-red-700 transition-colors shadow-sm"
        >
          <Plus size={16} /> เพิ่มสินค้าใหม่
        </button>
      </div>

      {/* Listings */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400 bg-white rounded-2xl border border-slate-100">
          <Package size={50} className="opacity-20" />
          <p className="font-bold">ยังไม่มีสินค้าในร้านค้า</p>
          <button onClick={openCreate} className="bg-red-600 text-white font-bold px-5 py-2 rounded-xl text-sm hover:bg-red-700">
            เพิ่มสินค้าแรก
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {listings.map((l) => {
            const stock = l.accounts.filter((a) => !a.sold).length;
            const isExpanded = expandedId === l._id;
            return (
              <div key={l._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Listing header */}
                <div className="flex items-center gap-4 p-4">
                  {l.images[0] ? (
                    <img src={l.images[0]} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-100" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      <Package size={24} className="text-slate-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-slate-800 truncate">{l.title}</p>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${l.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {l.status === "active" ? "เปิดขาย" : "ซ่อน"}
                      </span>
                    </div>
                    {l.description && <p className="text-xs text-slate-400 mt-0.5 truncate">{l.description}</p>}
                    <div className="flex items-center gap-4 mt-1">
                      <span className="font-black text-red-600 text-sm">฿{l.price.toLocaleString()}</span>
                      <span className="text-xs text-slate-400">สต็อก: <strong className={stock === 0 ? "text-red-500" : "text-slate-700"}>{stock}</strong> / {l.accounts.length} รายการ</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => toggleStatus(l)} title={l.status === "active" ? "ซ่อน" : "เปิดขาย"} className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
                      {l.status === "active" ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    <button onClick={() => openEdit(l)} className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDelete(l._id, l.title)} className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-100 transition-colors">
                      <Trash2 size={15} />
                    </button>
                    <button onClick={() => setExpandedId(isExpanded ? null : l._id)} className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                  </div>
                </div>

                {/* Account list */}
                {isExpanded && (
                  <div className="border-t border-slate-100 p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account ({l.accounts.length} รายการ)</p>
                      <button
                        onClick={() => { setAddingTo(l._id); setNewAccountData(""); }}
                        className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 transition-colors"
                      >
                        <PlusCircle size={14} /> เพิ่ม Account
                      </button>
                    </div>

                    {/* Add account form */}
                    {addingTo === l._id && (
                      <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-600">ข้อมูล Account (วางข้อความทั้งก้อน)</label>
                        <textarea
                          value={newAccountData}
                          onChange={(e) => setNewAccountData(e.target.value)}
                          rows={8}
                          placeholder={"คลิปYTสอนเข้า\n\nID : หมายเลขไอดี\n\n📧 อีเมลเข้าเกม\nอีเมล: example@gmail.com\nรหัสผ่าน: ..."}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 outline-none focus:border-red-400 resize-none"
                        />
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setAddingTo(null)} className="text-xs font-bold text-slate-500 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors">
                            ยกเลิก
                          </button>
                          <button
                            onClick={() => handleAddAccount(l._id)}
                            disabled={addingAccount || !newAccountData.trim()}
                            className="flex items-center gap-1.5 text-xs font-bold text-white bg-red-600 px-3 py-1.5 rounded-lg hover:bg-red-700 disabled:bg-slate-400 transition-colors"
                          >
                            {addingAccount ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                            เพิ่ม
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Account items */}
                    {l.accounts.length === 0 ? (
                      <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
                        <AlertCircle size={14} /> ยังไม่มี Account — กดเพิ่มเพื่อใส่ข้อมูล
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
                        {l.accounts.map((acc, idx) => (
                          <div key={acc._id} className={`rounded-xl border p-3 text-xs flex gap-3 ${acc.sold ? "bg-slate-50 border-slate-100 opacity-60" : "bg-white border-slate-200"}`}>
                            <div className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black mt-0.5" style={{ background: acc.sold ? "#f1f5f9" : "#fef2f2", color: acc.sold ? "#94a3b8" : "#ef4444" }}>
                              {idx + 1}
                            </div>
                            <pre className="flex-1 font-mono whitespace-pre-wrap text-slate-600 leading-relaxed min-w-0 overflow-hidden">{acc.data}</pre>
                            <div className="shrink-0 flex flex-col items-end gap-1">
                              {acc.sold ? (
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">ขายแล้ว</span>
                              ) : (
                                <>
                                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">พร้อมขาย</span>
                                  <button
                                    onClick={() => handleRemoveAccount(l._id, acc._id, acc.sold)}
                                    className="text-red-400 hover:text-red-600 transition-colors mt-1"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </>
                              )}
                            </div>
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
              <h3 className="font-bold text-slate-900">{modal === "edit" ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5 overflow-y-auto">
              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600">ชื่อสินค้า *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 font-medium text-slate-800"
                  placeholder="เช่น ID มือ 1 ระดับ Gold เซิร์ฟ A"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600">รายละเอียด</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 font-medium text-slate-800 resize-none"
                  placeholder="อธิบายสินค้า เช่น ระดับ rank, skin, ฯลฯ"
                />
              </div>

              {/* Price */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600">ราคา (฿) *</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 font-medium text-slate-800"
                  placeholder="0"
                  min={0}
                />
              </div>

              {/* Images */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-600">รูปสินค้า (หลายรูปได้)</label>
                  <button type="button" onClick={addImageSlot} className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1">
                    <Plus size={13} /> เพิ่มรูป
                  </button>
                </div>
                {form.images.map((img, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="flex-1">
                      <UploadInput
                        value={img}
                        onChange={(url) => setImage(idx, url)}
                        folder="shop"
                        label={`รูปที่ ${idx + 1}`}
                      />
                    </div>
                    {form.images.length > 1 && (
                      <button type="button" onClick={() => removeImageSlot(idx)} className="mt-6 text-red-400 hover:text-red-600 transition-colors">
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Status */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600">สถานะ</label>
                <div className="flex gap-3">
                  {(["active", "hidden"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, status: s }))}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-colors ${form.status === s ? "bg-red-600 text-white border-red-600" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}
                    >
                      {s === "active" ? "เปิดขาย" : "ซ่อน"}
                    </button>
                  ))}
                </div>
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

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[300] px-5 py-3 rounded-2xl shadow-xl font-bold text-sm text-white flex items-center gap-2 ${toast.ok ? "bg-emerald-600" : "bg-red-600"}`}>
          {toast.ok ? "✓" : "✕"} {toast.msg}
        </div>
      )}
    </div>
  );
}
