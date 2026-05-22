/**
 * MessageBubble.jsx — Chat Message Bubble
 *
 * Own messages  : right-aligned, brand-600 bg, white text, read receipt tick
 * Other messages: left-aligned, gray-100 bg, gray-900 text, sender avatar
 */

import { Check, CheckCheck } from "lucide-react";
import Avatar from "../common/Avatar.jsx";

// ── Timestamp helper ──────────────────────────────────────────────────────────
const formatTime = (dateString) => {
  if (!dateString) return "";
  const date  = new Date(dateString);
  const diffH = (Date.now() - date) / 3_600_000;
  return diffH < 24
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString([], { day: "numeric", month: "short" });
};

// ─────────────────────────────────────────────────────────────────────────────
const MessageBubble = ({ message, isOwn }) => {
  const { text, sender, createdAt, read, isOptimistic } = message;
  const time = formatTime(createdAt);

  // ── Own message ───────────────────────────────────────────────────────────
  if (isOwn) {
    return (
      <div className="flex justify-end mb-1 px-3">
        <div className="flex flex-col items-end max-w-[75%] sm:max-w-[60%]">
          <div
            className={`
              px-4 py-2.5 rounded-2xl rounded-br-md
              text-sm leading-relaxed shadow-sm
              ${isOptimistic
                ? "bg-brand-400 text-white opacity-70"
                : "bg-brand-600 text-white"}
            `}
          >
            {text}
          </div>

          {/* Time + read receipt */}
          <div className="flex items-center gap-1 mt-0.5 pr-0.5">
            <span className="text-[10px] text-gray-400">{time}</span>
            {/* Read receipt */}
            {!isOptimistic && (
              read
                ? <CheckCheck size={12} className="text-brand-400 flex-shrink-0" />
                : <Check      size={12} className="text-gray-400  flex-shrink-0" />
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Other person's message ────────────────────────────────────────────────
  return (
    <div className="flex items-end gap-2 mb-1 px-3">
      {/* Sender avatar */}
      <div className="flex-shrink-0 mb-4">
        <Avatar src={sender?.profilePicture} name={sender?.name ?? "?"} size="xs" />
      </div>

      <div className="flex flex-col items-start max-w-[75%] sm:max-w-[60%]">
        <div
          className="
            px-4 py-2.5 rounded-2xl rounded-bl-md
            bg-gray-100 text-gray-900
            text-sm leading-relaxed shadow-sm
          "
        >
          {text}
        </div>
        <span className="text-[10px] text-gray-400 mt-0.5 pl-1">{time}</span>
      </div>
    </div>
  );
};

export default MessageBubble;
