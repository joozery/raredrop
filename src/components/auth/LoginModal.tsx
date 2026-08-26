import React, { useState, useRef, useEffect } from 'react';
import { Mail, Phone, KeyRound, Eye, EyeOff, X, ArrowLeft } from 'lucide-react';
import { signIn } from "next-auth/react";
import { Turnstile } from "@marsidev/react-turnstile";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = "main" | "password" | "otp" | "phoneOtp";
type LoginMethod = "email" | "phone";

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [step, setStep] = useState<Step>("main");
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("phone");

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<any>(null);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(60);

  const [logoUrl, setLogoUrl] = useState("https://pub-ee29977ae9524b05b628923eee00188a.r2.dev/logo/logo.png");

  useEffect(() => {
    fetch("/api/public-settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (d.site_logo) setLogoUrl(d.site_logo); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if ((step === "otp" || step === "phoneOtp") && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const resetToMain = () => {
    setStep("main");
    setErrorMsg("");
    setTurnstileToken(null);
    turnstileRef.current?.reset();
  };

  const verifyTurnstile = async (): Promise<boolean> => {
    if (!turnstileToken) return false;
    const res = await fetch("/api/admin/verify-turnstile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: turnstileToken }),
    });
    const data = await res.json();
    if (!data.success) {
      setErrorMsg("กรุณายืนยัน CAPTCHA ใหม่อีกครั้ง");
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      return false;
    }
    return true;
  };

  const sendEmailOtp = async () => {
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
    } catch {
      setErrorMsg("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsLoading(false);
    }
  };

  const sendPhoneOtp = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/send-otp-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep("phoneOtp");
        setTimeLeft(60);
        setOtp(["", "", "", "", "", ""]);
      } else {
        setErrorMsg(data.error || "เกิดข้อผิดพลาดในการส่ง OTP");
      }
    } catch {
      setErrorMsg("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = async (index: number, value: string, currentStep: Step) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value !== "" && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    if (index === 5 && value !== "" && newOtp.every((v) => v !== "")) {
      setIsLoading(true);
      setErrorMsg("");
      const fullOtp = newOtp.join("");

      const creds = currentStep === "phoneOtp"
        ? { phone, otp: fullOtp, redirect: false }
        : { email, password, otp: fullOtp, redirect: false };

      const res = await signIn("credentials", creds);
      setIsLoading(false);

      if (res?.error) {
        setErrorMsg(res.error);
        setOtp(["", "", "", "", "", ""]);
        otpRefs.current[0]?.focus();
      } else if (res?.ok) {
        onClose();
        window.location.reload();
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={resetToMain}
      />

      <div className="relative w-full max-w-[420px] bg-[#F8F9FA] rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 sm:fade-in duration-300 pb-safe flex flex-col min-h-[450px]">

        {/* ===== STEP: MAIN ===== */}
        {step === "main" && (
          <>
            <div className="flex items-center justify-center p-6 pb-5 border-b border-gray-100">
              <div className="flex flex-col items-center gap-3">
                <img src={logoUrl} alt="Logo" className="h-10 object-contain drop-shadow-sm" />
                <h2 className="text-xl font-bold text-gray-900">เข้าสู่ระบบ หรือ ลงทะเบียน</h2>
              </div>
            </div>

            <div className="px-6 flex flex-col gap-3">
              {loginMethod === "email" ? (
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
                    <button onClick={() => setEmail("")} className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors shrink-0">
                      <X size={12} className="text-gray-600" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 flex items-center gap-3 shadow-sm focus-within:border-gray-400 transition-colors">
                  <Phone size={18} className="text-gray-500 shrink-0" />
                  <input
                    type="tel"
                    placeholder="กรอกเบอร์โทร (0812345678)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="flex-1 bg-transparent border-none outline-none text-[15px] text-gray-900 placeholder:text-gray-400"
                  />
                  {phone && (
                    <button onClick={() => setPhone("")} className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors shrink-0">
                      <X size={12} className="text-gray-600" />
                    </button>
                  )}
                </div>
              )}

              <div className="flex justify-center">
                <Turnstile
                  ref={turnstileRef}
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                  onSuccess={(token) => setTurnstileToken(token)}
                  onExpire={() => setTurnstileToken(null)}
                  onError={() => setTurnstileToken(null)}
                />
              </div>

              {/* Continue button */}
              {loginMethod === "email" ? (
                <button
                  disabled={!email || !turnstileToken || isLoading}
                  onClick={async () => {
                    if (!email || !turnstileToken) return;
                    setIsLoading(true);
                    setErrorMsg("");
                    try {
                      if (!(await verifyTurnstile())) return;
                      setStep("password");
                      setErrorMsg("");
                    } catch {
                      setErrorMsg("เกิดข้อผิดพลาด กรุณาลองใหม่");
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  className={`w-full text-white font-bold rounded-xl py-3.5 transition-colors mt-1 shadow-sm ${email && turnstileToken && !isLoading ? "bg-black hover:bg-gray-900" : "bg-black/50 cursor-not-allowed"}`}
                >
                  {isLoading ? "กำลังตรวจสอบ..." : "ต่อ"}
                </button>
              ) : (
                <button
                  disabled={phone.length !== 10 || !turnstileToken || isLoading}
                  onClick={async () => {
                    if (phone.length !== 10 || !turnstileToken) return;
                    setIsLoading(true);
                    setErrorMsg("");
                    try {
                      if (!(await verifyTurnstile())) return;
                      await sendPhoneOtp();
                    } catch {
                      setErrorMsg("เกิดข้อผิดพลาด กรุณาลองใหม่");
                      setIsLoading(false);
                    }
                  }}
                  className={`w-full text-white font-bold rounded-xl py-3.5 transition-colors mt-1 shadow-sm ${phone.length === 10 && turnstileToken && !isLoading ? "bg-black hover:bg-gray-900" : "bg-black/50 cursor-not-allowed"}`}
                >
                  {isLoading ? "กำลังส่ง OTP..." : "ส่ง OTP ทาง SMS"}
                </button>
              )}

              {errorMsg && <p className="text-red-500 text-xs text-center">{errorMsg}</p>}

              <div className="flex items-center gap-4 my-2">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-[11px] text-gray-400 font-medium">หรือ</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              <button
                onClick={() => { setLoginMethod(loginMethod === "email" ? "phone" : "email"); setErrorMsg(""); }}
                className="w-full bg-white border border-gray-100 shadow-sm hover:border-gray-400 hover:bg-gray-50 transition-all rounded-xl py-3.5 px-5 flex items-center gap-4 group"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  {loginMethod === "email" ? <Phone size={18} className="text-gray-700" /> : <Mail size={18} className="text-gray-700" />}
                </div>
                <span className="flex-1 text-center font-bold text-gray-800 text-[14px]">
                  {loginMethod === "email" ? "เข้าสู่ระบบด้วยเบอร์โทร" : "เข้าสู่ระบบด้วยอีเมล"}
                </span>
                <div className="w-5" />
              </button>

              <button
                onClick={() => signIn("line", { callbackUrl: "/" })}
                className="w-full bg-white border border-gray-100 shadow-sm hover:border-[#00C300] hover:bg-[#00C300]/5 transition-all rounded-xl py-3.5 px-5 flex items-center gap-4 group"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <img src="/banner/cover/line.svg" alt="Line Logo" className="w-full h-full object-contain" />
                </div>
                <span className="flex-1 text-center font-bold text-gray-800 text-[14px]">เข้าสู่ระบบด้วย Line</span>
                <div className="w-6" />
              </button>

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
                <div className="w-5" />
              </button>
            </div>

            <div className="pb-8"></div>
          </>
        )}

        {/* ===== STEP: PASSWORD (email flow) ===== */}
        {step === "password" && (
          <div className="flex-1 flex flex-col relative h-full">
            <div className="flex items-center justify-center p-6 pb-5 relative">
              <button onClick={() => setStep("main")} className="absolute left-6 text-gray-900 p-1 hover:bg-gray-100 rounded-full transition-colors" disabled={isLoading}>
                <ArrowLeft size={22} strokeWidth={2.5} />
              </button>
              <h2 className="text-xl font-black text-gray-900">ลงทะเบียน</h2>
            </div>

            <div className="px-6 flex flex-col gap-4 mt-2">
              <div className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 flex items-center gap-3 shadow-sm">
                <Mail size={18} className="text-gray-900 shrink-0" strokeWidth={1.5} />
                <input type="email" readOnly value={email} className="flex-1 bg-transparent border-none outline-none text-[15px] text-gray-900" />
              </div>

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
                <button onClick={() => setShowPassword(!showPassword)} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors shrink-0" disabled={isLoading}>
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>

              {errorMsg && <p className="text-red-500 text-xs text-center">{errorMsg}</p>}

              <button
                disabled={isLoading || password.length < 6}
                onClick={() => { if (email && password.length >= 6) sendEmailOtp(); }}
                className={`w-full text-white font-bold rounded-xl py-3.5 transition-colors mt-2 shadow-sm ${password.length >= 6 && !isLoading ? "bg-black hover:bg-gray-900" : "bg-[#BDBDBD] cursor-not-allowed"}`}
              >
                {isLoading ? "กำลังโหลด..." : "ส่งรหัสยืนยัน"}
              </button>
            </div>

            <div className="pb-8"></div>
          </div>
        )}

        {/* ===== STEP: OTP (email) ===== */}
        {step === "otp" && (
          <OtpStep
            title="ยืนยัน อีเมล ของคุณ"
            description={`ส่งรหัสยืนยันไปที่ ${email} แล้ว`}
            otp={otp}
            otpRefs={otpRefs}
            isLoading={isLoading}
            errorMsg={errorMsg}
            timeLeft={timeLeft}
            onBack={() => setStep("password")}
            onChange={(i, v) => handleOtpChange(i, v, "otp")}
            onKeyDown={handleOtpKeyDown}
            onResend={sendEmailOtp}
          />
        )}

        {/* ===== STEP: PHONE OTP ===== */}
        {step === "phoneOtp" && (
          <OtpStep
            title="ยืนยันเบอร์โทรของคุณ"
            description={`ส่งรหัส OTP ไปที่ ${phone} ทาง SMS แล้ว`}
            otp={otp}
            otpRefs={otpRefs}
            isLoading={isLoading}
            errorMsg={errorMsg}
            timeLeft={timeLeft}
            onBack={() => setStep("main")}
            onChange={(i, v) => handleOtpChange(i, v, "phoneOtp")}
            onKeyDown={handleOtpKeyDown}
            onResend={sendPhoneOtp}
          />
        )}

      </div>
    </div>
  );
}

interface OtpStepProps {
  title: string;
  description: string;
  otp: string[];
  otpRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  isLoading: boolean;
  errorMsg: string;
  timeLeft: number;
  onBack: () => void;
  onChange: (index: number, value: string) => void;
  onKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  onResend: () => void;
}

function OtpStep({ title, description, otp, otpRefs, isLoading, errorMsg, timeLeft, onBack, onChange, onKeyDown, onResend }: OtpStepProps) {
  return (
    <div className="flex-1 flex flex-col relative h-full">
      <div className="flex items-center justify-center p-6 pb-2 relative">
        <button onClick={onBack} className="absolute left-6 text-gray-900 p-1 hover:bg-gray-100 rounded-full transition-colors" disabled={isLoading}>
          <ArrowLeft size={22} strokeWidth={2.5} />
        </button>
        <h2 className="text-[19px] font-black text-gray-900 tracking-tight">{title}</h2>
      </div>

      <div className="px-6 flex flex-col mt-4">
        <p className="text-[13px] text-gray-500 mb-6">{description}</p>

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
              onChange={(e) => onChange(idx, e.target.value)}
              onKeyDown={(e) => onKeyDown(idx, e)}
              className="w-[14%] aspect-square bg-white border border-gray-200 rounded-xl text-center text-xl font-bold text-gray-900 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 shadow-sm transition-all disabled:bg-gray-50"
            />
          ))}
        </div>

        {errorMsg && <p className="text-red-500 text-xs text-center mt-4">{errorMsg}</p>}

        <div className="flex justify-end mt-4">
          <button
            disabled={timeLeft > 0 || isLoading}
            onClick={onResend}
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

      <div className="pb-8"></div>
    </div>
  );
}
