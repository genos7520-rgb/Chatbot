"use client";

import { useState, useRef, useCallback } from "react";
import type {
  AppState,
  Attachment,
  Conversation,
  ExportFormat,
  Message,
  Provider,
} from "@/types";
import { callAI } from "@/lib/api";
import {
  formatTime,
  isEmbeddingModel,
  buildExportContent,
  downloadContent,
} from "@/lib/utils";
import { LOCAL_RUNTIMES, PROVIDERS } from "@/lib/constants";

const DEFAULT_STATE: AppState = {
  provider: "anthropic",
  apiKey: "",
  model: "claude-sonnet-4-6",
  localRuntime: "ollama",
  localBaseUrl: "http://localhost:11434",
  conversations: {},
  currentConvId: null,
  isLoading: false,
  searchQuery: "",
  systemPrompt: "",
  pendingAttachments: [],
  abortController: null,
};

export function useAppState() {
  const [state, setStateRaw] = useState<AppState>(DEFAULT_STATE);
  const stateRef = useRef<AppState>(DEFAULT_STATE);

  const [appVisible, setAppVisible] = useState(false);
  const [toast, setToast] = useState<{ msg: string; id: number } | null>(null);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setState = useCallback((updater: (prev: AppState) => AppState) => {
    setStateRaw((prev) => {
      const next = updater(prev);
      stateRef.current = next;
      return next;
    });
  }, []);

  // =====================
  // TOAST
  // =====================
  const showToast = useCallback((msg: string) => {
    setToast({ msg, id: Date.now() });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2200);
  }, []);

  // =====================
  // STORAGE
  // =====================
  const saveConversations = useCallback((convs: Record<string, Conversation>) => {
    localStorage.setItem("nc_conversations", JSON.stringify(convs));
  }, []);

  const initFromStorage = useCallback(() => {
    const sp = localStorage.getItem("nc_provider") || "anthropic";
    const sk = localStorage.getItem("nc_api_key") || "";
    const sm = localStorage.getItem("nc_model") || "claude-sonnet-4-6";
    const sr = localStorage.getItem("nc_local_runtime") || "ollama";
    const su = localStorage.getItem("nc_local_url") || "";
    const slm = localStorage.getItem("nc_local_model") || "";
    const sc = localStorage.getItem("nc_conversations") || "{}";
    const ssp = localStorage.getItem("nc_system_prompt") || "";
    let conversations: Record<string, Conversation> = {};
    try { conversations = JSON.parse(sc); } catch {}
    setState((prev) => ({
      ...prev,
      provider: sp as Provider,
      apiKey: sk,
      model: slm || sm,
      localRuntime: sr as AppState["localRuntime"],
      localBaseUrl: su || "http://localhost:11434",
      conversations,
      systemPrompt: ssp,
    }));
    return { sp, sk, sm, sr, su, slm };
  }, [setState]);

  // =====================
  // ENTER APP
  // =====================
  const enterApp = useCallback((updatedState?: Partial<AppState>) => {
    setState((prev) => {
      const next = updatedState ? { ...prev, ...updatedState } : prev;
      const ids = Object.keys(next.conversations);
      let currentConvId = next.currentConvId;
      let conversations = { ...next.conversations };
      if (ids.length === 0) {
        const newId = "conv_" + Date.now();
        conversations = { [newId]: { title: "New conversation", messages: [] } };
        currentConvId = newId;
        saveConversations(conversations);
      } else if (!currentConvId || !conversations[currentConvId]) {
        currentConvId = ids[ids.length - 1];
      }
      return { ...next, conversations, currentConvId };
    });
    setAppVisible(true);
  }, [setState, saveConversations]);

  // =====================
  // PROVIDER / RUNTIME
  // =====================
  const switchProvider = useCallback((provider: Provider) => {
    setState((prev) => {
      let model = prev.model;
      if (provider !== "local") {
        const cfg = PROVIDERS[provider as keyof typeof PROVIDERS];
        if ("groups" in cfg && cfg.groups) model = cfg.groups[0].models[0].value;
        else if ("models" in cfg && cfg.models) model = cfg.models[0].value;
      }
      return { ...prev, provider, model };
    });
  }, [setState]);

  const switchRuntime = useCallback((runtime: AppState["localRuntime"]) => {
    const cfg = LOCAL_RUNTIMES[runtime];
    setState((prev) => ({ ...prev, localRuntime: runtime, localBaseUrl: cfg.defaultUrl }));
  }, [setState]);

  // =====================
  // CONVERSATIONS
  // =====================
  const createNewConversation = useCallback(() => {
    const id = "conv_" + Date.now();
    setState((prev) => {
      const convs = { ...prev.conversations, [id]: { title: "New conversation", messages: [] } };
      saveConversations(convs);
      return { ...prev, conversations: convs, currentConvId: id };
    });
  }, [setState, saveConversations]);

  const loadConversation = useCallback((id: string) => {
    setState((prev) => ({ ...prev, currentConvId: id }));
  }, [setState]);

  const deleteConversation = useCallback((id: string) => {
    setState((prev) => {
      const convs = { ...prev.conversations };
      delete convs[id];
      const rem = Object.keys(convs);
      let currentConvId = prev.currentConvId;
      if (currentConvId === id) {
        if (rem.length > 0) currentConvId = rem[rem.length - 1];
        else {
          const newId = "conv_" + Date.now();
          convs[newId] = { title: "New conversation", messages: [] };
          currentConvId = newId;
        }
      }
      saveConversations(convs);
      return { ...prev, conversations: convs, currentConvId };
    });
  }, [setState, saveConversations]);

  const clearCurrentChat = useCallback(() => {
    setState((prev) => {
      if (!prev.currentConvId) return prev;
      const convs = {
        ...prev.conversations,
        [prev.currentConvId]: { title: "New conversation", messages: [] },
      };
      saveConversations(convs);
      return { ...prev, conversations: convs };
    });
  }, [setState, saveConversations]);

  // =====================
  // SYSTEM PROMPT
  // =====================
  const saveSystemPrompt = useCallback((prompt: string) => {
    localStorage.setItem("nc_system_prompt", prompt);
    setState((prev) => ({ ...prev, systemPrompt: prompt }));
  }, [setState]);

  // =====================
  // ATTACHMENTS
  // =====================
  const addAttachments = useCallback((attachments: Attachment[]) => {
    setState((prev) => ({
      ...prev,
      pendingAttachments: [...prev.pendingAttachments, ...attachments],
    }));
  }, [setState]);

  const removeAttachment = useCallback((id: number) => {
    setState((prev) => ({
      ...prev,
      pendingAttachments: prev.pendingAttachments.filter((a) => a.id !== id),
    }));
  }, [setState]);

  // =====================
  // SEND MESSAGE
  // =====================
  const sendMessage = useCallback(async (text: string, attachments: Attachment[]) => {
    const s = stateRef.current;
    if ((!text.trim() && attachments.length === 0) || s.isLoading || !s.currentConvId) return;
    const conv = s.conversations[s.currentConvId];
    if (!conv) return;

    const convId = s.currentConvId;
    const userTime = formatTime(new Date());
    const attForStorage = attachments.map((a) => ({
      name: a.name, size: a.size, type: a.type, isImage: a.isImage,
      dataUrl: a.isImage ? a.dataUrl : null,
    }));
    const userMsg: Message = {
      role: "user",
      content: text || "[Attached files]",
      time: userTime,
      attachments: attForStorage,
    };

    let title = conv.title;
    if (conv.messages.filter((m) => m.role === "user").length === 0) {
      const t = text || (attachments.length > 0 ? `📎 ${attachments[0].name}` : "New conversation");
      title = t.length > 42 ? t.slice(0, 42) + "…" : t;
    }
    const msgs = [...conv.messages, userMsg];

    setState((prev) => {
      const convs = { ...prev.conversations, [convId]: { title, messages: msgs } };
      return { ...prev, conversations: convs, pendingAttachments: [], isLoading: true };
    });

    const controller = new AbortController();
    setState((prev) => ({ ...prev, abortController: controller }));
    setStreamingText(null);

    try {
      const s2 = stateRef.current;
      let started = false;
      const response = await callAI(
        s2.provider, msgs, attachments, s2.apiKey, s2.model, s2.systemPrompt,
        s2.localRuntime, s2.localBaseUrl,
        {
          onChunk: (chunk) => {
            if (!started) { started = true; }
            setStreamingText(chunk);
          },
          signal: controller.signal,
        }
      );
      setStreamingText(null);
      setState((prev) => {
        const c = prev.conversations[convId];
        if (!c) return { ...prev, isLoading: false, abortController: null };
        const aiMsg: Message = { role: "assistant", content: response, time: formatTime(new Date()) };
        const convs = { ...prev.conversations, [convId]: { ...c, messages: [...c.messages, aiMsg] } };
        saveConversations(convs);
        return { ...prev, conversations: convs, isLoading: false, abortController: null };
      });
    } catch (err) {
      setStreamingText(null);
      const error = err as Error;
      if (error.name === "AbortError") {
        setState((prev) => { saveConversations(prev.conversations); return { ...prev, isLoading: false, abortController: null }; });
        return;
      }
      let msg = error.message || "Something went wrong.";
      const lm = msg.toLowerCase();
      if (lm.includes("failed to fetch")) msg = "Cannot reach server. Make sure it is running.";
      else if (lm.includes("embedding")) msg = "⚠️ This is an embedding model — pick a chat model in Settings.";
      else if (lm.includes("data policy") || lm.includes("no endpoints")) msg = "⚠️ OpenRouter blocked this request due to data privacy settings.";
      else if (lm.includes("401") || lm.includes("unauthorized") || lm.includes("invalid api key")) msg = "⚠️ Invalid or expired API key. Please re-enter your key in Settings.";
      else if (lm.includes("402") || lm.includes("insufficient") || lm.includes("credits")) msg = "⚠️ Insufficient credits. Top up or switch to a free model.";
      else msg = `⚠️ ${msg}`;
      setState((prev) => {
        const c = prev.conversations[convId];
        if (!c) return { ...prev, isLoading: false, abortController: null };
        const errMsg: Message = { role: "assistant", content: msg, time: formatTime(new Date()) };
        const convs = { ...prev.conversations, [convId]: { ...c, messages: [...c.messages, errMsg] } };
        return { ...prev, conversations: convs, isLoading: false, abortController: null };
      });
    }
  }, [setState, saveConversations]);

  // =====================
  // REGENERATE
  // =====================
  const regenerateLastResponse = useCallback(async () => {
    const s = stateRef.current;
    if (!s.currentConvId || s.isLoading) return;
    const conv = s.conversations[s.currentConvId];
    if (!conv || conv.messages.length === 0 || conv.messages[conv.messages.length - 1].role !== "assistant") return;
    const convId = s.currentConvId;
    const trimmed = conv.messages.slice(0, -1);
    setState((prev) => {
      const convs = { ...prev.conversations, [convId]: { ...conv, messages: trimmed } };
      saveConversations(convs);
      return { ...prev, conversations: convs, isLoading: true };
    });
    const controller = new AbortController();
    setState((prev) => ({ ...prev, abortController: controller }));
    setStreamingText(null);
    try {
      const s2 = stateRef.current;
      const response = await callAI(
        s2.provider, trimmed, [], s2.apiKey, s2.model, s2.systemPrompt,
        s2.localRuntime, s2.localBaseUrl,
        { onChunk: (c) => setStreamingText(c), signal: controller.signal }
      );
      setStreamingText(null);
      showToast("↻ Response regenerated");
      setState((prev) => {
        const c = prev.conversations[convId];
        if (!c) return { ...prev, isLoading: false, abortController: null };
        const aiMsg: Message = { role: "assistant", content: response, time: formatTime(new Date()) };
        const convs = { ...prev.conversations, [convId]: { ...c, messages: [...c.messages, aiMsg] } };
        saveConversations(convs);
        return { ...prev, conversations: convs, isLoading: false, abortController: null };
      });
    } catch {
      setStreamingText(null);
      showToast("⚠️ Regeneration failed");
      setState((prev) => ({ ...prev, isLoading: false, abortController: null }));
    }
  }, [setState, saveConversations, showToast]);

  // =====================
  // STOP
  // =====================
  const stopGeneration = useCallback(() => {
    const s = stateRef.current;
    if (s.abortController) {
      s.abortController.abort();
      showToast("⏹ Generation stopped");
      setState((prev) => ({ ...prev, abortController: null }));
    }
  }, [setState, showToast]);

  // =====================
  // EXPORT
  // =====================
  const exportChat = useCallback((format: ExportFormat) => {
    const s = stateRef.current;
    if (!s.currentConvId) return;
    const conv = s.conversations[s.currentConvId];
    if (!conv || conv.messages.length === 0) { showToast("No messages to export"); return; }
    const title = conv.title || "conversation";
    const filename = title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    const { content, type, ext } = buildExportContent(format, title, conv.messages, s.model);
    downloadContent(content, type, `${filename}.${ext}`);
    showToast(`✓ Exported as .${ext}`);
  }, [showToast]);

  // =====================
  // HANDLE START
  // =====================
  const handleStart = useCallback((opts: {
    provider: Provider; apiKey: string; model: string;
    localRuntime: string; localBaseUrl: string; localModel: string;
  }): string | null => {
    if (opts.provider === "local") {
      if (!opts.localModel) return "Enter or select a model name.";
      const baseUrl = (opts.localBaseUrl || LOCAL_RUNTIMES[opts.localRuntime as keyof typeof LOCAL_RUNTIMES].defaultUrl).replace(/\/$/, "");
      localStorage.setItem("nc_provider", "local");
      localStorage.setItem("nc_local_runtime", opts.localRuntime);
      localStorage.setItem("nc_local_url", baseUrl);
      localStorage.setItem("nc_local_model", opts.localModel);
      const updates: Partial<AppState> = {
        provider: "local", model: opts.localModel,
        localRuntime: opts.localRuntime as AppState["localRuntime"],
        localBaseUrl: baseUrl, apiKey: "",
      };
      setState((prev) => ({ ...prev, ...updates }));
      enterApp(updates);
      return null;
    }
    if (!opts.apiKey) return "Please enter your API key.";
    if (isEmbeddingModel(opts.model))
      return `⚠️ "${opts.model.split("/").pop()}" is an embedding model and can't be used for chat.`;
    localStorage.setItem("nc_provider", opts.provider);
    localStorage.setItem("nc_api_key", opts.apiKey);
    localStorage.setItem("nc_model", opts.model);
    const updates: Partial<AppState> = { provider: opts.provider, apiKey: opts.apiKey, model: opts.model };
    setState((prev) => ({ ...prev, ...updates }));
    enterApp(updates);
    return null;
  }, [setState, enterApp]);

  const updateState = useCallback((updates: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, [setState]);

  return {
    state, appVisible, toast, streamingText,
    showToast, initFromStorage, enterApp,
    switchProvider, switchRuntime,
    createNewConversation, loadConversation, deleteConversation, clearCurrentChat,
    saveSystemPrompt, addAttachments, removeAttachment,
    sendMessage, regenerateLastResponse, stopGeneration,
    exportChat, handleStart, updateState,
  };
}
