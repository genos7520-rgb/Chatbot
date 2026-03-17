"use client";

import { useEffect, useRef } from "react";
import type { AppState, Attachment } from "@/types";
import MessageBubble from "./MessageBubble";
import InputDock from "./InputDock";
import { WELCOME_CHIPS } from "@/lib/constants";
import { estimateTokens, estimateCost } from "@/lib/utils";

interface ChatMainProps {
  state: AppState;
  streamingText: string | null;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onSend: (text: string, attachments: Attachment[]) => void;
  onStop: () => void;
  onClearChat: () => void;
  onAddAttachments: (attachments: Attachment[]) => void;
  onRemoveAttachment: (id: number) => void;
  onOpenExport: () => void;
  onOpenSystemPrompt: () => void;
  onSelectModel: (model: string) => void;
  onOpenSettings: () => void;
  onRegenerate: () => void;
  onChipClick: (text: string) => void;
}

export default function ChatMain({
  state,
  streamingText,
  sidebarCollapsed,
  onToggleSidebar,
  onSend,
  onStop,
  onClearChat,
  onAddAttachments,
  onRemoveAttachment,
  onOpenExport,
  onOpenSystemPrompt,
  onSelectModel,
  onOpenSettings,
  onRegenerate,
  onChipClick,
}: ChatMainProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conv = state.currentConvId ? state.conversations[state.currentConvId] : null;
  const messages = conv?.messages || [];
  const showWelcome = messages.length === 0 && !state.isLoading;

  // Token counter
  const allText = messages.map((m) => m.content || "").join(" ") + (state.systemPrompt || "");
  const inputTok = estimateTokens(allText);
  const outputTok = messages
    .filter((m) => m.role === "assistant")
    .reduce((s, m) => s + estimateTokens(m.content), 0);
  const cost = estimateCost(inputTok, outputTok, state.model);
  const tokenLabel =
    inputTok >= 1000
      ? `${(inputTok / 1000).toFixed(1)}k tok${cost ? ` · ${cost}` : ""}`
      : `${inputTok} tok${cost ? ` · ${cost}` : ""}`;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, streamingText]);

  const handleChipClick = (text: string) => {
    onChipClick(text);
  };

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-bg-app">
      {/* Topbar */}
      <header className="flex items-center gap-3 px-[1.1rem] py-[0.7rem] border-b border-border bg-bg-app flex-shrink-0">
        <button
          onClick={onToggleSidebar}
          title="Toggle sidebar (Ctrl+B)"
          className="w-[30px] h-[30px] bg-transparent border border-transparent rounded-[7px] text-text-muted cursor-pointer flex items-center justify-center transition-all hover:bg-bg-sidebar-hover hover:border-border hover:text-text-secondary"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" />
          </svg>
        </button>

        <span className="text-[0.85rem] text-text-secondary whitespace-nowrap overflow-hidden text-ellipsis">
          {conv?.title || "New conversation"}
        </span>

        <div className="flex items-center gap-[0.35rem] ml-auto">
          {/* Token counter */}
          <div
            title="Estimated tokens / cost"
            className="flex items-center gap-[0.3rem] text-[0.72rem] text-text-muted px-[0.6rem] py-[0.28rem] bg-bg-chip border border-border rounded-full cursor-default whitespace-nowrap max-sm:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[11px] h-[11px] flex-shrink-0">
              <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
            </svg>
            <span>{tokenLabel}</span>
          </div>

          {/* System prompt indicator */}
          {state.systemPrompt && (
            <button
              onClick={onOpenSystemPrompt}
              title="System prompt active"
              className="w-[30px] h-[30px] bg-transparent border border-transparent rounded-[7px] text-accent cursor-pointer flex items-center justify-center transition-all hover:border-accent hover:bg-[rgba(217,119,87,0.07)]"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </button>
          )}

          <button
            onClick={onOpenExport}
            title="Export chat (Ctrl+E)"
            className="w-[30px] h-[30px] bg-transparent border border-transparent rounded-[7px] text-text-muted cursor-pointer flex items-center justify-center transition-all hover:bg-bg-sidebar-hover hover:border-border hover:text-text-secondary"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>

          <button
            onClick={onClearChat}
            title="Clear chat"
            className="w-[30px] h-[30px] bg-transparent border border-transparent rounded-[7px] text-text-muted cursor-pointer flex items-center justify-center transition-all hover:bg-bg-sidebar-hover hover:border-border hover:text-text-secondary"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
          </button>
        </div>
      </header>

      {/* System prompt banner */}
      {state.systemPrompt && (
        <div className="flex items-center gap-2 px-[1.1rem] py-[0.45rem] bg-[rgba(217,119,87,0.08)] border-b border-[rgba(217,119,87,0.2)] text-[0.78rem] text-accent flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 flex-shrink-0">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
            {state.systemPrompt.length > 60
              ? state.systemPrompt.slice(0, 60) + "…"
              : state.systemPrompt}
          </span>
          <button
            onClick={onOpenSystemPrompt}
            className="bg-transparent border-none cursor-pointer text-accent font-sans text-[0.75rem] px-[0.4rem] py-[0.1rem] rounded-[4px] transition-all hover:bg-[rgba(217,119,87,0.15)]"
          >
            Edit
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col py-6">
        {showWelcome ? (
          <div className="flex flex-col items-center justify-center flex-1 px-6 pt-12 pb-8 text-center animate-fadeIn">
            <h2 className="font-serif text-[2rem] font-medium text-text-primary tracking-[-0.02em] mb-8">
              How can I help you?
            </h2>
            <div className="flex flex-wrap gap-2 justify-center max-w-[560px] max-sm:flex-col max-sm:items-stretch">
              {WELCOME_CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => handleChipClick(chip.text)}
                  className="bg-[#22222a] border border-border rounded-full text-text-secondary font-sans text-[0.83rem] px-4 py-2 cursor-pointer transition-all hover:bg-bg-chip-hover hover:border-border-input hover:text-text-primary hover:-translate-y-px max-sm:rounded-md max-sm:text-left"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="group-container">
            {messages.map((msg, idx) => (
              <div key={idx} className="group">
                <MessageBubble
                  message={msg}
                  msgIdx={idx}
                  isLast={idx === messages.length - 1}
                  onRegenerate={idx === messages.length - 1 && msg.role === "assistant" ? onRegenerate : undefined}
                />
              </div>
            ))}

            {/* Streaming bubble */}
            {state.isLoading && streamingText !== null && (
              <div className="group">
                <MessageBubble
                  message={{ role: "assistant", content: streamingText || "", time: "" }}
                  msgIdx={messages.length}
                  isLast={true}
                  isStreaming={true}
                  streamingText={streamingText}
                />
              </div>
            )}

            {/* Typing indicator (before streaming starts) */}
            {state.isLoading && streamingText === null && (
              <div className="w-full px-[max(1.5rem,calc(50%-380px))]">
                <div className="flex gap-[0.85rem] items-start py-[0.6rem]">
                  <div className="w-7 h-7 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center bg-accent text-white">
                    <svg viewBox="0 0 56 40" fill="none" className="w-3.5 h-3.5">
                      <path d="M37.532 2H18.468C10.468 2 4 8.582 4 16.72v6.56C4 31.418 10.468 38 18.468 38h19.064C45.532 38 52 31.418 52 23.28V16.72C52 8.582 45.532 2 37.532 2Z" fill="white" opacity="0.9" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <div className="flex items-center gap-1 py-[0.4rem]">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-text-muted animate-typingBounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <InputDock
        state={state}
        onSend={onSend}
        onStop={onStop}
        onAddAttachments={onAddAttachments}
        onRemoveAttachment={onRemoveAttachment}
        onSelectModel={onSelectModel}
        onOpenSettings={onOpenSettings}
      />
    </main>
  );
}
