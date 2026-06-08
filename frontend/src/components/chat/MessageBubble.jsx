/**
 * MessageBubble.jsx — Chat Message Bubble (Themed)
 *
 * Own messages  : right-aligned, accent bg, white text
 * Other messages: left-aligned,  bg-elevated, text-primary
 */

import { CheckCheck, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// ─────────────────────────────────────────────────────────────────────────────
const MessageBubble = ({ message, isOwn }) => {
  const relTime = (() => {
    try {
      return formatDistanceToNow(new Date(message.createdAt), { addSuffix: true });
    } catch {
      return "";
    }
  })();

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-1 px-4`}>
      <div
        style={isOwn
          ? message.pending
            ? { backgroundColor: "var(--bg-elevated)", color: "var(--text-secondary)", opacity: 0.7 }
            : { backgroundColor: "var(--accent)",      color: "#ffffff" }
          : { backgroundColor: "var(--bg-elevated)",   color: "var(--text-primary)" }
        }
        className={`
          max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
          ${isOwn ? "rounded-tr-none" : "rounded-tl-none"}
        `}
      >
        <p className="break-words whitespace-pre-wrap">{message.text}</p>

        {/* Timestamp + read receipt (own messages only) */}
        {isOwn && (
          <div className="flex items-center justify-end gap-1 mt-1">
            <span className="text-[10px] select-none" style={{ opacity: 0.7 }}>{relTime}</span>
            {message.read
              ? <CheckCheck size={12} style={{ opacity: 0.7, flexShrink: 0 }} />
              : <Check      size={12} style={{ opacity: 0.7, flexShrink: 0 }} />
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
