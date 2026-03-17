"use client";

import type { ExportFormat } from "@/types";

interface ExportModalProps {
  isOpen: boolean;
  onExport: (format: ExportFormat) => void;
  onClose: () => void;
}

const EXPORT_OPTIONS: { id: ExportFormat; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    id: "md",
    label: "Markdown",
    desc: "Clean .md file for notes apps",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    id: "json",
    label: "JSON",
    desc: "Raw data for developers",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    id: "txt",
    label: "Plain Text",
    desc: "Simple .txt transcript",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
  {
    id: "html",
    label: "HTML",
    desc: "Formatted webpage",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
];

export default function ExportModal({ isOpen, onExport, onClose }: ExportModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-[16px] flex items-start justify-center z-[1000] overflow-y-auto p-8 animate-fadeIn"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative bg-bg-modal border border-border rounded-xl w-full max-w-[440px] p-9 shadow-[0_20px_60px_rgba(0,0,0,0.5)] animate-slideUp my-auto">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 w-7 h-7 bg-transparent border border-border rounded-[7px] text-text-muted cursor-pointer flex items-center justify-center transition-all hover:bg-bg-app hover:text-text-secondary hover:border-border-input"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="text-center mb-7">
          <h1 className="font-serif text-[1.6rem] font-medium text-text-primary tracking-[-0.02em] mb-1">Export Chat</h1>
          <p className="text-text-secondary text-[0.88rem]">Download your conversation</p>
        </div>

        <div className="flex flex-col gap-2">
          {EXPORT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => { onExport(opt.id); onClose(); }}
              className="flex items-center gap-[0.85rem] px-4 py-3 bg-bg-app border border-border rounded-md cursor-pointer transition-all text-left text-inherit hover:border-accent hover:bg-[rgba(217,119,87,0.07)] group"
            >
              <span className="w-[38px] h-[38px] rounded-sm bg-[#2a2a35] border border-border flex items-center justify-center flex-shrink-0 text-accent transition-all group-hover:bg-accent group-hover:text-white group-hover:border-accent">
                {opt.icon}
              </span>
              <span className="flex flex-col gap-px">
                <strong className="text-[0.88rem] font-medium text-text-primary">{opt.label}</strong>
                <small className="text-[0.74rem] text-text-muted">{opt.desc}</small>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
