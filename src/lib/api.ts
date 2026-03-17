import type { Message, Attachment, Provider } from "@/types";
import { LOCAL_RUNTIMES } from "@/lib/constants";

// =====================
// CONTENT BUILDERS
// =====================
function buildAnthropicContent(
  messages: Message[],
  extraAttachments: Attachment[]
) {
  return messages.map((m, i) => {
    const isLastUser =
      m.role === "user" &&
      i === messages.length - 1 &&
      extraAttachments.length > 0;
    if (!isLastUser) return { role: m.role, content: m.content };
    const parts: unknown[] = [];
    extraAttachments.forEach((att) => {
      if (att.isImage) {
        parts.push({
          type: "image",
          source: {
            type: "base64",
            media_type: att.type || "image/jpeg",
            data: att.base64,
          },
        });
      } else {
        try {
          const text = atob(att.base64);
          parts.push({
            type: "text",
            text: `[File: ${att.name}]\n\`\`\`\n${text}\n\`\`\``,
          });
        } catch {
          parts.push({ type: "text", text: `[File attached: ${att.name}]` });
        }
      }
    });
    if (m.content && m.content !== "[Attached files]")
      parts.push({ type: "text", text: m.content });
    return { role: "user", content: parts };
  });
}

function buildOpenAIContent(
  messages: Message[],
  extraAttachments: Attachment[]
) {
  return messages.map((m, i) => {
    const isLastUser =
      m.role === "user" &&
      i === messages.length - 1 &&
      extraAttachments.length > 0;
    if (!isLastUser) return { role: m.role, content: m.content };
    const parts: unknown[] = [];
    if (m.content && m.content !== "[Attached files]")
      parts.push({ type: "text", text: m.content });
    extraAttachments.forEach((att) => {
      if (att.isImage)
        parts.push({
          type: "image_url",
          image_url: { url: `data:${att.type};base64,${att.base64}` },
        });
      else {
        try {
          const text = atob(att.base64);
          parts.push({
            type: "text",
            text: `[File: ${att.name}]\n\`\`\`\n${text}\n\`\`\``,
          });
        } catch {
          parts.push({ type: "text", text: `[File attached: ${att.name}]` });
        }
      }
    });
    return { role: "user", content: parts };
  });
}

// =====================
// STREAMING CALLBACKS
// =====================
interface StreamCallbacks {
  onChunk: (text: string) => void;
  signal: AbortSignal;
}

// =====================
// ANTHROPIC
// =====================
export async function callAnthropicAPIStream(
  messages: Message[],
  attachments: Attachment[],
  apiKey: string,
  model: string,
  systemPrompt: string,
  callbacks: StreamCallbacks
): Promise<string> {
  const builtMessages = buildAnthropicContent(messages, attachments);
  const body: Record<string, unknown> = {
    model,
    max_tokens: 4096,
    stream: true,
    messages: builtMessages,
  };
  if (systemPrompt) body.system = systemPrompt;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify(body),
    signal: callbacks.signal,
  });

  if (!res.ok) {
    const e = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(e?.error?.message || `HTTP ${res.status}`);
  }

  let fullText = "";
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (raw === "[DONE]") continue;
      try {
        const evt = JSON.parse(raw) as { type?: string; delta?: { type?: string; text?: string } };
        if (
          evt.type === "content_block_delta" &&
          evt.delta?.type === "text_delta" &&
          evt.delta.text
        ) {
          fullText += evt.delta.text;
          callbacks.onChunk(fullText);
        }
      } catch {}
    }
  }
  return fullText || "No response.";
}

// =====================
// OPENROUTER
// =====================
export async function callOpenRouterAPIStream(
  messages: Message[],
  attachments: Attachment[],
  apiKey: string,
  model: string,
  systemPrompt: string,
  callbacks: StreamCallbacks
): Promise<string> {
  const builtMessages = buildOpenAIContent(messages, attachments);
  const sysMsg = systemPrompt
    ? [{ role: "system", content: systemPrompt }]
    : [];

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer":
        typeof window !== "undefined" ? window.location.href : "",
      "X-Title": "NeuralAI",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      stream: true,
      messages: [...sysMsg, ...builtMessages],
    }),
    signal: callbacks.signal,
  });

  if (!res.ok) {
    const e = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(e?.error?.message || `HTTP ${res.status}`);
  }

  let fullText = "";
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (raw === "[DONE]") continue;
      try {
        const evt = JSON.parse(raw) as { choices?: Array<{ delta?: { content?: string } }> };
        const delta = evt.choices?.[0]?.delta?.content;
        if (delta) {
          fullText += delta;
          callbacks.onChunk(fullText);
        }
      } catch {}
    }
  }
  return fullText || "No response.";
}

// =====================
// LOCAL API
// =====================
export async function callLocalAPI(
  messages: Message[],
  localRuntime: string,
  localBaseUrl: string,
  model: string,
  systemPrompt: string,
  signal: AbortSignal
): Promise<string> {
  const rt = LOCAL_RUNTIMES[localRuntime as keyof typeof LOCAL_RUNTIMES];
  const endpoint = rt.chatEndpoint(localBaseUrl);
  const sysMsg = systemPrompt
    ? [{ role: "system", content: systemPrompt }]
    : [];
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        ...sysMsg,
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      stream: false,
    }),
    signal,
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(e?.error?.message || `HTTP ${res.status}`);
  }
  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content || "No response.";
}

// =====================
// UNIFIED CALL
// =====================
export async function callAI(
  provider: Provider,
  messages: Message[],
  attachments: Attachment[],
  apiKey: string,
  model: string,
  systemPrompt: string,
  localRuntime: string,
  localBaseUrl: string,
  callbacks: StreamCallbacks
): Promise<string> {
  if (provider === "anthropic") {
    return callAnthropicAPIStream(
      messages,
      attachments,
      apiKey,
      model,
      systemPrompt,
      callbacks
    );
  }
  if (provider === "openrouter") {
    return callOpenRouterAPIStream(
      messages,
      attachments,
      apiKey,
      model,
      systemPrompt,
      callbacks
    );
  }
  return callLocalAPI(
    messages,
    localRuntime,
    localBaseUrl,
    model,
    systemPrompt,
    callbacks.signal
  );
}
