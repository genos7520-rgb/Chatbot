"use client";

import { useState, useEffect } from "react";
import { PERSONA_PRESETS } from "@/lib/constants";

interface SystemPromptModalProps {
  isOpen: boolean;
  currentPrompt: string;
  onSave: (prompt: string) => void;
  onClose: () => void;
}

export default function SystemPromptModal({
  isOpen,
  currentPrompt,
  onSave,
  onClose,
}: SystemPromptModalProps) {
  const [value, setValue] = useState(currentPrompt);
  const [activePreset, setActivePreset] = useState("");

  useEffect(() => {
    if (isOpen) {
      setValue(currentPrompt);
      const matched = PERSONA_PRESETS.find((p) => p.prompt === currentPrompt);
      setActivePreset(matched ? matched.label : "");
    }
  }, [isOpen, currentPrompt]);

  const handleSave = () => {
    onSave(value.trim());
    onClose();
  };

  const handleClear = () => {
    setValue("");
    setActivePreset("");
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-[16px] flex items-start justify-center z-[1000] overflow-y-auto p-8 animate-fadeIn"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative bg-bg-modal border border-border rounded-xl w-full max-w-[560px] p-9 shadow-[0_20px_60px_rgba(0,0,0,0.5)] animate-slideUp my-auto">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 w-7 h-7 bg-transparent border border-border rounded-[7px] text-text-muted cursor-pointer flex items-center justify-center transition-all hover:bg-bg-app hover:text-text-secondary hover:border-border-input"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="text-center mb-7">
          <h1 className="font-serif text-[1.6rem] font-medium text-text-primary tracking-[-0.02em] mb-1">System Prompt</h1>
          <p className="text-text-secondary text-[0.88rem]">Set a persona or instructions for the AI</p>
        </div>

        {/* Persona presets */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {PERSONA_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                setValue(preset.prompt);
                setActivePreset(preset.label);
              }}
              className={`bg-bg-chip border border-border rounded-full text-text-secondary font-sans text-[0.78rem] font-medium py-[0.3rem] px-[0.8rem] cursor-pointer transition-all hover:bg-[rgba(217,119,87,0.07)] hover:border-accent hover:text-accent ${
                activePreset === preset.label
                  ? "bg-[rgba(217,119,87,0.07)] border-accent text-accent"
                  : ""
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="mt-4 mb-4">
          <label className="block text-[0.75rem] font-medium text-text-secondary uppercase tracking-[0.06em] mb-1.5">
            Custom system prompt
          </label>
          <textarea
            value={value}
            onChange={(e) => { setValue(e.target.value); setActivePreset(""); }}
            rows={6}
            placeholder="You are a helpful assistant..."
            className="w-full bg-bg-app border border-border-input rounded-sm text-text-primary font-sans text-[0.9rem] py-[0.65rem] px-[0.85rem] outline-none transition-all focus:border-border-focus focus:shadow-[0_0_0_3px_rgba(196,168,130,0.2)] resize-y min-h-[120px] leading-relaxed"
          />
        </div>

        <div className="flex gap-2 justify-end mt-4">
          <button
            onClick={handleClear}
            className="bg-bg-chip text-text-secondary border border-border rounded-sm font-sans text-[0.9rem] font-medium py-[0.62rem] px-[1.4rem] cursor-pointer transition-all hover:bg-bg-chip-hover hover:text-text-primary"
          >
            Clear
          </button>
          <button
            onClick={handleSave}
            className="bg-accent text-white border-none rounded-sm font-sans text-[0.9rem] font-medium py-[0.62rem] px-[1.4rem] cursor-pointer transition-all hover:bg-accent-hover active:scale-[0.99]"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
