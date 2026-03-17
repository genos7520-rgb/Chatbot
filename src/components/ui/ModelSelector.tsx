"use client";

import { useState, useEffect, useRef } from "react";
import type { AppState, Model } from "@/types";
import { PROVIDERS } from "@/lib/constants";
import { getAllModelsFlat, getModelLabel } from "@/lib/utils";

interface ModelSelectorProps {
  state: AppState;
  onSelectModel: (model: string) => void;
  onOpenSettings: () => void;
}

export default function ModelSelector({ state, onSelectModel, onOpenSettings }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const label = getModelLabel(state.provider, state.model, state.localRuntime);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (m: Model) => {
    if (m.value === "__custom__") {
      setOpen(false);
      onOpenSettings();
      return;
    }
    onSelectModel(m.value);
    setOpen(false);
  };

  const renderDropdownItems = () => {
    if (state.provider === "local") {
      return (
        <div className="px-[0.85rem] py-[0.7rem] text-[0.78rem] text-text-muted">
          Model set in Settings for Local AI
        </div>
      );
    }
    const cfg = PROVIDERS[state.provider as keyof typeof PROVIDERS];
    if (!cfg) return null;

    if ("groups" in cfg && cfg.groups) {
      return cfg.groups.map((group) => (
        <div key={group.label}>
          <span className="block text-[0.64rem] font-semibold uppercase tracking-[0.08em] text-text-muted px-[0.65rem] py-[0.5rem] pb-[0.2rem] border-t border-border first:border-t-0 mt-[0.2rem] first:mt-0 pt-[0.55rem] first:pt-[0.5rem]">
            {group.label}
          </span>
          {group.models.map((m) => (
            <ModelItem key={m.value} model={m} active={state.model === m.value} onSelect={handleSelect} />
          ))}
        </div>
      ));
    }

    if ("models" in cfg && cfg.models) {
      return cfg.models.map((m) => (
        <ModelItem key={m.value} model={m} active={state.model === m.value} onSelect={handleSelect} />
      ));
    }
    return null;
  };

  return (
    <div className="relative flex-shrink-0" ref={wrapRef}>
      <button
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex items-center gap-[0.22rem] bg-transparent border-none font-sans text-[0.8rem] font-medium px-[0.35rem] py-[0.26rem] cursor-pointer rounded-[7px] transition-all whitespace-nowrap tracking-[-0.01em] ${
          open
            ? "bg-white/[0.08] text-text-primary"
            : "text-[#7a7880] hover:bg-white/[0.06] hover:text-text-secondary"
        }`}
      >
        <span className="tracking-[-0.01em]">{label}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`w-3 h-3 flex-shrink-0 transition-transform duration-[0.18s] ${open ? "rotate-180 text-text-secondary" : "text-[#555260]"}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute bottom-[calc(100%+8px)] right-0 min-w-[268px] max-w-[310px] bg-[#1e1e24] border border-[#3a3a44] rounded-md shadow-[0_-4px_28px_rgba(0,0,0,0.55),0_8px_32px_rgba(0,0,0,0.4)] py-[0.3rem] z-[200] overflow-hidden"
        >
          {renderDropdownItems()}
        </div>
      )}
    </div>
  );
}

function ModelItem({
  model,
  active,
  onSelect,
}: {
  model: Model;
  active: boolean;
  onSelect: (m: Model) => void;
}) {
  const icon = model.icon || { bg: "#252530", text: "#9e98a0", letter: "?" };
  return (
    <button
      onClick={() => onSelect(model)}
      className={`flex items-center gap-[0.6rem] w-full px-[0.6rem] py-[0.48rem] bg-transparent border-none rounded-sm cursor-pointer text-left transition-all text-inherit hover:bg-white/[0.05] ${
        active ? "bg-[rgba(217,119,87,0.15)]" : ""
      }`}
    >
      <div
        className="w-[26px] h-[26px] rounded-[6px] flex items-center justify-center flex-shrink-0 text-[0.68rem] font-bold"
        style={{ background: icon.bg, color: icon.text }}
      >
        {icon.letter}
      </div>
      <div className="flex flex-col gap-px min-w-0 flex-1">
        <span className={`text-[0.81rem] font-medium whitespace-nowrap overflow-hidden text-ellipsis leading-tight ${active ? "text-accent" : "text-text-primary"}`}>
          {model.label}
        </span>
        {model.desc && (
          <span className="text-[0.69rem] text-text-muted whitespace-nowrap overflow-hidden text-ellipsis leading-tight">
            {model.desc}
          </span>
        )}
      </div>
      {model.badge && (
        <span className={`text-[0.59rem] font-semibold px-[0.38rem] py-[0.1rem] rounded-full flex-shrink-0 uppercase tracking-[0.05em] border ${
          model.badge === "free" ? "bg-[rgba(39,174,96,0.15)] text-[#27ae60] border-[rgba(39,174,96,0.25)]" :
          model.badge === "fast" ? "bg-[rgba(52,152,219,0.15)] text-[#3498db] border-[rgba(52,152,219,0.25)]" :
          model.badge === "smart" ? "bg-[rgba(155,89,182,0.15)] text-[#9b59b6] border-[rgba(155,89,182,0.25)]" :
          "bg-[rgba(230,126,34,0.15)] text-[#e67e22] border-[rgba(230,126,34,0.25)]"
        }`}>
          {model.badge}
        </span>
      )}
      {active && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3 text-accent flex-shrink-0">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </button>
  );
}
