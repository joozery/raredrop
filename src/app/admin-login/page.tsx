"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, ArrowRight } from "lucide-react";

function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        if (res.error === "CredentialsSignin") {
          setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        } else {
          setError(res.error);
        }
      } else {
        router.push(callbackUrl);
      }
    } catch (err: any) {
      setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
    }
    setLoading(false);
  };

  return (
    <div 
      className="w-full min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: 'url("/banner/cover/4186834.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* White overlay to make the box stand out */}
      <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-0"></div>
      
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 z-10">
        <div className="bg-red-600 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Lock size={120} />
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-red-600 font-black text-3xl mb-4 shadow-lg">R</div>
            <h1 className="text-2xl font-black text-white tracking-tight">RAREDROP</h1>
            <p className="text-red-100 text-sm font-medium mt-1">Admin Control Panel</p>
          </div>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold border border-red-100">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">อีเมลแอดมิน</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-11 pr-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all font-medium text-slate-800"
                  placeholder="admin@raredrop.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">รหัสผ่าน</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-11 pr-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all font-medium text-slate-800"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg py-3 font-bold flex items-center justify-center gap-2 transition-all mt-2 shadow-sm shadow-red-500/20 disabled:opacity-50"
            >
              {loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ (Login)"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AdminLogin() {
  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  );
}
