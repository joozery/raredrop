"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, Send, Search, CheckCheck, X } from "lucide-react";

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
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const openConversation = (c: Conversation) => {
    setActiveId(c._id);
    setMessages([]);
    setActiveUser(c.userId);
    setActiveSubject(c.subject);
    setActiveStatus(c.status);
    // optimistic เคลียร์ badge ใน list
    setConversations((prev) => prev.map((x) => x._id === c._id ? { ...x, unreadByAdmin: 0 } : x));
  };

  const send = async () => {
    const text = input.trim();
    if (!text || sending || !activeId) return;
    setSending(true);
    const optimistic: ChatMsg = { _id: `tmp-${messages.length}`, senderRole: "admin", text, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    try {
      const res = await fetch(`/api/admin/chat/${activeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        loadMessages(activeId);
        loadConversations();
      } else {
        setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
        setInput(text);
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
      setInput(text);
    } finally {
      setSending(false);
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
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Live Chat (แชทกับลูกค้า)</h1>
        <p className="text-sm text-slate-500 mt-1">ตอบกลับข้อความจากลูกค้าที่ติดต่อผ่านแชทในเว็บ</p>
      </div>

      <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm flex overflow-hidden h-[calc(100vh-220px)] min-h-[480px]">
        {/* Conversation list */}
        <div className="w-80 border-r border-slate-100 flex flex-col shrink-0">
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
        <div className="flex-1 flex flex-col min-w-0">
          {!activeId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-3">
              <MessageCircle size={48} className="opacity-40" />
              <p className="font-medium text-slate-400">เลือกบทสนทนาเพื่อเริ่มตอบกลับ</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden">
                    <img src={activeUser?.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${activeUser?.name || "U"}`} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-800">{activeUser?.name || "ผู้ใช้"}</p>
                    <p className="text-[11px] text-slate-400">
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

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 flex flex-col gap-2.5 bg-slate-50">
                {messages.map((m) => (
                  <div key={m._id} className={`flex ${m.senderRole === "admin" ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[70%] flex flex-col gap-0.5">
                      <div className={`px-3.5 py-2 rounded-2xl text-sm font-medium break-words ${m.senderRole === "admin" ? "bg-red-600 text-white rounded-br-sm" : "bg-white text-slate-800 border border-slate-100 rounded-bl-sm shadow-sm"}`}>
                        {m.text}
                      </div>
                      <span className={`text-[10px] text-slate-400 ${m.senderRole === "admin" ? "text-right" : "text-left"}`}>{fmtTime(m.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 border-t border-slate-100 flex items-center gap-2 shrink-0">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder="พิมพ์ข้อความตอบกลับ..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/10 font-medium text-slate-800"
                />
                <button
                  onClick={send}
                  disabled={sending || !input.trim()}
                  className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center hover:bg-red-700 disabled:bg-slate-300 transition-colors shrink-0"
                >
                  <Send size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
