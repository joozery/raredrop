"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Search, X, Coins, Crown, Star, Wallet, ArrowUpCircle } from "lucide-react";

interface UserData {
  _id: string;
  name: string;
  email: string;
  coins: number;
  vipLevel: number;
  xp: number;
  createdAt: string;
  lineId?: string;
  googleId?: string;
  avatar?: string;
}

export default function ManageUsers() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [currentUser, setCurrentUser] = useState<Partial<UserData> & { password?: string }>({});
  
  // Topup Modal states
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState<number | "">("");
  const [selectedTopupUser, setSelectedTopupUser] = useState<UserData | null>(null);
  const [isToppingUp, setIsToppingUp] = useState(false);

  // Delete confirm state
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const openAddModal = () => {
    setModalMode("add");
    setCurrentUser({ coins: 0, vipLevel: 1, xp: 0 });
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserData) => {
    setModalMode("edit");
    setCurrentUser({ ...user, password: "" });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentUser({});
  };

  const handleSave = async () => {
    if (!currentUser.name || (!currentUser.email && modalMode === "add")) {
      alert("กรุณากรอกชื่อและอีเมลให้ครบถ้วน");
      return;
    }

    try {
      const url = modalMode === "add" ? "/api/admin/users" : `/api/admin/users/${currentUser._id}`;
      const method = modalMode === "add" ? "POST" : "PUT";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentUser)
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      
      closeModal();
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      
      setDeleteConfirm(null);
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openTopupModal = (user: UserData) => {
    setSelectedTopupUser(user);
    setTopupAmount("");
    setIsTopupModalOpen(true);
  };

  const handleTopup = async () => {
    if (!selectedTopupUser || !topupAmount || topupAmount <= 0) {
      alert("กรุณาระบุจำนวนเงินที่ถูกต้อง");
      return;
    }

    setIsToppingUp(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedTopupUser._id}/topup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(topupAmount) })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      
      setIsTopupModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsToppingUp(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">จัดการผู้เล่น</h1>
          <p className="text-sm text-slate-500 mt-1">เพิ่ม ลบ แก้ไข ข้อมูลผู้เล่น และปรับยอดเงิน</p>
        </div>
        <button onClick={openAddModal} className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm shadow-red-500/20 shrink-0">
          <Plus size={16} />
          เพิ่มผู้เล่น
        </button>
      </div>

      <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ หรืออีเมลผู้เล่น..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all font-medium text-slate-700 placeholder:text-slate-400"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
              ผู้เล่นทั้งหมด: <span className="text-red-600 font-black ml-1">{users.length}</span> คน
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-white">
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ผู้เล่น (Player)</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">การเชื่อมต่อ (Provider)</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">ยอดเงินคงเหลือ</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">ระดับ (Level)</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">วันที่สมัคร</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="inline-flex items-center justify-center gap-2 text-slate-400 font-medium">
                      <div className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
                      กำลังโหลดข้อมูล...
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">ไม่พบข้อมูลผู้เล่น</td>
                </tr>
              ) : filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                        <img src={user.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user._id}`} alt="avatar" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{user.name}</div>
                        <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                          ID: <span className="font-mono">{user._id.slice(-6).toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-slate-600 font-medium text-xs">{user.email || "-"}</span>
                      <div className="flex items-center gap-1.5">
                        {user.lineId && (
                          <div className="bg-[#00B900]/10 border border-[#00B900]/20 rounded-md px-1.5 py-0.5 flex items-center gap-1.5" title="ล็อกอินผ่าน LINE">
                            <img src="/banner/cover/line.svg" alt="Line" className="w-3.5 h-3.5 object-contain" />
                            <span className="text-[9px] font-black text-[#00B900] uppercase tracking-wider">LINE</span>
                          </div>
                        )}
                        {user.googleId && (
                          <div className="bg-red-50 border border-red-100 rounded-md px-1.5 py-0.5 flex items-center gap-1.5" title="ล็อกอินผ่าน Google">
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            <span className="text-[9px] font-black text-red-600 uppercase tracking-wider">Google</span>
                          </div>
                        )}
                        {(!user.lineId && !user.googleId) && (
                          <div className="bg-slate-100 border border-slate-200 rounded-md px-1.5 py-0.5 flex items-center gap-1.5 text-slate-500" title="ล็อกอินด้วยอีเมล">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">Email</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-2.5 py-1 rounded-lg border border-green-200/50">
                      <Coins size={14} className="text-green-600" />
                      <span className="font-black tracking-tight">{user.coins?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || "0.00"}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <div className="bg-gradient-to-r from-amber-200 to-yellow-400 text-yellow-900 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm border border-yellow-300">
                        <Crown size={12} className="drop-shadow-sm" /> VIP {user.vipLevel || 1}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full">
                        <Star size={10} className="text-blue-500" /> {user.xp?.toLocaleString() || 0} XP
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-500 text-xs font-medium">
                    {new Date(user.createdAt).toLocaleDateString("th-TH", { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="py-4 px-6 text-right">
                    {deleteConfirm === user._id ? (
                      <div className="flex items-center justify-end gap-2 animate-in fade-in duration-200">
                        <button onClick={() => handleDelete(user._id)} className="text-xs font-bold bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 shadow-sm">ยืนยันลบ</button>
                        <button onClick={() => setDeleteConfirm(null)} className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200">ยกเลิก</button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-60 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openTopupModal(user)} className="text-green-600 hover:text-white bg-green-50 hover:bg-green-600 border border-green-100 hover:border-green-600 rounded-lg p-2 transition-all shadow-sm flex items-center justify-center" title="เติมเงิน">
                          <Wallet size={16} strokeWidth={2.5} />
                        </button>
                        <button onClick={() => openEditModal(user)} className="text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-100 hover:border-blue-600 rounded-lg p-2 transition-all shadow-sm flex items-center justify-center" title="แก้ไข">
                          <Edit2 size={16} strokeWidth={2.5} />
                        </button>
                        <button onClick={() => setDeleteConfirm(user._id)} className="text-red-500 hover:text-white bg-red-50 hover:bg-red-600 border border-red-100 hover:border-red-600 rounded-lg p-2 transition-all shadow-sm flex items-center justify-center" title="ลบ">
                          <Trash2 size={16} strokeWidth={2.5} />
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
                {modalMode === "add" ? "เพิ่มผู้เล่นใหม่" : "แก้ไขข้อมูลผู้เล่น"}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">ชื่อผู้เล่น</label>
                <input 
                  type="text" 
                  value={currentUser.name || ""}
                  onChange={(e) => setCurrentUser({...currentUser, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all font-medium text-slate-800"
                  placeholder="ชื่อ..."
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">อีเมล</label>
                <input 
                  type="email" 
                  value={currentUser.email || ""}
                  onChange={(e) => setCurrentUser({...currentUser, email: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all font-medium text-slate-800"
                  placeholder="อีเมล..."
                  disabled={modalMode === "edit" && !!currentUser.email} // Usually email is not editable
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  รหัสผ่าน {modalMode === "edit" && <span className="text-slate-400 font-normal normal-case">(เว้นว่างไว้หากไม่ต้องการเปลี่ยน)</span>}
                </label>
                <input 
                  type="password" 
                  value={currentUser.password || ""}
                  onChange={(e) => setCurrentUser({...currentUser, password: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all font-medium text-slate-800"
                  placeholder={modalMode === "add" ? "ตั้งรหัสผ่าน" : "รหัสผ่านใหม่..."}
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1 uppercase tracking-wider">
                  <Coins size={14} className="text-yellow-500"/> ยอดเงิน (บาท)
                </label>
                <input 
                  type="number" 
                  value={currentUser.coins || 0}
                  onChange={(e) => setCurrentUser({...currentUser, coins: parseFloat(e.target.value) || 0})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all font-black text-red-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1 uppercase tracking-wider">
                    <Crown size={14} className="text-yellow-500"/> VIP Level
                  </label>
                  <input 
                    type="number" 
                    min="1"
                    value={currentUser.vipLevel || 1}
                    onChange={(e) => setCurrentUser({...currentUser, vipLevel: parseInt(e.target.value) || 1})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1 uppercase tracking-wider">
                    <Star size={14} className="text-blue-500"/> XP
                  </label>
                  <input 
                    type="number" 
                    min="0"
                    value={currentUser.xp || 0}
                    onChange={(e) => setCurrentUser({...currentUser, xp: parseInt(e.target.value) || 0})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all font-bold text-slate-800"
                  />
                </div>
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
      {isTopupModalOpen && selectedTopupUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-6 flex flex-col items-center justify-center relative">
              <button onClick={() => setIsTopupModalOpen(false)} className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/20 p-1 rounded-full transition-colors">
                <X size={20} />
              </button>
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-3 shadow-inner">
                <Wallet size={32} className="text-white" />
              </div>
              <h2 className="text-xl font-black text-white">เติมเงินให้ผู้เล่น</h2>
              <p className="text-green-100 text-sm font-medium mt-1">{selectedTopupUser.name}</p>
            </div>
            
            <div className="p-6 flex flex-col gap-5 bg-slate-50">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <span className="text-sm font-bold text-slate-500">ยอดเงินปัจจุบัน</span>
                <span className="font-black text-lg text-slate-800">{selectedTopupUser.coins?.toLocaleString()} <span className="text-sm text-slate-400">บาท</span></span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">ระบุจำนวนเงินที่ต้องการเติม</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-green-600 font-black text-xl">฿</div>
                  <input 
                    type="number" 
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value ? parseFloat(e.target.value) : "")}
                    className="w-full bg-white border-2 border-green-200 rounded-xl pl-10 pr-4 py-3 text-lg font-black text-green-700 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all shadow-sm"
                    placeholder="0.00"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2 mt-3">
                  {[50, 100, 300, 500, 1000].map(amt => (
                    <button 
                      key={amt}
                      onClick={() => setTopupAmount(amt)}
                      className="flex-1 bg-white border border-slate-200 hover:border-green-400 hover:bg-green-50 hover:text-green-700 text-slate-600 font-bold text-xs py-2 rounded-lg transition-colors shadow-sm"
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 bg-white border-t border-slate-100 flex items-center justify-end gap-3">
              <button onClick={() => setIsTopupModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors">
                ยกเลิก
              </button>
              <button 
                onClick={handleTopup} 
                disabled={isToppingUp || !topupAmount || topupAmount <= 0}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-green-600 hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed text-white transition-all shadow-sm shadow-green-500/20"
              >
                {isToppingUp ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    กำลังเติม...
                  </>
                ) : (
                  <>
                    <ArrowUpCircle size={18} />
                    ยืนยันการเติมเงิน
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
