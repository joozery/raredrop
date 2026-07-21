"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ShoppingBag, Plus, Pencil, Trash2, X, Save, Loader2,
  Eye, EyeOff, Package, ChevronDown, ChevronUp, PlusCircle,
  AlertCircle, Upload, Image as ImageIcon, Search, FolderInput, ArrowUp, ArrowDown,
} from "lucide-react";
import { UploadInput } from "@/components/ui/UploadInput";
import Link from "next/link";

interface Account {
  _id: string;
  data: string;
  sold: boolean;
  soldAt?: string;
}

interface CategoryOption {
  _id: string;
  name: string;
  image?: string;
  order: number;
  isActive: boolean;
}

type CategoryForm = { name: string; slug: string; image: string; order: string; isActive: boolean };
const EMPTY_CATEGORY_FORM: CategoryForm = { name: "", slug: "", image: "", order: "0", isActive: true };

interface BannerItem {
  _id: string;
  image: string;
  link?: string;
  order: number;
  isActive: boolean;
}

type BannerForm = { image: string; link: string; order: string; isActive: boolean };
const EMPTY_BANNER_FORM: BannerForm = { image: "", link: "", order: "0", isActive: true };

interface ShopListing {
  _id: string;
  title: string;
  description?: string;
  images: string[];
  price: number;
  accounts: Account[];
  status: "active" | "hidden";
  liveChatEnabled?: boolean;
  youtubeUrl?: string;
  categoryId?: string;
  isFeatured?: boolean;
  requireUid?: boolean;
  uidLabel?: string;
  createdAt: string;
}

type ShopForm = { title: string; description: string; images: string[]; price: string; status: "active" | "hidden"; liveChatEnabled: boolean; youtubeUrl: string; categoryId: string; isFeatured: boolean; requireUid: boolean; uidLabel: string };
const EMPTY_FORM: ShopForm = { title: "", description: "", images: [""], price: "", status: "active", liveChatEnabled: false, youtubeUrl: "", categoryId: "", isFeatured: false, requireUid: false, uidLabel: "UID / ไอดีผู้เล่น" };

interface ShopListingCardProps {
  l: ShopListing;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  categoryName?: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  toggleStatus: (l: ShopListing) => void;
  openEdit: (l: ShopListing) => void;
  handleDelete: (id: string, title: string) => void;
  addingTo: string | null;
  setAddingTo: (id: string | null) => void;
  newAccountData: string;
  setNewAccountData: (v: string) => void;
  handleAddAccount: (id: string) => void;
  addingAccount: boolean;
  handleRemoveAccount: (listingId: string, accountId: string, sold: boolean) => void;
  bulkMode: boolean;
  setBulkMode: (v: boolean) => void;
  bulkQty: string;
  setBulkQty: (v: string) => void;
}

function ShopListingCard({
  l, isFirst, isLast, onMoveUp, onMoveDown, categoryName, isExpanded, onToggleExpand, toggleStatus, openEdit, handleDelete,
  addingTo, setAddingTo, newAccountData, setNewAccountData, handleAddAccount, addingAccount, handleRemoveAccount,
  bulkMode, setBulkMode, bulkQty, setBulkQty,
}: ShopListingCardProps) {
  const stock = l.accounts.filter((a) => !a.sold).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Listing header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
          <div className="shrink-0 flex flex-col items-center gap-0.5">
            <button
              onClick={onMoveUp}
              disabled={isFirst}
              className="w-6 h-6 flex items-center justify-center rounded text-slate-300 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              title="เลื่อนขึ้น"
            >
              <ArrowUp size={13} />
            </button>
            <button
              onClick={onMoveDown}
              disabled={isLast}
              className="w-6 h-6 flex items-center justify-center rounded text-slate-300 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              title="เลื่อนลง"
            >
              <ArrowDown size={13} />
            </button>
          </div>
          {l.images[0] ? (
            <img src={l.images[0]} alt="" className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover shrink-0 border border-slate-100" />
          ) : (
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
              <Package size={24} className="text-slate-300" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-slate-800 truncate">{l.title}</p>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${l.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                {l.status === "active" ? "เปิดขาย" : "ซ่อน"}
              </span>
              {categoryName && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                  {categoryName}
                </span>
              )}
              {l.isFeatured && (
                <span className="text-[9px] font-black text-amber-600 uppercase tracking-wider">⭐ แนะนำ</span>
              )}
            </div>
            {l.description && <p className="text-xs text-slate-400 mt-0.5 truncate">{l.description}</p>}
            <div className="flex items-center gap-4 mt-1">
              <span className="font-black text-red-600 text-sm">฿{l.price.toLocaleString()}</span>
              <span className="text-xs text-slate-400">สต็อก: <strong className={stock === 0 ? "text-red-500" : "text-slate-700"}>{stock}</strong> / {l.accounts.length} รายการ</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <button onClick={() => toggleStatus(l)} title={l.status === "active" ? "ซ่อน" : "เปิดขาย"} className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
            {l.status === "active" ? <Eye size={15} /> : <EyeOff size={15} />}
          </button>
          <button onClick={() => openEdit(l)} className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
            <Pencil size={15} />
          </button>
          <button onClick={() => handleDelete(l._id, l.title)} className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-100 transition-colors">
            <Trash2 size={15} />
          </button>
          <button onClick={onToggleExpand} className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
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
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 flex flex-col gap-2.5">
              {/* Bulk mode toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={bulkMode}
                  onChange={(e) => { setBulkMode(e.target.checked); if (!e.target.checked) setBulkQty("1"); }}
                  className="accent-blue-600 w-3.5 h-3.5 shrink-0"
                />
                <span className="text-xs font-bold text-slate-600">กำหนดจำนวนสต็อก (เพิ่มหลายชุดพร้อมกัน)</span>
              </label>

              {/* Quantity input — แสดงเมื่อติ๊ก bulk mode */}
              {bulkMode && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  <span className="text-xs font-bold text-blue-700 shrink-0">จำนวนชุด:</span>
                  <input
                    type="number"
                    value={bulkQty}
                    onChange={(e) => setBulkQty(e.target.value)}
                    min={1}
                    max={500}
                    className="w-20 bg-white border border-blue-200 rounded-lg px-2 py-1 text-sm font-black text-blue-800 outline-none focus:border-blue-400 text-center"
                  />
                  <span className="text-xs text-blue-600">ชุด (ใช้ข้อมูลด้านล่างซ้ำทั้งหมด)</span>
                </div>
              )}

              <label className="text-xs font-bold text-slate-600">ข้อมูล Account (วางข้อความทั้งก้อน)</label>
              <textarea
                value={newAccountData}
                onChange={(e) => setNewAccountData(e.target.value)}
                rows={8}
                placeholder={"คลิปYTสอนเข้า\n\nID : หมายเลขไอดี\n\n📧 อีเมลเข้าเกม\nอีเมล: example@gmail.com\nรหัสผ่าน: ..."}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 outline-none focus:border-red-400 resize-none"
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setAddingTo(null); setBulkMode(false); setBulkQty("1"); }} className="text-xs font-bold text-slate-500 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors">
                  ยกเลิก
                </button>
                <button
                  onClick={() => handleAddAccount(l._id)}
                  disabled={addingAccount || !newAccountData.trim()}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-red-600 px-3 py-1.5 rounded-lg hover:bg-red-700 disabled:bg-slate-400 transition-colors"
                >
                  {addingAccount ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                  {bulkMode && Number(bulkQty) > 1 ? `เพิ่ม ${bulkQty} ชุด` : "เพิ่ม"}
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
}

export default function AdminShopPage() {
  const [listings, setListings] = useState<ShopListing[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<ShopListing | null>(null);
  const [form, setForm] = useState<ShopForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Add account states
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newAccountData, setNewAccountData] = useState("");
  const [addingAccount, setAddingAccount] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkQty, setBulkQty] = useState("1");

  // Bulk image upload
  const bulkUploadRef = useRef<HTMLInputElement>(null);
  const [bulkUploading, setBulkUploading] = useState(false);

  // Banner management
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [bannerModal, setBannerModal] = useState<"create" | "edit" | null>(null);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
  const [bannerForm, setBannerForm] = useState<BannerForm>(EMPTY_BANNER_FORM);
  const [bannerSaving, setBannerSaving] = useState(false);
  const [bannerDeleteConfirm, setBannerDeleteConfirm] = useState<string | null>(null);

  const fetchBanners = useCallback(async () => {
    const res = await fetch("/api/admin/banners");
    if (res.ok) setBanners(await res.json());
  }, []);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  const openCreateBanner = () => {
    setEditingBanner(null);
    setBannerForm(EMPTY_BANNER_FORM);
    setBannerModal("create");
  };

  const openEditBanner = (b: BannerItem) => {
    setEditingBanner(b);
    setBannerForm({ image: b.image, link: b.link || "", order: String(b.order), isActive: b.isActive });
    setBannerModal("edit");
  };

  const closeBannerModal = () => { setBannerModal(null); setEditingBanner(null); };

  const handleSaveBanner = async () => {
    if (!bannerForm.image) { showToast("กรุณาอัปโหลดรูปแบนเนอร์", false); return; }
    setBannerSaving(true);
    try {
      const body = {
        image: bannerForm.image,
        link: bannerForm.link.trim() || undefined,
        page: "shop",
        order: Number(bannerForm.order) || 0,
        isActive: bannerForm.isActive,
      };
      const url = bannerModal === "edit" && editingBanner ? `/api/admin/banners/${editingBanner._id}` : "/api/admin/banners";
      const method = bannerModal === "edit" ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "เกิดข้อผิดพลาด", false); return; }
      showToast(bannerModal === "edit" ? "อัปเดตแบนเนอร์สำเร็จ" : "เพิ่มแบนเนอร์สำเร็จ");
      closeBannerModal();
      fetchBanners();
    } finally {
      setBannerSaving(false);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    const res = await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
    if (res.ok) { showToast("ลบแบนเนอร์สำเร็จ"); setBannerDeleteConfirm(null); fetchBanners(); }
    else showToast("ลบไม่สำเร็จ", false);
  };

  const toggleBannerActive = async (b: BannerItem) => {
    const res = await fetch(`/api/admin/banners/${b._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !b.isActive }),
    });
    if (res.ok) fetchBanners();
  };

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

  const fetchCategories = useCallback(async () => {
    const res = await fetch("/api/admin/shop-categories");
    if (res.ok) setCategories(await res.json());
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  // Category management
  const [categoryModal, setCategoryModal] = useState<"create" | "edit" | null>(null);
  const [editingCategory, setEditingCategory] = useState<CategoryOption | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(EMPTY_CATEGORY_FORM);
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryDeleteConfirm, setCategoryDeleteConfirm] = useState<string | null>(null);

  const openCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm(EMPTY_CATEGORY_FORM);
    setCategoryModal("create");
  };

  const openEditCategory = (c: CategoryOption) => {
    setEditingCategory(c);
    setCategoryForm({ name: c.name, slug: (c as any).slug || "", image: c.image || "", order: String(c.order), isActive: c.isActive });
    setCategoryModal("edit");
  };

  const closeCategoryModal = () => { setCategoryModal(null); setEditingCategory(null); };

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) { showToast("กรุณากรอกชื่อหมวดหมู่", false); return; }
    setCategorySaving(true);
    try {
      const body = {
        name: categoryForm.name.trim(),
        slug: categoryForm.slug.trim() || undefined,
        image: categoryForm.image || undefined,
        order: Number(categoryForm.order) || 0,
        isActive: categoryForm.isActive,
      };
      const url = categoryModal === "edit" && editingCategory ? `/api/admin/shop-categories/${editingCategory._id}` : "/api/admin/shop-categories";
      const method = categoryModal === "edit" ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "เกิดข้อผิดพลาด", false); return; }
      showToast(categoryModal === "edit" ? "อัปเดตหมวดหมู่สำเร็จ" : "เพิ่มหมวดหมู่สำเร็จ");
      closeCategoryModal();
      fetchCategories();
    } finally {
      setCategorySaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const res = await fetch(`/api/admin/shop-categories/${id}`, { method: "DELETE" });
    if (res.ok) { showToast("ลบหมวดหมู่สำเร็จ"); setCategoryDeleteConfirm(null); fetchCategories(); }
    else showToast("ลบไม่สำเร็จ", false);
  };

  const toggleCategoryActive = async (c: CategoryOption) => {
    const res = await fetch(`/api/admin/shop-categories/${c._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !c.isActive }),
    });
    if (res.ok) fetchCategories();
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
      liveChatEnabled: !!l.liveChatEnabled,
      youtubeUrl: l.youtubeUrl || "",
      categoryId: l.categoryId || "",
      isFeatured: !!l.isFeatured,
      requireUid: !!l.requireUid,
      uidLabel: l.uidLabel || "UID / ไอดีผู้เล่น",
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

  const handleBulkUpload = async (files: FileList) => {
    setBulkUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.append("file", file);
        body.append("folder", "shop");
        const res = await fetch("/api/upload", { method: "POST", body });
        const data = await res.json();
        if (res.ok) urls.push(data.url);
      }
      if (urls.length > 0) {
        setForm((f) => ({ ...f, images: [...f.images.filter(Boolean), ...urls] }));
      }
      if (urls.length < files.length) showToast("อัพโหลดบางไฟล์ไม่สำเร็จ", false);
    } finally {
      setBulkUploading(false);
    }
  };

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
        liveChatEnabled: form.liveChatEnabled,
        youtubeUrl: form.youtubeUrl.trim(),
        categoryId: form.categoryId || undefined,
        isFeatured: form.isFeatured,
        requireUid: form.requireUid,
        uidLabel: form.uidLabel.trim() || "UID / ไอดีผู้เล่น",
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
    const qty = bulkMode ? Math.max(1, Number(bulkQty) || 1) : 1;
    try {
      const res = await fetch(`/api/admin/shop/${listingId}/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: newAccountData, quantity: qty }),
      });
      if (res.ok) {
        showToast(qty > 1 ? `เพิ่ม ${qty} Account สำเร็จ` : "เพิ่ม Account สำเร็จ");
        setNewAccountData("");
        setAddingTo(null);
        setBulkMode(false);
        setBulkQty("1");
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

  const handleReorder = (newOrder: ShopListing[]) => {
    setListings(newOrder);
    fetch("/api/admin/shop/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: newOrder.map((l) => l._id) }),
    }).catch(() => {});
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    const filtered = listings.filter((l) => !search || l.title.toLowerCase().includes(search.toLowerCase()));
    const item = filtered[fromIndex];
    const globalFrom = listings.indexOf(item);
    const targetItem = filtered[toIndex];
    const globalTo = listings.indexOf(targetItem);
    const newOrder = [...listings];
    newOrder.splice(globalFrom, 1);
    newOrder.splice(globalTo, 0, item);
    handleReorder(newOrder);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShoppingBag size={22} className="text-red-500" /> ร้านค้า
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">จัดการสินค้าและ Account ID สำหรับขาย</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/admin/shop/bulk-import" className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm">
            <FolderInput size={16} /> นำเข้าจากโฟลเดอร์
          </Link>
          <button onClick={openCreate} className="flex items-center justify-center gap-2 bg-red-600 text-white font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-red-700 transition-colors shadow-sm">
            <Plus size={16} /> เพิ่มสินค้าใหม่
          </button>
        </div>
      </div>

      {/* Category management */}
      <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <ShoppingBag size={16} className="text-slate-400" /> หมวดหมู่เกม (ของร้านค้า)
          </h2>
          <button
            onClick={openCreateCategory}
            className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 transition-colors"
          >
            <Plus size={14} /> เพิ่มหมวดหมู่
          </button>
        </div>
        {categories.length === 0 ? (
          <div className="px-5 py-6 text-center text-slate-400 text-sm">ยังไม่มีหมวดหมู่ — เพิ่มได้เลย (แยกจากหมวดหมู่กล่องสุ่ม)</div>
        ) : (
          <div className="flex flex-wrap gap-2 p-4">
            {categories.map((c) => (
              <div key={c._id} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-1.5 py-1.5">
                {c.image ? (
                  <img src={c.image} alt="" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <span className={`w-2 h-2 rounded-full ${c.isActive ? "bg-emerald-500" : "bg-slate-300"}`} />
                )}
                <span className="text-xs font-bold text-slate-700">{c.name}</span>
                {!c.isActive && <span className="text-[9px] font-bold text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">ซ่อน</span>}
                {categoryDeleteConfirm === c._id ? (
                  <div className="flex items-center gap-1 ml-1">
                    <button onClick={() => handleDeleteCategory(c._id)} className="text-[10px] font-bold bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700">ยืนยัน</button>
                    <button onClick={() => setCategoryDeleteConfirm(null)} className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-300">ยกเลิก</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-0.5 ml-1">
                    <button onClick={() => toggleCategoryActive(c)} title={c.isActive ? "ซ่อน" : "เปิดแสดง"} className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors">
                      {c.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                    </button>
                    <button onClick={() => openEditCategory(c)} className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors">
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => setCategoryDeleteConfirm(c._id)} className="w-6 h-6 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-100 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Banner management */}
      <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <ImageIcon size={16} className="text-slate-400" /> แบนเนอร์หน้าร้านค้า
          </h2>
          <button
            onClick={openCreateBanner}
            className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 transition-colors"
          >
            <Plus size={14} /> เพิ่มแบนเนอร์
          </button>
        </div>
        {banners.length === 0 ? (
          <div className="px-5 py-6 text-center text-slate-400 text-sm">ยังไม่มีแบนเนอร์ — เพิ่มได้เลย</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {banners.map((b) => (
              <div key={b._id} className="flex items-center gap-3 px-5 py-3">
                <img src={b.image} alt="" className="w-20 h-11 rounded-lg object-cover border border-slate-100 shrink-0 bg-slate-50" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-700 truncate">{b.link || "ไม่มีลิงก์ปลายทาง"}</p>
                  <p className="text-[10px] text-slate-400">ลำดับ {b.order}</p>
                </div>
                {bannerDeleteConfirm === b._id ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleDeleteBanner(b._id)} className="text-xs font-bold bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700">ยืนยัน</button>
                    <button onClick={() => setBannerDeleteConfirm(null)} className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200">ยกเลิก</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => toggleBannerActive(b)} title={b.isActive ? "ซ่อน" : "เปิดแสดง"} className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
                      {b.isActive ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    <button onClick={() => openEditBanner(b)} className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => setBannerDeleteConfirm(b._id)} className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-100 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Listings */}
      {!loading && listings.length > 0 && (
        <div className="relative">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาสินค้า..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all font-medium text-slate-800 shadow-sm"
          />
        </div>
      )}
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
          {listings.filter((l) => !search || l.title.toLowerCase().includes(search.toLowerCase())).map((l, idx, arr) => (
            <ShopListingCard
              key={l._id}
              l={l}
              index={idx}
              isFirst={idx === 0}
              isLast={idx === arr.length - 1}
              onMoveUp={() => moveItem(idx, idx - 1)}
              onMoveDown={() => moveItem(idx, idx + 1)}
              categoryName={categories.find((c) => c._id === l.categoryId)?.name}
              isExpanded={expandedId === l._id}
              onToggleExpand={() => setExpandedId(expandedId === l._id ? null : l._id)}
              toggleStatus={toggleStatus}
              openEdit={openEdit}
              handleDelete={handleDelete}
              addingTo={addingTo}
              setAddingTo={setAddingTo}
              newAccountData={newAccountData}
              setNewAccountData={setNewAccountData}
              handleAddAccount={handleAddAccount}
              addingAccount={addingAccount}
              handleRemoveAccount={handleRemoveAccount}
              bulkMode={bulkMode}
              setBulkMode={setBulkMode}
              bulkQty={bulkQty}
              setBulkQty={setBulkQty}
            />
          ))}
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

              {/* Category */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600">หมวดหมู่เกม (แสดงเป็น tab หน้าร้านค้า)</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 font-medium text-slate-800"
                >
                  <option value="">-- ไม่ระบุหมวดหมู่ --</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Images */}
              <div className="flex flex-col gap-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <label className="text-xs font-bold text-slate-600">รูปสินค้า (หลายรูปได้)</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => bulkUploadRef.current?.click()}
                      disabled={bulkUploading}
                      className="text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 disabled:bg-slate-400 px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                    >
                      {bulkUploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                      อัพหลายรูปพร้อมกัน
                    </button>
                    <button type="button" onClick={addImageSlot} className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1">
                      <Plus size={13} /> เพิ่มรูป
                    </button>
                  </div>
                </div>
                <input
                  ref={bulkUploadRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) handleBulkUpload(e.target.files);
                    e.target.value = "";
                  }}
                />
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

              {/* YouTube how-to link */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600">ลิงก์ YouTube สอนวิธีใช้งาน (ไม่บังคับ)</label>
                <input
                  type="url"
                  value={form.youtubeUrl}
                  onChange={(e) => setForm((f) => ({ ...f, youtubeUrl: e.target.value }))}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 font-medium text-slate-800"
                  placeholder="https://youtube.com/watch?v=..."
                />
                <p className="text-[11px] text-slate-400">ลูกค้าจะเห็นปุ่ม “ดูวิธี” เมื่อใส่ลิงก์นี้</p>
              </div>

              {/* Live chat toggle */}
              <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.liveChatEnabled}
                  onChange={(e) => setForm((f) => ({ ...f, liveChatEnabled: e.target.checked }))}
                  className="accent-emerald-600 w-4 h-4"
                />
                <span className="text-sm font-bold text-slate-700">💬 เปิดให้สอบถามผ่าน Live Chat ในเว็บ</span>
              </label>

              {/* Featured toggle */}
              <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
                  className="accent-amber-500 w-4 h-4"
                />
                <span className="text-sm font-bold text-slate-700">⭐ สินค้าแนะนำ (แสดงใน section พิเศษหน้าร้านค้า)</span>
              </label>

              {/* Require UID toggle */}
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                  <input
                    type="checkbox"
                    checked={form.requireUid}
                    onChange={(e) => setForm((f) => ({ ...f, requireUid: e.target.checked }))}
                    className="accent-blue-600 w-4 h-4"
                  />
                  <span className="text-sm font-bold text-slate-700">🎮 บังคับกรอก UID / ไอดีก่อนซื้อ</span>
                </label>
                {form.requireUid && (
                  <div className="flex flex-col gap-1.5 pl-1">
                    <label className="text-xs font-bold text-slate-600">ชื่อ label ที่จะแสดงให้ผู้ซื้อเห็น</label>
                    <input
                      type="text"
                      value={form.uidLabel}
                      onChange={(e) => setForm((f) => ({ ...f, uidLabel: e.target.value }))}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 font-medium text-slate-800"
                      placeholder="เช่น UID เกม, ไอดีผู้เล่น, เลขบัญชี..."
                    />
                  </div>
                )}
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

      {/* Category Create/Edit Modal */}
      {categoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeCategoryModal}>
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-slate-900">{categoryModal === "edit" ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่"}</h3>
              <button onClick={closeCategoryModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4 overflow-y-auto">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600">ชื่อหมวดหมู่ *</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm((f) => ({ ...f, name: e.target.value }))}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 font-medium text-slate-800"
                  placeholder="เช่น Free Fire, Roblox, มือถือ..."
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600">
                  Slug (URL) <span className="text-slate-400 font-normal">— ถ้าว่างจะสร้างจากชื่อ (ควรกรอกถ้าชื่อเป็นภาษาไทย)</span>
                </label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:border-red-500 transition-all">
                  <span className="px-3 text-slate-400 text-sm font-medium border-r border-slate-200 py-2.5 shrink-0">/shop/</span>
                  <input
                    type="text"
                    value={categoryForm.slug}
                    onChange={(e) => setCategoryForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
                    className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none font-medium text-slate-800"
                    placeholder="freefire, roblox, mobile..."
                  />
                </div>
              </div>

              <UploadInput
                label="ไอคอนหมวดหมู่ (ไม่บังคับ)"
                value={categoryForm.image}
                onChange={(url) => setCategoryForm((f) => ({ ...f, image: url }))}
                folder="shop-categories"
                accept="image/jpeg,image/png,image/webp,image/gif"
                placeholder="https://... หรืออัพโหลดรูปภาพ"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">ลำดับการแสดงผล</label>
                  <input
                    type="number"
                    value={categoryForm.order}
                    onChange={(e) => setCategoryForm((f) => ({ ...f, order: e.target.value }))}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 font-bold text-slate-800"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">สถานะ</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCategoryForm((f) => ({ ...f, isActive: true }))}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-colors ${categoryForm.isActive ? "bg-red-600 text-white border-red-600" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}
                    >
                      แสดง
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategoryForm((f) => ({ ...f, isActive: false }))}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-colors ${!categoryForm.isActive ? "bg-red-600 text-white border-red-600" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}
                    >
                      ซ่อน
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3 shrink-0">
              <button onClick={closeCategoryModal} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors text-sm">
                ยกเลิก
              </button>
              <button onClick={handleSaveCategory} disabled={categorySaving} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 disabled:bg-slate-400 transition-colors text-sm flex items-center justify-center gap-2">
                {categorySaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {categorySaving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner Create/Edit Modal */}
      {bannerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeBannerModal}>
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-slate-900">{bannerModal === "edit" ? "แก้ไขแบนเนอร์" : "เพิ่มแบนเนอร์"}</h3>
              <button onClick={closeBannerModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4 overflow-y-auto">
              <UploadInput
                label="รูปแบนเนอร์ *"
                value={bannerForm.image}
                onChange={(url) => setBannerForm((f) => ({ ...f, image: url }))}
                folder="banners"
                accept="image/jpeg,image/png,image/webp,image/gif"
                placeholder="https://... หรืออัพโหลดรูปภาพ"
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600">ลิงก์ปลายทาง (ไม่บังคับ)</label>
                <input
                  type="text"
                  value={bannerForm.link}
                  onChange={(e) => setBannerForm((f) => ({ ...f, link: e.target.value }))}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 font-medium text-slate-800"
                  placeholder="/shop หรือ https://..."
                />
                <p className="text-[11px] text-slate-400">กดที่แบนเนอร์แล้วพาไปหน้านี้ — เว้นว่างได้ถ้าไม่ต้องการ</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">ลำดับการแสดงผล</label>
                  <input
                    type="number"
                    value={bannerForm.order}
                    onChange={(e) => setBannerForm((f) => ({ ...f, order: e.target.value }))}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 font-bold text-slate-800"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">สถานะ</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setBannerForm((f) => ({ ...f, isActive: true }))}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-colors ${bannerForm.isActive ? "bg-red-600 text-white border-red-600" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}
                    >
                      แสดง
                    </button>
                    <button
                      type="button"
                      onClick={() => setBannerForm((f) => ({ ...f, isActive: false }))}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-colors ${!bannerForm.isActive ? "bg-red-600 text-white border-red-600" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}
                    >
                      ซ่อน
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3 shrink-0">
              <button onClick={closeBannerModal} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors text-sm">
                ยกเลิก
              </button>
              <button onClick={handleSaveBanner} disabled={bannerSaving} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 disabled:bg-slate-400 transition-colors text-sm flex items-center justify-center gap-2">
                {bannerSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {bannerSaving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-6 right-6 sm:left-auto sm:right-6 z-[300] px-5 py-3 rounded-2xl shadow-xl font-bold text-sm text-white flex items-center justify-center gap-2 ${toast.ok ? "bg-emerald-600" : "bg-red-600"}`}>
          {toast.ok ? "✓" : "✕"} {toast.msg}
        </div>
      )}
    </div>
  );
}
