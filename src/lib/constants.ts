import type { LocalRuntime, Provider } from "@/types";

// =====================
// LOCAL RUNTIME CONFIGS
// =====================
export const LOCAL_RUNTIMES: Record<
  LocalRuntime,
  {
    defaultUrl: string;
    placeholder: string;
    modelsEndpoint: (base: string) => string;
    parseModels: (data: Record<string, unknown>) => string[];
    chatEndpoint: (base: string) => string;
    info: string;
    modelPlaceholder: string;
  }
> = {
  ollama: {
    defaultUrl: "http://localhost:11434",
    placeholder: "http://localhost:11434",
    modelsEndpoint: (base) => `${base}/api/tags`,
    parseModels: (data) =>
      ((data.models as { name: string }[]) || []).map((m) => m.name),
    chatEndpoint: (base) => `${base}/v1/chat/completions`,
    info: `Run local models with <a href="https://ollama.com" target="_blank">Ollama</a>. Start it with:<br><code>ollama serve</code> then pull a model: <code>ollama pull llama3.2</code>`,
    modelPlaceholder: "e.g. llama3.2, mistral, gemma3, phi4",
  },
  lmstudio: {
    defaultUrl: "http://localhost:1234",
    placeholder: "http://localhost:1234",
    modelsEndpoint: (base) => `${base}/v1/models`,
    parseModels: (data) =>
      ((data.data as { id: string }[]) || []).map((m) => m.id),
    chatEndpoint: (base) => `${base}/v1/chat/completions`,
    info: `Run models with <a href="https://lmstudio.ai" target="_blank">LM Studio</a>. Enable the local server in the app, then load a model.`,
    modelPlaceholder: "e.g. lmstudio-community/Meta-Llama-3-8B-GGUF",
  },
  custom: {
    defaultUrl: "http://localhost:8080",
    placeholder: "http://localhost:8080",
    modelsEndpoint: (base) => `${base}/v1/models`,
    parseModels: (data) =>
      ((data.data as { id: string }[]) || []).map((m) => m.id),
    chatEndpoint: (base) => `${base}/v1/chat/completions`,
    info: `Any <strong>OpenAI-compatible</strong> server works — <code>llama.cpp</code>, <code>koboldcpp</code>, <code>Jan</code>, <code>text-generation-webui</code>, etc.`,
    modelPlaceholder: "e.g. gpt-3.5-turbo or your model name",
  },
};

// =====================
// PROVIDERS
// =====================
export const PROVIDERS: Record<
  Exclude<Provider, "local">,
  {
    keyPlaceholder: string;
    hint: string;
    models?: import("@/types").Model[];
    groups?: import("@/types").ModelGroup[];
  }
> & { local: { keyPlaceholder: string; hint: string } } = {
  anthropic: {
    keyPlaceholder: "sk-ant-api03-...",
    hint: "Stored locally. Sent only to api.anthropic.com.",
    models: [
      {
        value: "claude-opus-4-6",
        label: "Claude Opus 4.6",
        desc: "Most capable",
        badge: "smart",
        icon: { bg: "#2d1f3d", text: "#9b59b6", letter: "O" },
      },
      {
        value: "claude-sonnet-4-6",
        label: "Claude Sonnet 4.6",
        desc: "Balanced",
        badge: "balanced",
        icon: { bg: "#2d2018", text: "#D97757", letter: "S" },
      },
      {
        value: "claude-haiku-4-5-20251001",
        label: "Claude Haiku 4.5",
        desc: "Fast & light",
        badge: "fast",
        icon: { bg: "#1a2535", text: "#3498db", letter: "H" },
      },
    ],
  },
  openrouter: {
    keyPlaceholder: "sk-or-v1-...",
    hint: "Stored locally. Sent only to openrouter.ai.",
    groups: [
      {
        label: "Free Models",
        models: [
          {
            value: "arcee-ai/trinity-large-preview:free",
            label: "Arcee Trinity Large",
            desc: "Free · Preview",
            badge: "free",
            icon: { bg: "#1a2d1a", text: "#27ae60", letter: "A" },
          },
          {
            value: "arcee-ai/trinity-mini:free",
            label: "Arcee Trinity Mini",
            desc: "Free · Fast",
            badge: "free",
            icon: { bg: "#1a2d1a", text: "#27ae60", letter: "A" },
          },
          {
            value: "stepfun/step-3.5-flash:free",
            label: "StepFun 3.5 Flash",
            desc: "Free · Flash",
            badge: "free",
            icon: { bg: "#1a2d1a", text: "#27ae60", letter: "S" },
          },
          {
            value: "liquid/lfm-2.5-1.2b-thinking:free",
            label: "LiquidAI LFM2.5",
            desc: "Free · Thinking",
            badge: "free",
            icon: { bg: "#1a2d1a", text: "#27ae60", letter: "L" },
          },
        ],
      },
      {
        label: "Other",
        models: [
          {
            value: "__custom__",
            label: "Custom Model",
            desc: "Enter your own model ID",
            badge: null,
            icon: { bg: "#252530", text: "#9e98a0", letter: "?" },
          },
        ],
      },
    ],
  },
  local: { keyPlaceholder: "", hint: "" },
};

// =====================
// TOKEN PRICING
// =====================
export const TOKEN_PRICING: Record<string, { input: number; output: number }> =
  {
    "claude-opus-4-6": { input: 15, output: 75 },
    "claude-sonnet-4-6": { input: 3, output: 15 },
    "claude-haiku-4-5-20251001": { input: 0.25, output: 1.25 },
  };

// =====================
// PERSONA PRESETS
// =====================
export const PERSONA_PRESETS = [
  {
    label: "Default",
    prompt: "You are a helpful, harmless, and honest AI assistant.",
  },
  {
    label: "Engineer",
    prompt:
      "You are an expert software engineer. Give concise, technically precise answers with working code examples. Prefer modern best practices.",
  },
  {
    label: "Writer",
    prompt:
      "You are a creative writing assistant. Help craft vivid, engaging prose. Offer suggestions for plot, character, and style. Be imaginative and encouraging.",
  },
  {
    label: "Tutor",
    prompt:
      "You are a Socratic tutor. Never give direct answers — instead, guide the user to discover answers through questions and hints. Be patient and encouraging.",
  },
  {
    label: "Concise",
    prompt:
      "You are a concise assistant. Respond in as few words as possible. No filler, no pleasantries. Only the essential information.",
  },
  {
    label: "Analyst",
    prompt:
      "You are a data analyst and statistician. Help interpret data, suggest visualizations, explain statistical concepts, and assist with analysis pipelines.",
  },
];

// =====================
// WELCOME CHIPS
// =====================
export const WELCOME_CHIPS = [
  {
    label: "Explain quantum entanglement",
    text: "Explain quantum entanglement in simple terms",
  },
  {
    label: "Write a poem about the ocean",
    text: "Write a short poem about the ocean at dawn",
  },
  { label: "5 habits to build", text: "What are 5 productive habits I should build?" },
  { label: "Help debug my code", text: "Help me debug my Python code" },
  {
    label: "Key ideas of stoicism",
    text: "Summarize the key ideas of stoicism",
  },
  {
    label: "Draft a work email",
    text: "Draft a professional email asking for a raise",
  },
];

// =====================
// EMBEDDING MODEL PATTERNS
// =====================
export const EMBEDDING_MODEL_PATTERNS = [
  /embed/i,
  /embedding/i,
  /-e5-/i,
  /text-similarity/i,
  /text-search/i,
  /code-search/i,
];
