"use client";

import { useState, useEffect } from "react";
import { Package, Search, Percent, Settings, Plus, X, Trash2, Box as BoxIcon, AlertTriangle } from "lucide-react";

interface RarityData {
  _id: string;
  name: string;
  color: string;
}

interface ItemData {
  _id: string;
  name: string;
  image: string;
  price: number;
  rarityId: RarityData;
  type?: "item" | "coin_reward";
  coinRewardAmount?: number;
}

interface BoxItem {
  itemId: ItemData;
  probability: number;
}

interface BoxData {
  _id: string;
  name: string;
  image: string;
  items: BoxItem[];
}

export default function ManageProbabilities() {
  const [boxes, setBoxes] = useState<BoxData[]>([]);
  const [items, setItems] = useState<ItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [selectedBox, setSelectedBox] = useState<BoxData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItems, setEditingItems] = useState<{ itemId: string, probability: number }[]>([]);
  const [itemSearch, setItemSearch] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resBoxes, resItems] = await Promise.all([
        fetch("/api/admin/boxes"),
        fetch("/api/admin/items")
      ]);
      
      if (resBoxes.ok) setBoxes(await resBoxes.json());
      if (resItems.ok) setItems(await resItems.json());
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const openManageModal = async (box: BoxData) => {
    // We need to fetch the detailed box to get populated items because the list might not have them fully populated
    try {
      const res = await fetch(`/api/admin/boxes/${box._id}`);
      if (res.ok) {
        const fullBox = await res.json();
        setSelectedBox(fullBox);
        setEditingItems(fullBox.items.map((i: any) => ({
          itemId: i.itemId._id,
          probability: i.probability
        })));
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBox(null);
    setEditingItems([]);
  };

  const handleAddItem = (item: ItemData) => {
    if (editingItems.find(i => i.itemId === item._id)) return; // Already added
    setEditingItems([...editingItems, { itemId: item._id, probability: 0 }]);
  };

  const handleRemoveItem = (itemId: string) => {
    setEditingItems(editingItems.filter(i => i.itemId !== itemId));
  };

  const handleProbChange = (itemId: string, val: string) => {
    const num = parseFloat(val);
    setEditingItems(editingItems.map(i => i.itemId === itemId ? { ...i, probability: isNaN(num) ? 0 : num } : i));
  };

  const handleSave = async () => {
    if (!selectedBox) return;
    
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/boxes/${selectedBox._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: editingItems })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      
      closeModal();
      fetchData(); // Refetch
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredBoxes = boxes.filter(box => 
    box.name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalProb = editingItems.reduce((sum, item) => sum + (item.probability || 0), 0);
  
  // Available items to add
  const availableItems = items.filter(i => 
    !editingItems.find(ei => ei.itemId === i._id) &&
    i.name.toLowerCase().includes(itemSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">อัตราดรอป (Drop Rates)</h1>
        <p className="text-sm text-slate-500 mt-1">ตั้งค่าไอเทมในกล่องสุ่มและกำหนดโอกาสออก (Probability)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400 font-medium">กำลังโหลดข้อมูล...</div>
        ) : filteredBoxes.map(box => (
          <div key={box._id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col group">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center p-1 shrink-0">
                {box.image ? <img src={box.image} alt={box.name} className="w-full h-full object-contain" /> : <Package className="text-slate-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-800 text-sm truncate">{box.name}</h3>
                <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-1">
                  <BoxIcon size={12} /> {box.items?.length || 0} ไอเทม
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => openManageModal(box)}
              className="mt-auto w-full bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <Settings size={14} />
              จัดการอัตราดรอป
            </button>
          </div>
        ))}
      </div>

      {isModalOpen && selectedBox && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-slate-50 rounded-lg p-1 border border-slate-100 shrink-0">
                  <img src={selectedBox.image} alt="box" className="w-full h-full object-contain" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-black text-slate-800 truncate">{selectedBox.name}</h2>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">จัดการไอเทมและโอกาสออก</p>
                </div>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors shrink-0">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
              {/* Left Side: Items in Box */}
              <div className="w-full lg:w-3/5 border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col bg-slate-50/50 max-h-[45vh] lg:max-h-none">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                  <h3 className="font-bold text-sm text-slate-700 flex items-center gap-2">
                    <Package size={16} className="text-slate-400" />
                    ไอเทมในกล่อง ({editingItems.length})
                  </h3>
                  <div className={`text-xs font-black px-3 py-1.5 rounded-lg border ${Math.abs(totalProb - 100) < 0.01 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    รวม {totalProb.toFixed(2)}%
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {editingItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                      <BoxIcon size={48} className="mb-3 opacity-20" />
                      <p className="font-medium text-sm">ยังไม่มีไอเทมในกล่องนี้</p>
                      <p className="text-xs">เลือกไอเทมจากด้านขวาเพื่อเพิ่มลงกล่อง</p>
                    </div>
                  ) : editingItems.map((ei, index) => {
                    const itemData = items.find(i => i._id === ei.itemId);
                    if (!itemData) return null;
                    return (
                      <div key={ei.itemId} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-4 shadow-sm hover:border-slate-300 transition-colors">
                        <div className="text-xs font-black text-slate-300 w-5">{index + 1}</div>
                        <div className="w-10 h-10 bg-slate-50 rounded-lg p-1 border border-slate-100 shrink-0 flex items-center justify-center">
                          {itemData.type === "coin_reward" ? (
                            <span className="text-2xl">💎</span>
                          ) : (
                            <img src={itemData.image} alt={itemData.name} className="w-full h-full object-contain" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-slate-800 text-sm truncate">{itemData.name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {itemData.rarityId && (
                              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ backgroundColor: `${itemData.rarityId.color}15`, color: itemData.rarityId.color }}>
                                {itemData.rarityId.name}
                              </span>
                            )}
                            {itemData.type === "coin_reward" ? (
                              <span className="text-[10px] font-black text-purple-600">+{(itemData.coinRewardAmount || 0).toLocaleString()} GEM</span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-500">฿{itemData.price.toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="relative">
                            <input 
                              type="number" 
                              min="0" max="100" step="0.01"
                              value={ei.probability.toString()}
                              onChange={(e) => handleProbChange(ei.itemId, e.target.value)}
                              className="w-24 bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-sm outline-none focus:border-red-500 font-black text-slate-800 text-right"
                            />
                            <Percent size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          </div>
                          <button onClick={() => handleRemoveItem(ei.itemId)} className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {Math.abs(totalProb - 100) > 0.01 && editingItems.length > 0 && (
                  <div className="p-3 m-4 mt-0 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-700 shrink-0">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <p className="text-xs font-medium"><strong>แจ้งเตือน:</strong> อัตราดรอปรวมทั้งหมดควรมีค่าเท่ากับ 100% (ปัจจุบัน {totalProb}%) เพื่อให้การสุ่มแม่นยำ</p>
                  </div>
                )}
              </div>

              {/* Right Side: Available Items */}
              <div className="w-full lg:w-2/5 flex flex-col bg-white max-h-[45vh] lg:max-h-none">
                <div className="p-4 border-b border-slate-100 shrink-0">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="ค้นหาไอเทมเพื่อเพิ่ม..." 
                      value={itemSearch}
                      onChange={(e) => setItemSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg pl-9 pr-3 py-2 outline-none focus:border-slate-300 font-medium"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {availableItems.length === 0 ? (
                    <div className="text-center text-slate-400 font-medium text-xs py-8">ไม่พบไอเทมที่ค้นหา หรือเพิ่มไอเทมทั้งหมดไปแล้ว</div>
                  ) : availableItems.map(item => (
                    <div key={item._id} className="border border-slate-100 rounded-xl p-2 flex items-center gap-3 hover:border-slate-200 transition-colors">
                      <div className="w-8 h-8 bg-slate-50 rounded-lg p-0.5 shrink-0 border border-slate-100 flex items-center justify-center">
                        {item.type === "coin_reward" ? (
                          <span className="text-lg">💎</span>
                        ) : (
                          <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-800 text-xs truncate">{item.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {item.rarityId && (
                            <div className="text-[9px] font-bold" style={{ color: item.rarityId.color }}>{item.rarityId.name}</div>
                          )}
                          {item.type === "coin_reward" && (
                            <div className="text-[9px] font-black text-purple-600">+{(item.coinRewardAmount || 0).toLocaleString()} GEM</div>
                          )}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleAddItem(item)}
                        className="w-7 h-7 bg-slate-50 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg flex items-center justify-center transition-colors shrink-0"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex items-center justify-end gap-3 bg-white shrink-0">
              <button onClick={closeModal} className="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                ยกเลิก
              </button>
              <button 
                onClick={handleSave} 
                disabled={isSaving}
                className="px-6 py-2.5 rounded-lg text-sm font-bold bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white transition-colors shadow-sm flex items-center gap-2"
              >
                {isSaving ? "กำลังบันทึก..." : "บันทึกอัตราดรอป"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
