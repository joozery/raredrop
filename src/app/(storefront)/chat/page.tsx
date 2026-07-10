"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { MessageCircle, X, Send, ChevronLeft, Paperclip, Loader2, Info } from "lucide-react";
import { useRouter } from "next/navigation";

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

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [activeSubject, setActiveSubject] = useState("");
  const [activeStatus, setActiveStatus] = useState<"open" | "closed">("open");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingImage, setPendingImage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newChatText, setNewChatText] = useState("");
  const [startingChat, setStartingChat] = useState(false);
  const [welcomeMsg, setWelcomeMsg] = useState("");
  const [caseClosedText, setCaseClosedText] = useState("เคสถูกปิดแล้ว");
  const [caseOpenText, setCaseOpenText] = useState("กำลังดำเนินการ");
  const [contactText, setContactText] = useState("ติดต่อทีมงานได้เลย");
  const [welcomeLoaded, setWelcomeLoaded] = useState(false);
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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (welcomeLoaded) return;
    fetch("/api/public-settings")
      .then((r) => r.json())
      .then((d) => { 
        setWelcomeMsg(d.livechat_welcome_message || "");
        if (d.livechat_case_closed_text) setCaseClosedText(d.livechat_case_closed_text);
        if (d.livechat_case_open_text) setCaseOpenText(d.livechat_case_open_text);
        if (d.livechat_contact_text) setContactText(d.livechat_contact_text);
        setWelcomeLoaded(true); 
      })
      .catch(() => setWelcomeLoaded(true));
  }, [welcomeLoaded]);

  useEffect(() => {
    if (activeId || status !== "authenticated") return;
    loadConversations();
    const t = setInterval(loadConversations, 8000);
    return () => clearInterval(t);
  }, [activeId, loadConversations, status]);

  useEffect(() => {
    if (!activeId) return;
    loadMessages(activeId);
    const t = setInterval(() => loadMessages(activeId), 4000);
    return () => clearInterval(t);
  }, [activeId, loadMessages]);

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

  const startChat = async () => {
    const text = newChatText.trim();
    if (!text || startingChat) return;
    setStartingChat(true);
    try {
      const res = await fetch("/api/user/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: "สอบถามทั่วไป", text }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewChatText("");
        await loadConversations();
        setActiveId(data.conversationId);
      }
    } catch {} finally {
      setStartingChat(false);
    }
  };

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleString("th-TH", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  if (status !== "authenticated") return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-red-600" /></div>;

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] md:h-[calc(100vh-80px)] flex flex-col bg-white md:border md:border-gray-200 md:rounded-2xl md:my-6 overflow-hidden md:shadow-sm">
      {/* Header */}
      <div className="bg-red-600 text-white px-4 py-3 md:py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {activeId ? (
            <button onClick={backToList} className="p-1 -ml-1 rounded-full hover:bg-white/20 transition-colors shrink-0">
              <ChevronLeft size={20} />
            </button>
          ) : (
            <MessageCircle size={20} className="shrink-0" />
          )}
          <div className="min-w-0">
            <h1 className="font-bold text-base md:text-lg leading-tight truncate">{activeId ? (activeSubject || "แชท") : "ศูนย์ช่วยเหลือ"}</h1>
            <p className="text-xs text-red-100 truncate">{activeId ? (activeStatus === "closed" ? caseClosedText : caseOpenText) : contactText}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      {!activeId ? (
        <>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              welcomeMsg ? (
                <div className="p-4 flex flex-col gap-2.5">
                  <div className="flex justify-start">
                    <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-bl-sm text-sm font-medium bg-white text-gray-800 border border-gray-100 shadow-sm leading-relaxed">
                      {welcomeMsg}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 gap-3 p-6">
                  <MessageCircle size={48} className="opacity-20" />
                  <p className="text-base font-medium text-gray-600">สวัสดี! มีอะไรให้ช่วยไหม?</p>
                  <p className="text-sm">พิมพ์ข้อความด้านล่างเพื่อเริ่มแชทกับทีมงาน</p>
                </div>
              )
            ) : (
              conversations.map((c) => (
                <button
                  key={c._id}
                  onClick={() => openCase(c._id)}
                  className="w-full text-left px-4 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors flex items-start gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-gray-800 truncate">{c.subject}</span>
                      {c.status === "closed" && <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full shrink-0">ปิดแล้ว</span>}
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {c.lastSender === "admin" && <span className="text-gray-400">ทีมงาน: </span>}
                      {c.lastMessage || "—"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-xs text-gray-400">{fmtTime(c.lastMessageAt)}</span>
                    {c.unreadByUser > 0 && (
                      <span className="min-w-[20px] h-[20px] px-1.5 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center">
                        {c.unreadByUser > 9 ? "9+" : c.unreadByUser}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {conversations.length === 0 && (
            <div className="border-t border-gray-100 p-4 flex items-center gap-2 shrink-0 bg-white">
              <textarea
                value={newChatText}
                onChange={(e) => {
                  setNewChatText(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={(e) => { 
                  if ((e.key === "Enter" || e.code === "Enter" || e.code === "NumpadEnter" || e.keyCode === 13) && !e.shiftKey) { 
                    e.preventDefault(); 
                    setTimeout(() => {
                      startChat(); 
                      if (e.target) (e.target as any).style.height = 'auto';
                    }, 0);
                  } 
                }}
                placeholder="พิมพ์ข้อความ..."
                rows={1}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/10 font-medium text-gray-800 resize-none overflow-y-auto min-h-[46px] max-h-[120px]"
              />
              <button
                onClick={startChat}
                disabled={startingChat || !newChatText.trim()}
                className="w-11 h-11 rounded-xl bg-red-600 text-white flex items-center justify-center hover:bg-red-700 disabled:bg-gray-300 transition-colors shrink-0 shadow-sm shadow-red-500/20"
              >
                {startingChat ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-3 bg-gray-50">
            {messages.map((m) => (
              <div key={m._id} className={`flex ${m.senderRole === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm font-medium break-words whitespace-pre-wrap ${
                    m.senderRole === "user"
                      ? "bg-red-600 text-white rounded-br-sm shadow-sm"
                      : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-sm"
                  }`}
                >
                  {m.imageUrl && (
                    <img src={m.imageUrl} alt="" className="max-w-[200px] md:max-w-xs h-auto object-cover rounded-xl mb-2" />
                  )}
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {activeStatus === "closed" ? (
            <div className="p-4 border-t border-gray-100 shrink-0 bg-white">
              <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-center gap-2 text-gray-500 text-sm">
                <Info size={16} />
                <p>{caseClosedText} — หากต้องการสอบถามเพิ่มเติม กรุณาเปิดเคสใหม่</p>
              </div>
            </div>
          ) : (
            <div className="border-t border-gray-100 shrink-0 bg-white">
              {pendingImage && (
                <div className="p-3 pb-0 flex items-center gap-2">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                    <img src={pendingImage} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setPendingImage("")}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              )}
              <div className="p-3 md:p-4 flex items-center gap-2">
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
                  className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 flex items-center justify-center hover:bg-gray-100 transition-colors shrink-0 disabled:opacity-60"
                >
                  {uploadingImage ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
                </button>
                <textarea
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                  }}
                  onKeyDown={(e) => { 
                    if ((e.key === "Enter" || e.code === "Enter" || e.code === "NumpadEnter" || e.keyCode === 13) && !e.shiftKey) { 
                      e.preventDefault(); 
                      setTimeout(() => {
                        send(); 
                        if (e.target) (e.target as any).style.height = 'auto';
                      }, 0);
                    } 
                  }}
                  placeholder="พิมพ์ข้อความ..."
                  rows={1}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/10 font-medium text-gray-800 resize-none overflow-y-auto min-h-[46px] max-h-[120px]"
                />
                <button
                  onClick={send}
                  disabled={sending || (!input.trim() && !pendingImage)}
                  className="w-11 h-11 rounded-xl bg-red-600 text-white flex items-center justify-center hover:bg-red-700 disabled:bg-gray-300 transition-colors shrink-0 shadow-sm shadow-red-500/20"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
