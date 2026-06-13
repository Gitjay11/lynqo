/**
 * ChatWindow.jsx — Real-Time One-to-One Chat Window (Redesigned)
 *
 * Key visual changes:
 *  - Top bar: back arrow (lg:hidden), peer avatar+status, MoreVertical dropdown
 *  - Messages: date separators, message grouping (consecutive same-sender),
 *    bubble-style typing indicator with staggered bouncing dots
 *  - Input bar: image-attach button, emoji icon, auto-resize textarea,
 *    SendHorizonal send button with disabled state, safe-area padding
 *
 * All socket events, API calls, and data logic are preserved exactly.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate }                               from "react-router-dom";
import {
  ArrowLeft,
  ImagePlus,
  Smile,
  MoreVertical,
  SendHorizonal,
  AlertCircle,
} from "lucide-react";
import toast             from "react-hot-toast";
import { useAuth }       from "../../hooks/useAuth.js";
import { useSocket }     from "../../hooks/useSocket.js";
import api               from "../../api/axios.js";
import Avatar            from "../common/Avatar.jsx";
import Loader            from "../common/Loader.jsx";
import OnlineDot         from "./OnlineDot.jsx";
import MessageBubble     from "./MessageBubble.jsx";

// ── Date separator label helper ───────────────────────────────────────────────
const getDateLabel = (dateStr) => {
  if (!dateStr) return "";
  const date      = new Date(dateStr);
  const now       = new Date();
  const todayMs   = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterMs  = todayMs - 86_400_000;
  const msgDayMs  = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

  if (msgDayMs === todayMs)  return "Today";
  if (msgDayMs === yesterMs) return "Yesterday";
  return date.toLocaleDateString([], { day: "numeric", month: "long" });
};

// ── Detect coarse-pointer (touch) device ──────────────────────────────────────
const isTouchDevice = () =>
  window.matchMedia("(hover: none) and (pointer: coarse)").matches;

// ─────────────────────────────────────────────────────────────────────────────
const ChatWindow = ({ convId }) => {
  const { user }                = useAuth();
  const { socket, onlineUsers } = useSocket();
  const navigate                = useNavigate();
  const myId                    = user?.id;

  const [messages,      setMessages]      = useState([]);
  const [otherUser,     setOtherUser]     = useState(null);
  const [newText,       setNewText]       = useState("");
  const [loading,       setLoading]       = useState(true);
  const [sendError,     setSendError]     = useState(false);
  const [isTyping,      setIsTyping]      = useState(false);
  const [showDropdown,  setShowDropdown]  = useState(false);

  const bottomRef      = useRef(null);
  const textareaRef    = useRef(null);
  const fileInputRef   = useRef(null);
  const dropdownRef    = useRef(null);
  const typingTimer    = useRef(null);
  const typingEmitted  = useRef(false);

  // ── Load messages + resolve peer user ────────────────────────────────────
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
        const other =
          thisConv.participants.find((p) => String(p._id) !== String(myId)) ??
          thisConv.participants[0];
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

  // ── Socket event listeners ────────────────────────────────────────────────
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

  // ── Auto-scroll to bottom on new message / typing indicator ──────────────
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

  // ── Close dropdown when clicking outside ─────────────────────────────────
  useEffect(() => {
    if (!showDropdown) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDropdown]);

  // ── Input handler + typing socket events ──────────────────────────────────
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

  // ── Send message (optimistic UI) ─────────────────────────────────────────
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

  // ── Build grouped render list with date separators ────────────────────────
  const renderList = [];
  let prevSenderId = null;
  let prevDateStr  = null;

  messages.forEach((msg, idx) => {
    const senderId = String(msg.sender?._id ?? msg.sender);
    const dateStr  = new Date(msg.createdAt).toDateString();

    // Date separator when the day changes
    if (dateStr !== prevDateStr) {
      renderList.push({ type: "separator", date: msg.createdAt, key: `sep-${msg._id}` });
      prevDateStr  = dateStr;
      prevSenderId = null; // reset group on day boundary
    }

    // Determine grouping
    const isFirstInGroup = senderId !== prevSenderId;

    const nextMsg        = messages[idx + 1];
    const nextSenderId   = nextMsg ? String(nextMsg.sender?._id ?? nextMsg.sender) : null;
    const nextDateStr    = nextMsg ? new Date(nextMsg.createdAt).toDateString() : null;
    const isLastInGroup  = !nextMsg || nextSenderId !== senderId || nextDateStr !== dateStr;

    renderList.push({
      type:          "message",
      msg,
      isFirstInGroup,
      isLastInGroup,
      key:           msg._id,
    });

    prevSenderId = senderId;
  });

  const otherIsOnline = otherUser && onlineUsers.has(String(otherUser._id));

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >

      {/* ══ Top bar ══════════════════════════════════════════════════════════ */}
      <div
        className="sticky top-0 z-10 flex-shrink-0 h-[52px] flex items-center gap-3 px-3"
        style={{
          backgroundColor: "var(--bg-elevated)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {/* Back button — mobile only */}
        <button
          id="chat-back-btn"
          onClick={() => navigate("/chat")}
          aria-label="Back to conversations"
          className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center
                     active:scale-95 transition-all duration-150 min-h-0"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-surface)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
        >
          <ArrowLeft size={18} />
        </button>

        {/* Peer avatar with online dot */}
        <div className="relative flex-shrink-0">
          <Avatar
            src={otherUser?.profilePicture}
            name={otherUser?.name ?? "…"}
            size="sm"
          />
          {otherIsOnline && (
            <OnlineDot
              isOnline={true}
              size="sm"
              className="absolute bottom-0 right-0"
            />
          )}
        </div>

        {/* Name + status text */}
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-bold font-display tracking-snug truncate leading-none"
            style={{ color: "var(--text-primary)" }}
          >
            {otherUser?.name ?? (loading ? "Loading…" : "Chat")}
          </p>
          <p
            className="text-[10px] font-medium mt-0.5 leading-none"
            style={{
              color: isTyping
                ? "var(--accent)"
                : otherIsOnline
                ? "#22c55e"
                : "var(--text-muted)",
              fontStyle: isTyping ? "italic" : "normal",
            }}
          >
            {isTyping ? "typing..." : otherIsOnline ? "Online now" : "Last seen recently"}
          </p>
        </div>

        {/* More options button + dropdown */}
        <div className="relative flex-shrink-0" ref={dropdownRef}>
          <button
            id="chat-more-btn"
            aria-label="More options"
            onClick={() => setShowDropdown((v) => !v)}
            className="w-9 h-9 rounded-xl flex items-center justify-center
                       transition-colors duration-150 min-h-0"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-surface)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            <MoreVertical size={18} />
          </button>

          {showDropdown && (
            <div
              className="absolute right-0 top-full mt-1 w-40 rounded-xl overflow-hidden shadow-lg z-20"
              style={{
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border)",
              }}
            >
              <button
                className="w-full px-4 py-3 text-sm font-medium text-left transition-colors min-h-0"
                style={{ color: "var(--text-primary)" }}
                onClick={() => {
                  setShowDropdown(false);
                  if (otherUser?._id) navigate(`/profile/${otherUser._id}`);
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-elevated)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                View Profile
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ══ Messages — scrollable area ════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 flex flex-col gap-3 scrollbar-hide lg:scrollbar-thin">

        {/* Loading spinner */}
        {loading && (
          <div className="flex justify-center items-center flex-1">
            <Loader size="md" text="" />
          </div>
        )}

        {/* Empty conversation state */}
        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 text-center px-8">
            <Avatar
              src={otherUser?.profilePicture}
              name={otherUser?.name ?? "?"}
              size="lg"
            />
            <p
              className="text-base font-bold font-display tracking-snug mt-3"
              style={{ color: "var(--text-primary)" }}
            >
              {otherUser?.name ?? "…"}
            </p>
            {(otherUser?.branch || otherUser?.semester) && (
              <p className="text-xs font-normal mt-1" style={{ color: "var(--text-secondary)" }}>
                {otherUser.branch}{otherUser.semester ? ` · Sem ${otherUser.semester}` : ""}
              </p>
            )}
            <p
              className="text-xs mt-4 leading-relaxed"
              style={{ color: "var(--text-muted)" }}
            >
              Say hello! Start the conversation.
            </p>
          </div>
        )}

        {/* Grouped messages with date separators */}
        {!loading && renderList.map((item) => {
          if (item.type === "separator") {
            return (
              <div key={item.key} className="flex items-center justify-center my-2">
                <span
                  className="text-[10px] font-medium px-3 py-1 rounded-full"
                  style={{
                    color: "var(--text-muted)",
                    backgroundColor: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {getDateLabel(item.date)}
                </span>
              </div>
            );
          }

          const { msg, isLastInGroup } = item;
          const isSent = String(msg.sender?._id ?? msg.sender) === String(myId);

          return (
            <div
              key={item.key}
              className={item.isFirstInGroup ? "mt-2" : "mt-0.5"}
            >
              <MessageBubble
                message={msg}
                isSent={isSent}
                showAvatar={!isSent && isLastInGroup}
                isLastInGroup={isLastInGroup}
                otherUser={otherUser}
              />
            </div>
          );
        })}

        {/* Bubble-style typing indicator */}
        {isTyping && otherUser && (
          <div className="flex items-end gap-2 animate-fade-in mt-1">
            {/* Sender avatar */}
            <div className="w-6 h-6 flex-shrink-0 mb-1">
              <Avatar
                src={otherUser.profilePicture}
                name={otherUser.name}
                size="xs"
              />
            </div>
            {/* Bouncing dots bubble */}
            <div
              className="px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5 items-center"
              style={{
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border)",
              }}
              aria-live="polite"
              aria-label={`${otherUser.name} is typing`}
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{
                    backgroundColor: "var(--text-muted)",
                    animationDelay: `${i * 150}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* ══ Input bar ════════════════════════════════════════════════════════ */}
      <div
        className="sticky bottom-0 flex-shrink-0 flex items-end gap-2 px-3 py-3"
        style={{
          backgroundColor: "var(--bg-primary)",
          borderTop: "1px solid var(--border)",
          paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
        }}
      >
        {/* Hidden file input for image attach */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={() => {
            // Image upload UI hook — backend implementation pending
            toast("Image sharing coming soon!", { icon: "📷" });
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />

        {/* Attach image button */}
        <button
          id="attach-image-btn"
          aria-label="Attach image"
          onClick={() => fileInputRef.current?.click()}
          className="w-9 h-9 rounded-xl flex items-center justify-center
                     flex-shrink-0 cursor-pointer active:scale-95 transition-all duration-150 min-h-0"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
        >
          <ImagePlus size={16} />
        </button>

        {/* Textarea wrapper */}
        <div
          className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-2xl
                     min-h-[40px] max-h-[120px] transition-colors duration-150"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border)",
          }}
          onFocusCapture={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
          onBlurCapture={(e)  => { e.currentTarget.style.borderColor = "var(--border)"; }}
        >
          <Smile size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />

          {/* Send-error inline notice */}
          {sendError && (
            <div className="flex items-center gap-1 text-red-500 text-xs px-1 flex-shrink-0">
              <AlertCircle size={12} />
              <span>Failed — try again</span>
            </div>
          )}

          <textarea
            ref={textareaRef}
            id="message-input"
            value={newText}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            maxLength={1000}
            aria-label="Type a message"
            className="flex-1 bg-transparent text-sm font-sans font-normal resize-none overflow-hidden
                       outline-none leading-relaxed"
            style={{ color: "var(--text-primary)" }}
          />
        </div>

        {/* Send button */}
        <button
          id="send-message-btn"
          onClick={sendMessage}
          disabled={!newText.trim()}
          aria-label="Send message"
          className="w-9 h-9 rounded-full flex items-center justify-center
                     flex-shrink-0 active:scale-95 transition-all duration-150 min-h-0
                     disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
          style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
          onMouseEnter={(e) => { if (newText.trim()) e.currentTarget.style.backgroundColor = "var(--accent-hover)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--accent)"; }}
        >
          <SendHorizonal size={16} />
        </button>
      </div>

    </div>
  );
};

export default ChatWindow;
