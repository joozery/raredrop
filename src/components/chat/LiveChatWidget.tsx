"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { MessageCircle, X, Send, ChevronLeft, Paperclip, Loader2 } from "lucide-react";

interface ChatMsg {
  _id: string;
  senderRole: "user" | "admin";
  text: string;
  imageUrl?: string;
  createdAt: string;
}
interface Conversation {
  _id: string;
  subject: string;
  lastMessage: string;
  lastSender: "user" | "admin";
  lastMessageAt: string;
  unreadByUser: number;
  status: "open" | "closed";
}

export function LiveChatWidget() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [openCases, setOpenCases] = useState(0);

  // มุมมอง: รายการเคส หรือ ในเคส
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [activeSubject, setActiveSubject] = useState("");
  const [activeStatus, setActiveStatus] = useState<"open" | "closed">("open");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingImage, setPendingImage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/user/chat", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch {}
  }, []);

  const loadUnread = useCallback(async () => {
    try {
      const res = await fetch("/api/user/chat?countOnly=1", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUnread(data.unread || 0);
        setOpenCases(data.openCases || 0);
      }
    } catch {}
  }, []);

  const loadMessages = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/user/chat/${id}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setActiveSubject(data.subject || "");
        setActiveStatus(data.status || "open");
      }
    } catch {}
  }, []);

  // เปิด widget จากที่อื่น (popup ขอรับของจริง) — เปิดตรงเข้าเคสที่ระบุ
  useEffect(() => {
    const handler = (e: Event) => {
      const cid = (e as CustomEvent).detail?.conversationId;
      setOpen(true);
      if (cid) setActiveId(cid);
    };
    window.addEventListener("open-livechat", handler as EventListener);
    return () => window.removeEventListener("open-livechat", handler as EventListener);
  }, []);

  // poll unread เมื่อปิด panel
  useEffect(() => {
    if (!session || open) return;
    loadUnread();
    const t = setInterval(loadUnread, 15000);
    return () => clearInterval(t);
  }, [session, open, loadUnread]);

  // เมื่อเปิด panel และอยู่หน้ารายการ → โหลด+poll รายการเคส
  useEffect(() => {
    if (!open || activeId) return;
    loadConversations();
    const t = setInterval(loadConversations, 8000);
    return () => clearInterval(t);
  }, [open, activeId, loadConversations]);

  // เมื่ออยู่ในเคส → โหลด+poll ข้อความ
  useEffect(() => {
    if (!open || !activeId) return;
    loadMessages(activeId);
    const t = setInterval(() => loadMessages(activeId), 4000);
    return () => clearInterval(t);
  }, [open, activeId, loadMessages]);

  useEffect(() => {
    if (activeId && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, activeId]);

  const openCase = (id: string) => {
    setActiveId(id);
    setMessages([]);
    setConversations((prev) => prev.map((c) => c._id === id ? { ...c, unreadByUser: 0 } : c));
  };

  const backToList = () => {
    setActiveId(null);
    setMessages([]);
    loadConversations();
    loadUnread();
  };

  const handleFileSelect = async (file: File) => {
    setUploadingImage(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/user/chat/upload", { method: "POST", body: form });
      const data = await res.json();
      if (res.ok && data.url) setPendingImage(data.url);
    } catch {} finally {
      setUploadingImage(false);
    }
  };

  const send = async () => {
    const text = input.trim();
    const image = pendingImage;
    if ((!text && !image) || sending || !activeId || activeStatus === "closed") return;
    setSending(true);
    const optimistic: ChatMsg = { _id: `tmp-${messages.length}`, senderRole: "user", text, imageUrl: image || undefined, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    setPendingImage("");
    try {
      const res = await fetch(`/api/user/chat/${activeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, image: image || undefined }),
      });
      if (res.ok) {
        loadMessages(activeId);
      } else {
        setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
        setInput(text);
        setPendingImage(image);
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
      setInput(text);
      setPendingImage(image);
    } finally {
      setSending(false);
    }
  };

  const fmtTime = (iso: string) => new Date(iso).toLocaleString("th-TH", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  if (!session) return null;

  return (
    <>
      {/* Floating button — โชว์เฉพาะเมื่อมีเคสที่ยังเปิด หรือมีข้อความที่ยังไม่อ่าน */}
      {!open && (openCases > 0 || unread > 0) && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-40 w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-500/30 flex items-center justify-center transition-colors"
          aria-label="Live Chat"
        >
          <MessageCircle size={24} />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-white text-red-600 text-[11px] font-black flex items-center justify-center border-2 border-red-600">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 h-[70vh] sm:h-[520px] max-h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              {activeId ? (
                <button onClick={backToList} className="p-1 -ml-1 rounded-full hover:bg-white/20 transition-colors shrink-0">
                  <ChevronLeft size={18} />
                </button>
              ) : (
                <MessageCircle size={18} className="shrink-0" />
              )}
              <div className="min-w-0">
                <p className="font-bold text-sm leading-tight truncate">{activeId ? (activeSubject || "แชท") : "ศูนย์ช่วยเหลือ"}</p>
                <p className="text-[11px] text-red-100 truncate">{activeId ? (activeStatus === "closed" ? "เคสถูกปิดแล้ว" : "กำลังดำเนินการ") : "เคสทั้งหมดของคุณ"}</p>
              </div>
            </div>
            <button onClick={() => { setOpen(false); setActiveId(null); }} className="p-1 rounded-full hover:bg-white/20 transition-colors shrink-0">
              <X size={18} />
            </button>
          </div>

          {/* รายการเคส */}
          {!activeId ? (
            <>
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 gap-2 p-6">
                    <MessageCircle size={36} className="opacity-30" />
                    <p className="text-sm font-medium">ยังไม่มีเคส</p>
                    <p className="text-xs">เคสจะถูกสร้างเมื่อคุณกด “รับ item” แล้วเลือกแชทกับทีมงาน</p>
                  </div>
                ) : (
                  conversations.map((c) => (
                    <button
                      key={c._id}
                      onClick={() => openCase(c._id)}
                      className="w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors flex items-start gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-gray-800 truncate">{c.subject}</span>
                          {c.status === "closed" && <span className="text-[9px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded shrink-0">ปิดแล้ว</span>}
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {c.lastSender === "admin" && <span className="text-gray-400">ทีมงาน: </span>}
                          {c.lastMessage || "—"}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[10px] text-gray-400">{fmtTime(c.lastMessageAt)}</span>
                        {c.unreadByUser > 0 && (
                          <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                            {c.unreadByUser > 9 ? "9+" : c.unreadByUser}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              {/* ข้อความในเคส */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5 bg-gray-50">
                {messages.map((m) => (
                  <div key={m._id} className={`flex ${m.senderRole === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-sm font-medium break-words whitespace-pre-wrap ${
                        m.senderRole === "user"
                          ? "bg-red-600 text-white rounded-br-sm"
                          : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-sm"
                      }`}
                    >
                      {m.imageUrl && (
                        <img src={m.imageUrl} alt="" className="w-32 h-32 object-cover rounded-xl mb-2" />
                      )}
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input หรือ แจ้งเคสปิด */}
              {activeStatus === "closed" ? (
                <div className="p-3 border-t border-gray-100 shrink-0">
                  <p className="text-xs text-center text-gray-500">เคสนี้ถูกปิดแล้ว — หากต้องการสอบถามเพิ่มเติม กรุณาขอรับไอเทมใหม่อีกครั้ง</p>
                </div>
              ) : (
                <div className="border-t border-gray-100 shrink-0 bg-white">
                  {pendingImage && (
                    <div className="p-2.5 pb-0 flex items-center gap-2">
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                        <img src={pendingImage} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => setPendingImage("")}
                          className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 text-white flex items-center justify-center"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="p-3 flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file);
                        e.target.value = "";
                      }}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 flex items-center justify-center hover:bg-gray-100 transition-colors shrink-0 disabled:opacity-60"
                    >
                      {uploadingImage ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
                    </button>
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                      placeholder="พิมพ์ข้อความ..."
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/10 font-medium text-gray-800"
                    />
                    <button
                      onClick={send}
                      disabled={sending || (!input.trim() && !pendingImage)}
                      className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center hover:bg-red-700 disabled:bg-gray-300 transition-colors shrink-0"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
