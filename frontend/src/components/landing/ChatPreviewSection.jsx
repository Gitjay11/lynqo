/**
 * ChatPreviewSection.jsx — Direct Messages Feature Showcase (Section 5)
 *
 * Background:  var(--bg-primary) with border-t border-[var(--border)]
 * Padding:     py-16 px-4
 * Container:   max-w-5xl mx-auto
 *
 * Layout:
 *   Mobile  → text first (order-first), chat below (order-last)
 *   Desktop → chat LEFT (lg:order-first), text RIGHT (lg:order-last)
 *
 * Note: No CTA link in this section — feature pills only (per spec).
 */

import { Send, MessageCircle } from "lucide-react";

// ── Fake chat messages ────────────────────────────────────────────────────────
// 4 messages alternating received / sent
const MESSAGES = [
  { type: "received", text: "Hey! Did you submit the project report?" },
  { type: "sent",     text: "Not yet, still working on it 😅" },
  { type: "received", text: "Let's finish it together tonight!" },
  { type: "sent",     text: "Yes! Library at 7pm? 📚" },
];

// ── Feature pill ──────────────────────────────────────────────────────────────
const FeaturePill = ({ emoji, text }) => (
  <span
    className="rounded-full px-3 py-1.5 text-xs font-medium flex items-center gap-1.5"
    style={{
      backgroundColor: "var(--bg-elevated)",
      border: "1px solid var(--border)",
      color: "var(--text-secondary)",
    }}
  >
    <span>{emoji}</span>
    <span>{text}</span>
  </span>
);

// ─────────────────────────────────────────────────────────────────────────────
const ChatPreviewSection = () => (
  <section
    id="chat"
    className="py-16 px-4"
    style={{
      backgroundColor: "var(--bg-primary)",
      borderTop: "1px solid var(--border)",
    }}
  >
    <div className="max-w-5xl mx-auto lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">

      {/* ── Text comes FIRST in DOM so it renders first on mobile naturally.
          On desktop (lg:grid), lg:order-2 pushes it to the right column. ── */}
      {/* RIGHT: Text content — rendered first in DOM (top on mobile) ───────── */}
      <div className="lg:order-2">

        {/* Badge */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
          style={{
            backgroundColor: "var(--accent-light)",
            border: "0.5px solid var(--accent-border)",
            color: "#9a3412",
          }}
        >
          <MessageCircle size={13} />
          Direct Messages
        </div>

        {/* Headline */}
        <h2
          className="text-3xl md:text-4xl font-black font-display mt-3 mb-2"
          style={{ color: "var(--text-primary)", letterSpacing: "-0.035em" }}
        >
          Talk to anyone on campus. Instantly.
        </h2>

        {/* Subtitle */}
        <p
          className="text-sm font-normal leading-relaxed mt-2"
          style={{ color: "var(--text-secondary)" }}
        >
          No number needed. Find any student and start chatting. See when they
          are online and typing.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 mt-4">
          <FeaturePill emoji="🟢" text="Online status" />
          <FeaturePill emoji="✍️" text="Typing indicators" />
          <FeaturePill emoji="💬" text="Instant delivery" />
        </div>

      </div>

      {/* ── LEFT: Mock chat UI — second in DOM (below text on mobile) ──────────
          On desktop (lg:grid), lg:order-1 places it in the left column. ── */}
      <div className="mt-10 lg:mt-0 lg:order-1">
        <div
          className="rounded-2xl p-4 max-w-sm mx-auto shadow-sm"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border)",
          }}
        >
          {/* Top bar — avatar, name, online indicator */}
          <div
            className="flex items-center gap-3 pb-3"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            {/* Avatar — RS in accent */}
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ backgroundColor: "#e8643a" }}
            >
              RS
            </div>
            {/* Name */}
            <span
              className="text-sm font-bold font-display flex-1"
              style={{ color: "var(--text-primary)" }}
            >
              Ritika Sharma
            </span>
            {/* Online dot + label */}
            <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
            <span className="text-xs font-medium text-green-500 ml-1">Online</span>
          </div>

          {/* Messages area — 4 alternating bubbles */}
          <div className="py-3 space-y-2">
            {MESSAGES.map((msg, i) =>
              msg.type === "received" ? (
                /* Received bubble */
                <div key={i} className="flex">
                  <p
                    className="text-xs px-3 py-2 rounded-2xl rounded-tl-sm"
                    style={{
                      maxWidth: "78%",
                      backgroundColor: "var(--bg-elevated)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {msg.text}
                  </p>
                </div>
              ) : (
                /* Sent bubble */
                <div key={i} className="flex justify-end">
                  <p
                    className="text-xs font-normal px-3 py-2 rounded-2xl rounded-tr-sm text-white"
                    style={{
                      maxWidth: "78%",
                      backgroundColor: "#e8643a",
                    }}
                  >
                    {msg.text}
                  </p>
                </div>
              )
            )}
          </div>

          {/* Input bar */}
          <div
            className="flex gap-2 pt-3 items-center"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            {/* Fake input */}
            <div
              className="flex-1 rounded-full px-3 py-2 text-xs font-normal select-none"
              style={{
                backgroundColor: "var(--bg-elevated)",
                color: "var(--text-muted)",
              }}
            >
              Type a message...
            </div>
            {/* Send button */}
            <button
              aria-label="Send message"
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 min-h-0"
              style={{ backgroundColor: "#e8643a" }}
            >
              <Send size={14} className="text-white" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

    </div>
  </section>
);

export default ChatPreviewSection;
