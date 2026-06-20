"use client";

import { useState, useEffect } from "react";
import { Search, User, ArrowUpRight, ArrowDownRight, ArrowRightLeft } from "lucide-react";

interface UserData {
  _id: string;
  name: string;
  avatar?: string;
}

interface TransactionData {
  _id: string;
  userId: UserData;
  type: "topup" | "withdraw" | "buy_box" | "sell_item" | "market_buy" | "market_sell" | "admin_adjust";
  amount: number;
  balanceAfter: number;
  description?: string;
  createdAt: string;
}

export default function ManageTransactions() {
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    fetchData();
  }, [typeFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = "/api/admin/transactions";
      if (typeFilter) url += `?type=${typeFilter}`;
      
      const res = await fetch(url);
      if (res.ok) {
        setTransactions(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const filteredTransactions = transactions.filter(t => 
    t.userId?.name.toLowerCase().includes(search.toLowerCase()) || 
    t.description?.toLowerCase().includes(search.toLowerCase())
  );

  const getTypeDetails = (type: string) => {
    switch (type) {
      case 'topup': return { label: 'เติมเงิน', icon: <ArrowDownRight size={14} />, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', sign: '+' };
      case 'withdraw': return { label: 'ถอนเงิน', icon: <ArrowUpRight size={14} />, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', sign: '-' };
      case 'buy_box': return { label: 'ซื้อกล่องสุ่ม', icon: <ArrowUpRight size={14} />, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', sign: '-' };
      case 'sell_item': return { label: 'ขายคืนระบบ', icon: <ArrowDownRight size={14} />, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', sign: '+' };
      case 'market_buy': return { label: 'ซื้อจากตลาด', icon: <ArrowUpRight size={14} />, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', sign: '-' };
      case 'market_sell': return { label: 'ขายในตลาด', icon: <ArrowDownRight size={14} />, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', sign: '+' };
      case 'admin_adjust': return { label: 'แอดมินปรับสมดุล', icon: <ArrowRightLeft size={14} />, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', sign: '' };
      default: return { label: type, icon: <ArrowRightLeft size={14} />, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', sign: '' };
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">ประวัติธุรกรรม (Transactions)</h1>
        <p className="text-sm text-slate-500 mt-1">ดูประวัติการไหลเวียนของเหรียญในระบบทั้งหมด</p>
      </div>

      <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อผู้เล่น หรือรายละเอียด..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-red-500 transition-all font-medium text-slate-700"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full sm:w-auto bg-white border border-slate-200 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-red-500 font-medium text-slate-700"
            >
              <option value="">ทุกประเภทธุรกรรม</option>
              <option value="topup">เติมเงิน (Topup)</option>
              <option value="withdraw">ถอนเงิน (Withdraw)</option>
              <option value="buy_box">ซื้อกล่องสุ่ม (Buy Box)</option>
              <option value="sell_item">ขายคืนระบบ (Sell Item)</option>
              <option value="market_buy">ซื้อจากตลาด (Market Buy)</option>
              <option value="market_sell">ขายในตลาด (Market Sell)</option>
              <option value="admin_adjust">แอดมินปรับสมดุล (Admin Adjust)</option>
            </select>
          </div>

          <div className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm shrink-0">
            รายการทั้งหมด: <span className="text-red-600 font-black ml-1">{transactions.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-white">
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">วันเวลา</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ผู้ทำธุรกรรม</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ประเภท</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">จำนวนเงิน</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">ยอดคงเหลือ</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">รายละเอียด</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">กำลังโหลดข้อมูล...</td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">ไม่พบข้อมูลธุรกรรม</td>
                </tr>
              ) : filteredTransactions.map((t) => {
                const details = getTypeDetails(t.type);
                
                return (
                  <tr key={t._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 text-slate-500 text-[11px] font-medium">
                      {new Date(t.createdAt).toLocaleString("th-TH", { dateStyle: 'short', timeStyle: 'medium' })}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-slate-100 overflow-hidden shrink-0">
                          {t.userId?.avatar ? <img src={t.userId.avatar} alt="avatar" className="w-full h-full object-cover" /> : <User size={12} className="text-slate-400 m-auto mt-1" />}
                        </div>
                        <span className="font-bold text-slate-800 text-xs">{t.userId?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border ${details.bg} ${details.color} ${details.border}`}>
                        {details.icon}
                        {details.label}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className={`font-black ${details.color}`}>
                        {details.sign}{Math.abs(t.amount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-slate-700">
                      {t.balanceAfter?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '-'}
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-[11px] text-slate-500">{t.description || '-'}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
