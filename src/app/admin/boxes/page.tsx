"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Search, X, Package, Percent } from "lucide-react";
import { UploadInput } from "@/components/ui/UploadInput";
import Link from "next/link";

interface CategoryData {
  _id: string;
  name: string;
}

interface BoxData {
  _id: string;
  name: string;
  description?: string;
  image: string;
  animation?: string;
  price: number;
  pityThreshold: number;
  categoryId?: CategoryData | string;
  isFeatured: boolean;
  isActive: boolean;
  items: any[];
  createdAt: string;
}

export default function ManageBoxes() {
  const [boxes, setBoxes] = useState<BoxData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [currentBox, setCurrentBox] = useState<Partial<BoxData>>({ isActive: true, isFeatured: false, price: 0 });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resBoxes, resCats] = await Promise.all([
        fetch("/api/admin/boxes"),
        fetch("/api/admin/categories")
      ]);
      
      if (resBoxes.ok) setBoxes(await resBoxes.json());
      if (resCats.ok) setCategories(await resCats.json());
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const openAddModal = () => {
    setModalMode("add");
    setCurrentBox({
      isActive: true,
      isFeatured: false,
      price: 0,
      pityThreshold: 100,
      categoryId: ""
    });
    setIsModalOpen(true);
  };

  const openEditModal = (box: BoxData) => {
    setModalMode("edit");
    setCurrentBox({ 
      ...box,
      categoryId: typeof box.categoryId === 'object' ? (box.categoryId as any)._id : (box.categoryId || "")
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentBox({});
  };

  const handleSave = async () => {
    if (!currentBox.name || !currentBox.image || currentBox.price === undefined) {
      alert("กรุณากรอกชื่อ, รูปภาพ และราคาให้ครบถ้วน");
      return;
    }

    try {
      const url = modalMode === "add" ? "/api/admin/boxes" : `/api/admin/boxes/${currentBox._id}`;
      const method = modalMode === "add" ? "POST" : "PUT";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentBox)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      
      closeModal();
      fetchData(); // Refetch boxes
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/boxes/${id}`, { method: "DELETE" });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      
      setDeleteConfirm(null);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredBoxes = boxes.filter(box => 
    box.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">กล่องสุ่มทั้งหมด (Boxes)</h1>
          <p className="text-sm text-slate-500 mt-1">จัดการข้อมูลกล่องสุ่ม ราคา และหมวดหมู่</p>
        </div>
        <button onClick={openAddModal} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm shadow-red-500/20">
          <Plus size={16} />
          เพิ่มกล่องสุ่ม
        </button>
      </div>

      <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="relative w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="ค้นหาชื่อกล่องสุ่ม..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all font-medium text-slate-700 placeholder:text-slate-400"
            />
          </div>
          <div className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
            กล่องสุ่มทั้งหมด: <span className="text-red-600 font-black ml-1">{boxes.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-white">
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ชื่อกล่อง</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">หมวดหมู่</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">ราคาเปิด (บาท)</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">ไอเทมในกล่อง</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">สถานะ</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">กำลังโหลดข้อมูล...</td>
                </tr>
              ) : filteredBoxes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">ไม่พบข้อมูล</td>
                </tr>
              ) : filteredBoxes.map((box) => {
                const cData = box.categoryId as any as CategoryData;

                return (
                  <tr key={box._id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 p-1 relative">
                          {box.image ? (
                            <img src={box.image} alt={box.name} className="w-full h-full object-contain" />
                          ) : (
                            <Package size={18} className="text-slate-400" />
                          )}
                          {box.isFeatured && (
                            <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-bl-lg shadow-sm"></div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 line-clamp-1">{box.name}</div>
                          {box.isFeatured && <span className="text-[9px] font-black text-red-500 uppercase tracking-wider">⭐ แนะนำ</span>}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {cData ? (
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded w-max">{cData.name}</span>
                      ) : (
                        <span className="text-[10px] font-bold bg-slate-50 text-slate-400 px-2 py-0.5 rounded w-max">ไม่ระบุหมวดหมู่</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="font-black text-slate-800">
                        {box.price.toLocaleString()}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <Link href={`/admin/probabilities`} className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-colors group/btn shadow-sm">
                        <Percent size={12} className="text-blue-500 group-hover/btn:text-white" />
                        {box.items?.length || 0} ชิ้น
                      </Link>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${box.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {box.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {deleteConfirm === box._id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleDelete(box._id)} className="text-xs font-bold bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700">ยืนยัน</button>
                          <button onClick={() => setDeleteConfirm(null)} className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200">ยกเลิก</button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditModal(box)} className="text-blue-600 bg-blue-50 border border-blue-100 rounded-lg p-2 hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="แก้ไข">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => setDeleteConfirm(box._id)} className="text-red-500 bg-red-50 border border-red-100 rounded-lg p-2 hover:bg-red-600 hover:text-white transition-all shadow-sm" title="ลบ">
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
                {modalMode === "add" ? "เพิ่มกล่องสุ่มใหม่" : "แก้ไขข้อมูลกล่องสุ่ม"}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-5 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">ชื่อกล่อง <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={currentBox.name || ""}
                  onChange={(e) => setCurrentBox({...currentBox, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-red-500 transition-all font-medium text-slate-800"
                  placeholder="เช่น กล่องสุ่ม iPhone 15..."
                />
              </div>

              <UploadInput
                label="รูปภาพกล่อง *"
                value={currentBox.image || ""}
                onChange={(url) => setCurrentBox({ ...currentBox, image: url })}
                folder="boxes"
                accept="image/jpeg,image/png,image/webp,image/gif"
                placeholder="https://... หรืออัพโหลดรูปภาพ"
              />

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">ราคาต่อการเปิด 1 ครั้ง (บาท) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={currentBox.price ?? 0}
                    onChange={(e) => setCurrentBox({...currentBox, price: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-red-500 transition-all font-black text-red-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Pity (การันตีทุกกี่ครั้ง)</label>
                  <input
                    type="number"
                    min="1"
                    value={currentBox.pityThreshold ?? 100}
                    onChange={(e) => setCurrentBox({...currentBox, pityThreshold: parseInt(e.target.value) || 100})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-red-500 transition-all font-black text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">หมวดหมู่</label>
                  <select 
                    value={currentBox.categoryId as string || ""}
                    onChange={(e) => setCurrentBox({...currentBox, categoryId: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-red-500 transition-all font-medium text-slate-800"
                  >
                    <option value="">-- ไม่ระบุ --</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <UploadInput
                label="Animation เปิดกล่อง (ไม่บังคับ)"
                value={currentBox.animation || ""}
                onChange={(url) => setCurrentBox({ ...currentBox, animation: url })}
                folder="animations"
                accept="video/mp4,video/webm,image/gif"
                placeholder="https://... หรืออัพโหลดวิดีโอ/gif"
                isVideo
              />

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">รายละเอียดกล่อง (ไม่บังคับ)</label>
                <textarea
                  value={currentBox.description || ""}
                  onChange={(e) => setCurrentBox({...currentBox, description: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-red-500 transition-all font-medium text-slate-800 min-h-[60px]"
                  placeholder="รายละเอียด..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">กล่องแนะนำ (Featured)</label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                      <input type="radio" name="isFeatured" checked={currentBox.isFeatured === true} onChange={() => setCurrentBox({...currentBox, isFeatured: true})} className="accent-red-600 w-4 h-4" /> ใช่
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                      <input type="radio" name="isFeatured" checked={currentBox.isFeatured === false} onChange={() => setCurrentBox({...currentBox, isFeatured: false})} className="accent-red-600 w-4 h-4" /> ไม่ใช่
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">สถานะกล่อง</label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                      <input type="radio" name="isActive" checked={currentBox.isActive === true} onChange={() => setCurrentBox({...currentBox, isActive: true})} className="accent-red-600 w-4 h-4" /> เปิด
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                      <input type="radio" name="isActive" checked={currentBox.isActive === false} onChange={() => setCurrentBox({...currentBox, isActive: false})} className="accent-red-600 w-4 h-4" /> ปิด
                    </label>
                  </div>
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
