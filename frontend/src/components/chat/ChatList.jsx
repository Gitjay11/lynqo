/**
 * ChatList.jsx — Conversation Inbox + User Search
 *
 * Two modes in one component, toggled by whether searchQuery is non-empty:
 *
 *  Default mode (searchQuery empty):
 *   → Fetches GET /api/chat/conversations on mount
 *   → Lists conversations sorted by most-recent (server-sorted by updatedAt)
 *   → Each row shows: avatar + OnlineDot, name, last message preview, timestamp
 *   → Updates live: listens to "receive_message" socket event to refresh
 *     lastMessage preview without a full re-fetch
 *
 *  Search mode (searchQuery non-empty):
 *   → Debounced 400ms → GET /api/users/search?q=...
 *   → Lists matching users with their avatar and name
 *   → Clicking a result → POST /api/chat/conversation/:userId
 *                       → navigate to /chat/:convId
 *
 * Props:
 *  onSelectConv  {function}  — called with convId string; used by ChatPage on
 *                              mobile to switch panel without page navigation.
 *                              On desktop this is a no-op (navigation handles it).
 *
 * Data shapes expected:
 *  conversation: {
 *    _id, participants: [{ _id, name, profilePicture }],
 *    lastMessage: { text, createdAt } | null,
 *    updatedAt
 *  }
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MessageCircle, X, Loader2, Users } from "lucide-react";
import toast              from "react-hot-toast";
import { useAuth }        from "../../hooks/useAuth.js";
import { useSocket }      from "../../hooks/useSocket.js";
import api                from "../../api/axios.js";
import Avatar             from "../common/Avatar.jsx";
import OnlineDot          from "./OnlineDot.jsx";
import ChatListSkeleton   from "../common/ChatListSkeleton.jsx";

// ── Timestamp helper for last-message preview ─────────────────────────────────
const formatPreviewTime = (dateString) => {
  if (!dateString) return "";
  const date  = new Date(dateString);
  const now   = new Date();
  const diffH = (now - date) / (1000 * 60 * 60);

  if (diffH < 24)  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffH < 168) return date.toLocaleDateString([], { weekday: "short" }); // last 7 days
  return date.toLocaleDateString([], { day: "numeric", month: "short" });
};

// ─────────────────────────────────────────────────────────────────────────────
const ChatList = ({ onSelectConv }) => {
  const { user }            = useAuth();
  const { socket }          = useSocket();
  const navigate            = useNavigate();

  // ── State ─────────────────────────────────────────────────────────────────
  const [conversations,  setConversations]  = useState([]);
  const [searchQuery,    setSearchQuery]    = useState("");
  const [searchResults,  setSearchResults]  = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [searching,      setSearching]      = useState(false);
  const [startingConv,   setStartingConv]   = useState(null); // userId of in-flight conv

  const searchTimer = useRef(null); // debounce timer ref

  // ── Fetch conversations on mount ──────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/chat/conversations");
      setConversations(data.conversations ?? []);
    } catch (err) {
      console.error("[ChatList] Failed to fetch conversations:", err.message);
      toast.error(
        err?.response?.data?.message ||
          "Couldn’t load your conversations. Please refresh."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // ── Live: update lastMessage preview when a new message arrives ───────────
  // We listen to receive_message here (not just in ChatWindow) so that if
  // the user is looking at the ChatList while a message arrives in another
  // conversation, the preview and sort order update immediately.
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = ({ message }) => {
      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if (conv._id === message.conversation) {
            // Replace lastMessage and bubble this conv to the top
            return { ...conv, lastMessage: message, updatedAt: message.createdAt };
          }
          return conv;
        });
        // Re-sort by updatedAt descending (most recent first)
        return [...updated].sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        );
      });
    };

    socket.on("receive_message", handleNewMessage);
    return () => socket.off("receive_message", handleNewMessage);
  }, [socket]);

  // ── Search: debounced user lookup ─────────────────────────────────────────
  useEffect(() => {
    // Clear previous timer
    clearTimeout(searchTimer.current);

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    // Debounce: wait 400ms after the last keystroke before hitting the API
    searchTimer.current = setTimeout(async () => {
      try {
        setSearching(true);
        const { data } = await api.get("/users/search", {
          params: { q: searchQuery.trim() },
        });
        // Exclude ourselves from search results
        setSearchResults(
          (data.users ?? []).filter((u) => String(u.id) !== String(user?.id))
        );
      } catch (err) {
        console.error("[ChatList] Search error:", err.message);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(searchTimer.current);
  }, [searchQuery, user]);

  // ── Start or open a conversation with a search result user ───────────────
  const handleSelectUser = async (targetUser) => {
    try {
      setStartingConv(targetUser.id);
      const { data } = await api.post(`/chat/conversation/${targetUser.id}`);
      const convId   = data.conversation._id;

      // Clear search so we drop back to the list view
      setSearchQuery("");
      setSearchResults([]);

      // Let parent know (for mobile panel switching), then navigate
      onSelectConv?.(convId);
      navigate(`/chat/${convId}`);
    } catch (err) {
      console.error("[ChatList] Failed to start conversation:", err.message);
      toast.error(
        err?.response?.data?.message ||
          "Couldn’t open that conversation. Please try again."
      );
    } finally {
      setStartingConv(null);
    }
  };

  // ── Derive the "other user" from a conversation's participants ────────────
  const getOtherUser = (conv) =>
    conv.participants.find(
      (p) => String(p._id) !== String(user?.id)
    ) ?? conv.participants[0];

  // ── Handlers ──────────────────────────────────────────────────────────────
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
    <div className="flex flex-col h-full bg-white">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
        <h1 className="text-xl font-bold text-gray-900 mb-3">Messages</h1>

        {/* Search bar */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            id="chat-search"
            type="text"
            placeholder="Search people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="
              w-full h-11 pl-9 pr-9
              bg-gray-50 border border-gray-200 rounded-xl
              text-sm text-gray-900 placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
              transition duration-200
            "
            autoComplete="off"
          />
          {/* Clear button — only shown when there is text */}
          {searchQuery && (
            <button
              onClick={clearSearch}
              aria-label="Clear search"
              className="
                absolute right-2 top-1/2 -translate-y-1/2
                p-1.5 rounded-full text-gray-400
                hover:text-gray-600 hover:bg-gray-100
                transition-colors min-h-0
              "
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Scrollable body ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Search results ──────────────────────────────────────────────── */}
        {searchQuery.trim() && (
          <>
            {searching ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={20} className="animate-spin text-brand-500" />
              </div>
            ) : searchResults.length === 0 ? (
              /* ── No search results empty state ──────────────────────────── */
              <div className="flex flex-col items-center py-12 px-6 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <Search size={22} className="text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-600">No students found</p>
                <p className="text-xs text-gray-400 mt-1">
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
                      className="
                        w-full flex items-center gap-3 px-4 py-3
                        hover:bg-gray-50 active:bg-gray-100
                        transition-colors text-left min-h-[60px]
                        disabled:opacity-60
                      "
                    >
                      <div className="relative flex-shrink-0">
                        <Avatar src={u.profilePicture} name={u.name} size="sm" />
                        <OnlineDot
                          userId={u.id}
                          size="sm"
                          className="absolute -bottom-0.5 -right-0.5"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {u.name}
                        </p>
                        {u.branch && (
                          <p className="text-xs text-gray-400 truncate">
                            {u.branch}
                            {u.semester ? ` · Sem ${u.semester}` : ""}
                          </p>
                        )}
                      </div>
                      {startingConv === u.id && (
                        <Loader2 size={14} className="animate-spin text-brand-500 flex-shrink-0" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {/* ── Conversations list (default view) ───────────────────────────── */}
        {!searchQuery.trim() && (
          <>
            {loading ? (
              /* ── Skeleton rows while conversations load ──────────────────── */
              <ChatListSkeleton />
            ) : conversations.length === 0 ? (
              /* ── No conversations empty state ───────────────────────────── */
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mb-4">
                  <MessageCircle size={28} className="text-brand-400" />
                </div>
                <p className="text-gray-800 font-semibold mb-1">No chats yet</p>
                <p className="text-gray-400 text-sm">
                  Find a student and say hi.
                </p>
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
                        className="
                          w-full flex items-center gap-3 px-4 py-3.5
                          hover:bg-gray-50 active:bg-gray-100
                          transition-colors text-left min-h-[72px]
                          border-b border-gray-50 last:border-b-0
                        "
                      >
                        {/* Avatar + online dot */}
                        <div className="relative flex-shrink-0">
                          <Avatar
                            src={other?.profilePicture}
                            name={other?.name ?? "?"}
                            size="md"
                          />
                          <OnlineDot
                            userId={other?._id}
                            size="sm"
                            className="absolute -bottom-0.5 -right-0.5"
                          />
                        </div>

                        {/* Name + preview */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="text-sm font-semibold text-gray-900 truncate pr-2">
                              {other?.name ?? "Unknown"}
                            </p>
                            <span className="text-[11px] text-gray-400 flex-shrink-0">
                              {time}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">
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
