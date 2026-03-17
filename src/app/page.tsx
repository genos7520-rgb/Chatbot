"use client";

import { useEffect, useState, useCallback } from "react";
import { useAppState } from "@/hooks/useAppState";
import SetupModal from "@/components/modals/SetupModal";
import SystemPromptModal from "@/components/modals/SystemPromptModal";
import ExportModal from "@/components/modals/ExportModal";
import Sidebar from "@/components/sidebar/Sidebar";
import ChatMain from "@/components/chat/ChatMain";
import Toast from "@/components/ui/Toast";
import type { Provider } from "@/types";

export default function Home() {
  const {
    state,
    appVisible,
    toast,
    streamingText,
    showToast,
    initFromStorage,
    enterApp,
    switchProvider,
    createNewConversation,
    loadConversation,
    deleteConversation,
    clearCurrentChat,
    saveSystemPrompt,
    addAttachments,
    removeAttachment,
    sendMessage,
    regenerateLastResponse,
    stopGeneration,
    exportChat,
    handleStart,
    updateState,
  } = useAppState();

  const [setupOpen, setSetupOpen] = useState(true);
  const [systemPromptOpen, setSystemPromptOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [initDone, setInitDone] = useState(false);

  // Store init values from localStorage for the modal
  const [initVals, setInitVals] = useState({
    provider: "anthropic" as Provider,
    apiKey: "",
    model: "claude-sonnet-4-6",
    runtime: "ollama",
    baseUrl: "http://localhost:11434",
    localModel: "",
  });

  useEffect(() => {
    const vals = initFromStorage();
    setInitVals({
      provider: (vals.sp as Provider) || "anthropic",
      apiKey: vals.sk || "",
      model: vals.sm || "claude-sonnet-4-6",
      runtime: vals.sr || "ollama",
      baseUrl: vals.su || "http://localhost:11434",
      localModel: vals.slm || "",
    });

    // Auto-enter if credentials exist
    if (vals.sk || vals.sp === "local") {
      setSetupOpen(false);
      enterApp();
    }
    setInitDone(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (e.key === "Escape") {
        setSystemPromptOpen(false);
        setExportOpen(false);
        return;
      }
      if (!mod) return;
      if (e.shiftKey && e.key === "N") { e.preventDefault(); createNewConversation(); return; }
      if (e.key === "b") { e.preventDefault(); setSidebarCollapsed((v) => !v); return; }
      if (e.key === "p") { e.preventDefault(); setSystemPromptOpen(true); return; }
      if (e.key === "e") { e.preventDefault(); setExportOpen(true); return; }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [createNewConversation]);

  const handleStartChat = useCallback(
    (opts: {
      provider: Provider;
      apiKey: string;
      model: string;
      localRuntime: string;
      localBaseUrl: string;
      localModel: string;
    }) => {
      const err = handleStart(opts);
      if (!err) {
        setSetupOpen(false);
      }
      return err;
    },
    [handleStart]
  );

  const handleChipClick = useCallback(
    (text: string) => {
      sendMessage(text, []);
    },
    [sendMessage]
  );

  const handleSelectModel = useCallback(
    (model: string) => {
      updateState({ model });
      localStorage.setItem("nc_model", model);
      showToast(`✓ Switched to ${model.split("/").pop()?.replace(":free", "")}`);
    },
    [updateState, showToast]
  );

  const handleClearChat = useCallback(() => {
    if (window.confirm("Clear this conversation?")) {
      clearCurrentChat();
    }
  }, [clearCurrentChat]);

  if (!initDone) return null;

  return (
    <>
      {/* Setup Modal */}
      <SetupModal
        isOpen={setupOpen}
        canClose={appVisible}
        initialProvider={initVals.provider}
        initialApiKey={initVals.apiKey}
        initialModel={initVals.model}
        initialRuntime={initVals.runtime}
        initialBaseUrl={initVals.baseUrl}
        initialLocalModel={initVals.localModel}
        onStart={handleStartChat}
        onClose={() => setSetupOpen(false)}
      />

      {/* System Prompt Modal */}
      <SystemPromptModal
        isOpen={systemPromptOpen}
        currentPrompt={state.systemPrompt}
        onSave={(prompt) => {
          saveSystemPrompt(prompt);
          showToast(prompt ? "✓ System prompt applied" : "System prompt cleared");
        }}
        onClose={() => setSystemPromptOpen(false)}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={exportOpen}
        onExport={exportChat}
        onClose={() => setExportOpen(false)}
      />

      {/* Main App */}
      {appVisible && (
        <div className="flex h-screen overflow-hidden">
          <Sidebar
            collapsed={sidebarCollapsed}
            state={state}
            onNewChat={createNewConversation}
            onLoadConversation={loadConversation}
            onDeleteConversation={deleteConversation}
            onSearchChange={(q) => updateState({ searchQuery: q.toLowerCase() })}
            onOpenSystemPrompt={() => setSystemPromptOpen(true)}
            onOpenSettings={() => setSetupOpen(true)}
          />

          <ChatMain
            state={state}
            streamingText={streamingText}
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
            onSend={sendMessage}
            onStop={stopGeneration}
            onClearChat={handleClearChat}
            onAddAttachments={addAttachments}
            onRemoveAttachment={removeAttachment}
            onOpenExport={() => setExportOpen(true)}
            onOpenSystemPrompt={() => setSystemPromptOpen(true)}
            onSelectModel={handleSelectModel}
            onOpenSettings={() => setSetupOpen(true)}
            onRegenerate={regenerateLastResponse}
            onChipClick={handleChipClick}
          />
        </div>
      )}

      {/* Toast */}
      <Toast message={toast?.msg ?? null} />
    </>
  );
}
