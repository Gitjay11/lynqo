/**
 * MessageBubble.jsx — Chat Message Bubble (Dark Theme)
 *
 * Own messages  : right-aligned, zinc-100 bg (near-white), black text
 * Other messages: left-aligned,  zinc-700 bg, zinc-100 text
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
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-1`}>
      <div
        className={`
          max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
          ${isOwn
            ? message.pending
              ? "bg-zinc-300 text-zinc-600 opacity-70"
              : "bg-zinc-100 text-black"
            : "bg-zinc-700 text-zinc-100"
          }
          ${isOwn ? "rounded-tr-none" : "rounded-tl-none"}
        `}
      >
        <p className="break-words whitespace-pre-wrap">{message.text}</p>

        {/* Timestamp + read receipt (own messages only) */}
        {isOwn && (
          <div className="flex items-center justify-end gap-1 mt-1">
            <span className="text-[10px] text-zinc-500 select-none">{relTime}</span>
            {message.read
              ? <CheckCheck size={12} className="text-zinc-500 flex-shrink-0" />
              : <Check      size={12} className="text-zinc-500 flex-shrink-0" />
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
