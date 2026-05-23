/**
 * ChatWindow.jsx — Real-Time One-to-One Chat Window
 *
 * Layout (flex-col, fills whatever container it is given):
 *
 *  ┌─ Header [sticky top-0, h-14] ──────────────────────────────────────┐
 *  │  ← back  |  Avatar + OnlineDot  |  Name  |  Online / Offline       │
 *  ├─ Messages [flex-1, overflow-y-auto] ───────────────────────────────┤
 *  │  <MessageBubble /> × N                                             │
 *  │  <TypingDots />  (shows/hides)                                     │
 *  │  <div ref={bottomRef} />  ← auto-scroll anchor                    │
 *  ├─ Input [sticky bottom-0] ──────────────────────────────────────────┤
 *  │  [textarea]                               [Send button]            │
 *  │  pb-14 on mobile (clears BottomTabBar)  · lg:pb-2                 │
 *  └────────────────────────────────────────────────────────────────────┘
 *
 * On mobile: the parent (ChatPage) wraps this in `fixed inset-0 z-50`,
 * making it true h-[100dvh]. On desktop: parent is `h-full`.
 * ChatWindow itself is always `h-full flex-col`.
 *
 * Optimistic sends:
 *  Message is appended immediately with a temp _id. When receive_message
 *  echoes back the DB-persisted version, the temp entry is swapped out.
 *
 * Enter-to-send:
 *  Desktop (non-touch): Enter sends, Shift+Enter = newline.
 *  Mobile (touch/coarse pointer): Enter key is ignored; Send button only.
 *
 * Typing debounce: emit typing on first keystroke, stop_typing after 1.5 s idle.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate }   from "react-router-dom";
import { ArrowLeft, Send, Loader2, AlertCircle } from "lucide-react";
import toast             from "react-hot-toast";
import { useAuth }       from "../../hooks/useAuth.js";
import { useSocket }     from "../../hooks/useSocket.js";
import api               from "../../api/axios.js";
import Avatar            from "../common/Avatar.jsx";
import OnlineDot         from "./OnlineDot.jsx";
import MessageBubble     from "./MessageBubble.jsx";

// ── Typing indicator ──────────────────────────────────────────────────────────
const TypingDots = ({ name }) => (
  <div className="flex items-center gap-2 px-5 py-1.5" aria-live="polite">
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-zinc-500 inline-block"
          style={{
            animation: "typing-bounce 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
    <span className="text-xs text-zinc-500">{name} is typing…</span>
  </div>
);

// ── Detect touch/coarse-pointer device (mobile keyboard) ─────────────────────
const isTouchDevice = () =>
  window.matchMedia("(hover: none) and (pointer: coarse)").matches;

// ─────────────────────────────────────────────────────────────────────────────
const ChatWindow = ({ convId }) => {
  const { user }                = useAuth();
  const { socket, onlineUsers } = useSocket();
  const navigate                = useNavigate();

  const myId = user?.id;

  // ── State ─────────────────────────────────────────────────────────────────
  const [messages,   setMessages]   = useState([]);
  const [otherUser,  setOtherUser]  = useState(null);
  const [newText,    setNewText]    = useState("");
  const [loading,    setLoading]    = useState(true);
  const [sendError,  setSendError]  = useState(false);
  const [isTyping,   setIsTyping]   = useState(false);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const bottomRef        = useRef(null);
  const textareaRef      = useRef(null);
  const typingTimer      = useRef(null);
  const typingEmitted    = useRef(false);

  // ── Load message history + derive otherUser ───────────────────────────────
  const loadMessages = useCallback(async () => {
    if (!convId) return;
    try {
      setLoading(true);
      setSendError(false);

      const [{ data: msgData }, { data: convData }] = await Promise.all([
        api.get(`/chat/messages/${convId}`),
        api.get("/chat/conversations"),
      ]);

      setMessages(msgData.messages ?? []);

      const thisConv = convData.conversations?.find((c) => c._id === convId);
      if (thisConv) {
        const other = thisConv.participants.find(
          (p) => String(p._id) !== String(myId)
        ) ?? thisConv.participants[0];
        setOtherUser(other);
      }
    } catch (err) {
      console.error("[ChatWindow] load error:", err.message);
      // Show a toast so the user knows why the chat is empty
      toast.error(
        err?.response?.data?.message ||
          "Couldn’t load messages. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [convId, myId]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  // ── Socket: join room + wire events ──────────────────────────────────────
  useEffect(() => {
    if (!socket || !convId) return;

    socket.emit("join_room", { conversationId: convId });

    // receive_message: swap out matching optimistic entry, then append real one
    const onReceive = ({ message }) => {
      if (message.conversation !== convId) return;
      setMessages((prev) => {
        const senderId = message.sender?._id ?? message.sender;
        const filtered = prev.filter((m) => {
          if (!m.isOptimistic) return true;
          return !(
            (m.sender?._id ?? m.sender) === senderId &&
            m.text === message.text
          );
        });
        return [...filtered, message];
      });
      setIsTyping(false);
    };

    const onTyping     = () => setIsTyping(true);
    const onStopTyping = () => setIsTyping(false);
    // message_error: socket server couldn't persist the message
    const onError      = () => {
      setSendError(true);
      toast.error("Message failed to send. Please try again.");
    };

    socket.on("receive_message", onReceive);
    socket.on("user_typing",     onTyping);
    socket.on("stop_typing",     onStopTyping);
    socket.on("message_error",   onError);

    return () => {
      socket.off("receive_message", onReceive);
      socket.off("user_typing",     onTyping);
      socket.off("stop_typing",     onStopTyping);
      socket.off("message_error",   onError);
    };
  }, [socket, convId]);

  // ── Auto-scroll to bottom on new messages / typing indicator ─────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ── Auto-resize textarea ──────────────────────────────────────────────────
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [newText]);

  // ── Input handler + typing events ─────────────────────────────────────────
  const handleInput = (e) => {
    setNewText(e.target.value);
    setSendError(false);
    if (!socket || !convId) return;

    // Emit "typing" only on first keystroke (avoid flooding)
    if (!typingEmitted.current && e.target.value.trim()) {
      socket.emit("typing", { conversationId: convId });
      typingEmitted.current = true;
    }

    // Reset stop_typing debounce — fires 1.5 s after last keystroke
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit("stop_typing", { conversationId: convId });
      typingEmitted.current = false;
    }, 1500);
  };

  // ── Send message (optimistic) ─────────────────────────────────────────────
  const sendMessage = () => {
    const trimmed = newText.trim();
    if (!trimmed || !socket || !convId) return;

    // Stop typing
    clearTimeout(typingTimer.current);
    if (typingEmitted.current) {
      socket.emit("stop_typing", { conversationId: convId });
      typingEmitted.current = false;
    }

    // Optimistic append
    const optimistic = {
      _id:          `temp-${Date.now()}`,
      conversation: convId,
      text:         trimmed,
      sender:       { _id: myId, name: user?.name, profilePicture: user?.profilePicture },
      createdAt:    new Date().toISOString(),
      read:         false,
      isOptimistic: true,
    };

    setMessages((prev) => [...prev, optimistic]);
    setNewText("");
    setSendError(false);

    socket.emit("send_message", { conversationId: convId, text: trimmed });
  };

  // ── Keyboard: Enter sends on desktop, Shift+Enter = newline ───────────────
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !isTouchDevice()) {
      e.preventDefault();
      sendMessage();
    }
  };

  const otherIsOnline = otherUser && onlineUsers.has(otherUser._id);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col bg-zinc-950 overflow-hidden">

      {/* ══ Sticky top header ═══════════════════════════════════════════════ */}
      <div className="sticky top-0 z-10 flex-shrink-0 h-14 flex items-center gap-3 px-3 bg-zinc-900 border-b border-zinc-800 shadow-sm">

        {/* Back button */}
        <button
          id="chat-back-btn"
          onClick={() => navigate("/chat")}
          aria-label="Back to conversations"
          className="p-2 -ml-1 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors min-h-0 flex-shrink-0"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Avatar + online dot */}
        <div className="relative flex-shrink-0">
          <Avatar src={otherUser?.profilePicture} name={otherUser?.name ?? "…"} size="sm" />
          <OnlineDot userId={otherUser?._id} size="sm" className="absolute -bottom-0.5 -right-0.5" />
        </div>

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-50 truncate leading-tight">
            {otherUser?.name ?? (loading ? "Loading…" : "Chat")}
          </p>
          <p className={`text-[11px] leading-tight ${otherIsOnline ? "text-emerald-500" : "text-zinc-500"}`}>
            {otherIsOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      {/* ══ Messages — scrollable ════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto overscroll-contain py-3">
        {loading && (
          <div className="flex justify-center items-center h-full">
            <Loader2 size={24} className="animate-spin text-brand-500" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <Avatar src={otherUser?.profilePicture} name={otherUser?.name ?? "?"} size="lg" className="mb-3" />
            <p className="text-zinc-300 font-semibold text-sm mb-1">
              Say hi to {otherUser?.name ?? "them"} 👋
            </p>
            <p className="text-zinc-500 text-xs">Start the conversation below.</p>
          </div>
        )}

        {!loading && messages.map((msg) => (
          <MessageBubble
            key={msg._id}
            message={msg}
            isOwn={String(msg.sender?._id ?? msg.sender) === String(myId)}
          />
        ))}

        {isTyping && otherUser && <TypingDots name={otherUser.name} />}

        {/* Auto-scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* ══ Sticky bottom input ══════════════════════════════════════════════ */}
      <div
        className="
          sticky bottom-0 flex-shrink-0
          bg-zinc-900 border-t border-zinc-800
          px-3 pt-2 pb-16 lg:pb-2
          flex flex-col gap-1.5
        "
      >
        {/* Send error banner */}
        {sendError && (
          <div className="flex items-center gap-1.5 text-rose-500 text-xs px-1">
            <AlertCircle size={12} />
            <span>Message failed — please try again.</span>
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Auto-resize textarea */}
          <textarea
            ref={textareaRef}
            id="message-input"
            value={newText}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            rows={1}
            maxLength={1000}
            aria-label="Message input"
            className="
              flex-1 resize-none overflow-y-auto
              min-h-[44px] max-h-[120px]
              px-4 py-2.5
              bg-zinc-800 border border-zinc-700 rounded-2xl
              text-sm text-zinc-50 placeholder-zinc-500
              focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
              transition duration-200 leading-[1.5]
            "
          />

          {/* Send button */}
          <button
            id="send-message-btn"
            onClick={sendMessage}
            disabled={!newText.trim()}
            aria-label="Send message"
            className="
              flex-shrink-0 w-11 h-11 rounded-full
              flex items-center justify-center
              bg-brand-600 hover:bg-brand-700 active:bg-brand-800
              disabled:opacity-40 disabled:cursor-not-allowed
              text-white transition-all duration-150 shadow-sm min-h-0
            "
          >
            <Send size={18} />
          </button>
        </div>
      </div>

    </div>
  );
};

export default ChatWindow;
