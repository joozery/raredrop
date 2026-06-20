"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Search, X, Box, Coins, Image as ImageIcon } from "lucide-react";
import { UploadInput } from "@/components/ui/UploadInput";

interface RarityData {
  _id: string;
  name: string;
  color: string;
}

interface CategoryData {
  _id: string;
  name: string;
}

interface ItemData {
  _id: string;
  name: string;
  description?: string;
  image: string;
  animation?: string;
  rarityId: RarityData | string;
  categoryId?: CategoryData | string;
  price: number;
  sellPrice?: number;
  stock: number;
  unlimitedStock?: boolean;
  contactChannels?: { discord: boolean; livechat: boolean };
  isActive: boolean;
  type: "item" | "coin_reward";
  coinRewardAmount: number;
  createdAt: string;
}

export default function ManageItems() {
  const [items, setItems] = useState<ItemData[]>([]);
  const [rarities, setRarities] = useState<RarityData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [currentItem, setCurrentItem] = useState<Partial<ItemData>>({ isActive: true, price: 0, stock: 0 });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resItems, resRarities, resCats] = await Promise.all([
        fetch("/api/admin/items"),
        fetch("/api/admin/rarities"),
        fetch("/api/admin/categories")
      ]);
      
      if (resItems.ok) setItems(await resItems.json());
      if (resRarities.ok) setRarities(await resRarities.json());
      if (resCats.ok) setCategories(await resCats.json());
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const openAddModal = () => {
    setModalMode("add");
    setCurrentItem({
      isActive: true,
      price: 0,
      stock: 0,
      unlimitedStock: false,
      contactChannels: { discord: true, livechat: true },
      type: "item",
      coinRewardAmount: 0,
      rarityId: rarities.length > 0 ? rarities[0]._id : "",
      categoryId: ""
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: ItemData) => {
    setModalMode("edit");
    const resolvedType = (item as any).type === "coin_reward" ? "coin_reward" : "item";
    console.log("[openEditModal] item.type from API:", (item as any).type, "→ resolved:", resolvedType);
    setCurrentItem({
      ...item,
      type: resolvedType,
      coinRewardAmount: (item as any).coinRewardAmount ?? 0,
      unlimitedStock: !!item.unlimitedStock,
      contactChannels: {
        discord: item.contactChannels?.discord !== false,
        livechat: item.contactChannels?.livechat !== false,
      },
      rarityId: typeof item.rarityId === 'object' ? (item.rarityId as any)._id : item.rarityId,
      categoryId: typeof item.categoryId === 'object' ? (item.categoryId as any)._id : (item.categoryId || "")
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentItem({});
  };

  const handleSave = async () => {
    const isCoinReward = currentItem.type === "coin_reward";
    if (!currentItem.name || (!isCoinReward && !currentItem.image) || !currentItem.rarityId) {
      alert(isCoinReward
        ? "กรุณากรอกชื่อและเลือกระดับความหายากให้ครบถ้วน"
        : "กรุณากรอกชื่อ, รูปภาพ และเลือกระดับความหายากให้ครบถ้วน"
      );
      return;
    }

    try {
      const url = modalMode === "add" ? "/api/admin/items" : `/api/admin/items/${currentItem._id}`;
      const method = modalMode === "add" ? "POST" : "PUT";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentItem)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      
      closeModal();
      fetchData(); // Refetch items
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/items/${id}`, { method: "DELETE" });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      
      setDeleteConfirm(null);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredItems = items.filter(item => 
    item.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">คลังไอเทม (Items Inventory)</h1>
          <p className="text-sm text-slate-500 mt-1">จัดการข้อมูลไอเทมทั้งหมดที่จะนำไปใส่ในกล่องสุ่ม</p>
        </div>
        <button onClick={openAddModal} className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm shadow-red-500/20 shrink-0">
          <Plus size={16} />
          เพิ่มไอเทมใหม่
        </button>
      </div>

      <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อไอเทม..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all font-medium text-slate-700 placeholder:text-slate-400"
            />
          </div>
          <div className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm shrink-0">
            ไอเทมทั้งหมด: <span className="text-red-600 font-black ml-1">{items.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-white">
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ไอเทม</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">หมวดหมู่/ระดับ</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">มูลค่า (บาท)</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">สต็อก</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">สถานะ</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">กำลังโหลดข้อมูล...</td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">ไม่พบข้อมูล</td>
                </tr>
              ) : filteredItems.map((item) => {
                const rData = item.rarityId as any as RarityData;
                const cData = item.categoryId as any as CategoryData;

                return (
                  <tr key={item._id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 p-1">
                          {item.type === "coin_reward" ? (
                            <span className="text-2xl">💎</span>
                          ) : item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                          ) : (
                            <ImageIcon size={18} className="text-slate-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 line-clamp-1" title={item.name}>{item.name}</div>
                          {item.description && <div className="text-[10px] text-slate-500 font-medium mt-0.5 max-w-[200px] line-clamp-1">{item.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1.5">
                        {cData ? (
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded w-max">{cData.name}</span>
                        ) : (
                          <span className="text-[10px] font-bold bg-slate-50 text-slate-400 px-2 py-0.5 rounded w-max">ไม่ระบุหมวดหมู่</span>
                        )}
                        {rData && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded w-max border" style={{ backgroundColor: `${rData.color}15`, color: rData.color, borderColor: `${rData.color}30` }}>
                            {rData.name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-1.5 text-slate-800 font-black">
                        <Coins size={14} className="text-yellow-500" />
                        {item.price.toLocaleString()}
                      </div>
                      {item.type !== "coin_reward" && (
                        <div className="text-[10px] font-bold text-slate-400 mt-0.5">
                          ขายคืน: <span className="text-slate-600">฿{(item.sellPrice ?? item.price).toLocaleString()}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {item.type === "coin_reward" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700">
                          💎 {item.coinRewardAmount} GEM
                        </span>
                      ) : item.unlimitedStock ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700">
                          <Box size={12} />
                          ♾️ ไม่จำกัด
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg ${item.stock > 0 ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-600'}`}>
                          <Box size={12} />
                          {item.stock} ชิ้น
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {item.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {deleteConfirm === item._id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleDelete(item._id)} className="text-xs font-bold bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700">ยืนยัน</button>
                          <button onClick={() => setDeleteConfirm(null)} className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200">ยกเลิก</button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditModal(item)} className="text-blue-600 bg-blue-50 border border-blue-100 rounded-lg p-2 hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="แก้ไข">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => setDeleteConfirm(item._id)} className="text-red-500 bg-red-50 border border-red-100 rounded-lg p-2 hover:bg-red-600 hover:text-white transition-all shadow-sm" title="ลบ">
                            <Trash2 size={16} />
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
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <h2 className="text-lg font-bold text-slate-800">
                {modalMode === "add" ? "เพิ่มไอเทมใหม่" : "แก้ไขข้อมูลไอเทม"}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-5 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">ชื่อไอเทม <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={currentItem.name || ""}
                  onChange={(e) => setCurrentItem({...currentItem, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-red-500 transition-all font-medium text-slate-800"
                  placeholder="เช่น iPhone 15 Pro Max..."
                />
              </div>

              <UploadInput
                label={currentItem.type === "coin_reward" ? "รูปภาพ (ไม่บังคับ)" : "รูปภาพไอเทม *"}
                value={currentItem.image === "coin_reward" ? "" : (currentItem.image || "")}
                onChange={(url) => setCurrentItem({ ...currentItem, image: url })}
                folder="items"
                accept="image/jpeg,image/png,image/webp,image/gif"
                placeholder="https://... หรืออัพโหลดรูปภาพ"
              />

              {currentItem.type !== "coin_reward" && (
                <UploadInput
                  label="Animation ไอเทม (ไม่บังคับ) — แสดงตอนผู้เล่นได้รับ"
                  value={currentItem.animation || ""}
                  onChange={(url) => setCurrentItem({ ...currentItem, animation: url })}
                  folder="animations"
                  accept="video/mp4,video/webm,image/gif"
                  placeholder="/animationbox.mp4 หรืออัพโหลด .mp4/.gif"
                  isVideo
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">ระดับความหายาก <span className="text-red-500">*</span></label>
                  <select 
                    value={currentItem.rarityId as string || ""}
                    onChange={(e) => setCurrentItem({...currentItem, rarityId: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-red-500 transition-all font-medium text-slate-800"
                  >
                    {rarities.length === 0 && <option value="" disabled>ไม่มีข้อมูล (กรุณาไปเพิ่มก่อน)</option>}
                    {rarities.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">หมวดหมู่</label>
                  <select 
                    value={currentItem.categoryId as string || ""}
                    onChange={(e) => setCurrentItem({...currentItem, categoryId: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-red-500 transition-all font-medium text-slate-800"
                  >
                    <option value="">-- ไม่ระบุ --</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">ประเภทไอเทม</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentItem({ ...currentItem, type: "item" })}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 text-sm font-bold transition-all ${currentItem.type !== "coin_reward" ? "border-red-500 bg-red-50 text-red-700" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}
                  >
                    🎁 ไอเทมปกติ
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentItem({ ...currentItem, type: "coin_reward" })}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 text-sm font-bold transition-all ${currentItem.type === "coin_reward" ? "border-purple-500 bg-purple-50 text-purple-700" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}
                  >
                    💎 รางวัล GemCoin
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">มูลค่าไอเทม (บาท) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={currentItem.price ?? 0}
                    onChange={(e) => setCurrentItem({...currentItem, price: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-red-500 transition-all font-black text-slate-800"
                  />
                </div>
                {currentItem.type === "coin_reward" ? (
                  <div>
                    <label className="block text-xs font-bold text-purple-600 mb-1.5">💎 จำนวน GemCoin ที่ได้รับ</label>
                    <input
                      type="number"
                      value={currentItem.coinRewardAmount ?? 0}
                      onChange={(e) => setCurrentItem({...currentItem, coinRewardAmount: parseInt(e.target.value) || 0})}
                      className="w-full bg-purple-50 border border-purple-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-purple-500 transition-all font-bold text-slate-800"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">สต็อกตั้งต้น (ชิ้น)</label>
                    <input
                      type="number"
                      value={currentItem.unlimitedStock ? "" : (currentItem.stock ?? 0)}
                      onChange={(e) => setCurrentItem({...currentItem, stock: parseInt(e.target.value) || 0})}
                      disabled={currentItem.unlimitedStock}
                      placeholder={currentItem.unlimitedStock ? "∞ ไม่จำกัด" : undefined}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-red-500 transition-all font-bold text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                    />
                  </div>
                )}
              </div>

              {currentItem.type !== "coin_reward" && (
                <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={!!currentItem.unlimitedStock}
                    onChange={(e) => setCurrentItem({...currentItem, unlimitedStock: e.target.checked})}
                    className="accent-red-600 w-4 h-4"
                  />
                  <span className="text-sm font-bold text-slate-700">♾️ สต็อกไม่จำกัด (Infinity)</span>
                  <span className="text-[11px] text-slate-400 ml-auto">ไม่หักสต็อกเมื่อสุ่มได้</span>
                </label>
              )}

              {currentItem.type !== "coin_reward" && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">
                    ราคาขายคืน (บาท) <span className="font-normal text-slate-400">— เว้นว่างเพื่อใช้มูลค่าไอเทม</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={currentItem.sellPrice ?? ""}
                    onChange={(e) => setCurrentItem({...currentItem, sellPrice: e.target.value === "" ? undefined : (parseFloat(e.target.value) || 0)})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-red-500 transition-all font-black text-slate-800"
                    placeholder={`ค่าเริ่มต้น: ${(currentItem.price ?? 0).toLocaleString()}`}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">จำนวนเหรียญที่ผู้เล่นได้รับเมื่อกด “ขายคืนระบบ”</p>
                </div>
              )}

              {currentItem.type !== "coin_reward" && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">ช่องทางติดต่อทีมงาน (ตอนกด “รับ item”)</label>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5">
                      <input
                        type="checkbox"
                        checked={currentItem.contactChannels?.livechat !== false}
                        onChange={(e) => setCurrentItem({...currentItem, contactChannels: { discord: currentItem.contactChannels?.discord !== false, livechat: e.target.checked }})}
                        className="accent-emerald-600 w-4 h-4"
                      />
                      <span className="text-sm font-bold text-slate-700">💬 แชทกับทีมงานในเว็บ</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5">
                      <input
                        type="checkbox"
                        checked={currentItem.contactChannels?.discord !== false}
                        onChange={(e) => setCurrentItem({...currentItem, contactChannels: { livechat: currentItem.contactChannels?.livechat !== false, discord: e.target.checked }})}
                        className="accent-indigo-600 w-4 h-4"
                      />
                      <span className="text-sm font-bold text-slate-700">🔵 ส่งผ่าน Discord</span>
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">เลือกว่าจะให้ลูกค้าเห็นช่องทางไหนบ้างเมื่อขอรับสินค้านี้</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">รายละเอียด (ไม่บังคับ)</label>
                <textarea 
                  value={currentItem.description || ""}
                  onChange={(e) => setCurrentItem({...currentItem, description: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-red-500 transition-all font-medium text-slate-800 min-h-[60px]"
                  placeholder="คุณสมบัติ, สเปคสินค้า..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">สถานะ</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                    <input type="radio" name="isActive" checked={currentItem.isActive === true} onChange={() => setCurrentItem({...currentItem, isActive: true})} className="accent-red-600 w-4 h-4" /> เปิดใช้งาน
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                    <input type="radio" name="isActive" checked={currentItem.isActive === false} onChange={() => setCurrentItem({...currentItem, isActive: false})} className="accent-red-600 w-4 h-4" /> ปิดใช้งาน
                  </label>
                </div>
              </div>

            </div>

            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
              <button onClick={closeModal} className="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                ยกเลิก
              </button>
              <button onClick={handleSave} className="px-5 py-2.5 rounded-lg text-sm font-bold bg-red-600 hover:bg-red-700 text-white transition-colors shadow-sm">
                บันทึกข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
