"use client";

import type { AppState, Conversation } from "@/types";
import { getModelLabel } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  state: AppState;
  onNewChat: () => void;
  onLoadConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onSearchChange: (q: string) => void;
  onOpenSystemPrompt: () => void;
  onOpenSettings: () => void;
}

export default function Sidebar({
  collapsed,
  state,
  onNewChat,
  onLoadConversation,
  onDeleteConversation,
  onSearchChange,
  onOpenSystemPrompt,
  onOpenSettings,
}: SidebarProps) {
  const { conversations, currentConvId, searchQuery } = state;
  const modelLabel = getModelLabel(state.provider, state.model, state.localRuntime);

  const ids = Object.keys(conversations).reverse();
  const filtered = searchQuery
    ? ids.filter((id) =>
        (conversations[id]?.title || "").toLowerCase().includes(searchQuery)
      )
    : ids;

  return (
    <aside
      className={`flex flex-col bg-bg-sidebar border-r border-border overflow-hidden transition-[width,min-width] duration-[0.25s] ease-[cubic-bezier(0.4,0,0.2,1)] ${
        collapsed ? "w-0 min-w-0 border-r-0" : "w-[260px] min-w-[260px]"
      } max-sm:absolute max-sm:z-[100] max-sm:h-full max-sm:shadow-[4px_0_20px_rgba(0,0,0,0.08)]`}
      id="sidebar"
    >
      {/* Top */}
      <div className="flex items-center justify-between px-[0.9rem] pt-[0.9rem] pb-[0.7rem] flex-shrink-0">
        <div className="flex items-center gap-[0.55rem]">
          <span className="font-serif text-[1rem] font-medium text-text-primary whitespace-nowrap">Neural AI</span>
        </div>
        <button
          onClick={onNewChat}
          title="New chat (Ctrl+Shift+N)"
          className="w-[30px] h-[30px] bg-transparent border border-border rounded-[7px] text-text-secondary cursor-pointer flex items-center justify-center flex-shrink-0 transition-all hover:bg-bg-sidebar-active hover:text-text-primary hover:border-border-input"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 mx-3 mb-2 bg-white/[0.04] border border-border rounded-sm px-[0.65rem] py-[0.45rem]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 text-text-muted flex-shrink-0">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search conversations…"
          autoComplete="off"
          className="bg-transparent border-none outline-none font-sans text-[0.82rem] text-text-primary w-full placeholder:text-text-placeholder"
        />
      </div>

      {/* Section label */}
      <div className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-text-muted px-4 pb-[0.4rem] flex-shrink-0">
        Recents
      </div>

      {/* Chat history */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {filtered.length === 0 ? (
          <div className="px-4 py-4 text-center text-[0.78rem] text-text-muted">
            {searchQuery ? "No matching conversations" : "No conversations yet"}
          </div>
        ) : (
          filtered.map((id) => {
            const conv: Conversation = conversations[id];
            return (
              <div
                key={id}
                onClick={() => onLoadConversation(id)}
                className={`flex items-center gap-[0.3rem] px-[0.6rem] py-2 rounded-sm cursor-pointer text-text-secondary text-[0.845rem] transition-all mb-px min-w-0 group ${
                  id === currentConvId
                    ? "bg-bg-sidebar-active text-text-primary font-medium"
                    : "hover:bg-bg-sidebar-hover hover:text-text-primary"
                }`}
              >
                <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
                  {conv.title || "New conversation"}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteConversation(id); }}
                  title="Delete"
                  className="flex-shrink-0 w-[22px] h-[22px] bg-transparent border-none rounded-[5px] text-transparent cursor-pointer flex items-center justify-center p-[3px] transition-all group-hover:text-text-muted hover:!bg-[rgba(192,57,43,0.1)] hover:!text-[#c0392b]"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4h6v2" />
                  </svg>
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-3 pt-3 pb-3 border-t border-border flex-shrink-0 flex flex-col gap-[0.35rem]">
        <div className="text-[0.75rem] text-text-muted px-[0.2rem] pb-[0.2rem] whitespace-nowrap overflow-hidden text-ellipsis">
          {state.provider === "local" && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#27ae60] mr-1 animate-pulseDot" />
          )}
          {modelLabel}
        </div>

        <div className="flex gap-[0.35rem]">
          <button
            onClick={onOpenSystemPrompt}
            title="System prompt"
            className="flex-1 bg-transparent border border-border rounded-sm text-text-secondary font-sans text-[0.8rem] font-normal px-[0.7rem] py-[0.48rem] cursor-pointer flex items-center gap-[0.45rem] transition-all hover:bg-bg-sidebar-active hover:text-text-primary"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            Persona
          </button>
        </div>

        <button
          onClick={onOpenSettings}
          className="w-full bg-transparent border border-border rounded-sm text-text-secondary font-sans text-[0.8rem] font-normal px-[0.7rem] py-[0.48rem] cursor-pointer flex items-center gap-[0.45rem] transition-all hover:bg-bg-sidebar-active hover:text-text-primary"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M16.24 7.76a6 6 0 0 1 0 8.49M4.93 4.93a10 10 0 0 0 0 14.14M7.76 7.76a6 6 0 0 0 0 8.49" />
          </svg>
          Settings
        </button>
      </div>
    </aside>
  );
}
