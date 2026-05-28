/**
 * ChatPreviewSection.jsx — Real-Time Chat Feature Showcase (Dark Theme)
 *
 * Background: bg-zinc-900
 * Mock chat card: bg-zinc-800
 * Sent bubble:     bg-zinc-100 text-black  (white/near-white)
 * Received bubble: bg-zinc-700 text-zinc-100
 */

import { Link } from "react-router-dom";
import { Send } from "lucide-react";

// ── Typing indicator — three staggered bouncing dots ─────────────────────────
const TypingIndicator = () => (
  <div className="flex gap-1 items-center px-4 py-2">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-2 h-2 rounded-full bg-zinc-500 inline-block"
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
    bg-zinc-800 border border-zinc-700 rounded-full
    px-4 py-2 text-sm text-zinc-300
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
      className="bg-zinc-900 border-t border-zinc-800 py-20 px-4"
    >
      <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">

        {/* ── LEFT: Mock chat UI ─────────────────────────────────────────────
            On mobile this renders AFTER the text (order-last),
            on lg it becomes the left column (lg:order-first).         ──── */}
        <div className="mt-10 lg:mt-0 lg:order-first order-last">
          <div className="bg-zinc-800 rounded-2xl shadow-xl shadow-black/40 p-4 max-w-sm mx-auto border border-zinc-700">

            {/* Top bar */}
            <div className="flex items-center gap-3 pb-3 border-b border-zinc-700">
              {/* Avatar — initials "RS" */}
              <div className="
                w-8 h-8 rounded-full bg-zinc-700
                flex items-center justify-center
                text-xs font-bold text-zinc-200
                flex-shrink-0
              ">
                RS
              </div>

              {/* Name */}
              <span className="font-semibold text-sm text-zinc-100 flex-1">
                Rahul Sharma
              </span>

              {/* Online dot — stays emerald */}
              <span className="w-2 h-2 rounded-full bg-emerald-500 ml-auto flex-shrink-0" />
            </div>

            {/* Messages area */}
            <div className="py-4 space-y-3">

              {/* Received bubble */}
              <div className="flex">
                <p className="
                  bg-zinc-700 text-zinc-100 text-sm
                  px-4 py-2 rounded-2xl rounded-tl-none
                  max-w-[80%]
                ">
                  Hey! Did you get the assignment for DSA?
                </p>
              </div>

              {/* Sent bubble — white/near-white */}
              <div className="flex justify-end">
                <p className="
                  bg-zinc-100 text-black text-sm
                  px-4 py-2 rounded-2xl rounded-tr-none
                  max-w-[80%]
                ">
                  Yeah, I'll share the notes with you
                </p>
              </div>

              {/* Received bubble */}
              <div className="flex">
                <p className="
                  bg-zinc-700 text-zinc-100 text-sm
                  px-4 py-2 rounded-2xl rounded-tl-none
                  max-w-[80%]
                ">
                  That would be great, thanks! 🙏
                </p>
              </div>

              {/* Typing indicator */}
              <div className="flex">
                <div className="bg-zinc-700 rounded-2xl rounded-tl-none">
                  <TypingIndicator />
                </div>
              </div>

            </div>

            {/* Input bar */}
            <div className="flex gap-2 pt-3 border-t border-zinc-700 items-center">
              {/* Fake text input */}
              <div className="
                flex-1 bg-zinc-900 rounded-full
                px-4 py-2 text-sm text-zinc-500
                select-none border border-zinc-700
              ">
                Type a message...
              </div>

              {/* Send button — white */}
              <button
                aria-label="Send message"
                className="
                  w-8 h-8 rounded-full bg-white
                  flex items-center justify-center
                  flex-shrink-0 min-h-0
                  hover:bg-zinc-100 transition-colors
                "
              >
                <Send size={14} className="text-black" strokeWidth={2.5} />
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
            bg-zinc-800 text-zinc-400 text-xs
            border border-zinc-700
            px-3 py-1.5 rounded-full
          ">
            ⚡ Real-time Chat
          </span>

          {/* Headline */}
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-50 mt-4">
            Talk to anyone on campus. Instantly.
          </h2>

          {/* Description */}
          <p className="text-zinc-400 mt-4 leading-relaxed">
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
              bg-white hover:bg-zinc-100 active:bg-zinc-200
              text-black font-semibold text-base
              rounded-full
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-950
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
