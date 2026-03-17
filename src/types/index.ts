// =====================
// TYPES
// =====================

export type Provider = "anthropic" | "openrouter" | "local";
export type LocalRuntime = "ollama" | "lmstudio" | "custom";

export interface ModelIcon {
  bg: string;
  text: string;
  letter: string;
}

export interface Model {
  value: string;
  label: string;
  desc?: string;
  badge?: string | null;
  icon: ModelIcon;
  group?: string;
}

export interface ModelGroup {
  label: string;
  models: Model[];
}

export interface Attachment {
  id: number;
  name: string;
  size: string;
  type: string;
  isImage: boolean;
  dataUrl: string;
  base64: string;
}

export interface StoredAttachment {
  name: string;
  size: string;
  type: string;
  isImage: boolean;
  dataUrl: string | null;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  time?: string;
  attachments?: StoredAttachment[];
}

export interface Conversation {
  title: string;
  messages: Message[];
}

export interface AppState {
  provider: Provider;
  apiKey: string;
  model: string;
  localRuntime: LocalRuntime;
  localBaseUrl: string;
  conversations: Record<string, Conversation>;
  currentConvId: string | null;
  isLoading: boolean;
  searchQuery: string;
  systemPrompt: string;
  pendingAttachments: Attachment[];
  abortController: AbortController | null;
}

export type ExportFormat = "md" | "json" | "txt" | "html";
