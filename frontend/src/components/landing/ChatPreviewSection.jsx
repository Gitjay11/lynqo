/**
 * ChatPreviewSection.jsx — Real-Time Chat Feature Showcase
 *
 * Background: bg-indigo-50
 * Padding:    py-20 px-4
 *
 * Layout:
 *  - Mobile: single column — text first, visual second
 *  - lg:     two-column grid, VISUAL LEFT / TEXT RIGHT (reversed from AnonymousSection)
 *            lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center max-w-6xl mx-auto
 *
 * Left — mock chat UI (pure HTML/CSS, no real data):
 *  - White card, top bar with avatar + name + online dot
 *  - 3 messages: received / sent / received
 *  - Typing indicator (3 bouncing dots with staggered delay)
 *  - Fake input bar with send button
 *
 * Right — text content:
 *  - Label pill (indigo-100)
 *  - Headline + description
 *  - 3 feature pills (white bordered, rounded-full)
 *  - Solid indigo CTA → /signup
 *
 * Mobile-first. All touch targets ≥ 44px.
 */

import { Link } from "react-router-dom";
import { Send } from "lucide-react";

// ── Typing indicator — three staggered bouncing dots ─────────────────────────
const TypingIndicator = () => (
  <div className="flex gap-1 items-center px-4 py-2">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-2 h-2 rounded-full bg-gray-300"
        style={{
          animation: "typing-bounce 1.2s ease-in-out infinite",
          animationDelay: `${i * 0.2}s`,
        }}
      />
    ))}
  </div>
);

// ── Feature pill ──────────────────────────────────────────────────────────────
const FeaturePill = ({ emoji, text }) => (
  <span className="
    bg-white border border-gray-200 rounded-full
    px-4 py-2 text-sm text-gray-700
    flex items-center gap-2
  ">
    <span>{emoji}</span>
    <span>{text}</span>
  </span>
);

// ─────────────────────────────────────────────────────────────────────────────
const ChatPreviewSection = () => {
  return (
    <section
      id="chat"
      className="bg-indigo-50 py-20 px-4"
    >
      <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">

        {/* ── LEFT: Mock chat UI ─────────────────────────────────────────────
            On mobile this renders AFTER the text (order-last),
            on lg it becomes the left column (lg:order-first).         ──── */}
        <div className="mt-10 lg:mt-0 lg:order-first order-last">
          <div className="bg-white rounded-2xl shadow-xl p-4 max-w-sm mx-auto">

            {/* Top bar */}
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              {/* Avatar — initials "RS" */}
              <div className="
                w-8 h-8 rounded-full bg-indigo-200
                flex items-center justify-center
                text-xs font-bold text-indigo-700
                flex-shrink-0
              ">
                RS
              </div>

              {/* Name */}
              <span className="font-semibold text-sm text-gray-800 flex-1">
                Rahul Sharma
              </span>

              {/* Online dot */}
              <span className="w-2 h-2 rounded-full bg-green-500 ml-auto flex-shrink-0" />
            </div>

            {/* Messages area */}
            <div className="py-4 space-y-3">

              {/* Received bubble */}
              <div className="flex">
                <p className="
                  bg-gray-100 text-gray-800 text-sm
                  px-4 py-2 rounded-2xl rounded-tl-none
                  max-w-[80%]
                ">
                  Hey! Did you get the assignment for DSA?
                </p>
              </div>

              {/* Sent bubble */}
              <div className="flex justify-end">
                <p className="
                  bg-indigo-500 text-white text-sm
                  px-4 py-2 rounded-2xl rounded-tr-none
                  max-w-[80%]
                ">
                  Yeah, I'll share the notes with you
                </p>
              </div>

              {/* Received bubble */}
              <div className="flex">
                <p className="
                  bg-gray-100 text-gray-800 text-sm
                  px-4 py-2 rounded-2xl rounded-tl-none
                  max-w-[80%]
                ">
                  That would be great, thanks! 🙏
                </p>
              </div>

              {/* Typing indicator */}
              <div className="flex">
                <div className="bg-gray-100 rounded-2xl rounded-tl-none">
                  <TypingIndicator />
                </div>
              </div>

            </div>

            {/* Input bar */}
            <div className="flex gap-2 pt-3 border-t border-gray-100 items-center">
              {/* Fake text input */}
              <div className="
                flex-1 bg-gray-100 rounded-full
                px-4 py-2 text-sm text-gray-400
                select-none
              ">
                Type a message...
              </div>

              {/* Send button */}
              <button
                aria-label="Send message"
                className="
                  w-8 h-8 rounded-full bg-indigo-500
                  flex items-center justify-center
                  flex-shrink-0 min-h-0
                  hover:bg-indigo-600 transition-colors
                "
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
          <span className="
            inline-block
            bg-indigo-100 text-indigo-700 text-xs
            px-3 py-1.5 rounded-full
          ">
            ⚡ Real-time Chat
          </span>

          {/* Headline */}
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4">
            Talk to anyone on campus. Instantly.
          </h2>

          {/* Description */}
          <p className="text-gray-600 mt-4 leading-relaxed">
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
              bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800
              text-white font-semibold text-base
              rounded-full
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2
            "
          >
            Start Chatting →
          </Link>

        </div>

      </div>
    </section>
  );
};

export default ChatPreviewSection;
