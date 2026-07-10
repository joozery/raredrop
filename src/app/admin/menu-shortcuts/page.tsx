"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Search, X, Link as LinkIcon } from "lucide-react";
import { UploadInput } from "@/components/ui/UploadInput";

interface ShortcutData {
  _id: string;
  title: string;
  imageUrl: string;
  url: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

export default function ManageShortcuts() {
  const [shortcuts, setShortcuts] = useState<ShortcutData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [currentShortcut, setCurrentShortcut] = useState<Partial<ShortcutData>>({ isActive: true, order: 0 });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchShortcuts();
  }, []);

  const fetchShortcuts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/menu-shortcuts");
      if (res.ok) {
        const data = await res.json();
        setShortcuts(data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const openAddModal = () => {
    setModalMode("add");
    setCurrentShortcut({ isActive: true, order: shortcuts.length });
    setIsModalOpen(true);
  };

  const openEditModal = (item: ShortcutData) => {
    setModalMode("edit");
    setCurrentShortcut({ ...item });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentShortcut({});
  };

  const handleSave = async () => {
    if (!currentShortcut.title || !currentShortcut.imageUrl || !currentShortcut.url) {
      alert("กรุณากรอกข้อมูลให้ครบ (ชื่อ, รูปภาพ, ลิงก์)");
      return;
    }

    try {
      const url = modalMode === "add" ? "/api/admin/menu-shortcuts" : `/api/admin/menu-shortcuts/${currentShortcut._id}`;
      const method = modalMode === "add" ? "POST" : "PUT";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentShortcut)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      
      closeModal();
      fetchShortcuts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/menu-shortcuts/${id}`, { method: "DELETE" });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      
      setDeleteConfirm(null);
      fetchShortcuts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredShortcuts = shortcuts.filter(s => 
    s.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">จัดการเมนูลัด (Shortcuts)</h1>
          <p className="text-sm text-slate-500 mt-1">เพิ่ม ลบ แก้ไข เมนูลัดหน้าแรก (เช่น ชิงรางวัลฟรี, เติมเงิน)</p>
        </div>
        <button onClick={openAddModal} className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm shadow-red-500/20 shrink-0">
          <Plus size={16} />
          เพิ่มเมนูลัด
        </button>
      </div>

      <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อเมนูลัด..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all font-medium text-slate-700 placeholder:text-slate-400"
            />
          </div>
          <div className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm shrink-0">
            ทั้งหมด: <span className="text-red-600 font-black ml-1">{shortcuts.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-white">
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ลำดับ</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">เมนูลัด</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">สถานะ</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ลิงก์</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100/80">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">กำลังโหลดข้อมูล...</td>
                </tr>
              ) : filteredShortcuts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">ไม่พบข้อมูล</td>
                </tr>
              ) : filteredShortcuts.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="py-4 px-6 font-bold text-slate-500">{item.order}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-200" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{item.title}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {item.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-500 text-xs font-medium">
                    <div className="flex items-center gap-1 max-w-[150px] truncate" title={item.url}>
                      <LinkIcon size={12} className="shrink-0" />
                      <span className="truncate">{item.url}</span>
                    </div>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">
                {modalMode === "add" ? "เพิ่มเมนูลัด" : "แก้ไขเมนูลัด"}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">ชื่อเมนูลัด <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={currentShortcut.title || ""}
                  onChange={(e) => setCurrentShortcut({...currentShortcut, title: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-red-500 transition-all font-medium text-slate-800"
                  placeholder="เช่น ชิงรางวัลฟรี..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  ลิงก์ปลายทาง <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={currentShortcut.url || ""}
                  onChange={(e) => setCurrentShortcut({...currentShortcut, url: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-red-500 transition-all font-medium text-slate-800"
                  placeholder="เช่น /red-envelope หรือ https://..."
                />
              </div>

              <UploadInput
                value={currentShortcut.imageUrl || ""}
                onChange={(url) => setCurrentShortcut({ ...currentShortcut, imageUrl: url })}
                folder="shortcuts"
                label="รูปภาพ/ไอคอน (จำเป็น)"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">ลำดับการแสดงผล</label>
                  <input 
                    type="number" 
                    value={currentShortcut.order ?? 0}
                    onChange={(e) => setCurrentShortcut({...currentShortcut, order: parseInt(e.target.value) || 0})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-red-500 transition-all font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">สถานะ</label>
                  <select 
                    value={currentShortcut.isActive ? "true" : "false"}
                    onChange={(e) => setCurrentShortcut({...currentShortcut, isActive: e.target.value === "true"})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-red-500 transition-all font-bold text-slate-800"
                  >
                    <option value="true">เปิดใช้งาน</option>
                    <option value="false">ปิดใช้งาน</option>
                  </select>
                </div>
              </div>

            </div>

            <div className="p-6 pt-0 flex items-center justify-end gap-3">
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
