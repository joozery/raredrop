"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ChevronRight, Search, Plus, Edit2, Trash2, Eye, Calendar, Shield, Users, Coins, X, Check, Loader2, PlusCircle } from "lucide-react";

interface UserData {
  _id: string;
  name: string;
  email: string;
  coins: number;
  gemCoins: number;
  vipLevel: number;
  xp: number;
  role: string;
  createdAt: string;
  avatar?: string;
  lineId?: string;
  googleId?: string;
  referredBy?: string;
}

interface ItemOption {
  _id: string;
  name: string;
  image: string;
  price: number;
  type: string;
  rarityId?: { name: string; color: string };
}

interface InventoryItem {
  _id: string;
  itemId: ItemOption;
  status: string;
  acquiredAt: string;
}

const STATUS_OPTIONS = ["kept", "selling", "delivered", "sold"];
const STATUS_LABEL: Record<string, string> = {
  kept: "เก็บไว้",
  selling: "กำลังขาย",
  delivered: "ส่งของแล้ว",
  sold: "ถูกลบ",
};

export default function UserCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [user, setUser] = useState<UserData | null>(null);
  const [inventories, setInventories] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const [gemcoinIcon, setGemcoinIcon] = useState("");
  const PAGE_SIZE = 10;

  // Edit inventory modal
  const [editInv, setEditInv] = useState<InventoryItem | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete confirm modal
  const [deleteInvId, setDeleteInvId] = useState<string | null>(null);
  const [deletingInv, setDeletingInv] = useState(false);

  // View (Eye) modal
  const [viewInv, setViewInv] = useState<InventoryItem | null>(null);

  // Topup modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState("");

  // Add item modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const [allItems, setAllItems] = useState<ItemOption[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemOption | null>(null);
  const [addStatus, setAddStatus] = useState("kept");
  const [addingItem, setAddingItem] = useState(false);

  useEffect(() => {
    fetchUserAndInventories();
    fetch("/api/public-settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (d.gemcoin_icon) setGemcoinIcon(d.gemcoin_icon); })
      .catch(() => {});
  }, [id]);

  const fetchUserAndInventories = async () => {
    setLoading(true);
    try {
      const [userRes, invRes] = await Promise.all([
        fetch(`/api/admin/users/${id}`),
        fetch(`/api/admin/inventories?userId=${id}`),
      ]);
      if (userRes.ok) setUser(await userRes.json());
      if (invRes.ok) setInventories(await invRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTopup = async () => {
    const amt = parseFloat(adjustAmount);
    if (!amt || amt <= 0) return setAdjustError("กรุณากรอกจำนวนที่ถูกต้อง");
    setAdjustError("");
    setAdjusting(true);
    try {
      const res = await fetch(`/api/admin/users/${id}/topup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt }),
      });
      const data = await res.json();
      if (!res.ok) return setAdjustError(data.error || "เกิดข้อผิดพลาด");
      setUser((prev) => prev ? { ...prev, coins: data.coins } : prev);
      setShowAdjustModal(false);
      setAdjustAmount("");
    } catch {
      setAdjustError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setAdjusting(false);
    }
  };

  const openAddModal = async () => {
    setShowAddModal(true);
    setSelectedItem(null);
    setItemSearch("");
    setAddStatus("kept");
    setLoadingItems(true);
    try {
      const res = await fetch("/api/admin/items");
      if (res.ok) setAllItems(await res.json());
    } finally {
      setLoadingItems(false);
    }
  };

  const handleAddItem = async () => {
    if (!selectedItem) return;
    setAddingItem(true);
    try {
      const res = await fetch("/api/admin/inventories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id, itemId: selectedItem._id, status: addStatus }),
      });
      if (res.ok) {
        const newInv = await res.json();
        setInventories((prev) => [newInv, ...prev]);
        setShowAddModal(false);
      }
    } finally {
      setAddingItem(false);
    }
  };

  const handleEditSave = async () => {
    if (!editInv) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/admin/inventories/${editInv._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: editStatus }),
      });
      if (res.ok) {
        setInventories((prev) =>
          prev.map((inv) => (inv._id === editInv._id ? { ...inv, status: editStatus } : inv))
        );
        setEditInv(null);
      }
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteInvId) return;
    setDeletingInv(true);
    try {
      const res = await fetch(`/api/admin/inventories/${deleteInvId}`, { method: "DELETE" });
      if (res.ok) {
        setInventories((prev) => prev.filter((inv) => inv._id !== deleteInvId));
        setDeleteInvId(null);
      }
    } finally {
      setDeletingInv(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <div className="text-center py-20 text-slate-500">ไม่พบข้อมูลผู้เล่น</div>;
  }

  const provider = user.googleId ? "Google" : user.lineId ? "LINE" : "Email";

  const totalItems = inventories.length;
  const keptItems = inventories.filter((i) => i.status === "kept").length;
  const sellingItems = inventories.filter((i) => i.status === "selling").length;
  const deliveredItems = inventories.filter((i) => i.status === "delivered").length;
  const deletedItems = inventories.filter((i) => i.status === "sold" || i.status === "deleted").length;

  const tabFiltered =
    activeTab === "history"
      ? inventories.filter((i) => i.status === "delivered")
      : activeTab === "sales"
      ? inventories.filter((i) => i.status === "selling" || i.status === "sold")
      : inventories;

  const filteredItems = tabFiltered.filter(
    (i) =>
      i.itemId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      i._id.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const pagedItems = filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const filteredItemOptions = allItems.filter((item) =>
    item.name.toLowerCase().includes(itemSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
        <Link href="/admin/users" className="hover:text-red-600 transition-colors">จัดการผู้เล่น</Link>
        <ChevronRight size={14} />
        <Link href="/admin/users" className="hover:text-red-600 transition-colors">รายชื่อผู้เล่น</Link>
        <ChevronRight size={14} />
        <span className="text-slate-800 font-bold">คอลเลกชันของผู้เล่น</span>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">คอลเลกชันของผู้เล่น</h1>

      {/* User Info Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col xl:flex-row items-center xl:items-start gap-8">
        <div className="flex items-center gap-5">
          <div className="w-24 h-24 rounded-full bg-slate-100 overflow-hidden flex-shrink-0">
            <img
              src={user.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user._id}`}
              alt="avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">ออนไลน์</span>
              {user.role && user.role !== "user" && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${user.role === "super_admin" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                  {user.role === "super_admin" ? "Super Admin" : "Admin"}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">UID: {user._id.slice(-6).toUpperCase()}</p>
            <p className="text-sm text-slate-500">อีเมล: {user.email || "-"}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 border border-slate-200 px-2 py-1 rounded-lg">
              {provider === "Google" && (
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              <span className="text-xs font-bold text-slate-700">{provider}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col sm:flex-row gap-4 w-full">
          <div className="flex-1 bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex flex-col justify-center gap-1">
            <div className="flex items-center gap-2">
              <Coins size={16} className="text-emerald-600" />
              <span className="text-sm font-bold text-emerald-800">เครดิต</span>
            </div>
            <div className="text-xl font-black text-emerald-700 mt-1">
              {user.coins?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm">฿</span>
            </div>
          </div>
          <div className="flex-1 bg-purple-50 rounded-2xl p-4 border border-purple-100 flex flex-col justify-center gap-1">
            <div className="flex items-center gap-2">
              {gemcoinIcon ? (
                <img src={gemcoinIcon} alt="" className="w-4 h-4 object-contain" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              )}
              <span className="text-sm font-bold text-purple-800">GemCoin</span>
            </div>
            <div className="text-xl font-black text-purple-700 mt-1">{(user.gemCoins || 0).toLocaleString()}</div>
          </div>
          <div className="flex-1 bg-amber-50 rounded-2xl p-4 border border-amber-100 flex flex-col justify-center gap-1">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              <span className="text-sm font-bold text-amber-800">XP</span>
            </div>
            <div className="text-xl font-black text-amber-700 mt-1">{(user.xp || 0).toLocaleString()}</div>
          </div>
        </div>

        <div className="flex flex-col gap-3 xl:w-auto w-full border-t xl:border-t-0 xl:border-l border-slate-100 pt-4 xl:pt-0 xl:pl-8">
          <button
            onClick={() => { setShowAdjustModal(true); setAdjustError(""); setAdjustAmount(""); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors shadow-sm w-full justify-center"
          >
            <PlusCircle size={15} />
            เติมเงินให้ผู้เล่น
          </button>
        </div>
        <div className="flex flex-col gap-3 text-sm text-slate-600 xl:w-64 w-full border-t xl:border-t-0 xl:border-l border-slate-100 pt-4 xl:pt-0 xl:pl-8">
          <div className="flex items-center gap-3">
            <Calendar size={16} className="text-slate-400" />
            <span>วันที่สมัคร: <span className="font-medium text-slate-800">{new Date(user.createdAt).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" })}</span></span>
          </div>
          <div className="flex items-center gap-3">
            <Shield size={16} className="text-slate-400" />
            <span>ระดับผู้เล่น: <span className="font-medium text-slate-800">LV {user.vipLevel || 1}</span></span>
          </div>
          <div className="flex items-center gap-3">
            <Users size={16} className="text-slate-400" />
            <span>ผู้แนะนำ: <span className="font-medium text-slate-800">{user.referredBy ? user.referredBy.toString().slice(-6).toUpperCase() : "-"}</span></span>
          </div>
        </div>
      </div>

      {/* Tabs & Add Button */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex gap-6">
          {[
            { key: "all", label: "คอลเลกชันทั้งหมด" },
            { key: "history", label: "ประวัติการได้รับ" },
            { key: "sales", label: "ประวัติการขาย" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setPage(1); }}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === tab.key ? "border-red-600 text-red-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-700 shadow-sm transition-colors mb-2"
        >
          <Plus size={16} /> เพิ่มไอเทม
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col gap-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "ทั้งหมด", count: totalItems, cls: "bg-slate-50 border-slate-100", textCls: "text-slate-800", labelCls: "text-slate-500" },
            { label: "เก็บไว้", count: keptItems, cls: "bg-emerald-50 border-emerald-100", textCls: "text-emerald-600", labelCls: "text-emerald-700" },
            { label: "กำลังขาย", count: sellingItems, cls: "bg-orange-50 border-orange-100", textCls: "text-orange-500", labelCls: "text-orange-700" },
            { label: "ส่งของแล้ว", count: deliveredItems, cls: "bg-blue-50 border-blue-100", textCls: "text-blue-500", labelCls: "text-blue-700" },
            { label: "ถูกลบ", count: deletedItems, cls: "bg-slate-50 border-slate-100", textCls: "text-slate-800", labelCls: "text-slate-700" },
          ].map((s) => (
            <div key={s.label} className={`${s.cls} rounded-2xl p-4 flex flex-col justify-center border`}>
              <span className={`${s.labelCls} text-sm font-bold`}>{s.label}</span>
              <div className="mt-2">
                <span className={`text-2xl font-black ${s.textCls}`}>{s.count}</span>{" "}
                <span className="text-slate-500 text-sm">ชิ้น</span>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 mt-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาไอเทม..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-red-400"
            />
          </div>
          <button
            onClick={fetchUserAndInventories}
            className="bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            รีเฟรช
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-4 px-4 text-[12px] font-bold text-slate-500 w-[30%]">ไอเทม</th>
                <th className="py-4 px-4 text-[12px] font-bold text-slate-500">Item ID</th>
                <th className="py-4 px-4 text-[12px] font-bold text-slate-500">ระดับ</th>
                <th className="py-4 px-4 text-[12px] font-bold text-slate-500">สถานะ</th>
                <th className="py-4 px-4 text-[12px] font-bold text-slate-500">มูลค่า</th>
                <th className="py-4 px-4 text-[12px] font-bold text-slate-500">ได้รับเมื่อ</th>
                <th className="py-4 px-4 text-[12px] font-bold text-slate-500 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {pagedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium text-sm">ไม่พบไอเทมในคอลเลกชัน</td>
                </tr>
              ) : pagedItems.map((inv) => (
                <tr key={inv._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                        <img src={inv.itemId?.image || ""} alt="" className="w-full h-full object-contain drop-shadow-sm" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-900 truncate">{inv.itemId?.name || "-"}</p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {inv.itemId?.type === "coin_reward" ? "💎 GemCoin" : "ไอเทมปกติ"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs text-slate-500 font-medium">{inv._id.slice(-8).toUpperCase()}</span>
                  </td>
                  <td className="py-3 px-4">
                    {inv.itemId?.rarityId ? (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-md" style={{ color: inv.itemId.rarityId.color, backgroundColor: `${inv.itemId.rarityId.color}15` }}>
                        {inv.itemId.rarityId.name}
                      </span>
                    ) : "-"}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                      inv.status === "kept" ? "bg-emerald-50 text-emerald-600" :
                      inv.status === "selling" ? "bg-orange-50 text-orange-500" :
                      inv.status === "delivered" ? "bg-blue-50 text-blue-500" :
                      "bg-slate-100 text-slate-500"
                    }`}>
                      {STATUS_LABEL[inv.status] || inv.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-sm text-slate-900">
                    ฿{inv.itemId?.price?.toLocaleString() || 0}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col text-xs text-slate-500">
                      <span className="font-medium">{new Date(inv.acquiredAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}</span>
                      <span className="text-[10px]">{new Date(inv.acquiredAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-center gap-1.5">
                      {inv.status === "delivered" ? (
                        <button
                          onClick={() => setViewInv(inv)}
                          className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-100 transition-colors"
                          title="ดูรายละเอียด"
                        >
                          <Eye size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => { setEditInv(inv); setEditStatus(inv.status); }}
                          className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors"
                          title="แก้ไขสถานะ"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteInvId(inv._id)}
                        className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                        title="ลบไอเทม"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-slate-500 font-medium">
              แสดง {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filteredItems.length)} จาก {filteredItems.length} รายการ
            </span>
            <div className="flex items-center gap-1 text-sm">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="text-slate-400 hover:text-slate-700 px-2 disabled:opacity-50">&lt;</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg font-bold ${page === p ? "border border-red-600 text-red-600" : "text-slate-500 hover:bg-slate-100"}`}>{p}</button>
              ))}
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="text-slate-400 hover:text-slate-700 px-2 disabled:opacity-50">&gt;</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add Item Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-slate-900">เพิ่มไอเทมให้ผู้เล่น</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <div className="p-6 flex flex-col gap-4 overflow-y-auto flex-1">
              {/* Search items */}
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อไอเทม..."
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-red-400"
                />
              </div>

              {/* Item list */}
              {loadingItems ? (
                <div className="flex justify-center py-8 text-slate-400">
                  <Loader2 size={24} className="animate-spin" />
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                  {filteredItemOptions.length === 0 ? (
                    <p className="text-center text-sm text-slate-400 py-4">ไม่พบไอเทม</p>
                  ) : filteredItemOptions.map((item) => (
                    <button
                      key={item._id}
                      onClick={() => setSelectedItem(item)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${selectedItem?._id === item._id ? "border-red-400 bg-red-50" : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"}`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                        <img src={item.image} alt="" className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-900 truncate">{item.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.rarityId && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: item.rarityId.color, backgroundColor: `${item.rarityId.color}15` }}>
                              {item.rarityId.name}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">฿{item.price?.toLocaleString()}</span>
                        </div>
                      </div>
                      {selectedItem?._id === item._id && <Check size={16} className="text-red-500 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}

              {/* Status select */}
              {selectedItem && (
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-600">ไอเทมที่เลือก: <span className="text-slate-900">{selectedItem.name}</span></p>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-600">สถานะเริ่มต้น</label>
                    <select
                      value={addStatus}
                      onChange={(e) => setAddStatus(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-red-400"
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s] || s}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 pb-6 flex gap-3 shrink-0 border-t border-slate-100 pt-4">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-sm transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleAddItem}
                disabled={!selectedItem || addingItem}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                {addingItem ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                เพิ่มไอเทม
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View (Eye) Modal ── */}
      {viewInv && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">รายละเอียดไอเทม</h3>
              <button onClick={() => setViewInv(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="p-6 flex flex-col items-center gap-4">
              <div className="w-28 h-28 rounded-2xl bg-slate-100 flex items-center justify-center p-2 border border-slate-200">
                {viewInv.itemId?.image ? (
                  <img src={viewInv.itemId.image} alt="" className="w-full h-full object-contain" />
                ) : <span className="text-4xl">🎁</span>}
              </div>
              <div className="w-full flex flex-col gap-2 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">ชื่อไอเทม</span>
                  <span className="font-bold text-slate-900">{viewInv.itemId?.name || "-"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">ระดับ</span>
                  {viewInv.itemId?.rarityId ? (
                    <span className="text-[11px] font-bold px-2 py-1 rounded-md" style={{ color: viewInv.itemId.rarityId.color, backgroundColor: `${viewInv.itemId.rarityId.color}15` }}>
                      {viewInv.itemId.rarityId.name}
                    </span>
                  ) : <span className="text-slate-400">-</span>}
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">มูลค่า</span>
                  <span className="font-bold text-slate-900">฿{viewInv.itemId?.price?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">สถานะ</span>
                  <span className="text-[11px] font-bold px-2 py-1 rounded-md bg-blue-50 text-blue-500">{STATUS_LABEL[viewInv.status] || viewInv.status}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">ได้รับเมื่อ</span>
                  <span className="font-bold text-slate-900">{new Date(viewInv.acquiredAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-500 font-medium">Inventory ID</span>
                  <span className="font-mono text-xs text-slate-500">{viewInv._id.slice(-8).toUpperCase()}</span>
                </div>
              </div>
            </div>
            <div className="px-6 pb-6">
              <button onClick={() => setViewInv(null)} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-sm transition-colors">
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Status Modal ── */}
      {editInv && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">แก้ไขสถานะไอเทม</h3>
              <button onClick={() => setEditInv(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                <img src={editInv.itemId?.image || ""} alt="" className="w-10 h-10 object-contain rounded-lg bg-white" />
                <div>
                  <p className="font-bold text-sm text-slate-900">{editInv.itemId?.name || "-"}</p>
                  <p className="text-xs text-slate-400">{editInv._id.slice(-8).toUpperCase()}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-600">สถานะ</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-red-400"
                >
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s] || s}</option>)}
                </select>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setEditInv(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-sm transition-colors">ยกเลิก</button>
              <button
                onClick={handleEditSave}
                disabled={savingEdit}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                {savingEdit ? <Loader2 size={13} className="animate-spin" /> : <Check size={14} />}
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteInvId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-5 flex flex-col gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                <Trash2 size={22} className="text-red-600" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">ยืนยันการลบ</h3>
              <p className="text-sm text-slate-500">คุณต้องการลบไอเทมนี้ออกจาก inventory ของผู้เล่นใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้</p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setDeleteInvId(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-sm transition-colors">ยกเลิก</button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deletingInv}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                {deletingInv ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={14} />}
                ลบเลย
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Topup Modal ── */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">เติมเงินให้ผู้เล่น</h3>
              <button onClick={() => setShowAdjustModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="bg-emerald-50 rounded-xl px-4 py-3 text-sm flex justify-between items-center border border-emerald-100">
                <span className="text-emerald-700 font-medium">ยอดปัจจุบัน</span>
                <span className="font-black text-emerald-800">
                  ฿{user.coins?.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">จำนวนเงินที่จะเติม (฿)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="เช่น 100, 500, 1000"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 font-mono text-lg font-bold focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                  autoFocus
                />
              </div>

              {adjustAmount && parseFloat(adjustAmount) > 0 && (
                <div className="bg-slate-50 rounded-xl px-4 py-2.5 text-sm flex justify-between items-center">
                  <span className="text-slate-500">ยอดหลังเติม</span>
                  <span className="font-black text-slate-900">
                    ฿{((user.coins || 0) + parseFloat(adjustAmount)).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {adjustError && (
                <p className="text-sm text-red-600 font-semibold text-center">{adjustError}</p>
              )}
            </div>

            <div className="px-6 pb-6 flex gap-3 border-t border-slate-100 pt-4">
              <button
                onClick={() => setShowAdjustModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-sm transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleTopup}
                disabled={adjusting || !adjustAmount || parseFloat(adjustAmount) <= 0}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                {adjusting ? <Loader2 size={14} className="animate-spin" /> : <PlusCircle size={14} />}
                เติมเงิน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
