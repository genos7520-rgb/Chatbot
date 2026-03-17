import { TOKEN_PRICING, EMBEDDING_MODEL_PATTERNS, PROVIDERS } from "@/lib/constants";
import type { ExportFormat, Message, Model } from "@/types";

// =====================
// TOKEN / COST
// =====================
export function estimateTokens(text: string): number {
  return Math.ceil((text || "").length / 4);
}

export function estimateCost(
  inputTok: number,
  outputTok: number,
  model: string
): string | null {
  const p = TOKEN_PRICING[model];
  if (!p) return null;
  const cost = (inputTok * p.input + outputTok * p.output) / 1_000_000;
  return cost < 0.001 ? "<$0.001" : `$${cost.toFixed(4)}`;
}

// =====================
// UTILS
// =====================
export function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function escapeHtml(t: string): string {
  return String(t)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function isEmbeddingModel(modelId: string): boolean {
  return EMBEDDING_MODEL_PATTERNS.some((p) => p.test(modelId));
}

// =====================
// MARKDOWN PARSER
// =====================
export function parseMarkdown(text: string): string {
  if (!text) return "";
  let h = escapeHtml(text);

  h = h.replace(/```(\w+)?\n?([\s\S]*?)```/g, (_, lang, code) => {
    const l = lang || "";
    return `<pre><code class="lang-${l} ${l ? "language-" + l : ""}">${code.trim()}</code></pre>`;
  });

  h = h.replace(/`([^`\n]+)`/g, "<code>$1</code>");
  h = h.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  h = h.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  h = h.replace(/^# (.+)$/gm, "<h1>$1</h1>");
  h = h.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  h = h.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  h = h.replace(/__(.+?)__/g, "<strong>$1</strong>");
  h = h.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
  h = h.replace(/_([^_\n]+)_/g, "<em>$1</em>");
  h = h.replace(/~~(.+?)~~/g, "<del>$1</del>");
  h = h.replace(/^&gt; (.+)$/gm, "<blockquote>$1</blockquote>");

  h = h.replace(
    /^\|(.+)\|\s*\n\|[-| :]+\|\s*\n((?:\|.+\|\s*\n?)*)/gm,
    (_, header, rows) => {
      const ths = header
        .split("|")
        .filter((c: string) => c.trim())
        .map((c: string) => `<th>${c.trim()}</th>`)
        .join("");
      const trs = rows
        .trim()
        .split("\n")
        .map((row: string) => {
          const tds = row
            .split("|")
            .filter((c: string) => c.trim())
            .map((c: string) => `<td>${c.trim()}</td>`)
            .join("");
          return `<tr>${tds}</tr>`;
        })
        .join("");
      return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
    }
  );

  h = h.replace(/^[-*+] (.+)$/gm, "<li>$1</li>");
  h = h.replace(/^\d+\. (.+)$/gm, "<li>$1</li>");
  h = h.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  h = h.replace(/^---$/gm, "<hr>");
  h = h.replace(/\n\n/g, "</p><p>");
  h = h.replace(/\n/g, "<br>");
  h = `<p>${h}</p>`;
  h = h.replace(/<p>(<h[1-3]>.*?<\/h[1-3]>)<\/p>/g, "$1");
  h = h.replace(/<p>(<pre>.*?<\/pre>)<\/p>/gs, "$1");
  h = h.replace(/<p>(<blockquote>.*?<\/blockquote>)<\/p>/gs, "$1");
  h = h.replace(/<p>(<table>.*?<\/table>)<\/p>/gs, "$1");
  h = h.replace(/<p>(<hr>)<\/p>/g, "$1");
  h = h.replace(/<p><br><\/p>/g, "");
  h = h.replace(/<p><\/p>/g, "");
  return h;
}

// =====================
// HTML DETECTION
// =====================
export function extractHtml(text: string): string | null {
  const fenced = text.match(/```html\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  const loose = text.match(/(<!DOCTYPE[\s\S]*?<\/html>)/i);
  if (loose) return loose[1].trim();
  return null;
}

export function downloadHtml(html: string, filename: string): void {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function previewHtml(html: string): void {
  const win = window.open("", "_blank");
  if (win) {
    win.document.open();
    win.document.write(html);
    win.document.close();
  }
}

// =====================
// EXPORT
// =====================
export function buildExportContent(
  format: ExportFormat,
  title: string,
  messages: Message[],
  model: string
): { content: string; type: string; ext: string } {
  if (format === "md") {
    const content =
      `# ${title}\n\n*Exported from Neural AI on ${new Date().toLocaleString()}*\n\n---\n\n` +
      messages
        .map((m) => {
          const role = m.role === "user" ? "**You**" : "**Assistant**";
          return `${role} *(${m.time || ""})*\n\n${m.content}\n\n---\n\n`;
        })
        .join("");
    return { content, type: "text/markdown", ext: "md" };
  }
  if (format === "json") {
    const content = JSON.stringify(
      {
        title,
        exported: new Date().toISOString(),
        model,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
          time: m.time,
        })),
      },
      null,
      2
    );
    return { content, type: "application/json", ext: "json" };
  }
  if (format === "txt") {
    const content =
      `${title}\nExported: ${new Date().toLocaleString()}\n${"=".repeat(50)}\n\n` +
      messages
        .map(
          (m) =>
            `[${m.role === "user" ? "You" : "Assistant"}] ${m.time || ""}\n${m.content}\n\n`
        )
        .join("");
    return { content, type: "text/plain", ext: "txt" };
  }
  // html
  const body = messages
    .map((m) => {
      const role = m.role === "user" ? "You" : "Assistant";
      const cls = m.role === "user" ? "user" : "ai";
      return `<div class="msg ${cls}"><div class="role">${role} <span class="time">${m.time || ""}</span></div><div class="content">${parseMarkdown(m.content)}</div></div>`;
    })
    .join("");
  const content = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title><style>body{font-family:system-ui,sans-serif;max-width:780px;margin:2rem auto;padding:0 1rem;background:#1a1a1e;color:#e8e3dc}h1{font-family:Georgia,serif;border-bottom:1px solid #333;padding-bottom:.5rem}.msg{padding:1rem;margin:.75rem 0;border-radius:12px}.user{background:#2a2a32;border:1px solid #2e2e38}.ai{background:transparent;padding-left:0}.role{font-size:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#9e98a0;margin-bottom:.4rem}.time{font-weight:400;opacity:.6}.content p{margin:.5em 0}pre{background:#16161c;border:1px solid #2e2e38;border-radius:8px;padding:1rem;overflow-x:auto}code{color:#e8956d}a{color:#D97757}</style></head><body><h1>${title}</h1><p style="color:#6b6570;font-size:.8rem">Exported ${new Date().toLocaleString()} · Neural AI</p>${body}</body></html>`;
  return { content, type: "text/html", ext: "html" };
}

export function downloadContent(
  content: string,
  type: string,
  filename: string
): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// =====================
// MODEL HELPERS
// =====================
export function getAllModelsFlat(provider: string): Model[] {
  if (provider === "local") return [];
  const cfg = PROVIDERS[provider as keyof typeof PROVIDERS];
  if (!cfg) return [];
  if ("groups" in cfg && cfg.groups) {
    const flat: Model[] = [];
    cfg.groups.forEach((g) =>
      g.models.forEach((m) => flat.push({ ...m, group: g.label }))
    );
    return flat;
  }
  if ("models" in cfg && cfg.models) {
    return cfg.models.map((m) => ({ ...m, group: "" }));
  }
  return [];
}

export function getModelLabel(provider: string, model: string, localRuntime: string): string {
  if (provider === "local") {
    const rl =
      { ollama: "Ollama", lmstudio: "LM Studio", custom: "Local" }[
        localRuntime
      ] || "Local";
    return `${rl} · ${model.split("/").pop()}`;
  }
  const models = getAllModelsFlat(provider);
  const found = models.find((m) => m.value === model);
  if (found) return found.label;
  return (
    model
      .split("/")
      .pop()
      ?.replace(":free", "") || "Select model"
  );
}
