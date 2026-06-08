/**
 * ChatList.jsx — Conversation Inbox + User Search (Themed)
 *
 * bg-bg-surface, border-app-border, inputs bg-bg-elevated.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MessageCircle, X, Loader2 } from "lucide-react";
import toast              from "react-hot-toast";
import { useAuth }        from "../../hooks/useAuth.js";
import { useSocket }      from "../../hooks/useSocket.js";
import api                from "../../api/axios.js";
import Avatar             from "../common/Avatar.jsx";
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
  const { user }            = useAuth();
  const { socket }          = useSocket();
  const navigate            = useNavigate();

  const [conversations,  setConversations]  = useState([]);
  const [searchQuery,    setSearchQuery]    = useState("");
  const [searchResults,  setSearchResults]  = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [searching,      setSearching]      = useState(false);
  const [startingConv,   setStartingConv]   = useState(null);

  const searchTimer = useRef(null);

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

  // ── Live: update lastMessage preview ─────────────────────────────────────
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

  // ── Search: debounced user lookup ─────────────────────────────────────────
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

  // ── Start / open a conversation ───────────────────────────────────────────
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
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "var(--bg-surface)" }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
        <h1 className="text-xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>Messages</h1>

        {/* Search bar */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            id="chat-search"
            type="text"
            placeholder="Search people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              backgroundColor: "var(--bg-elevated)",
              border:          "1px solid var(--border)",
              color:           "var(--text-primary)",
            }}
            className="
              w-full h-11 pl-9 pr-9
              rounded-xl
              text-sm
              focus:outline-none focus:ring-2
              transition duration-200
            "
            autoComplete="off"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              aria-label="Clear search"
              style={{ color: "var(--text-muted)" }}
              className="
                absolute right-2 top-1/2 -translate-y-1/2
                p-1.5 rounded-full
                transition-colors min-h-0
              "
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Scrollable body ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Search results ─────────────────────────────────────────────────── */}
        {searchQuery.trim() && (
          <>
            {searching ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={20} className="animate-spin" style={{ color: "var(--text-muted)" }} />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="flex flex-col items-center py-12 px-6 text-center">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
                  style={{ backgroundColor: "var(--bg-elevated)" }}
                >
                  <Search size={22} style={{ color: "var(--text-muted)" }} />
                </div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>No students found</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  Try a different name or check the spelling.
                </p>
              </div>
            ) : (
              <ul aria-label="Search results">
                {searchResults.map((u) => (
                  <li key={u.id}>
                    <button
                      id={`search-result-${u.id}`}
                      onClick={() => handleSelectUser(u)}
                      disabled={startingConv === u.id}
                      style={{ borderBottom: "1px solid var(--border)" }}
                      className="
                        w-full flex items-center gap-3 px-4 py-3
                        transition-colors text-left min-h-[60px]
                        disabled:opacity-60
                        focus:outline-none
                      "
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-elevated)"}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <div className="relative flex-shrink-0">
                        <Avatar src={u.profilePicture} name={u.name} size="sm" />
                        <OnlineDot userId={u.id} size="sm" className="absolute -bottom-0.5 -right-0.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{u.name}</p>
                        {u.branch && (
                          <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                            {u.branch}{u.semester ? ` · Sem ${u.semester}` : ""}
                          </p>
                        )}
                      </div>
                      {startingConv === u.id && (
                        <Loader2 size={14} className="animate-spin flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {/* ── Conversations list (default view) ────────────────────────────── */}
        {!searchQuery.trim() && (
          <>
            {loading ? (
              <ChatListSkeleton />
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: "var(--bg-elevated)" }}
                >
                  <MessageCircle size={28} style={{ color: "var(--text-secondary)" }} />
                </div>
                <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>No chats yet</p>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Find a student and say hi.</p>
              </div>
            ) : (
              <ul aria-label="Conversations">
                {conversations.map((conv) => {
                  const other       = getOtherUser(conv);
                  const lastMsg     = conv.lastMessage;
                  const previewText = lastMsg?.text ?? "Start a conversation";
                  const time        = formatPreviewTime(conv.updatedAt);

                  return (
                    <li key={conv._id}>
                      <button
                        id={`conv-${conv._id}`}
                        onClick={() => handleSelectConv(conv._id)}
                        style={{ borderBottom: "1px solid var(--border)" }}
                        className="
                          w-full flex items-center gap-3 px-4 py-3.5
                          transition-colors text-left min-h-[72px]
                          focus:outline-none
                        "
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-elevated)"}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                      >
                        <div className="relative flex-shrink-0">
                          <Avatar src={other?.profilePicture} name={other?.name ?? "?"} size="md" />
                          <OnlineDot userId={other?._id} size="sm" className="absolute -bottom-0.5 -right-0.5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="text-sm font-semibold truncate pr-2" style={{ color: "var(--text-primary)" }}>
                              {other?.name ?? "Unknown"}
                            </p>
                            <span className="text-[11px] flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                              {time}
                            </span>
                          </div>
                          <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                            {previewText}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ChatList;
