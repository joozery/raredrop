"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, Send, Search, CheckCheck, X, ArrowLeft, Paperclip, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserData { _id: string; name: string; avatar?: string; email?: string }
interface Conversation {
  _id: string;
  userId: UserData | null;
  subject: string;
  lastMessage: string;
  lastSender: "user" | "admin";
  lastMessageAt: string;
  unreadByAdmin: number;
  status: "open" | "closed";
}
interface ChatMsg {
  _id: string;
  senderRole: "user" | "admin";
  text: string;
  imageUrl?: string;
  resolved?: boolean;
  createdAt: string;
}

export default function AdminChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [activeUser, setActiveUser] = useState<UserData | null>(null);
  const [activeSubject, setActiveSubject] = useState("");
  const [activeStatus, setActiveStatus] = useState<"open" | "closed">("open");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef("");
  const [search, setSearch] = useState("");
  const [pendingImage, setPendingImage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [welcomeMsgInput, setWelcomeMsgInput] = useState("");
  const [caseClosedInput, setCaseClosedInput] = useState("");
  const [caseOpenInput, setCaseOpenInput] = useState("");
  const [contactInput, setContactInput] = useState("");
  const [savingWelcome, setSavingWelcome] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/public-settings")
      .then((r) => r.json())
      .then((d) => {
        setWelcomeMsgInput(d.livechat_welcome_message || "");
        setCaseClosedInput(d.livechat_case_closed_text || "เคสถูกปิดแล้ว");
        setCaseOpenInput(d.livechat_case_open_text || "กำลังดำเนินการ");
        setContactInput(d.livechat_contact_text || "ติดต่อทีมงานได้เลย");
      })
      .catch(() => {});
  }, []);

  const saveWelcomeMsg = async () => {
    setSavingWelcome(true);
    try {
      await Promise.all([
        fetch("/api/admin/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "livechat_welcome_message", value: welcomeMsgInput.trim() }),
        }),
        fetch("/api/admin/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "livechat_case_closed_text", value: caseClosedInput.trim() }),
        }),
        fetch("/api/admin/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "livechat_case_open_text", value: caseOpenInput.trim() }),
        }),
        fetch("/api/admin/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "livechat_contact_text", value: contactInput.trim() }),
        })
      ]);
    } catch {} finally {
      setSavingWelcome(false);
    }
  };

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/chat", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch {}
  }, []);

  const loadMessages = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/admin/chat/${id}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setActiveUser(data.conversation?.userId || null);
        setActiveSubject(data.conversation?.subject || "");
        setActiveStatus(data.conversation?.status || "open");
      }
    } catch {}
  }, []);

  // poll รายการบทสนทนา
  useEffect(() => {
    loadConversations();
    const t = setInterval(loadConversations, 8000);
    return () => clearInterval(t);
  }, [loadConversations]);

  // poll ข้อความของห้องที่เปิดอยู่
  useEffect(() => {
    if (!activeId) return;
    loadMessages(activeId);
    const t = setInterval(() => loadMessages(activeId), 4000);
    return () => clearInterval(t);
  }, [activeId, loadMessages]);

  // เด้งลงล่างเฉพาะตอนเปิดห้องใหม่ หรือผู้ใช้กำลังอยู่ล่างสุดอยู่แล้ว
  // ป้องกัน poll ทุก 4 วิ ดึงจอกลับลงล่างขณะเลื่อนขึ้นดูประวัติ
  const atBottomRef = useRef(true);
  const prevActiveIdRef = useRef<string | null>(null);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (prevActiveIdRef.current !== activeId) {
      prevActiveIdRef.current = activeId;
      atBottomRef.current = true;
      el.scrollTop = el.scrollHeight;
      return;
    }
    if (atBottomRef.current) el.scrollTop = el.scrollHeight;
  }, [messages, activeId]);

  const openConversation = (c: Conversation) => {
    setActiveId(c._id);
    setMessages([]);
    setActiveUser(c.userId);
    setActiveSubject(c.subject);
    setActiveStatus(c.status);
    // optimistic เคลียร์ badge ใน list
    setConversations((prev) => prev.map((x) => x._id === c._id ? { ...x, unreadByAdmin: 0 } : x));
  };

  const handleFileSelect = async (file: File) => {
    setUploadingImage(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", "chat-attachments");
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (res.ok && data.url) setPendingImage(data.url);
    } catch {} finally {
      setUploadingImage(false);
    }
  };

  const send = async () => {
    const text = inputRef.current.trim();
    const image = pendingImage;
    if ((!text && !image) || sending || !activeId) return;
    setSending(true);
    const optimistic: ChatMsg = { _id: `tmp-${messages.length}`, senderRole: "admin", text, imageUrl: image || undefined, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, optimistic]);
    inputRef.current = "";
    setInput("");
    setPendingImage("");
    try {
      const res = await fetch(`/api/admin/chat/${activeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, image: image || undefined }),
      });
      if (res.ok) {
        loadMessages(activeId);
        loadConversations();
      } else {
        setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
        inputRef.current = text;
        setInput(text);
        setPendingImage(image);
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
      inputRef.current = text;
      setInput(text);
      setPendingImage(image);
    } finally {
      setSending(false);
    }
  };

  const toggleMessageResolved = async (messageId: string, resolved: boolean) => {
    if (!activeId) return;
    setMessages((prev) => prev.map((m) => m._id === messageId ? { ...m, resolved } : m));
    try {
      const res = await fetch(`/api/admin/chat/${activeId}/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolved }),
      });
      if (!res.ok) {
        setMessages((prev) => prev.map((m) => m._id === messageId ? { ...m, resolved: !resolved } : m));
      }
    } catch {
      setMessages((prev) => prev.map((m) => m._id === messageId ? { ...m, resolved: !resolved } : m));
    }
  };

  const toggleStatus = async () => {
    if (!activeId) return;
    const next = activeStatus === "open" ? "closed" : "open";
    try {
      const res = await fetch(`/api/admin/chat/${activeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) { setActiveStatus(next); loadConversations(); }
    } catch {}
  };

  const filtered = conversations.filter((c) =>
    (c.userId?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const fmtTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("th-TH", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Live Chat (แชทกับลูกค้า)</h1>
        <p className="text-sm text-slate-500 mt-1">ตอบกลับข้อความจากลูกค้าที่ติดต่อผ่านแชทในเว็บ</p>
      </div>

      {/* Welcome message setting */}
      <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="shrink-0">
            <p className="text-sm font-bold text-slate-700">ข้อความต้อนรับ Livechat</p>
            <p className="text-xs text-slate-400 mt-0.5">แสดงเป็น bubble เมื่อ user เปิดแชทครั้งแรก</p>
          </div>
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={welcomeMsgInput}
              onChange={(e) => setWelcomeMsgInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveWelcomeMsg(); }}
              placeholder="เช่น สวัสดีครับ มีอะไรให้ช่วยไหมครับ?"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/10 font-medium text-slate-700"
            />
            <button
              onClick={saveWelcomeMsg}
              disabled={savingWelcome}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:bg-slate-300 transition-colors shrink-0"
            >
              {savingWelcome ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mt-4">
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-700 mb-1.5">สถานะ: ข้อความติดต่อแชทใหม่</p>
            <input
              type="text"
              value={contactInput}
              onChange={(e) => setContactInput(e.target.value)}
              placeholder="เช่น ติดต่อทีมงานได้เลย"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/10 font-medium text-slate-700"
            />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-700 mb-1.5">สถานะ: กำลังดำเนินการ (Open)</p>
            <input
              type="text"
              value={caseOpenInput}
              onChange={(e) => setCaseOpenInput(e.target.value)}
              placeholder="เช่น กำลังดำเนินการ"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/10 font-medium text-slate-700"
            />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-700 mb-1.5">สถานะ: เคสถูกปิดแล้ว (Closed)</p>
            <input
              type="text"
              value={caseClosedInput}
              onChange={(e) => setCaseClosedInput(e.target.value)}
              placeholder="เช่น เคสถูกปิดแล้ว"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/10 font-medium text-slate-700"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm flex overflow-hidden h-[calc(100vh-220px)] min-h-[480px]">
        {/* Conversation list */}
        <div className={cn("w-full lg:w-80 border-r border-slate-100 flex-col shrink-0", activeId ? "hidden lg:flex" : "flex")}>
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาลูกค้า..."
                className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl pl-9 pr-3 py-2 outline-none focus:border-red-400 font-medium text-slate-700"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm font-medium">ยังไม่มีบทสนทนา</div>
            ) : filtered.map((c) => (
              <button
                key={c._id}
                onClick={() => openConversation(c)}
                className={`w-full text-left px-4 py-3 border-b border-slate-50 flex items-center gap-3 transition-colors ${activeId === c._id ? "bg-red-50" : "hover:bg-slate-50"}`}
              >
                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
                  <img src={c.userId?.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${c.userId?.name || "U"}`} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-slate-800 truncate">{c.userId?.name || "ผู้ใช้ที่ถูกลบ"}</span>
                    <span className="text-[10px] text-slate-400 shrink-0">{fmtTime(c.lastMessageAt)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] font-bold text-slate-600 truncate">{c.subject}</span>
                    {c.status === "closed" && <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded shrink-0">ปิดแล้ว</span>}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="text-xs text-slate-500 truncate">
                      {c.lastSender === "admin" && <span className="text-slate-400">คุณ: </span>}
                      {c.lastMessage || "—"}
                    </span>
                    {c.unreadByAdmin > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {c.unreadByAdmin > 9 ? "9+" : c.unreadByAdmin}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Thread */}
        <div className={cn("flex-1 flex-col min-w-0", activeId ? "flex" : "hidden lg:flex")}>
          {!activeId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-3">
              <MessageCircle size={48} className="opacity-40" />
              <p className="font-medium text-slate-400">เลือกบทสนทนาเพื่อเริ่มตอบกลับ</p>
            </div>
          ) : (
            <>
              <div className="px-3 sm:px-5 py-3 border-b border-slate-100 flex items-center justify-between shrink-0 gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <button onClick={() => setActiveId(null)} className="lg:hidden shrink-0 text-slate-400 hover:text-slate-600 p-1 -ml-1">
                    <ArrowLeft size={18} />
                  </button>
                  <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden shrink-0">
                    <img src={activeUser?.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${activeUser?.name || "U"}`} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-800 truncate">{activeUser?.name || "ผู้ใช้"}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {activeSubject}
                      {activeStatus === "closed" && <span className="ml-1.5 font-bold text-slate-500">· ปิดแล้ว</span>}
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleStatus}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${activeStatus === "open" ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-green-100 text-green-700 hover:bg-green-200"}`}
                >
                  {activeStatus === "open" ? <><X size={13} /> ปิดเคส</> : <><CheckCheck size={13} /> เปิดใหม่</>}
                </button>
              </div>

              <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-3 sm:p-5 flex flex-col gap-2.5 bg-slate-50">
                {messages.map((m) => (
                  <div key={m._id} className={`flex ${m.senderRole === "admin" ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[85%] sm:max-w-[70%] flex flex-col gap-0.5">
                      <div className={`px-3.5 py-2 rounded-2xl text-sm font-medium break-words whitespace-pre-wrap ${m.senderRole === "admin" ? "bg-red-600 text-white rounded-br-sm" : "bg-white text-slate-800 border border-slate-100 rounded-bl-sm shadow-sm"}`}>
                        {m.imageUrl && (
                          <a href={m.imageUrl} target="_blank" rel="noopener noreferrer">
                            <img src={m.imageUrl} alt="" className="w-40 h-40 object-cover rounded-xl mb-2" />
                          </a>
                        )}
                        {m.text}
                      </div>
                      <div className={`flex items-center gap-1.5 ${m.senderRole === "admin" ? "justify-end" : "justify-start"}`}>
                        <span className="text-[10px] text-slate-400">{fmtTime(m.createdAt)}</span>
                        {m.senderRole === "user" && (
                          m.resolved ? (
                            <button
                              onClick={() => toggleMessageResolved(m._id, false)}
                              className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 hover:bg-emerald-100 transition-colors"
                            >
                              ✅ ปิดเคสแล้ว
                            </button>
                          ) : (
                            <button
                              onClick={() => toggleMessageResolved(m._id, true)}
                              className="text-[10px] font-bold text-slate-400 border border-slate-200 rounded-full px-2 py-0.5 hover:bg-slate-100 transition-colors"
                            >
                              ปิดเคสนี้
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 shrink-0">
                {pendingImage && (
                  <div className="px-3 pt-2.5 flex items-center gap-2">
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 shrink-0">
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
                    className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-100 transition-colors shrink-0 disabled:opacity-60"
                  >
                    {uploadingImage ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
                  </button>
                  <textarea
                    value={input}
                    onChange={(e) => {
                      inputRef.current = e.target.value;
                      setInput(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                        (e.target as HTMLTextAreaElement).style.height = "auto";
                      }
                    }}
                    placeholder="พิมพ์ข้อความตอบกลับ..."
                    rows={1}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/10 font-medium text-slate-800 resize-none overflow-y-auto min-h-[42px] max-h-[120px]"
                  />
                  <button
                    onClick={send}
                    disabled={sending || (!input.trim() && !pendingImage)}
                    className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center hover:bg-red-700 disabled:bg-slate-300 transition-colors shrink-0"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
