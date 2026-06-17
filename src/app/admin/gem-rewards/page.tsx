"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Coins, Package, Box as BoxIcon, ShoppingBag } from "lucide-react";

interface RarityData { _id: string; name: string; color: string }
interface BoxOption { _id: string; name: string; image: string; price: number }
interface ItemOption { _id: string; name: string; image: string; type: string; coinRewardAmount: number; rarityId: RarityData; isActive?: boolean }
interface ShopOption { _id: string; title: string; images: string[]; price: number; accounts: { sold: boolean }[] }
interface GemReward {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  type: "box" | "item" | "shop";
  boxId?: BoxOption;
  boxOpenTimes?: number;
  itemId?: ItemOption;
  shopListingId?: ShopOption;
  gemCost: number;
  stock: number;
  isActive: boolean;
  createdAt: string;
}

const emptyForm = {
  name: "", description: "", image: "",
  type: "box" as "box" | "item" | "shop",
  boxId: "", boxOpenTimes: 1,
  itemId: "",
  shopListingId: "",
  gemCost: 100, stock: 0, isActive: true,
};

export default function GemRewardsPage() {
  const [rewards, setRewards] = useState<GemReward[]>([]);
  const [boxes, setBoxes] = useState<BoxOption[]>([]);
  const [items, setItems] = useState<ItemOption[]>([]);
  const [shops, setShops] = useState<ShopOption[]>([]);
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
      const [rRes, bRes, iRes, sRes] = await Promise.all([
        fetch("/api/admin/gem-rewards"),
        fetch("/api/admin/boxes"),
        fetch("/api/admin/items"),
        fetch("/api/admin/shop"),
      ]);
      if (rRes.ok) setRewards(await rRes.json());
      if (bRes.ok) setBoxes(await bRes.json());
      if (iRes.ok) setItems(await iRes.json());
      if (sRes.ok) setShops(await sRes.json());
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const openAdd = () => {
    setModalMode("add");
    setForm({ ...emptyForm });
    setEditId(null);
    setIsModalOpen(true);
  };

  const openEdit = (r: GemReward) => {
    setModalMode("edit");
    setEditId(r._id);
    setForm({
      name: r.name,
      description: r.description || "",
      image: r.image || "",
      type: r.type,
      boxId: r.boxId ? r.boxId._id : "",
      boxOpenTimes: r.boxOpenTimes || 1,
      itemId: r.itemId ? r.itemId._id : "",
      shopListingId: r.shopListingId ? r.shopListingId._id : "",
      gemCost: r.gemCost,
      stock: r.stock,
      isActive: r.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.gemCost) { alert("กรุณากรอกชื่อและค่า GemCoin"); return; }
    if (form.type === "box" && !form.boxId) { alert("กรุณาเลือกกล่องสุ่ม"); return; }
    if (form.type === "item" && !form.itemId) { alert("กรุณาเลือกไอเทม"); return; }
    if (form.type === "shop" && !form.shopListingId) { alert("กรุณาเลือกสินค้าจากร้านค้า"); return; }
    setSaving(true);
    try {
      const url = modalMode === "add" ? "/api/admin/gem-rewards" : `/api/admin/gem-rewards/${editId}`;
      const method = modalMode === "add" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
      const res = await fetch(`/api/admin/gem-rewards/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("ลบไม่สำเร็จ");
      setDeleteConfirm(null);
      fetchAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getTypeLabel = (r: GemReward) => {
    if (r.type === "box") return { label: "🎁 กล่องสุ่ม", sub: r.boxId ? `${r.boxId.name} × ${r.boxOpenTimes} ครั้ง` : "", cls: "bg-blue-50 text-blue-700" };
    if (r.type === "item") return { label: "📦 ไอเทม", sub: r.itemId?.name || "", cls: "bg-green-50 text-green-700" };
    return { label: "🛍️ ร้านค้า", sub: r.shopListingId?.title || "", cls: "bg-orange-50 text-orange-700" };
  };

  const getThumb = (r: GemReward) => {
    if (r.type === "box" && r.boxId?.image) return <img src={r.boxId.image} alt="" className="w-full h-full object-contain p-1" />;
    if (r.type === "item" && r.itemId?.type === "coin_reward") return <span className="text-xl">💎</span>;
    if (r.type === "item" && r.itemId?.image) return <img src={r.itemId.image} alt="" className="w-full h-full object-contain p-1" />;
    if (r.type === "shop" && r.shopListingId?.images?.[0]) return <img src={r.shopListingId.images[0]} alt="" className="w-full h-full object-cover" />;
    return <Coins size={18} className="text-purple-400" />;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">แลก GemCoin</h1>
          <p className="text-sm text-slate-500 mt-1">จัดการรายการแลกรางวัลด้วย GemCoin</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm">
          <Plus size={16} />
          เพิ่มรางวัล
        </button>
      </div>

      <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">รางวัล</th>
              <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ประเภท</th>
              <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">ค่า GemCoin</th>
              <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">Stock</th>
              <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">สถานะ</th>
              <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100/80">
            {loading ? (
              <tr><td colSpan={6} className="py-12 text-center text-slate-400">กำลังโหลด...</td></tr>
            ) : rewards.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-slate-400">ยังไม่มีรางวัล</td></tr>
            ) : rewards.map((r) => {
              const { label, sub, cls } = getTypeLabel(r);
              const shopUnsold = r.type === "shop" ? (r.shopListingId?.accounts || []).filter((a) => !a.sold).length : null;
              return (
                <tr key={r._id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                        {getThumb(r)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{r.name}</div>
                        {r.description && <div className="text-xs text-slate-400 line-clamp-1">{r.description}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col gap-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded w-max ${cls}`}>{label}</span>
                      {sub && <span className="text-xs text-slate-500">{sub}</span>}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Coins size={13} className="text-purple-500" />
                      <span className="font-black text-purple-700">{r.gemCost.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    {r.type === "shop" ? (
                      <span className="font-bold text-slate-700 text-sm">{shopUnsold} account</span>
                    ) : (
                      <span className="font-bold text-slate-700 text-sm">{r.stock === 0 ? "∞" : r.stock}</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${r.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {r.isActive ? "เปิด" : "ปิด"}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    {deleteConfirm === r._id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleDelete(r._id)} className="text-xs font-bold bg-red-600 text-white px-3 py-1.5 rounded-lg">ยืนยัน</button>
                        <button onClick={() => setDeleteConfirm(null)} className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg">ยกเลิก</button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(r)} className="text-blue-600 bg-blue-50 border border-blue-100 rounded-lg p-2 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => setDeleteConfirm(r._id)} className="text-red-500 bg-red-50 border border-red-100 rounded-lg p-2 hover:bg-red-600 hover:text-white transition-all shadow-sm">
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
                {modalMode === "add" ? "เพิ่มรางวัลใหม่" : "แก้ไขรางวัล"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">ชื่อรางวัล <span className="text-red-500">*</span></label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-purple-500 font-medium text-slate-800"
                  placeholder="เช่น บัญชี Roblox 800 Robux" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">คำอธิบาย (ไม่บังคับ)</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-purple-500 font-medium text-slate-800"
                  placeholder="รายละเอียดเพิ่มเติม..." />
              </div>

              {/* Type selector — 3 ประเภท */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">ประเภทรางวัล <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "box", icon: BoxIcon, label: "กล่องสุ่ม", sub: "สิทธิ์เปิดฟรี", color: "blue" },
                    { value: "item", icon: Package, label: "ไอเทม", sub: "เข้า inventory", color: "green" },
                    { value: "shop", icon: ShoppingBag, label: "ร้านค้า", sub: "สินค้า/account", color: "orange" },
                  ].map(({ value, icon: Icon, label, sub, color }) => (
                    <button key={value} type="button" onClick={() => setForm({ ...form, type: value as any })}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${form.type === value ? `border-${color}-500 bg-${color}-50` : "border-slate-200 hover:border-slate-300"}`}>
                      <Icon size={20} className={form.type === value ? `text-${color}-600` : "text-slate-400"} />
                      <div className={`text-xs font-bold ${form.type === value ? `text-${color}-700` : "text-slate-700"}`}>{label}</div>
                      <div className="text-[10px] text-slate-400">{sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Box selector */}
              {form.type === "box" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">กล่องสุ่ม <span className="text-red-500">*</span></label>
                    <select value={form.boxId} onChange={(e) => setForm({ ...form, boxId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500 font-medium text-slate-800">
                      <option value="">-- เลือกกล่อง --</option>
                      {boxes.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">จำนวนครั้ง</label>
                    <input type="number" min="1" value={form.boxOpenTimes}
                      onChange={(e) => setForm({ ...form, boxOpenTimes: parseInt(e.target.value) || 1 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500 font-black text-slate-800" />
                  </div>
                </div>
              )}

              {/* Item selector */}
              {form.type === "item" && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">ไอเทม <span className="text-red-500">*</span></label>
                  <select value={form.itemId} onChange={(e) => setForm({ ...form, itemId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500 font-medium text-slate-800">
                    <option value="">-- เลือกไอเทม --</option>
                    {items.map((i) => (
                      <option key={i._id} value={i._id}>
                        {i.type === "coin_reward" ? `💎 ${i.name} (+${i.coinRewardAmount} GEM)` : i.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Shop selector */}
              {form.type === "shop" && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">สินค้าจากร้านค้า <span className="text-red-500">*</span></label>
                  <select value={form.shopListingId} onChange={(e) => setForm({ ...form, shopListingId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500 font-medium text-slate-800">
                    <option value="">-- เลือกสินค้า --</option>
                    {shops.map((s) => {
                      const unsold = s.accounts.filter((a) => !a.sold).length;
                      return (
                        <option key={s._id} value={s._id}>
                          {s.title} — เหลือ {unsold} account
                        </option>
                      );
                    })}
                  </select>
                  {form.shopListingId && (() => {
                    const sel = shops.find((s) => s._id === form.shopListingId);
                    if (!sel) return null;
                    const unsold = sel.accounts.filter((a) => !a.sold).length;
                    return (
                      <p className="text-xs text-slate-500 mt-1.5">
                        🛍️ {sel.title} — มี <span className={`font-bold ${unsold === 0 ? "text-red-500" : "text-green-600"}`}>{unsold}</span> account พร้อมแจก
                      </p>
                    );
                  })()}
                </div>
              )}

              {/* Cost + Stock + Status */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">ค่า GemCoin <span className="text-red-500">*</span></label>
                  <input type="number" min="1" value={form.gemCost}
                    onChange={(e) => setForm({ ...form, gemCost: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500 font-black text-purple-700" />
                </div>
                {form.type !== "shop" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Stock (0=ไม่จำกัด)</label>
                    <input type="number" min="0" value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500 font-black text-slate-800" />
                  </div>
                )}
                <div className={form.type === "shop" ? "col-span-2" : ""}>
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
            </div>

            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                ยกเลิก
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2.5 rounded-lg text-sm font-bold bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white transition-colors shadow-sm">
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
