"use client";

import { useEffect, useState } from "react";
import { X, Copy, Check } from "lucide-react";

function detectInAppBrowser(ua: string): string | null {
  if (/FBAN|FBAV|FB_IAB|FBIOS/i.test(ua)) return "Facebook";
  if (/MessengerForiOS|MessengerLiteForiOS/i.test(ua)) return "Messenger";
  if (/Instagram/i.test(ua)) return "Instagram";
  if (/Line\//i.test(ua)) return "Line";
  if (/musical_ly|TikTok|BytedanceWebview/i.test(ua)) return "TikTok";
  return null;
}

export function InAppBrowserWarning() {
  const [appName, setAppName] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("inapp_warning_dismissed")) return;
    const detected = detectInAppBrowser(navigator.userAgent);
    if (detected) {
      setAppName(detected);
      // ให้ mount ที่ translate-y ปิดก่อน แล้วค่อยเลื่อนลงมาเป็น slide-down animation
      requestAnimationFrame(() => setShown(true));
    }
  }, []);

  if (!appName) return null;

  const dismiss = () => {
    sessionStorage.setItem("inapp_warning_dismissed", "1");
    setShown(false);
    setTimeout(() => setAppName(null), 300);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] flex justify-center px-3 pt-3 pointer-events-none">
      <div
        className={`bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-sm w-full overflow-hidden relative pointer-events-auto transition-all duration-300 ease-out ${
          shown ? "translate-y-0 opacity-100" : "-translate-y-[130%] opacity-0"
        }`}
      >
        <button onClick={dismiss} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 z-10">
          <X size={20} />
        </button>
        <div className="p-5 pt-6 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚠️</span>
            <h2 className="font-black text-gray-900 text-base">กรุณาเปิดผ่านเบราว์เซอร์หลัก</h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            การใช้งานผ่าน {appName} อาจทำให้ระบบทำงานไม่สมบูรณ์
          </p>
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5 flex flex-col gap-2">
            <p className="text-xs font-bold text-gray-700">วิธีเปิดในเบราว์เซอร์:</p>
            <ol className="text-xs text-gray-600 leading-relaxed list-decimal list-inside flex flex-col gap-1">
              <li>แตะสัญลักษณ์จุดไข่ปลา (...) มุมขวาบน</li>
              <li>เลือก &quot;เปิดในเบราว์เซอร์&quot; หรือ &quot;Open in browser&quot;</li>
            </ol>
          </div>
          <button
            onClick={copyLink}
            className="flex items-center justify-center gap-2 w-full bg-gray-900 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-gray-800 transition-colors"
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? "คัดลอกลิงก์แล้ว" : "คัดลอกลิงก์"}
          </button>
          <button onClick={dismiss} className="text-xs text-gray-400 hover:text-gray-600 text-center">
            ใช้งานต่อ (ไม่แนะนำ)
          </button>
        </div>
      </div>
    </div>
  );
}
