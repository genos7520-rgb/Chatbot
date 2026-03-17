"use client";

import { useEffect, useRef, useState } from "react";
import type { Message, StoredAttachment } from "@/types";
import { parseMarkdown, extractHtml, downloadHtml, previewHtml, escapeHtml } from "@/lib/utils";

interface MessageBubbleProps {
  message: Message;
  msgIdx: number;
  isLast: boolean;
  isStreaming?: boolean;
  streamingText?: string;
  onRegenerate?: () => void;
}

export default function MessageBubble({
  message,
  msgIdx,
  isLast,
  isStreaming,
  streamingText,
  onRegenerate,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState<number | null>(null);

  const displayContent = isStreaming && streamingText !== undefined ? streamingText : message.content;
  const html = !isUser ? extractHtml(displayContent) : null;

  // Syntax highlighting after render
  useEffect(() => {
    if (!bubbleRef.current || isUser) return;
    const blocks = bubbleRef.current.querySelectorAll("pre code:not([data-highlighted])");
    if (blocks.length > 0 && typeof window !== "undefined" && (window as Window & { hljs?: { highlightElement: (el: Element) => void } }).hljs) {
      blocks.forEach((block) => {
        (window as Window & { hljs?: { highlightElement: (el: Element) => void } }).hljs!.highlightElement(block as HTMLElement);
        (block as HTMLElement).dataset.highlighted = "yes";
      });
    }
  }, [displayContent, isUser]);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleCopyCode = (idx: number, code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(idx);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  const renderAIContent = () => {
    const parsed = parseMarkdown(displayContent);
    // We need to post-process to add code block headers with copy buttons
    // We'll use dangerouslySetInnerHTML for the markdown content but add wrappers via DOM manipulation
    return parsed;
  };

  return (
    <div
      className={`w-full animate-msgIn ${isUser ? "" : ""}`}
      data-idx={msgIdx}
    >
      <div className={`flex gap-[0.85rem] items-start py-[0.6rem] ${isUser ? "flex-row-reverse" : ""} px-[max(1.5rem,calc(50%-380px))]`}>
        {/* Avatar */}
        <div
          className={`w-7 h-7 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center text-[0.7rem] font-semibold font-sans ${
            isUser
              ? "bg-[#2e2e3a] text-text-secondary border border-border"
              : "bg-accent text-white"
          }`}
        >
          {isUser ? (
            "You"
          ) : (
            <svg viewBox="0 0 56 40" fill="none" className="w-3.5 h-3.5">
              <path d="M37.532 2H18.468C10.468 2 4 8.582 4 16.72v6.56C4 31.418 10.468 38 18.468 38h19.064C45.532 38 52 31.418 52 23.28V16.72C52 8.582 45.532 2 37.532 2Z" fill="white" opacity="0.9" />
              <path d="M22 19.5L28 13L34 19.5L28 26L22 19.5Z" fill="white" />
            </svg>
          )}
        </div>

        {/* Body */}
        <div className={`flex-1 min-w-0 flex flex-col ${isUser ? "items-end" : ""}`}>
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {message.attachments.map((att, i) => (
                <AttachmentItem key={i} att={att} />
              ))}
            </div>
          )}

          {/* Bubble */}
          {isUser ? (
            <div className="bg-bg-user-msg border border-border rounded-[18px_18px_8px_18px] px-4 py-[0.7rem] max-w-[78%] text-[0.92rem] leading-[1.7] text-text-primary">
              {escapeHtml(displayContent).split("\n").map((line, i) => (
                <span key={i}>{line}{i < displayContent.split("\n").length - 1 && <br />}</span>
              ))}
            </div>
          ) : (
            <AIBubble
              ref={bubbleRef}
              content={renderAIContent()}
              isStreaming={isStreaming}
              onCopyCode={handleCopyCode}
              copiedCode={copiedCode}
            />
          )}

          {/* HTML actions */}
          {html && !isStreaming && (
            <div className="flex gap-2 mt-[0.65rem] flex-wrap">
              <button
                onClick={() => downloadHtml(html, `website-${Date.now()}.html`)}
                className="inline-flex items-center gap-1.5 font-sans text-[0.78rem] font-medium px-[0.85rem] py-[0.38rem] rounded-[8px] cursor-pointer transition-all border bg-accent text-white border-accent hover:bg-accent-hover hover:border-accent-hover hover:-translate-y-px hover:shadow-[0_3px_10px_rgba(217,119,87,0.35)]"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download .html
              </button>
              <button
                onClick={() => previewHtml(html)}
                className="inline-flex items-center gap-1.5 font-sans text-[0.78rem] font-medium px-[0.85rem] py-[0.38rem] rounded-[8px] cursor-pointer transition-all border bg-bg-chip text-text-secondary border-border hover:bg-bg-chip-hover hover:text-text-primary hover:-translate-y-px"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Preview
              </button>
            </div>
          )}

          {/* Message actions (AI only) */}
          {!isUser && !isStreaming && (
            <div className="flex gap-[0.3rem] mt-[0.45rem] opacity-0 group-hover:opacity-100 transition-opacity">
              {isLast && onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="flex items-center gap-[0.3rem] bg-transparent border border-border rounded-[6px] text-text-muted font-sans text-[0.7rem] px-2 py-[0.2rem] cursor-pointer transition-all hover:text-text-primary hover:bg-bg-chip hover:border-border-input"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[11px] h-[11px]">
                    <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.49" />
                  </svg>
                  Regenerate
                </button>
              )}
              <button
                onClick={handleCopyMessage}
                className={`flex items-center gap-[0.3rem] bg-transparent border rounded-[6px] font-sans text-[0.7rem] px-2 py-[0.2rem] cursor-pointer transition-all ${
                  copied
                    ? "text-[#27ae60] border-[#27ae60]"
                    : "border-border text-text-muted hover:text-text-primary hover:bg-bg-chip hover:border-border-input"
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[11px] h-[11px]">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>
          )}

          {/* Timestamp */}
          <div className={`text-[0.68rem] text-text-muted mt-[0.35rem] ${isUser ? "text-right pr-[0.2rem]" : "pl-[0.1rem]"}`}>
            {message.time}
          </div>
        </div>
      </div>
    </div>
  );
}

// AI bubble with code block handling
import { forwardRef } from "react";

const AIBubble = forwardRef<
  HTMLDivElement,
  {
    content: string;
    isStreaming?: boolean;
    onCopyCode: (idx: number, code: string) => void;
    copiedCode: number | null;
  }
>(({ content, isStreaming, onCopyCode, copiedCode }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Expose both refs
  useEffect(() => {
    if (typeof ref === "function") ref(containerRef.current);
    else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = containerRef.current;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Wrap code blocks with header
    const pres = container.querySelectorAll("pre:not([data-wrapped])");
    pres.forEach((pre, idx) => {
      const code = pre.querySelector("code");
      if (!code) return;
      const langMatch = code.className.match(/lang-(\w+)/);
      const lang = langMatch ? langMatch[1] : "";

      pre.setAttribute("data-wrapped", "true");

      const wrap = document.createElement("div");
      wrap.className = "code-block-wrap relative my-[0.65em]";

      const header = document.createElement("div");
      header.className = "flex items-center justify-between bg-[#1e1e2a] border border-border border-b-0 rounded-t-sm px-3 py-[0.4rem]";

      const langLabel = document.createElement("span");
      langLabel.className = "text-[0.7rem] text-text-muted font-mono uppercase tracking-[0.05em]";
      langLabel.textContent = lang || "code";

      const copyBtn = document.createElement("button");
      copyBtn.className = "flex items-center gap-[0.3rem] bg-transparent border border-border rounded-[5px] text-text-muted font-sans text-[0.7rem] font-medium px-2 py-[0.18rem] cursor-pointer transition-all hover:text-text-primary hover:bg-bg-chip hover:border-border-input";
      copyBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-[10px] h-[10px]"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy`;
      copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(code.textContent || "").then(() => {
          copyBtn.textContent = "✓ Copied!";
          copyBtn.style.color = "#27ae60";
          setTimeout(() => {
            copyBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-[10px] h-[10px]"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy`;
            copyBtn.style.color = "";
          }, 2000);
        });
      });

      header.appendChild(langLabel);
      header.appendChild(copyBtn);

      pre.parentNode?.insertBefore(wrap, pre);
      wrap.appendChild(header);
      wrap.appendChild(pre);

      // Round bottom of pre
      (pre as HTMLElement).style.cssText = "margin:0;border-radius:0 0 8px 8px;border-top:none;";
    });
  }, [content]);

  return (
    <div
      ref={containerRef}
      className="msg-bubble-ai text-[0.92rem] leading-[1.7] text-text-primary group"
      dangerouslySetInnerHTML={{
        __html: content + (isStreaming ? '<span class="inline-block w-0.5 h-[1em] bg-accent rounded-sm align-text-bottom ml-px animate-cursorBlink"></span>' : ""),
      }}
    />
  );
});
AIBubble.displayName = "AIBubble";

function AttachmentItem({ att }: { att: StoredAttachment }) {
  return (
    <div className="flex items-center gap-1.5 bg-[#22222a] border border-border rounded-[10px] px-[0.55rem] py-[0.3rem] pl-[0.4rem] max-w-[180px]">
      {att.isImage && att.dataUrl ? (
        <img src={att.dataUrl} alt={att.name} className="w-7 h-7 rounded-[5px] object-cover flex-shrink-0" />
      ) : (
        <span className="w-7 h-7 rounded-[5px] bg-[rgba(217,119,87,0.1)] flex items-center justify-center flex-shrink-0 text-accent">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </span>
      )}
      <span className="text-[0.72rem] text-text-secondary whitespace-nowrap overflow-hidden text-ellipsis max-w-[110px]">
        {att.name}
      </span>
    </div>
  );
}
