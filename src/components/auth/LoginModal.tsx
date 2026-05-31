import React, { useState, useRef, useEffect } from 'react';
import { Mail, Headset, ChevronDown, X, ArrowLeft, KeyRound, Eye, EyeOff } from 'lucide-react';
import { signIn } from "next-auth/react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [step, setStep] = useState<"email" | "password" | "otp">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // OTP State
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "otp" && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const sendOtp = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep("otp");
        setTimeLeft(60);
        setOtp(["", "", "", "", "", ""]);
      } else {
        setErrorMsg(data.error || "เกิดข้อผิดพลาดในการส่ง OTP");
      }
    } catch (err) {
      setErrorMsg("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = async (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input
    if (value !== "" && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto submit if all filled
    if (index === 5 && value !== "" && newOtp.every(v => v !== "")) {
      setIsLoading(true);
      setErrorMsg("");
      const fullOtp = newOtp.join("");
      
      const res = await signIn("credentials", { 
        email, 
        password, 
        otp: fullOtp,
        redirect: false
      });
      
      setIsLoading(false);

      if (res?.error) {
        setErrorMsg(res.error);
        setOtp(["", "", "", "", "", ""]);
        otpRefs.current[0]?.focus();
      } else if (res?.ok) {
        onClose();
        // Force refresh to update UI state if needed
        window.location.reload();
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => {
          setStep("email");
          setErrorMsg("");
          onClose();
        }}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-[420px] bg-[#F8F9FA] rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 sm:fade-in duration-300 pb-safe flex flex-col min-h-[450px]">
        
        {step === "email" && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-white font-black shadow-sm">
                  <span className="text-lg">R</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">เข้าสู่ระบบ หรือ ลงทะเบียน</h2>
              </div>
              
              <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors">
                ภาษาไทย <ChevronDown size={14} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 flex flex-col gap-3">
              
              {/* Email Input Field */}
              <div className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 flex items-center gap-3 shadow-sm focus-within:border-gray-400 transition-colors">
                <Mail size={18} className="text-gray-500 shrink-0" />
                <input 
                  type="email" 
                  placeholder="กรอกอีเมลของคุณ" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-[15px] text-gray-900 placeholder:text-gray-400"
                />
                {email && (
                  <button 
                    onClick={() => setEmail("")}
                    className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors shrink-0"
                  >
                    <X size={12} className="text-gray-600" />
                  </button>
                )}
              </div>

              {/* Continue Button */}
              <button 
                onClick={() => {
                  if (email) {
                    setStep("password");
                    setErrorMsg("");
                  }
                }}
                className={`w-full text-white font-bold rounded-xl py-3.5 transition-colors mt-1 shadow-sm ${email ? "bg-black hover:bg-gray-900" : "bg-black/50 cursor-not-allowed"}`}
              >
                ต่อ
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4 my-2">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-[11px] text-gray-400 font-medium">หรือ</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
              
              {/* Line Button */}
              <button 
                onClick={() => signIn("line", { callbackUrl: "/" })}
                className="w-full bg-white border border-gray-100 shadow-sm hover:border-[#00C300] hover:bg-[#00C300]/5 transition-all rounded-xl py-3.5 px-5 flex items-center gap-4 group"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <img src="/banner/cover/line.svg" alt="Line Logo" className="w-full h-full object-contain" />
                </div>
                <span className="flex-1 text-center font-bold text-gray-800 text-[14px]">เข้าสู่ระบบด้วย Line</span>
                <div className="w-6" /> {/* Spacer */}
              </button>

              {/* Google Button */}
              <button 
                onClick={() => signIn("google", { callbackUrl: "/" })}
                className="w-full bg-white border border-gray-100 shadow-sm hover:border-blue-500 hover:bg-blue-50 transition-all rounded-xl py-3.5 px-5 flex items-center gap-4 group"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-full h-full">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <span className="flex-1 text-center font-bold text-gray-800 text-[14px]">เข้าสู่ระบบด้วย Google</span>
                <div className="w-5" /> {/* Spacer */}
              </button>

            </div>

            {/* Contact Support Floating Button */}
            <div className="px-6 flex justify-end mt-4 mb-1">
              <button className="bg-white shadow-sm border border-gray-100 rounded-full py-2 px-4 flex items-center gap-2 hover:bg-gray-50 transition-colors">
                <Headset size={16} className="text-gray-700" />
                <span className="text-[13px] font-bold text-gray-800">ติดต่อเจ้าหน้าที่</span>
              </button>
            </div>

            {/* Footer */}
            <div className="px-8 pb-8 pt-4 text-center mt-2">
              <p className="text-[11px] text-gray-500 leading-relaxed">
                การเข้าสู่ระบบหรือลงทะเบียน ถือเป็นการยอมรับ <br/>
                <a href="#" className="font-semibold text-gray-600 hover:underline hover:text-gray-900">ข้อตกลงผู้ใช้งาน</a> และ <a href="#" className="font-semibold text-gray-600 hover:underline hover:text-gray-900">นโยบายความเป็นส่วนตัว</a>
              </p>
            </div>
          </>
        )}
        
        {step === "password" && (
          <div className="flex-1 flex flex-col relative h-full">
            {/* Header Step 2 */}
            <div className="flex items-center justify-center p-6 pb-5 relative">
              <button 
                onClick={() => setStep("email")}
                className="absolute left-6 text-gray-900 p-1 hover:bg-gray-100 rounded-full transition-colors"
                disabled={isLoading}
              >
                <ArrowLeft size={22} strokeWidth={2.5} />
              </button>
              <h2 className="text-xl font-black text-gray-900">ลงทะเบียน</h2>
            </div>

            {/* Body Step 2 */}
            <div className="px-6 flex flex-col gap-4 mt-2">
              
              {/* Email Input Field (Readonly) */}
              <div className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 flex items-center gap-3 shadow-sm">
                <Mail size={18} className="text-gray-900 shrink-0" strokeWidth={1.5} />
                <input 
                  type="email" 
                  readOnly
                  value={email}
                  className="flex-1 bg-transparent border-none outline-none text-[15px] text-gray-900"
                />
              </div>

              {/* Password Input Field */}
              <div className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 flex items-center gap-3 shadow-sm focus-within:border-gray-400 transition-colors">
                <KeyRound size={18} className="text-gray-600 shrink-0" strokeWidth={1.5} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="โปรดตั้งรหัสผ่าน" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-[15px] text-gray-900 placeholder:text-gray-400"
                  disabled={isLoading}
                />
                <button 
                  onClick={() => setShowPassword(!showPassword)}
                  className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                  disabled={isLoading}
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
              
              {errorMsg && <p className="text-red-500 text-xs text-center">{errorMsg}</p>}

              {/* Submit Button */}
              <button 
                disabled={isLoading || password.length < 6}
                onClick={() => {
                  if (email && password.length >= 6) {
                    sendOtp();
                  }
                }}
                className={`w-full text-white font-bold rounded-xl py-3.5 transition-colors mt-2 shadow-sm ${password.length >= 6 && !isLoading ? "bg-black hover:bg-gray-900" : "bg-[#BDBDBD] cursor-not-allowed"}`}
              >
                {isLoading ? "กำลังโหลด..." : "ส่งรหัสยืนยัน"}
              </button>
            </div>

            {/* Contact Support Floating Button */}
            <div className="absolute right-6 bottom-6">
              <button className="bg-white shadow-sm border border-gray-100 rounded-full py-2 px-4 flex items-center gap-2 hover:bg-gray-50 transition-colors">
                <Headset size={16} className="text-gray-700" />
                <span className="text-[13px] font-bold text-gray-800">ติดต่อเจ้าหน้าที่</span>
              </button>
            </div>
          </div>
        )}

        {step === "otp" && (
          <div className="flex-1 flex flex-col relative h-full">
            {/* Header Step 3 */}
            <div className="flex items-center justify-center p-6 pb-2 relative">
              <button 
                onClick={() => setStep("password")}
                className="absolute left-6 text-gray-900 p-1 hover:bg-gray-100 rounded-full transition-colors"
                disabled={isLoading}
              >
                <ArrowLeft size={22} strokeWidth={2.5} />
              </button>
              <h2 className="text-[19px] font-black text-gray-900 tracking-tight">ยืนยัน อีเมล ของคุณ</h2>
            </div>

            {/* Body Step 3 */}
            <div className="px-6 flex flex-col mt-4">
              <p className="text-[13px] text-gray-500 mb-6">
                ส่งรหัสยืนยันไปที่ {email} แล้ว
              </p>

              {/* OTP Inputs */}
              <div className="flex gap-2 justify-between">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    disabled={isLoading}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-[14%] aspect-square bg-white border border-gray-200 rounded-xl text-center text-xl font-bold text-gray-900 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 shadow-sm transition-all disabled:bg-gray-50"
                  />
                ))}
              </div>
              
              {errorMsg && <p className="text-red-500 text-xs text-center mt-4">{errorMsg}</p>}

              {/* Resend Timer */}
              <div className="flex justify-end mt-4">
                <button 
                  disabled={timeLeft > 0 || isLoading}
                  onClick={sendOtp}
                  className={`text-[13px] font-medium transition-colors flex gap-1 ${timeLeft > 0 || isLoading ? "text-gray-400 cursor-not-allowed" : "text-primary hover:text-primary/80"}`}
                >
                  {timeLeft > 0 ? (
                    <><span className="text-blue-500">{timeLeft}s</span> ส่งรหัสอีกครั้ง</>
                  ) : (
                    "ส่งรหัสอีกครั้ง"
                  )}
                </button>
              </div>
            </div>

            {/* Contact Support Floating Button */}
            <div className="absolute right-6 bottom-6">
              <button className="bg-white shadow-sm border border-gray-100 rounded-full py-2 px-4 flex items-center gap-2 hover:bg-gray-50 transition-colors">
                <Headset size={16} className="text-gray-700" />
                <span className="text-[13px] font-bold text-gray-800">ติดต่อเจ้าหน้าที่</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
