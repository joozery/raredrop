"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Search, X, ShieldAlert, PlusCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Admin {
  _id: string;
  name: string;
  email: string;
  role: string;
  coins: number;
  createdAt: string;
}

export default function ManageAdmins() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [currentAdmin, setCurrentAdmin] = useState<Partial<Admin> & { password?: string }>({});
  
  // Delete confirm state
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Topup modal
  const [topupTarget, setTopupTarget] = useState<Admin | null>(null);
  const [topupAmount, setTopupAmount] = useState("");
  const [topping, setTopping] = useState(false);
  const [topupError, setTopupError] = useState("");

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/admins");
      if (res.ok) {
        const data = await res.json();
        setAdmins(data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const openAddModal = () => {
    setModalMode("add");
    setCurrentAdmin({ role: "admin" });
    setIsModalOpen(true);
  };

  const openEditModal = (admin: Admin) => {
    setModalMode("edit");
    setCurrentAdmin({ ...admin, password: "" });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentAdmin({});
  };

  const handleSave = async () => {
    if (!currentAdmin.name || !currentAdmin.email || (!currentAdmin.password && modalMode === "add")) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    try {
      const url = modalMode === "add" ? "/api/admin/admins" : `/api/admin/admins/${currentAdmin._id}`;
      const method = modalMode === "add" ? "POST" : "PUT";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentAdmin)
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      
      closeModal();
      fetchAdmins();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/admins/${id}`, { method: "DELETE" });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      
      setDeleteConfirm(null);
      fetchAdmins();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTopup = async () => {
    if (!topupTarget) return;
    const amt = parseFloat(topupAmount);
    if (!amt || amt <= 0) return setTopupError("กรุณากรอกจำนวนที่ถูกต้อง");
    setTopupError("");
    setTopping(true);
    try {
      const res = await fetch(`/api/admin/users/${topupTarget._id}/topup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt }),
      });
      const data = await res.json();
      if (!res.ok) return setTopupError(data.error || "เกิดข้อผิดพลาด");
      setAdmins((prev) => prev.map((a) => a._id === topupTarget._id ? { ...a, coins: data.coins } : a));
      setTopupTarget(null);
      setTopupAmount("");
    } catch {
      setTopupError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setTopping(false);
    }
  };

  const filteredAdmins = admins.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) || 
    a.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">จัดการแอดมิน</h1>
          <p className="text-sm text-slate-500 mt-1">เพิ่ม ลบ แก้ไข ข้อมูลผู้ดูแลระบบ (Admin) ทั้งหมด</p>
        </div>
        <button onClick={openAddModal} className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm shadow-red-500/20 shrink-0">
          <Plus size={16} />
          เพิ่มแอดมินใหม่
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="ค้นหาชื่อ หรืออีเมล..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 text-sm rounded-lg pl-9 pr-4 py-2 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">ชื่อแอดมิน</th>
                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">อีเมลเข้าสู่ระบบ</th>
                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">สิทธิ์ (Role)</th>
                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">วันที่เพิ่ม</th>
                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">กำลังโหลดข้อมูล...</td>
                </tr>
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">ไม่พบข้อมูลแอดมิน</td>
                </tr>
              ) : filteredAdmins.map((admin) => (
                <tr key={admin._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-6 font-bold text-slate-800">{admin.name}</td>
                  <td className="py-3 px-6 text-slate-600 font-medium">{admin.email}</td>
                  <td className="py-3 px-6 text-center">
                    <span className={cn(
                      "text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1",
                      admin.role === "super_admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                    )}>
                      {admin.role === "super_admin" && <ShieldAlert size={10} />}
                      {admin.role}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-slate-500 text-xs">
                    {new Date(admin.createdAt).toLocaleDateString("th-TH", { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="py-3 px-6 text-right">
                    {deleteConfirm === admin._id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleDelete(admin._id)} className="text-[10px] font-bold bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700">ยืนยันลบ</button>
                        <button onClick={() => setDeleteConfirm(null)} className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-1 rounded hover:bg-slate-300">ยกเลิก</button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => { setTopupTarget(admin); setTopupAmount(""); setTopupError(""); }}
                          className="flex items-center gap-1 text-emerald-600 hover:text-emerald-800 p-1 text-xs font-bold transition-colors"
                          title="เติมเงิน"
                        >
                          <PlusCircle size={15} />
                          เติมเงิน
                        </button>
                        <button onClick={() => openEditModal(admin)} className="text-blue-500 hover:text-blue-700 p-1" title="แก้ไข">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => setDeleteConfirm(admin._id)} className="text-slate-400 hover:text-red-600 p-1 transition-colors" title="ลบ">
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">
                {modalMode === "add" ? "เพิ่มแอดมินใหม่" : "แก้ไขข้อมูลแอดมิน"}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">ชื่อแอดมิน</label>
                <input 
                  type="text" 
                  value={currentAdmin.name || ""}
                  onChange={(e) => setCurrentAdmin({...currentAdmin, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all font-medium text-slate-800"
                  placeholder="เช่น Admin_John"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">อีเมลเข้าสู่ระบบ</label>
                <input 
                  type="email" 
                  value={currentAdmin.email || ""}
                  onChange={(e) => setCurrentAdmin({...currentAdmin, email: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all font-medium text-slate-800"
                  placeholder="admin@raredrop.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  รหัสผ่าน {modalMode === "edit" && <span className="text-slate-400 font-normal normal-case">(เว้นว่างไว้หากไม่ต้องการเปลี่ยน)</span>}
                </label>
                <input 
                  type="password" 
                  value={currentAdmin.password || ""}
                  onChange={(e) => setCurrentAdmin({...currentAdmin, password: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all font-medium text-slate-800"
                  placeholder={modalMode === "add" ? "ตั้งรหัสผ่าน" : "รหัสผ่านใหม่..."}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">สิทธิ์ (Role)</label>
                <select 
                  value={currentAdmin.role || "admin"}
                  onChange={(e) => setCurrentAdmin({...currentAdmin, role: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all font-bold text-slate-800 cursor-pointer appearance-none"
                >
                  <option value="admin">Admin (ผู้ดูแลทั่วไป)</option>
                  <option value="super_admin">Super Admin (ผู้ดูแลสูงสุด)</option>
                </select>
              </div>
            </div>

            <div className="p-6 pt-0 flex items-center justify-end gap-3">
              <button onClick={closeModal} className="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                ยกเลิก
              </button>
              <button onClick={handleSave} className="px-5 py-2.5 rounded-lg text-sm font-bold bg-red-600 hover:bg-red-700 text-white transition-colors shadow-sm shadow-red-500/20">
                บันทึกข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Topup Modal */}
      {topupTarget && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800">เติมเงินให้ {topupTarget.name}</h2>
              <button onClick={() => setTopupTarget(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="bg-emerald-50 rounded-xl px-4 py-3 text-sm flex justify-between items-center border border-emerald-100">
                <span className="text-emerald-700 font-medium">ยอดปัจจุบัน</span>
                <span className="font-black text-emerald-800">
                  ฿{(topupTarget.coins || 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">จำนวนเงินที่จะเติม (฿)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  placeholder="เช่น 100, 500, 1000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-mono font-bold outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                  autoFocus
                />
              </div>

              {topupAmount && parseFloat(topupAmount) > 0 && (
                <div className="bg-slate-50 rounded-xl px-4 py-2.5 text-sm flex justify-between items-center">
                  <span className="text-slate-500">ยอดหลังเติม</span>
                  <span className="font-black text-slate-900">
                    ฿{((topupTarget.coins || 0) + parseFloat(topupAmount)).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {topupError && <p className="text-sm text-red-600 font-semibold text-center">{topupError}</p>}
            </div>

            <div className="px-6 pb-6 flex gap-3 border-t border-slate-100 pt-4">
              <button
                onClick={() => setTopupTarget(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-sm transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleTopup}
                disabled={topping || !topupAmount || parseFloat(topupAmount) <= 0}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                {topping ? <Loader2 size={14} className="animate-spin" /> : <PlusCircle size={14} />}
                เติมเงิน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
