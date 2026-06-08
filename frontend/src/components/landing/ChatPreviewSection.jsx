/**
 * ChatPreviewSection.jsx — Real-Time Chat Feature Showcase (Theme-Aware)
 *
 * Background: bg-bg-surface border-t border-app-border
 * Mock chat card: bg-bg-elevated border-app-border
 * Sent bubble:     bg-accent text-white
 * Received bubble: bg-bg-primary text-text-primary
 */

import { Link } from "react-router-dom";
import { Send } from "lucide-react";

// ── Typing indicator — three staggered bouncing dots ─────────────────────────
const TypingIndicator = () => (
  <div className="flex gap-1 items-center px-4 py-2">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-2 h-2 rounded-full inline-block"
        style={{
          backgroundColor: "var(--text-muted)",
          animation: "typing-bounce 1.2s ease-in-out infinite",
          animationDelay: `${i * 0.2}s`,
        }}
      />
    ))}
  </div>
);

// ── Feature pill ──────────────────────────────────────────────────────────────
const FeaturePill = ({ emoji, text }) => (
  <span
    className="rounded-full px-4 py-2 text-sm flex items-center gap-2"
    style={{
      backgroundColor: "var(--bg-primary)",
      border: "1px solid var(--border)",
      color: "var(--text-secondary)",
    }}
  >
    <span>{emoji}</span>
    <span>{text}</span>
  </span>
);

// ─────────────────────────────────────────────────────────────────────────────
const ChatPreviewSection = () => {
  return (
    <section
      id="chat"
      className="py-20 px-4"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">

        {/* ── LEFT: Mock chat UI ─────────────────────────────────────────────
            On mobile this renders AFTER the text (order-last),
            on lg it becomes the left column (lg:order-first).         ──── */}
        <div className="mt-10 lg:mt-0 lg:order-first order-last">
          <div
            className="rounded-2xl shadow-xl p-4 max-w-sm mx-auto"
            style={{
              backgroundColor: "var(--bg-elevated)",
              border: "1px solid var(--border)",
            }}
          >

            {/* Top bar */}
            <div
              className="flex items-center gap-3 pb-3"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              {/* Avatar — initials "RS" */}
              <div
                className="
                  w-8 h-8 rounded-full
                  flex items-center justify-center
                  text-xs font-bold
                  flex-shrink-0
                "
                style={{ backgroundColor: "var(--bg-surface)", color: "var(--text-secondary)" }}
              >
                RS
              </div>

              {/* Name */}
              <span className="font-semibold text-sm flex-1" style={{ color: "var(--text-primary)" }}>
                Rahul Sharma
              </span>

              {/* Online dot — stays emerald (semantic, not themed) */}
              <span className="w-2 h-2 rounded-full bg-emerald-500 ml-auto flex-shrink-0" />
            </div>

            {/* Messages area */}
            <div className="py-4 space-y-3">

              {/* Received bubble */}
              <div className="flex">
                <p
                  className="text-sm px-4 py-2 rounded-2xl rounded-tl-none max-w-[80%]"
                  style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}
                >
                  Hey! Did you get the assignment for DSA?
                </p>
              </div>

              {/* Sent bubble — accent */}
              <div className="flex justify-end">
                <p
                  className="text-sm px-4 py-2 rounded-2xl rounded-tr-none max-w-[80%]"
                  style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
                >
                  Yeah, I'll share the notes with you
                </p>
              </div>

              {/* Received bubble */}
              <div className="flex">
                <p
                  className="text-sm px-4 py-2 rounded-2xl rounded-tl-none max-w-[80%]"
                  style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}
                >
                  That would be great, thanks! 🙏
                </p>
              </div>

              {/* Typing indicator */}
              <div className="flex">
                <div
                  className="rounded-2xl rounded-tl-none"
                  style={{ backgroundColor: "var(--bg-primary)" }}
                >
                  <TypingIndicator />
                </div>
              </div>

            </div>

            {/* Input bar */}
            <div
              className="flex gap-2 pt-3 items-center"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              {/* Fake text input */}
              <div
                className="
                  flex-1 rounded-full
                  px-4 py-2 text-sm
                  select-none
                "
                style={{
                  backgroundColor: "var(--bg-primary)",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                }}
              >
                Type a message...
              </div>

              {/* Send button — accent */}
              <button
                aria-label="Send message"
                className="
                  w-8 h-8 rounded-full
                  flex items-center justify-center
                  flex-shrink-0 min-h-0
                  transition-colors
                "
                style={{ backgroundColor: "var(--accent)" }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--accent-hover)"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "var(--accent)"}
              >
                <Send size={14} className="text-white" strokeWidth={2.5} />
              </button>
            </div>

          </div>
        </div>

        {/* ── RIGHT: Text content ──────────────────────────────────────────────
            On mobile renders FIRST (order-first),
            on lg sits to the right of the chat card (lg:order-last).  ──── */}
        <div className="order-first lg:order-last">

          {/* Label pill */}
          <span
            className="inline-block text-xs px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: "var(--bg-primary)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            ⚡ Real-time Chat
          </span>

          {/* Headline */}
          <h2 className="text-3xl md:text-4xl font-bold mt-4" style={{ color: "var(--text-primary)" }}>
            Talk to anyone on campus. Instantly.
          </h2>

          {/* Description */}
          <p className="mt-4 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            No phone numbers needed. Find any student by name and start chatting.
            See when they are online and when they are typing.
          </p>

          {/* Feature pills */}
          <div className="mt-6 flex flex-wrap gap-3">
            <FeaturePill emoji="🟢" text="Online status" />
            <FeaturePill emoji="✍️" text="Typing indicators" />
            <FeaturePill emoji="💬" text="Instant delivery" />
          </div>

          {/* CTA */}
          <Link
            to="/signup"
            id="chat-cta-signup"
            className="
              inline-flex items-center justify-center
              min-h-[48px] px-6 py-3 mt-8
              text-white font-semibold text-base
              rounded-full
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-2
            "
            style={{ backgroundColor: "var(--accent)" }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--accent-hover)"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "var(--accent)"}
          >
            Start Chatting →
          </Link>

        </div>

      </div>
    </section>
  );
};

export default ChatPreviewSection;
