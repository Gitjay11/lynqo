/**
 * ChatPage.jsx — Chat Layout Orchestrator
 *
 * Mobile (< lg):
 *  - /chat           → <ChatList /> fills available height
 *  - /chat/:convId   → <ChatWindow /> renders as fixed inset-0 z-50 h-[100dvh]
 *                       (covers Navbar + BottomTabBar; ChatWindow manages its own
 *                        header and input clearance via pb-16 on the input bar)
 *
 * Desktop (lg+):
 *  - Two-panel side-by-side, always both visible
 *  - Left: ChatList (w-80, border-r)
 *  - Right: ChatWindow or empty-state placeholder
 *
 * Why fixed + h-[100dvh] on mobile?
 *  AppLayout adds pt-14 + pb-16 to its <main>. If ChatWindow sits inside that
 *  padded container, sticky bottom-0 attaches to the container bottom — not
 *  the viewport bottom — and the input can still be occluded by the browser
 *  chrome or BottomTabBar on short screens.
 *  By rendering the mobile ChatWindow as `fixed inset-0`, it escapes the
 *  padding context entirely and sticks to the true viewport edges.
 *  `h-[100dvh]` (dynamic viewport height) further prevents layout shifts
 *  caused by the browser URL bar appearing/disappearing on scroll.
 */

import { useParams, useNavigate } from "react-router-dom";
import { MessageCircle }          from "lucide-react";
import ChatList                   from "../components/chat/ChatList.jsx";
import ChatWindow                 from "../components/chat/ChatWindow.jsx";

// ── Desktop right-panel empty state ──────────────────────────────────────────
const NoConversationSelected = () => (
  <div className="flex flex-col items-center justify-center h-full text-center px-8 bg-zinc-950">
    <div className="w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center mb-5">
      <MessageCircle size={36} className="text-brand-400" />
    </div>
    <h2 className="text-zinc-100 font-semibold text-base mb-2">Select a conversation</h2>
    <p className="text-zinc-400 text-sm max-w-[200px]">
      Choose a thread on the left or search for a classmate to start chatting.
    </p>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
const ChatPage = () => {
  const { convId } = useParams();
  const navigate   = useNavigate();

  const handleSelectConv = (id) => navigate(`/chat/${id}`);

  return (
    <>
      {/* ════════════════════════════════════════════════════════════════════
          MOBILE LAYOUT
          ChatList: fills the space between Navbar and BottomTabBar.
          ChatWindow: fixed fullscreen overlay (h-[100dvh]) when convId set.
      ═════════════════════════════════════════════════════════════════════ */}

      {/* Mobile — ChatList */}
      <div
        className="
          lg:hidden flex flex-col overflow-hidden
          h-[calc(100dvh-3.5rem-3.5rem)]
        "
      >
        <ChatList onSelectConv={handleSelectConv} />
      </div>

      {/* Mobile — ChatWindow (full-screen fixed overlay) */}
      {convId && (
        <div className="lg:hidden fixed inset-0 z-50 h-[100dvh] flex flex-col">
          <ChatWindow convId={convId} />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          DESKTOP LAYOUT
          Two-panel, side-by-side. Hidden on mobile (lg:flex).
          Height: 100dvh minus Navbar (3.5rem). AppLayout adds lg:pb-0.
      ═════════════════════════════════════════════════════════════════════ */}
      <div
        className="
          hidden lg:flex overflow-hidden
          h-[calc(100dvh-3.5rem)]
        "
      >
        {/* Left panel — conversation list */}
        <div className="w-80 flex-shrink-0 border-r border-zinc-800 h-full overflow-hidden">
          <ChatList onSelectConv={handleSelectConv} />
        </div>

        {/* Right panel — active chat or empty state */}
        <div className="flex-1 h-full overflow-hidden">
          {convId
            ? <ChatWindow convId={convId} />
            : <NoConversationSelected />
          }
        </div>
      </div>
    </>
  );
};

export default ChatPage;
