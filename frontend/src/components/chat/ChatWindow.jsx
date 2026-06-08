/**
 * ChatWindow.jsx — Real-Time One-to-One Chat Window (Themed)
 *
 * bg-bg-primary for the message area background.
 * bg-bg-elevated header and footer.
 * Message input: bg-bg-elevated border-app-border.
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
          className="w-1.5 h-1.5 rounded-full inline-block"
          style={{
            backgroundColor: "var(--text-muted)",
            animation:       "typing-bounce 1.2s ease-in-out infinite",
            animationDelay:  `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{name} is typing…</span>
  </div>
);

// ── Detect touch/coarse-pointer device ───────────────────────────────────────
const isTouchDevice = () =>
  window.matchMedia("(hover: none) and (pointer: coarse)").matches;

// ─────────────────────────────────────────────────────────────────────────────
const ChatWindow = ({ convId }) => {
  const { user }                = useAuth();
  const { socket, onlineUsers } = useSocket();
  const navigate                = useNavigate();
  const myId = user?.id;

  const [messages,   setMessages]   = useState([]);
  const [otherUser,  setOtherUser]  = useState(null);
  const [newText,    setNewText]    = useState("");
  const [loading,    setLoading]    = useState(true);
  const [sendError,  setSendError]  = useState(false);
  const [isTyping,   setIsTyping]   = useState(false);

  const bottomRef        = useRef(null);
  const textareaRef      = useRef(null);
  const typingTimer      = useRef(null);
  const typingEmitted    = useRef(false);

  // ── Load messages ─────────────────────────────────────────────────────────
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
      toast.error(err?.response?.data?.message || "Couldn't load messages. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [convId, myId]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  // ── Socket ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !convId) return;
    socket.emit("join_room", { conversationId: convId });

    const onReceive = ({ message }) => {
      if (message.conversation !== convId) return;
      setMessages((prev) => {
        const senderId = message.sender?._id ?? message.sender;
        const filtered = prev.filter((m) => {
          if (!m.isOptimistic) return true;
          return !((m.sender?._id ?? m.sender) === senderId && m.text === message.text);
        });
        return [...filtered, message];
      });
      setIsTyping(false);
    };

    const onTyping     = () => setIsTyping(true);
    const onStopTyping = () => setIsTyping(false);
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

  // ── Auto-scroll ───────────────────────────────────────────────────────────
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

    if (!typingEmitted.current && e.target.value.trim()) {
      socket.emit("typing", { conversationId: convId });
      typingEmitted.current = true;
    }

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

    clearTimeout(typingTimer.current);
    if (typingEmitted.current) {
      socket.emit("stop_typing", { conversationId: convId });
      typingEmitted.current = false;
    }

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

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !isTouchDevice()) {
      e.preventDefault();
      sendMessage();
    }
  };

  const otherIsOnline = otherUser && onlineUsers.has(otherUser._id);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ backgroundColor: "var(--bg-primary)" }}>

      {/* ══ Sticky top header ═════════════════════════════════════════════════ */}
      <div
        className="sticky top-0 z-10 flex-shrink-0 h-14 flex items-center gap-3 px-3 shadow-sm"
        style={{
          backgroundColor: "var(--bg-elevated)",
          borderBottom:    "1px solid var(--border)",
        }}
      >
        {/* Back button */}
        <button
          id="chat-back-btn"
          onClick={() => navigate("/chat")}
          aria-label="Back to conversations"
          style={{ color: "var(--text-secondary)" }}
          className="p-2 -ml-1 rounded-full transition-colors min-h-0 flex-shrink-0 focus:outline-none"
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = "var(--bg-surface)"; e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}
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
          <p className="text-sm font-semibold truncate leading-tight" style={{ color: "var(--text-primary)" }}>
            {otherUser?.name ?? (loading ? "Loading…" : "Chat")}
          </p>
          <p
            className="text-[11px] leading-tight"
            style={{ color: otherIsOnline ? "var(--success)" : "var(--text-secondary)" }}
          >
            {otherIsOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      {/* ══ Messages — scrollable ══════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto overscroll-contain py-3">
        {loading && (
          <div className="flex justify-center items-center h-full">
            <Loader2 size={24} className="animate-spin" style={{ color: "var(--text-secondary)" }} />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <Avatar src={otherUser?.profilePicture} name={otherUser?.name ?? "?"} size="lg" className="mb-3" />
            <p className="font-semibold text-sm mb-1" style={{ color: "var(--text-primary)" }}>
              Say hi to {otherUser?.name ?? "them"} 👋
            </p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Start the conversation below.</p>
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
        <div ref={bottomRef} />
      </div>

      {/* ══ Sticky bottom input ═══════════════════════════════════════════════ */}
      <div
        className="sticky bottom-0 flex-shrink-0 px-3 pt-2 pb-16 lg:pb-2 flex flex-col gap-1.5"
        style={{
          backgroundColor: "var(--bg-elevated)",
          borderTop:       "1px solid var(--border)",
        }}
      >
        {/* Send error banner */}
        {sendError && (
          <div className="flex items-center gap-1.5 text-red-500 text-xs px-1">
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
            style={{
              backgroundColor: "var(--bg-surface)",
              border:          "1px solid var(--border)",
              color:           "var(--text-primary)",
            }}
            className="
              flex-1 resize-none overflow-y-auto
              min-h-[44px] max-h-[120px]
              px-4 py-2.5
              rounded-2xl
              text-sm
              focus:outline-none focus:ring-2
              transition duration-200 leading-[1.5]
            "
          />

          {/* Send button */}
          <button
            id="send-message-btn"
            onClick={sendMessage}
            disabled={!newText.trim()}
            aria-label="Send message"
            style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
            className="
              flex-shrink-0 w-11 h-11 rounded-full
              flex items-center justify-center
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-150 shadow-sm min-h-0
              active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-1
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
