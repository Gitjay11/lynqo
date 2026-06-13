/**
 * ChatList.jsx — Conversation Inbox + User Search (Redesigned)
 *
 * Visual redesign: new top bar with compose button, redesigned search input,
 * search-results dropdown with section label, redesigned conversation rows
 * (active highlight, "You:" prefix, unread badge, online dot, empty state).
 *
 * All API calls and socket logic are preserved exactly.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams }                    from "react-router-dom";
import { Search, MessageCircle, X, Loader2, PenSquare } from "lucide-react";
import toast              from "react-hot-toast";
import { useAuth }        from "../../hooks/useAuth.js";
import { useSocket }      from "../../hooks/useSocket.js";
import api                from "../../api/axios.js";
import Avatar             from "../common/Avatar.jsx";
import Loader             from "../common/Loader.jsx";
import EmptyState         from "../common/EmptyState.jsx";
import OnlineDot          from "./OnlineDot.jsx";
import ChatListSkeleton   from "../common/ChatListSkeleton.jsx";

// ── Timestamp helper ──────────────────────────────────────────────────────────
const formatPreviewTime = (dateString) => {
  if (!dateString) return "";
  const date  = new Date(dateString);
  const now   = new Date();
  const diffH = (now - date) / (1000 * 60 * 60);

  if (diffH < 24)  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffH < 168) return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { day: "numeric", month: "short" });
};

// ─────────────────────────────────────────────────────────────────────────────
const ChatList = ({ onSelectConv }) => {
  const { user }              = useAuth();
  const { socket, onlineUsers } = useSocket();
  const navigate              = useNavigate();
  // convId from URL — used to highlight active conversation on desktop
  const { convId: activeConvId } = useParams();

  const [conversations,  setConversations]  = useState([]);
  const [searchQuery,    setSearchQuery]    = useState("");
  const [searchResults,  setSearchResults]  = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [searching,      setSearching]      = useState(false);
  const [startingConv,   setStartingConv]   = useState(null);

  const searchTimer    = useRef(null);
  const searchInputRef = useRef(null); // compose button focuses this

  // ── Fetch conversations ───────────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/chat/conversations");
      setConversations(data.conversations ?? []);
    } catch (err) {
      console.error("[ChatList] Failed to fetch conversations:", err.message);
      toast.error(err?.response?.data?.message || "Couldn't load your conversations. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // ── Live: update lastMessage preview on new socket message ───────────────
  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = ({ message }) => {
      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if (conv._id === message.conversation) {
            return { ...conv, lastMessage: message, updatedAt: message.createdAt };
          }
          return conv;
        });
        return [...updated].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      });
    };
    socket.on("receive_message", handleNewMessage);
    return () => socket.off("receive_message", handleNewMessage);
  }, [socket]);

  // ── Search: debounced user lookup via GET /api/users/search?q= ───────────
  useEffect(() => {
    clearTimeout(searchTimer.current);
    if (!searchQuery.trim()) { setSearchResults([]); setSearching(false); return; }

    searchTimer.current = setTimeout(async () => {
      try {
        setSearching(true);
        const { data } = await api.get("/users/search", { params: { q: searchQuery.trim() } });
        setSearchResults((data.users ?? []).filter((u) => String(u.id) !== String(user?.id)));
      } catch (err) {
        console.error("[ChatList] Search error:", err.message);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(searchTimer.current);
  }, [searchQuery, user]);

  // ── Start / open a conversation via POST /api/chat/conversation/:userId ───
  const handleSelectUser = async (targetUser) => {
    try {
      setStartingConv(targetUser.id);
      const { data } = await api.post(`/chat/conversation/${targetUser.id}`);
      const convId   = data.conversation._id;
      setSearchQuery("");
      setSearchResults([]);
      onSelectConv?.(convId);
      navigate(`/chat/${convId}`);
    } catch (err) {
      console.error("[ChatList] Failed to start conversation:", err.message);
      toast.error(err?.response?.data?.message || "Couldn't open that conversation. Please try again.");
    } finally {
      setStartingConv(null);
    }
  };

  const getOtherUser = (conv) =>
    conv.participants.find((p) => String(p._id) !== String(user?.id)) ?? conv.participants[0];

  const handleSelectConv = (convId) => {
    onSelectConv?.(convId);
    navigate(`/chat/${convId}`);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    searchInputRef.current?.focus();
  };

  const isSearchActive = searchQuery.trim().length > 0;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "var(--bg-primary)" }}>

      {/* ══ Top bar ════════════════════════════════════════════════════════════ */}
      <div
        className="px-4 h-[52px] flex items-center justify-between flex-shrink-0"
        style={{
          backgroundColor: "var(--bg-elevated)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <h1
          className="text-base font-black font-display tracking-snug"
          style={{ color: "var(--text-primary)" }}
        >
          Messages
        </h1>

        {/* Compose button — focuses search so user can look up a student */}
        <button
          id="compose-chat-btn"
          aria-label="Start new chat"
          onClick={() => searchInputRef.current?.focus()}
          className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer active:scale-95 transition-all duration-150 min-h-0"
          style={{
            backgroundColor: "var(--accent-light)",
            border: "1px solid var(--accent-border)",
          }}
        >
          <PenSquare size={15} style={{ color: "var(--accent)" }} />
        </button>
      </div>

      {/* ══ Search bar ═════════════════════════════════════════════════════════ */}
      <div className="px-3 pt-3 pb-2 flex-shrink-0">
        <div
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl transition-colors duration-150 focus-within:border-[var(--accent)]"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border)",
          }}
        >
          <Search size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <input
            ref={searchInputRef}
            id="chat-search"
            type="text"
            placeholder="Search or start new chat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm font-normal outline-none"
            style={{ color: "var(--text-primary)" }}
            autoComplete="off"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              aria-label="Clear search"
              className="flex-shrink-0 min-h-0"
              style={{ color: "var(--text-muted)" }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ══ Scrollable body ════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">

        {/* ── Search results (replaces conv list while typing) ──────────────── */}
        {isSearchActive && (
          <div className="flex flex-col gap-1 px-3">
            {searching ? (
              <div className="flex items-center justify-center py-10">
                <Loader size="sm" text="" />
              </div>
            ) : searchResults.length === 0 ? (
              <p
                className="text-xs text-center py-6"
                style={{ color: "var(--text-muted)" }}
              >
                No students found
              </p>
            ) : (
              <>
                {/* Section label */}
                <p
                  className="text-[9px] font-bold uppercase tracking-widest px-1 mb-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  Students
                </p>

                {searchResults.map((u) => (
                  <button
                    key={u.id}
                    id={`search-result-${u.id}`}
                    onClick={() => handleSelectUser(u)}
                    disabled={startingConv === u.id}
                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer w-full text-left
                               disabled:opacity-60 transition-colors duration-150 min-h-0"
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-elevated)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar src={u.profilePicture} name={u.name} size="sm" />
                      <OnlineDot userId={u.id} size="sm" className="absolute bottom-0.5 right-0.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-bold font-display tracking-snug truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {u.name}
                      </p>
                      {(u.branch || u.semester) && (
                        <p
                          className="text-xs font-normal mt-0.5 truncate"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {u.branch}{u.semester ? ` · Sem ${u.semester}` : ""}
                        </p>
                      )}
                    </div>
                    {startingConv === u.id && (
                      <Loader2
                        size={14}
                        className="animate-spin flex-shrink-0"
                        style={{ color: "var(--text-muted)" }}
                      />
                    )}
                  </button>
                ))}
              </>
            )}
          </div>
        )}

        {/* ── Conversation list (default view) ─────────────────────────────── */}
        {!isSearchActive && (
          <>
            {loading ? (
              <ChatListSkeleton />
            ) : conversations.length === 0 ? (
              /* Empty state */
              <EmptyState
                icon={<MessageCircle size={26} />}
                title="No conversations yet"
                subtitle="Find a student and say hi. Search by name above to start chatting."
              />
            ) : (
              <>
                {/* Section label */}
                <div
                  className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest"
                  style={{ color: "var(--text-muted)" }}
                >
                  Recent
                </div>

                <ul aria-label="Conversations" className="flex flex-col px-2 pb-4">
                  {conversations.map((conv) => {
                    const other       = getOtherUser(conv);
                    const lastMsg     = conv.lastMessage;
                    const isActive    = conv._id === activeConvId;
                    const isFromMe    = lastMsg &&
                      String(lastMsg.sender?._id ?? lastMsg.sender) === String(user?.id);
                    const unreadCount = conv.unreadCount ?? 0;
                    const time        = formatPreviewTime(conv.updatedAt);
                    const isOnline    = Boolean(other?._id && onlineUsers.has(String(other._id)));

                    return (
                      <li key={conv._id}>
                        <button
                          id={`conv-${conv._id}`}
                          onClick={() => handleSelectConv(conv._id)}
                          className="w-full flex items-center gap-3 p-3 rounded-2xl cursor-pointer
                                     text-left transition-all duration-150 active:scale-[0.98] min-h-0"
                          style={
                            isActive
                              ? {
                                  backgroundColor: "var(--accent-light)",
                                  border: "1px solid var(--accent-border)",
                                }
                              : {}
                          }
                          onMouseEnter={(e) => {
                            if (!isActive)
                              e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive)
                              e.currentTarget.style.backgroundColor = "transparent";
                          }}
                        >
                          {/* Avatar with online dot */}
                          <div className="relative flex-shrink-0">
                            <Avatar
                              src={other?.profilePicture}
                              name={other?.name ?? "?"}
                              size="md"
                            />
                            {isOnline && (
                              <OnlineDot
                                isOnline={true}
                                size="md"
                                className="absolute bottom-0.5 right-0.5"
                              />
                            )}
                          </div>

                          {/* Middle: name + last message preview */}
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm font-bold font-display tracking-snug leading-none truncate"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {other?.name ?? "Unknown"}
                            </p>

                            {lastMsg ? (
                              <p
                                className="text-xs font-normal mt-1 truncate"
                                style={{ color: "var(--text-secondary)" }}
                              >
                                {isFromMe && (
                                  <span style={{ color: "var(--text-muted)" }}>You: </span>
                                )}
                                {lastMsg.text ?? (lastMsg.image ? "📷 Image" : "")}
                              </p>
                            ) : (
                              <p
                                className="text-xs mt-1 italic"
                                style={{ color: "var(--text-muted)" }}
                              >
                                Say hello 👋
                              </p>
                            )}
                          </div>

                          {/* Right: timestamp + unread badge */}
                          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                            <span
                              className="text-[10px] tabular-nums"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {time}
                            </span>
                            {unreadCount > 0 && (
                              <div
                                className="w-5 h-5 rounded-full text-white text-[9px] font-bold tabular-nums
                                           flex items-center justify-center"
                                style={{ backgroundColor: "var(--accent)" }}
                              >
                                {unreadCount > 9 ? "9+" : unreadCount}
                              </div>
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ChatList;
