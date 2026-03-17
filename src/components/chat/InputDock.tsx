"use client";

import { useRef, useState, useEffect } from "react";
import type { AppState, Attachment } from "@/types";
import { formatBytes } from "@/lib/utils";
import ModelSelector from "@/components/ui/ModelSelector";

interface InputDockProps {
  state: AppState;
  onSend: (text: string, attachments: Attachment[]) => void;
  onStop: () => void;
  onAddAttachments: (attachments: Attachment[]) => void;
  onRemoveAttachment: (id: number) => void;
  onSelectModel: (model: string) => void;
  onOpenSettings: () => void;
}

export default function InputDock({
  state,
  onSend,
  onStop,
  onAddAttachments,
  onRemoveAttachment,
  onSelectModel,
  onOpenSettings,
}: InputDockProps) {
  const [text, setText] = useState("");
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const attachWrapRef = useRef<HTMLDivElement>(null);
  const inputCardRef = useRef<HTMLDivElement>(null);

  const hasContent = !!text.trim() || state.pendingAttachments.length > 0;
  const canSend = hasContent && !state.isLoading;

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [text]);

  // Close attach menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (attachWrapRef.current && !attachWrapRef.current.contains(e.target as Node)) {
        setAttachMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Drag and drop
  useEffect(() => {
    const card = inputCardRef.current;
    if (!card) return;
    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      card.style.borderColor = "#c4a882";
    };
    const onDragLeave = () => { card.style.borderColor = ""; };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      card.style.borderColor = "";
      if (e.dataTransfer?.files.length) {
        const files = Array.from(e.dataTransfer.files);
        handleFileSelection(files.filter((f) => f.type.startsWith("image/")), true);
        handleFileSelection(files.filter((f) => !f.type.startsWith("image/")), false);
      }
    };
    card.addEventListener("dragover", onDragOver);
    card.addEventListener("dragleave", onDragLeave);
    card.addEventListener("drop", onDrop);
    return () => {
      card.removeEventListener("dragover", onDragOver);
      card.removeEventListener("dragleave", onDragLeave);
      card.removeEventListener("drop", onDrop);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileSelection = (files: File[], isImage: boolean) => {
    const MAX_SIZE = 20 * 1024 * 1024;
    const newAttachments: Attachment[] = [];
    let pending = files.length;
    if (!pending) return;

    files.forEach((file) => {
      if (file.size > MAX_SIZE) { pending--; return; }
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const base64 = dataUrl.split(",")[1];
        newAttachments.push({
          id: Date.now() + Math.random(),
          name: file.name,
          size: formatBytes(file.size),
          type: file.type,
          isImage: isImage || file.type.startsWith("image/"),
          dataUrl,
          base64,
        });
        pending--;
        if (pending === 0) onAddAttachments(newAttachments);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSend = () => {
    if (!canSend) return;
    const msgText = text.trim();
    const attachments = [...state.pendingAttachments];
    setText("");
    onSend(msgText, attachments);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) handleSend();
    }
  };

  return (
    <div className="px-[max(1.5rem,calc(50%-380px))] pt-3 pb-4 flex-shrink-0 bg-bg-app">
      {/* Attachment previews */}
      {state.pendingAttachments.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-2">
          {state.pendingAttachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-1.5 bg-[#22222a] border border-border-input rounded-md px-[0.5rem] py-[0.35rem] pl-[0.45rem] max-w-[200px] animate-chipIn"
            >
              {att.isImage ? (
                <img src={att.dataUrl} alt={att.name} className="w-8 h-8 rounded-[6px] object-cover flex-shrink-0" />
              ) : (
                <span className="w-8 h-8 rounded-[6px] bg-[rgba(217,119,87,0.12)] border border-[rgba(217,119,87,0.2)] flex items-center justify-center flex-shrink-0 text-accent">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </span>
              )}
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[0.75rem] font-medium text-text-primary whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] leading-tight">{att.name}</span>
                <span className="text-[0.65rem] text-text-muted leading-tight">{att.size}</span>
              </div>
              <button
                onClick={() => onRemoveAttachment(att.id)}
                className="w-[18px] h-[18px] bg-transparent border-none rounded-full text-text-muted cursor-pointer flex items-center justify-center p-0 flex-shrink-0 transition-all hover:bg-[rgba(192,57,43,0.15)] hover:text-[#e05c4b]"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-2.5 h-2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".txt,.pdf,.doc,.docx,.csv,.json,.md,.py,.js,.ts,.html,.css,.xml,.yaml,.yml"
        className="hidden"
        onChange={() => { if (fileInputRef.current?.files) handleFileSelection(Array.from(fileInputRef.current.files), false); }}
      />
      <input
        ref={photoInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={() => { if (photoInputRef.current?.files) handleFileSelection(Array.from(photoInputRef.current.files), true); }}
      />

      {/* Input card */}
      <div
        ref={inputCardRef}
        className="bg-[#252529] border border-[#3a3a42] rounded-[18px] shadow-[0_2px_14px_rgba(0,0,0,0.3)] transition-all focus-within:border-[#4e4e5a] focus-within:shadow-[0_2px_20px_rgba(0,0,0,0.38)] relative"
      >
        {/* Textarea */}
        <div className="px-4 pt-3 pb-[0.25rem]">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Reply..."
            rows={1}
            maxLength={10000}
            className="w-full bg-transparent border-none outline-none font-sans text-[0.93rem] text-text-primary leading-[1.55] resize-none max-h-[200px] overflow-y-auto p-0 block placeholder:text-[#5a5860]"
          />
        </div>

        {/* Bottom toolbar */}
        <div className="flex items-center px-2 pt-[0.3rem] pb-[0.42rem] gap-[0.2rem]">
          {/* Attach button */}
          <div className="relative flex-shrink-0 flex items-center" ref={attachWrapRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setAttachMenuOpen(!attachMenuOpen); }}
              title="Add files or photos"
              className={`w-[30px] h-[30px] bg-transparent border-none rounded-[8px] cursor-pointer flex items-center justify-center flex-shrink-0 transition-all ${
                attachMenuOpen ? "bg-[rgba(217,119,87,0.15)] text-accent" : "text-[#666270] hover:bg-white/[0.07] hover:text-text-secondary"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`w-4 h-4 transition-transform duration-200 ${attachMenuOpen ? "rotate-45" : ""}`}
              >
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>

            {/* Attach menu */}
            {attachMenuOpen && (
              <div className="absolute bottom-[calc(100%+8px)] left-0 bg-[#1e1e26] border border-border-input rounded-md shadow-[0_8px_32px_rgba(0,0,0,0.45)] py-[0.3rem] min-w-[200px] z-50">
                <button
                  onClick={() => { setAttachMenuOpen(false); if (fileInputRef.current) { fileInputRef.current.value = ""; fileInputRef.current.click(); } }}
                  className="flex items-center gap-[0.7rem] w-full px-[0.65rem] py-[0.55rem] bg-transparent border-none rounded-sm cursor-pointer text-left transition-all text-inherit hover:bg-bg-sidebar-active"
                >
                  <span className="w-8 h-8 rounded-[8px] bg-[#2a2a35] border border-border flex items-center justify-center flex-shrink-0 text-text-secondary transition-all group-hover:bg-[rgba(217,119,87,0.07)]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />
                    </svg>
                  </span>
                  <span className="flex flex-col gap-px">
                    <strong className="text-[0.83rem] font-medium text-text-primary leading-tight">Upload file</strong>
                    <small className="text-[0.7rem] text-text-muted leading-tight">TXT, PDF, DOC, code…</small>
                  </span>
                </button>
                <button
                  onClick={() => { setAttachMenuOpen(false); if (photoInputRef.current) { photoInputRef.current.value = ""; photoInputRef.current.click(); } }}
                  className="flex items-center gap-[0.7rem] w-full px-[0.65rem] py-[0.55rem] bg-transparent border-none rounded-sm cursor-pointer text-left transition-all text-inherit border-t border-border mt-[0.15rem] pt-[0.55rem] hover:bg-bg-sidebar-active"
                >
                  <span className="w-8 h-8 rounded-[8px] bg-[#2a2a35] border border-border flex items-center justify-center flex-shrink-0 text-text-secondary">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </span>
                  <span className="flex flex-col gap-px">
                    <strong className="text-[0.83rem] font-medium text-text-primary leading-tight">Upload photo</strong>
                    <small className="text-[0.7rem] text-text-muted leading-tight">JPG, PNG, GIF, WEBP…</small>
                  </span>
                </button>
              </div>
            )}
          </div>

          <div className="flex-1" />

          {/* Model selector */}
          <ModelSelector
            state={state}
            onSelectModel={onSelectModel}
            onOpenSettings={onOpenSettings}
          />

          {/* Send / Stop */}
          <div className="flex items-center flex-shrink-0 gap-1">
            {state.isLoading ? (
              <button
                onClick={onStop}
                title="Stop generation"
                className="w-[30px] h-[30px] bg-[#2e2e38] border border-border rounded-full text-text-secondary cursor-pointer flex items-center justify-center transition-all hover:bg-[rgba(192,57,43,0.2)] hover:border-[#c0392b] hover:text-[#e05c4b]"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!canSend}
                className={`w-[30px] h-[30px] border-none rounded-full cursor-pointer flex items-center justify-center transition-all flex-shrink-0 ${
                  canSend
                    ? "bg-text-primary text-bg-app hover:bg-white scale-100 hover:scale-[1.06]"
                    : "bg-[#2e2e34] text-[#44424a] cursor-not-allowed"
                }`}
              >
                {hasContent ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="w-3.5 h-3.5">
                    <path d="M2 13h4l2-8 4 16 2-8h8" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="text-[0.68rem] text-text-muted text-center mt-2 max-sm:hidden">
        Neural AI can make mistakes. Verify important info.
      </p>
    </div>
  );
}
