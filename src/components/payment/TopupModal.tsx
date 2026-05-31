"use client";

import React, { useState, useRef } from "react";
import { X, Upload, CheckCircle2, AlertCircle, QrCode, ArrowRight } from "lucide-react";
import { useSession } from "next-auth/react";

interface TopupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TopupModal({ isOpen, onClose }: TopupModalProps) {
  const { update } = useSession();
  const [step, setStep] = useState<"amount" | "qrcode">("amount");
  const [amount, setAmount] = useState<number | "">("");
  const [qrImage, setQrImage] = useState<string | null>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setStep("amount");
    setAmount("");
    setQrImage(null);
    setFile(null);
    setPreview(null);
    setStatus("idle");
    setMessage("");
  };

  const handleClose = () => {
    onClose();
    setTimeout(resetState, 300); // delay reset so animation finishes
  };

  const handleGenerateQR = async () => {
    if (!amount || amount <= 0) return;
    
    setIsLoading(true);
    setStatus("idle");
    setMessage("");
    
    try {
      const res = await fetch("/api/user/topup/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount })
      });
      
      const data = await res.json();
      if (res.ok && data.data?.qrImageLink) {
        // Extract the correct field from the Slip2go API response
        setQrImage(data.data.qrImageLink);
        setStep("qrcode");
      } else {
        setStatus("error");
        setMessage(data.message || data.error || "ไม่สามารถสร้าง QR Code ได้");
      }
    } catch (error) {
      setStatus("error");
      setMessage("เกิดข้อผิดพลาดในการเชื่อมต่อระบบ");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setStatus("idle");
      setMessage("");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsLoading(true);
    setStatus("idle");
    setMessage("");

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result;

        const res = await fetch("/api/user/topup/slip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slipBase64: base64data })
        });

        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(`เติมเงินสำเร็จ! ได้รับ ${data.amount} บาท`);
          await update(); // Refresh session to update coins
          setTimeout(() => {
            handleClose();
            window.location.reload(); // Force page refresh to guarantee coin display update
          }, 2000);
        } else {
          setStatus("error");
          setMessage(data.error || "สลิปไม่ถูกต้อง หรือถูกใช้งานไปแล้ว");
        }
        setIsLoading(false);
      };
    } catch (err: any) {
      setStatus("error");
      setMessage("เกิดข้อผิดพลาดในการอัปโหลด");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden relative">
        <div className="bg-gradient-to-r from-red-600 to-red-500 p-5 flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">
            {step === "amount" ? "ระบุจำนวนเงิน" : "สแกนชำระเงิน"}
          </h2>
          <button onClick={handleClose} className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {step === "amount" && (
            <div className="animate-in slide-in-from-right-4 duration-300">
              <div className="mb-6 text-center">
                <p className="text-sm text-slate-500 font-medium">โปรดระบุจำนวนเงินที่ต้องการเติม</p>
                <p className="text-xs text-slate-400 mt-1">ระบบจะสร้าง QR Code ชำระเงินให้คุณ</p>
              </div>

              <div className="relative mb-4">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-red-600 font-black text-xl">฿</div>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value ? parseFloat(e.target.value) : "")}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-10 pr-4 py-4 text-2xl font-black text-slate-800 outline-none focus:border-red-500 focus:bg-white transition-all shadow-sm"
                  placeholder="0.00"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-3 gap-2 mb-6">
                {[50, 100, 150, 300, 500, 1000].map(amt => (
                  <button 
                    key={amt}
                    onClick={() => setAmount(amt)}
                    className="bg-white border border-slate-200 hover:border-red-400 hover:bg-red-50 hover:text-red-600 text-slate-600 font-bold text-sm py-2 rounded-lg transition-colors shadow-sm"
                  >
                    {amt}
                  </button>
                ))}
              </div>

              {status === "error" && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm font-medium px-4 py-3 rounded-lg flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" /> {message}
                </div>
              )}

              <button 
                onClick={handleGenerateQR}
                disabled={!amount || amount <= 0 || isLoading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    กำลังสร้าง QR Code...
                  </>
                ) : (
                  <>
                    <QrCode size={18} />
                    สร้าง QR Code ชำระเงิน
                  </>
                )}
              </button>
            </div>
          )}

          {step === "qrcode" && (
            <div className="animate-in slide-in-from-right-4 duration-300">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col items-center justify-center mb-5">
                <p className="text-slate-500 text-sm font-medium mb-3">สแกน QR Code นี้เพื่อชำระเงิน</p>
                <div className="bg-white p-2 rounded-lg shadow-sm mb-3">
                  {qrImage ? (
                    <img src={qrImage} alt="QR Code" className="w-48 h-48 object-contain" />
                  ) : (
                    <div className="w-48 h-48 bg-slate-100 flex items-center justify-center text-slate-400 text-sm font-bold">QR ERROR</div>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">ยอดที่ต้องชำระ</p>
                  <p className="text-2xl font-black text-red-600">฿{Number(amount).toLocaleString(undefined, {minimumFractionDigits:2})}</p>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-200 pt-5">
                <p className="text-sm font-bold text-slate-700 text-center mb-3">เมื่อชำระเสร็จแล้ว ให้อัปโหลดสลิปที่นี่</p>
                
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                />

                <div 
                  onClick={() => !isLoading && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                    preview ? "border-slate-200 bg-slate-50" : "border-red-200 hover:border-red-400 hover:bg-red-50 bg-slate-50"
                  }`}
                >
                  {preview ? (
                    <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden shadow-sm">
                      <img src={preview} alt="Slip preview" className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-500">
                        <Upload size={20} />
                      </div>
                      <p className="text-sm font-bold text-slate-700">คลิกเพื่อแนบสลิป</p>
                    </>
                  )}
                </div>

                {preview && (
                  <button 
                    onClick={() => { setFile(null); setPreview(null); setStatus("idle"); }}
                    className="text-xs font-bold text-slate-400 hover:text-red-500 w-full text-center mt-2"
                  >
                    เลือกรูปใหม่
                  </button>
                )}
              </div>

              {status === "error" && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-600 text-sm font-medium px-4 py-3 rounded-lg flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" /> {message}
                </div>
              )}

              {status === "success" && (
                <div className="mt-4 bg-green-50 border border-green-200 text-green-700 text-sm font-bold px-4 py-3 rounded-lg flex items-center gap-2">
                  <CheckCircle2 size={16} className="shrink-0" /> {message}
                </div>
              )}

              <button 
                onClick={handleUpload}
                disabled={!file || isLoading || status === "success"}
                className="w-full mt-4 bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    กำลังตรวจสอบ...
                  </>
                ) : status === "success" ? (
                  "เติมเงินสำเร็จ!"
                ) : (
                  "แจ้งชำระเงิน"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
