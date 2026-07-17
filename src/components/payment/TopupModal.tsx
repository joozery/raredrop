"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Upload, CheckCircle2, AlertCircle, QrCode, Wallet, ExternalLink, RefreshCw, Gem, Link } from "lucide-react";
import { useSession } from "next-auth/react";

interface TopupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POLL_INTERVAL_MS = 5000;
const POLL_MAX_ATTEMPTS = 60; // ~5 นาที

const NETWORK_LABELS: Record<string, string> = { eth: "ETH", bsc: "BNB", polygon: "MATIC" };
const NETWORK_NAMES: Record<string, string> = {
  eth: "Ethereum Mainnet",
  bsc: "BNB Smart Chain",
  polygon: "Polygon",
};

export function TopupModal({ isOpen, onClose }: TopupModalProps) {
  const { update } = useSession();
  const [method, setMethod] = useState<"promptpay" | "truemoney" | "crypto">("promptpay");
  const [step, setStep] = useState<"amount" | "qrcode" | "truemoney" | "crypto">("amount");
  const [amount, setAmount] = useState<number | "">("");
  const [qrImage, setQrImage] = useState<string | null>(null);

  const [tmnUrl, setTmnUrl] = useState<string | null>(null);
  const [tmnRequestId, setTmnRequestId] = useState<string | null>(null);
  const [tmnAmount, setTmnAmount] = useState<number | null>(null);
  const [minTopup, setMinTopup] = useState(1);

  // Crypto / MetaMask state
  const [cryptoEnabled, setCryptoEnabled] = useState(false);
  const [cryptoWalletAddress, setCryptoWalletAddress] = useState("");
  const [cryptoNetwork, setCryptoNetwork] = useState("eth");
  const [cryptoRatePerUnit, setCryptoRatePerUnit] = useState(1);
  const [cryptoUserAddress, setCryptoUserAddress] = useState<string | null>(null);
  const [cryptoTxHash, setCryptoTxHash] = useState<string | null>(null);
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollAttempts = useRef(0);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error" | "pending">("idle");
  const [message, setMessage] = useState("");
  // กันลูกค้าโอนเงินแล้วปิดหน้าต่างโดยลืมแนบสลิป — ต้องยืนยันก่อนปิด
  const [confirmClose, setConfirmClose] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopPolling = () => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  };

  useEffect(() => {
    fetch("/api/public-settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.min_topup_amount) setMinTopup(Number(d.min_topup_amount));
        setCryptoEnabled(d.crypto_enabled === true || d.crypto_enabled === "true");
        if (d.crypto_wallet_address) setCryptoWalletAddress(d.crypto_wallet_address);
        if (d.crypto_network) setCryptoNetwork(d.crypto_network);
        if (d.crypto_rate_per_unit) setCryptoRatePerUnit(Number(d.crypto_rate_per_unit) || 1);
      })
      .catch(() => {});
  }, []);

  // เช็คอัตโนมัติเป็นระยะตอนอยู่หน้า TrueMoney — ลูกค้าไม่ต้องกดตรวจสอบเอง
  useEffect(() => {
    if (step !== "truemoney" || !tmnRequestId) return;

    pollAttempts.current = 0;
    setPollTimedOut(false);

    const check = async () => {
      pollAttempts.current += 1;
      try {
        const res = await fetch("/api/user/topup/truemoney/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestId: tmnRequestId }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          stopPolling();
          setStatus("success");
          setMessage(`เติมเงินสำเร็จ! ได้รับ ${data.amount} บาท`);
          await update();
          setTimeout(() => {
            handleClose();
            window.location.reload();
          }, 2000);
          return;
        }
      } catch {
        // เงียบไว้ — ลองใหม่ในรอบถัดไป
      }
      if (pollAttempts.current >= POLL_MAX_ATTEMPTS) {
        stopPolling();
        setPollTimedOut(true);
      }
    };

    check();
    pollTimer.current = setInterval(check, POLL_INTERVAL_MS);
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, tmnRequestId, retryKey]);

  // Poll for crypto TX confirmation after user sends
  useEffect(() => {
    if (step !== "crypto" || !cryptoTxHash) return;

    pollAttempts.current = 0;
    setPollTimedOut(false);

    const check = async () => {
      pollAttempts.current += 1;
      try {
        const res = await fetch("/api/user/topup/crypto", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ txHash: cryptoTxHash }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          stopPolling();
          setStatus("success");
          setMessage(`เติมเงินสำเร็จ! ได้รับ ${data.amount} บาท`);
          await update();
          setTimeout(() => {
            handleClose();
            window.location.reload();
          }, 2000);
          return;
        }
      } catch {}
      if (pollAttempts.current >= POLL_MAX_ATTEMPTS) {
        stopPolling();
        setPollTimedOut(true);
      }
    };

    check();
    pollTimer.current = setInterval(check, POLL_INTERVAL_MS);
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, cryptoTxHash, retryKey]);

  const handleRetryPolling = () => {
    setPollTimedOut(false);
    setRetryKey((k) => k + 1);
  };

  if (!isOpen) return null;

  const resetState = () => {
    stopPolling();
    setMethod("promptpay");
    setStep("amount");
    setAmount("");
    setQrImage(null);
    setTmnUrl(null);
    setTmnRequestId(null);
    setTmnAmount(null);
    setPollTimedOut(false);
    setFile(null);
    setPreview(null);
    setStatus("idle");
    setMessage("");
    setConfirmClose(false);
    setCryptoUserAddress(null);
    setCryptoTxHash(null);
  };

  const connectMetaMask = async () => {
    const eth = (window as any).ethereum;
    if (!eth?.isMetaMask) {
      setStatus("error");
      setMessage("ไม่พบ MetaMask — กรุณาติดตั้งส่วนเสริม MetaMask ในเบราว์เซอร์ก่อน");
      return;
    }
    try {
      setIsLoading(true);
      setStatus("idle");
      const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
      setCryptoUserAddress(accounts[0] ?? null);
    } catch (err: any) {
      setStatus("error");
      if (err.code === 4001) {
        setMessage("คุณปฏิเสธการเชื่อมต่อ MetaMask");
      } else if (err.code === -32002) {
        setMessage("MetaMask กำลังรอการยืนยัน — กรุณาเปิด MetaMask แล้วอนุมัติ");
      } else {
        setMessage("ไม่สามารถเชื่อมต่อ MetaMask: " + (err.message || "Unknown error"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const sendCryptoPayment = async () => {
    if (!cryptoUserAddress || !amount || !cryptoWalletAddress || cryptoRatePerUnit <= 0) return;
    const eth = (window as any).ethereum;
    if (!eth) return;

    const nativeAmount = Number(amount) / cryptoRatePerUnit;
    const weiHex = "0x" + BigInt(Math.round(nativeAmount * 1e18)).toString(16);

    try {
      setIsLoading(true);
      setStatus("pending");
      setMessage("กำลังรอการยืนยันจาก MetaMask...");

      const txHash = (await eth.request({
        method: "eth_sendTransaction",
        params: [{ from: cryptoUserAddress, to: cryptoWalletAddress, value: weiHex }],
      })) as string;

      setCryptoTxHash(txHash);
      setMessage("ส่งรายการโอนแล้ว กำลังรอยืนยันบน Blockchain...");
    } catch (err: any) {
      setStatus("error");
      if (err.code === 4001) {
        setMessage("คุณปฏิเสธรายการโอน");
      } else {
        setMessage("เกิดข้อผิดพลาด: " + (err.message || "Unknown error"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const forceClose = () => {
    setConfirmClose(false);
    onClose();
    setTimeout(resetState, 300); // delay reset so animation finishes
  };

  const handleClose = () => {
    // อยู่หน้า QR แต่ยังแจ้งชำระไม่สำเร็จ — ถามยืนยันก่อน กันลืมแนบสลิปทั้งที่โอนเงินไปแล้ว
    if (step === "qrcode" && status !== "success") {
      setConfirmClose(true);
      return;
    }
    forceClose();
  };

  const handleGenerateQR = async () => {
    if (!amount || amount < minTopup) return;

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

  const handleRequestTrueMoney = async () => {
    if (!amount || amount < minTopup) return;

    setIsLoading(true);
    setStatus("idle");
    setMessage("");

    try {
      const res = await fetch("/api/user/topup/truemoney/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setTmnUrl(data.url);
        setTmnRequestId(data.requestId);
        setTmnAmount(data.amount);
        setStep("truemoney");
      } else {
        setStatus("error");
        setMessage(data.error || "ไม่สามารถสร้างลิงก์ชำระเงิน TrueMoney ได้");
      }
    } catch {
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
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden relative flex flex-col max-h-[90vh]">
        {confirmClose && (
          <div className="absolute inset-0 z-20 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center p-5 animate-in fade-in duration-150">
            <div className="bg-white rounded-xl shadow-xl p-5 w-full">
              <div className="flex items-center gap-2 text-amber-600 font-bold text-sm mb-2">
                <AlertCircle size={18} className="shrink-0" /> คุณยังไม่ได้แนบสลิป
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                ถ้าโอนเงินแล้ว ต้องแนบสลิปและกด &quot;แจ้งชำระเงิน&quot; ระบบถึงจะเติมเงินให้
                — ปิดหน้าต่างตอนนี้ยอดเงินจะยังไม่เข้า
              </p>
              <button
                onClick={() => setConfirmClose(false)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 text-sm mb-2"
              >
                <Upload size={15} /> กลับไปแนบสลิป
              </button>
              <button
                onClick={forceClose}
                className="w-full text-slate-400 hover:text-slate-600 font-bold py-2 rounded-xl transition-colors text-xs"
              >
                ยังไม่ได้โอนเงิน — ปิดหน้าต่าง
              </button>
            </div>
          </div>
        )}
        <div className="bg-gradient-to-r from-red-600 to-red-500 p-5 flex items-center justify-between shrink-0">
          <h2 className="text-white font-bold text-lg">
            {step === "amount" ? "ระบุจำนวนเงิน"
              : step === "qrcode" ? "สแกนชำระเงิน"
              : step === "crypto" ? "ชำระผ่าน MetaMask"
              : "ชำระผ่าน TrueMoney"}
          </h2>
          <button onClick={handleClose} className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 md:p-6 overflow-y-auto">
          {step === "amount" && (
            <div className="animate-in slide-in-from-right-4 duration-300">
              <div className={`grid gap-2 mb-5 ${cryptoEnabled ? "grid-cols-3" : "grid-cols-2"}`}>
                <button
                  onClick={() => setMethod("promptpay")}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold border transition-all ${method === "promptpay" ? "bg-red-600 text-white border-red-600" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}
                >
                  <QrCode size={15} /> พร้อมเพย์
                </button>
                <button
                  onClick={() => setMethod("truemoney")}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold border transition-all ${method === "truemoney" ? "bg-red-600 text-white border-red-600" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}
                >
                  <Wallet size={15} /> TrueMoney
                </button>
                {cryptoEnabled && (
                  <button
                    onClick={() => setMethod("crypto")}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold border transition-all ${method === "crypto" ? "bg-red-600 text-white border-red-600" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}
                  >
                    <Gem size={15} /> Crypto
                  </button>
                )}
              </div>

              <div className="mb-6 text-center">
                <p className="text-sm text-slate-500 font-medium">โปรดระบุจำนวนเงินที่ต้องการเติม (ขั้นต่ำ {minTopup} บาท)</p>
                <p className="text-xs text-slate-400 mt-1">
                  {method === "promptpay"
                    ? "ระบบจะสร้าง QR Code ชำระเงินให้คุณ"
                    : method === "truemoney"
                    ? "ระบบจะเปิดแอป TrueMoney ให้ชำระเงิน"
                    : `โอน ${NETWORK_LABELS[cryptoNetwork] ?? "Crypto"} ผ่าน MetaMask (${NETWORK_NAMES[cryptoNetwork] ?? cryptoNetwork})`}
                </p>
                {method === "crypto" && cryptoRatePerUnit > 0 && amount && Number(amount) >= minTopup && (
                  <p className="text-xs text-indigo-600 font-bold mt-1">
                    ≈ {(Number(amount) / cryptoRatePerUnit).toFixed(6)} {NETWORK_LABELS[cryptoNetwork] ?? "Crypto"}
                  </p>
                )}
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
                onClick={
                  method === "promptpay"
                    ? handleGenerateQR
                    : method === "truemoney"
                    ? handleRequestTrueMoney
                    : () => { setStep("crypto"); if (!cryptoUserAddress) connectMetaMask(); }
                }
                disabled={!amount || amount < minTopup || isLoading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {method === "promptpay" ? "กำลังสร้าง QR Code..." : method === "truemoney" ? "กำลังสร้างลิงก์..." : "กำลังเชื่อมต่อ..."}
                  </>
                ) : method === "promptpay" ? (
                  <><QrCode size={18} /> สร้าง QR Code ชำระเงิน</>
                ) : method === "truemoney" ? (
                  <><Wallet size={18} /> สร้างลิงก์ชำระผ่าน TrueMoney</>
                ) : (
                  <><Gem size={18} /> ดำเนินการชำระผ่าน MetaMask</>
                )}
              </button>
            </div>
          )}

          {step === "qrcode" && (
            <div className="animate-in slide-in-from-right-4 duration-300">
              <div className="bg-slate-50 border border-slate-200 p-3 md:p-4 rounded-xl flex flex-col items-center justify-center mb-4">
                <p className="text-slate-500 text-sm font-medium mb-2">สแกน QR Code นี้เพื่อชำระเงิน</p>
                <div className="bg-white p-2 rounded-lg shadow-sm mb-2">
                  {qrImage ? (
                    <img src={qrImage} alt="QR Code" className="w-40 h-40 md:w-48 md:h-48 object-contain" />
                  ) : (
                    <div className="w-40 h-40 md:w-48 md:h-48 bg-slate-100 flex items-center justify-center text-slate-400 text-sm font-bold">QR ERROR</div>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">ยอดที่ต้องชำระ</p>
                  <p className="text-2xl font-black text-red-600 leading-none mt-1">฿{Number(amount).toLocaleString(undefined, {minimumFractionDigits:2})}</p>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-200 pt-4">
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
                  className={`border-2 border-dashed rounded-xl p-3 md:p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
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

          {step === "truemoney" && (
            <div className="animate-in slide-in-from-right-4 duration-300">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col items-center justify-center mb-5 gap-3">
                <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                  <Wallet size={26} />
                </div>
                <div className="text-center">
                  <p className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">โอนให้ตรงยอดนี้</p>
                  <p className="text-2xl font-black text-red-600">
                    ฿{(tmnAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <a
                  href={tmnUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 text-sm"
                >
                  <ExternalLink size={16} /> เปิดแอป TrueMoney เพื่อชำระเงิน
                </a>
              </div>

              <div className="border-t border-dashed border-slate-200 pt-5">
                {status === "success" ? (
                  <div className="bg-green-50 border border-green-200 text-green-700 text-sm font-bold px-4 py-3 rounded-lg flex items-center gap-2">
                    <CheckCircle2 size={16} className="shrink-0" /> {message}
                  </div>
                ) : pollTimedOut ? (
                  <>
                    <div className="mb-3 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium px-4 py-3 rounded-lg flex items-center gap-2">
                      <AlertCircle size={16} className="shrink-0" /> ยังไม่พบรายการโอนของคุณ ตรวจสอบว่าโอนเงินแล้วและลองใหม่อีกครั้ง
                    </div>
                    <button
                      onClick={handleRetryPolling}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={16} /> ตรวจสอบอีกครั้ง
                    </button>
                  </>
                ) : (
                  <div className="flex items-center justify-center gap-2.5 py-3 text-sm font-bold text-slate-500">
                    <div className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin shrink-0" />
                    กำลังรอตรวจสอบการชำระเงินอัตโนมัติ...
                  </div>
                )}
              </div>
            </div>
          )}

          {step === "crypto" && (
            <div className="animate-in slide-in-from-right-4 duration-300">

              {/* Wallet connection */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 shrink-0">
                    <Link size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 font-medium">กระเป๋า MetaMask ของคุณ</p>
                    {cryptoUserAddress ? (
                      <p className="text-xs font-bold text-indigo-700 truncate">{cryptoUserAddress}</p>
                    ) : (
                      <p className="text-xs text-slate-400">ยังไม่ได้เชื่อมต่อ</p>
                    )}
                  </div>
                  {!cryptoUserAddress && (
                    <button
                      onClick={connectMetaMask}
                      disabled={isLoading}
                      className="shrink-0 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      {isLoading ? "..." : "เชื่อมต่อ"}
                    </button>
                  )}
                </div>

                {/* Transfer details */}
                <div className="bg-white border border-slate-100 rounded-lg p-3 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">จำนวนเงิน</span>
                    <span className="font-black text-slate-800">฿{Number(amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">จำนวน {NETWORK_LABELS[cryptoNetwork] ?? "Crypto"} ที่ต้องโอน</span>
                    <span className="font-black text-indigo-700">
                      {cryptoRatePerUnit > 0
                        ? (Number(amount) / cryptoRatePerUnit).toFixed(6)
                        : "–"} {NETWORK_LABELS[cryptoNetwork] ?? ""}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">เครือข่าย</span>
                    <span className="font-bold text-slate-700">{NETWORK_NAMES[cryptoNetwork] ?? cryptoNetwork}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">ปลายทาง</span>
                    <span className="font-mono text-[10px] text-slate-600 max-w-[140px] truncate">{cryptoWalletAddress || "ยังไม่ได้ตั้งค่า"}</span>
                  </div>
                </div>
              </div>

              {/* Status messages */}
              {status === "error" && (
                <div className="mb-3 bg-red-50 border border-red-200 text-red-600 text-sm font-medium px-4 py-3 rounded-lg flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" /> {message}
                </div>
              )}
              {status === "success" && (
                <div className="mb-3 bg-green-50 border border-green-200 text-green-700 text-sm font-bold px-4 py-3 rounded-lg flex items-center gap-2">
                  <CheckCircle2 size={16} className="shrink-0" /> {message}
                </div>
              )}

              {/* Confirmation polling */}
              {cryptoTxHash && status !== "success" && status !== "error" && (
                <div className="mb-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-xs text-slate-500 font-medium flex items-center gap-2 mb-3">
                    <span className="font-bold text-slate-700">TX:</span>
                    <span className="font-mono truncate">{cryptoTxHash}</span>
                  </div>
                  {pollTimedOut ? (
                    <>
                      <div className="mb-3 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium px-4 py-3 rounded-lg flex items-center gap-2">
                        <AlertCircle size={16} className="shrink-0" /> TX ยังไม่ยืนยัน — ตรวจสอบว่าโอนสำเร็จแล้วและลองอีกครั้ง
                      </div>
                      <button
                        onClick={handleRetryPolling}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                      >
                        <RefreshCw size={16} /> ตรวจสอบอีกครั้ง
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center justify-center gap-2.5 py-3 text-sm font-bold text-slate-500">
                      <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin shrink-0" />
                      กำลังรอยืนยันบน Blockchain...
                    </div>
                  )}
                </div>
              )}

              {/* Send button (shown only before TX is sent) */}
              {!cryptoTxHash && status !== "success" && (
                <button
                  onClick={sendCryptoPayment}
                  disabled={!cryptoUserAddress || !cryptoWalletAddress || isLoading || status === "pending"}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  {isLoading || status === "pending" ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {status === "pending" ? "กำลังรอ MetaMask..." : "กำลังโหลด..."}
                    </>
                  ) : (
                    <>
                      <Gem size={18} />
                      โอน {cryptoRatePerUnit > 0 ? (Number(amount) / cryptoRatePerUnit).toFixed(6) : ""} {NETWORK_LABELS[cryptoNetwork] ?? "Crypto"} ผ่าน MetaMask
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
