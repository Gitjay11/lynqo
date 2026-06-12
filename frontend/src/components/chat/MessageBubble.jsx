/**
 * MessageBubble.jsx — Chat Message Bubble (Redesigned)
 *
 * Props:
 *  message       {object}  — message object from API/socket
 *  isSent        {boolean} — true when the message belongs to the current user
 *  showAvatar    {boolean} — show sender avatar on the last received msg in a group
 *  isLastInGroup {boolean} — whether this is the last consecutive msg from one sender
 *  otherUser     {object}  — peer user object (for avatar on received messages)
 */

import { useState } from "react";
import { Check, CheckCheck, X } from "lucide-react";
import Avatar from "../common/Avatar.jsx";

// ── Format createdAt → HH:MM ──────────────────────────────────────────────────
const formatTime = (dateString) => {
  if (!dateString) return "";
  try {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

// ─────────────────────────────────────────────────────────────────────────────
const MessageBubble = ({ message, isSent, showAvatar, isLastInGroup, otherUser }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const time = formatTime(message.createdAt);

  // Bubble border-radius: clip the corner closest to the avatar / sender edge
  const bubbleRadius = isSent
    ? "rounded-2xl rounded-tr-sm"   // sent:     top-right is clipped
    : "rounded-2xl rounded-tl-sm";  // received: top-left  is clipped

  return (
    <>
      {/* ── Image lightbox ──────────────────────────────────────────────────── */}
      {lightboxOpen && message.image && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors min-h-0"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close image preview"
          >
            <X size={20} />
          </button>
          <img
            src={message.image}
            alt="Full size message image"
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* ── Message row ─────────────────────────────────────────────────────── */}
      <div
        className={`flex items-end gap-2 animate-fade-in ${isSent ? "flex-row-reverse" : ""}`}
      >
        {/* Avatar placeholder (received messages only — keeps alignment consistent) */}
        {!isSent && (
          <div className="w-6 h-6 flex-shrink-0 mb-1">
            {showAvatar ? (
              <Avatar
                src={otherUser?.profilePicture}
                name={otherUser?.name ?? "?"}
                size="xs"
              />
            ) : null}
          </div>
        )}

        {/* ── Bubble content col ────────────────────────────────────────────── */}
        <div
          className={`flex flex-col max-w-[75%] ${isSent ? "items-end" : "items-start"}`}
        >
          {/* Shared image (if any) */}
          {message.image && (
            <button
              className="mb-1 min-h-0 rounded-xl overflow-hidden"
              onClick={() => setLightboxOpen(true)}
              aria-label="View full image"
            >
              <img
                src={message.image}
                alt="Shared image"
                className="w-full max-w-[240px] object-cover rounded-xl"
                style={{
                  aspectRatio: "16 / 9",
                  border: "1px solid var(--border)",
                }}
              />
            </button>
          )}

          {/* Text bubble */}
          {(message.text || !message.image) && (
            <div
              className={`px-4 py-2.5 text-sm leading-[1.65] break-words whitespace-pre-wrap shadow-sm ${bubbleRadius} ${
                message.isOptimistic ? "opacity-70" : ""
              }`}
              style={
                isSent
                  ? { backgroundColor: "var(--accent)", color: "#ffffff" }
                  : {
                      backgroundColor: "var(--bg-surface)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                    }
              }
            >
              {message.text}
            </div>
          )}

          {/* Timestamp + read receipt row */}
          <div
            className={`flex items-center gap-1 mt-1 ${isSent ? "flex-row-reverse mr-1" : "ml-1"}`}
          >
            <span className="text-[9px] tabular-nums" style={{ color: "var(--text-muted)" }}>
              {time}
            </span>

            {/* Read receipt — sent messages only */}
            {isSent && (
              message.read
                ? (
                  <CheckCheck
                    size={10}
                    style={{ color: "var(--accent)", flexShrink: 0 }}
                    aria-label="Read"
                  />
                )
                : (
                  <Check
                    size={10}
                    style={{ color: "var(--text-muted)", flexShrink: 0 }}
                    aria-label="Sent"
                  />
                )
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MessageBubble;
