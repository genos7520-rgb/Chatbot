"use client";

import { useState, useEffect } from "react";
import type { Provider } from "@/types";
import { PROVIDERS, LOCAL_RUNTIMES } from "@/lib/constants";

interface SetupModalProps {
  isOpen: boolean;
  canClose: boolean;
  initialProvider: Provider;
  initialApiKey: string;
  initialModel: string;
  initialRuntime: string;
  initialBaseUrl: string;
  initialLocalModel: string;
  onStart: (opts: {
    provider: Provider;
    apiKey: string;
    model: string;
    localRuntime: string;
    localBaseUrl: string;
    localModel: string;
  }) => string | null;
  onClose: () => void;
}

export default function SetupModal({
  isOpen,
  canClose,
  initialProvider,
  initialApiKey,
  initialModel,
  initialRuntime,
  initialBaseUrl,
  initialLocalModel,
  onStart,
  onClose,
}: SetupModalProps) {
  const [provider, setProvider] = useState<Provider>(initialProvider);
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [model, setModel] = useState(initialModel);
  const [customModel, setCustomModel] = useState("");
  const [localRuntime, setLocalRuntime] = useState(initialRuntime);
  const [localBaseUrl, setLocalBaseUrl] = useState(initialBaseUrl);
  const [localModel, setLocalModel] = useState(initialLocalModel);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [detectedModels, setDetectedModels] = useState<string[]>([]);
  const [selectedDetected, setSelectedDetected] = useState("");
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    setProvider(initialProvider);
    setApiKey(initialApiKey);
    setModel(initialModel);
    setLocalRuntime(initialRuntime);
    setLocalBaseUrl(initialBaseUrl);
    setLocalModel(initialLocalModel);
  }, [initialProvider, initialApiKey, initialModel, initialRuntime, initialBaseUrl, initialLocalModel]);

  useEffect(() => {
    if (provider !== "local") {
      const cfg = PROVIDERS[provider];
      if ("groups" in cfg && cfg.groups) {
        setModel(cfg.groups[0].models[0].value);
      } else if ("models" in cfg && cfg.models) {
        setModel(cfg.models[0].value);
      }
    } else {
      const cfg = LOCAL_RUNTIMES[localRuntime as keyof typeof LOCAL_RUNTIMES];
      setLocalBaseUrl(cfg.defaultUrl);
      setLocalModel("");
      setDetectedModels([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  useEffect(() => {
    const cfg = LOCAL_RUNTIMES[localRuntime as keyof typeof LOCAL_RUNTIMES];
    setLocalBaseUrl(cfg.defaultUrl);
    setLocalModel("");
    setDetectedModels([]);
  }, [localRuntime]);

  const handleStart = () => {
    setError("");
    const err = onStart({
      provider,
      apiKey,
      model: model === "__custom__" ? customModel : model,
      localRuntime,
      localBaseUrl,
      localModel,
    });
    if (err) setError(err);
  };

  const handleAutoDetect = async () => {
    const base = (localBaseUrl || LOCAL_RUNTIMES[localRuntime as keyof typeof LOCAL_RUNTIMES].defaultUrl).replace(/\/$/, "");
    const cfg = LOCAL_RUNTIMES[localRuntime as keyof typeof LOCAL_RUNTIMES];
    setDetecting(true);
    setError("");
    setDetectedModels([]);
    try {
      const res = await fetch(cfg.modelsEndpoint(base), { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      const models = cfg.parseModels(data);
      if (!models.length) { setError("No models found. Load a model first."); return; }
      setDetectedModels(models);
      if (models.length === 1) { setLocalModel(models[0]); setSelectedDetected(models[0]); }
    } catch (err) {
      const e = err as Error;
      if (e.name === "TimeoutError") setError("Timed out. Is the server running?");
      else if (e.message.includes("Failed to fetch")) setError("Cannot reach server. Check URL and CORS.");
      else setError(e.message);
    } finally {
      setDetecting(false);
    }
  };

  const getModelOptions = () => {
    if (provider === "anthropic") {
      return (PROVIDERS.anthropic.models || []).map((m) => (
        <option key={m.value} value={m.value}>{m.label}</option>
      ));
    }
    if (provider === "openrouter" && PROVIDERS.openrouter.groups) {
      return PROVIDERS.openrouter.groups.map((g) => (
        <optgroup key={g.label} label={g.label}>
          {g.models.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </optgroup>
      ));
    }
    return null;
  };

  if (!isOpen) return null;

  const runtimeCfg = LOCAL_RUNTIMES[localRuntime as keyof typeof LOCAL_RUNTIMES];

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-[16px] flex items-start justify-center z-[1000] overflow-y-auto p-8 animate-fadeIn">
      <div className="relative bg-bg-modal border border-border rounded-xl w-full max-w-[440px] p-9 shadow-[0_20px_60px_rgba(0,0,0,0.5)] animate-slideUp my-auto">
        {canClose && (
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 w-7 h-7 bg-transparent border border-border rounded-[7px] text-text-muted cursor-pointer flex items-center justify-center transition-all hover:bg-bg-app hover:text-text-secondary hover:border-border-input"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        <div className="text-center mb-7">
          <h1 className="font-serif text-[1.6rem] font-medium text-text-primary tracking-[-0.02em] mb-1">Neural AI</h1>
          <p className="text-text-secondary text-[0.88rem]">Choose your AI provider to get started</p>
        </div>

        {/* Provider Toggle */}
        <div className="flex gap-[0.3rem] bg-bg-app border border-border rounded-sm p-[3px] mb-[1.4rem]">
          {(["anthropic", "openrouter", "local"] as Provider[]).map((p) => (
            <button
              key={p}
              onClick={() => setProvider(p)}
              className={`flex-1 rounded-[6px] font-sans text-[0.8rem] font-medium py-[0.42rem] px-2 cursor-pointer flex items-center justify-center gap-[0.35rem] transition-all ${
                provider === p
                  ? "bg-[#2e2e38] text-text-primary shadow-[0_1px_4px_rgba(0,0,0,0.4)]"
                  : "bg-transparent text-text-secondary hover:text-text-primary hover:bg-[#2a2a32]"
              }`}
            >
              {p === "anthropic" && (
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                  <path d="M10 2L2 17h16L10 2zm0 3.5L15.5 15h-11L10 5.5z" />
                </svg>
              )}
              {p === "openrouter" && (
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3 h-3">
                  <circle cx="10" cy="10" r="8" /><path d="M6 10h8M10 6l4 4-4 4" />
                </svg>
              )}
              {p === "local" && (
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3 h-3">
                  <rect x="2" y="3" width="16" height="11" rx="2" /><path d="M6 17h8M10 14v3" /><circle cx="10" cy="8.5" r="2.5" />
                </svg>
              )}
              {p === "anthropic" ? "Anthropic" : p === "openrouter" ? "OpenRouter" : "Local AI"}
            </button>
          ))}
        </div>

        {/* Cloud Fields */}
        {provider !== "local" && (
          <div>
            <label className="block text-[0.75rem] font-medium text-text-secondary uppercase tracking-[0.06em] mb-1.5">
              API Key
            </label>
            <div className="relative mb-1.5">
              <input
                type={showPassword ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStart()}
                placeholder={PROVIDERS[provider as Exclude<Provider,"local">]?.keyPlaceholder || ""}
                autoComplete="off"
                spellCheck={false}
                className="w-full bg-bg-app border border-border-input rounded-sm text-text-primary font-sans text-[0.9rem] py-[0.65rem] pl-[0.85rem] pr-10 outline-none transition-all focus:border-border-focus focus:shadow-[0_0_0_3px_rgba(196,168,130,0.2)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-[0.65rem] top-1/2 -translate-y-1/2 bg-transparent border-none text-text-muted cursor-pointer flex items-center p-1 transition-colors hover:text-text-secondary"
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-[0.75rem] text-text-muted mb-4 leading-relaxed">
              {(PROVIDERS[provider as Exclude<Provider,"local">] as { hint: string })?.hint}
            </p>

            <div className="mb-4">
              <label className="block text-[0.75rem] font-medium text-text-secondary uppercase tracking-[0.06em] mb-1.5">
                Model
              </label>
              <select
                value={model}
                onChange={(e) => { setModel(e.target.value); }}
                className="w-full bg-bg-app border border-border-input rounded-sm text-text-primary font-sans text-[0.9rem] py-[0.65rem] px-[0.85rem] outline-none transition-all focus:border-border-focus appearance-none cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239e9890' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 0.85rem center" }}
              >
                {getModelOptions()}
              </select>
            </div>

            {model === "__custom__" && (
              <div className="mb-4">
                <label className="block text-[0.75rem] font-medium text-text-secondary uppercase tracking-[0.06em] mb-1.5">
                  Custom Model ID
                </label>
                <input
                  type="text"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  placeholder="e.g. meta-llama/llama-3-70b-instruct"
                  className="w-full bg-bg-app border border-border-input rounded-sm text-text-primary font-sans text-[0.9rem] py-[0.65rem] px-[0.85rem] outline-none transition-all focus:border-border-focus"
                />
              </div>
            )}
          </div>
        )}

        {/* Local AI Fields */}
        {provider === "local" && (
          <div>
            <div className="flex gap-1 mb-[0.9rem]">
              {(["ollama", "lmstudio", "custom"] as const).map((rt) => (
                <button
                  key={rt}
                  onClick={() => setLocalRuntime(rt)}
                  className={`flex-1 rounded-[6px] border font-sans text-[0.78rem] font-medium py-[0.38rem] cursor-pointer transition-all ${
                    localRuntime === rt
                      ? "bg-[#2e2e38] border-border-focus text-text-primary shadow-sm"
                      : "bg-bg-app border-border text-text-secondary hover:bg-bg-chip-hover hover:text-text-primary"
                  }`}
                >
                  {rt === "ollama" ? "Ollama" : rt === "lmstudio" ? "LM Studio" : "Custom"}
                </button>
              ))}
            </div>

            <div
              className="bg-[rgba(217,119,87,0.07)] border border-[rgba(217,119,87,0.2)] rounded-sm px-[0.85rem] py-[0.7rem] text-[0.78rem] text-text-secondary leading-relaxed mb-[0.9rem]"
              dangerouslySetInnerHTML={{ __html: runtimeCfg.info }}
            />

            <div className="mb-4">
              <label className="block text-[0.75rem] font-medium text-text-secondary uppercase tracking-[0.06em] mb-1.5">Server URL</label>
              <input
                type="text"
                value={localBaseUrl}
                onChange={(e) => setLocalBaseUrl(e.target.value)}
                placeholder={runtimeCfg.placeholder}
                className="w-full bg-bg-app border border-border-input rounded-sm text-text-primary font-sans text-[0.9rem] py-[0.65rem] px-[0.85rem] outline-none transition-all focus:border-border-focus"
              />
            </div>

            <div className="mb-4">
              <label className="block text-[0.75rem] font-medium text-text-secondary uppercase tracking-[0.06em] mb-1.5">Model Name</label>
              <input
                type="text"
                value={localModel}
                onChange={(e) => setLocalModel(e.target.value)}
                placeholder={runtimeCfg.modelPlaceholder}
                className="w-full bg-bg-app border border-border-input rounded-sm text-text-primary font-sans text-[0.9rem] py-[0.65rem] px-[0.85rem] outline-none transition-all focus:border-border-focus"
              />
            </div>

            <button
              onClick={handleAutoDetect}
              className={`w-full bg-transparent border border-dashed border-border-input rounded-sm text-text-secondary font-sans text-[0.82rem] font-medium py-[0.55rem] cursor-pointer flex items-center justify-center gap-1.5 mb-[0.6rem] transition-all hover:border-accent hover:text-accent hover:bg-[rgba(217,119,87,0.07)]`}
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={`w-3.5 h-3.5 ${detecting ? "animate-spin" : ""}`}>
                <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.49" />
              </svg>
              Auto-detect running models
            </button>

            {detectedModels.length > 0 && (
              <div className="mb-4">
                <label className="block text-[0.75rem] font-medium text-text-secondary uppercase tracking-[0.06em] mb-1.5">Detected models</label>
                <div className="flex flex-wrap gap-[0.35rem]">
                  {detectedModels.map((m) => (
                    <button
                      key={m}
                      onClick={() => { setLocalModel(m); setSelectedDetected(m); }}
                      className={`bg-bg-chip border border-border rounded-full text-text-secondary text-[0.75rem] py-1 px-[0.65rem] cursor-pointer transition-all hover:bg-[rgba(217,119,87,0.07)] hover:border-accent hover:text-accent ${selectedDetected === m ? "bg-[rgba(217,119,87,0.07)] border-accent text-accent" : ""}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleStart}
          className="w-full bg-accent text-white border-none rounded-sm font-sans text-[0.9rem] font-medium py-[0.72rem] cursor-pointer transition-all mt-1 hover:bg-accent-hover active:scale-[0.99]"
        >
          Start chatting
        </button>

        {error && (
          <p className="text-[#c0392b] text-[0.8rem] text-center min-h-[1.2em] mt-2">{error}</p>
        )}
      </div>
    </div>
  );
}
