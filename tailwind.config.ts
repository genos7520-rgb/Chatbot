import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-app": "#1a1a1e",
        "bg-sidebar": "#141416",
        "bg-sidebar-hover": "#1e1e23",
        "bg-sidebar-active": "#25252b",
        "bg-modal": "#1e1e23",
        "bg-input": "#1e1e23",
        "bg-user-msg": "#2a2a32",
        "bg-chip": "#2a2a32",
        "bg-chip-hover": "#32323c",
        border: "#2e2e38",
        "border-input": "#38383f",
        "border-focus": "#c4a882",
        accent: "#D97757",
        "accent-hover": "#c4684a",
        "text-primary": "#e8e3dc",
        "text-secondary": "#9e98a0",
        "text-muted": "#6b6570",
        "text-placeholder": "#505058",
      },
      fontFamily: {
        serif: ["Lora", "Georgia", "serif"],
        sans: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "18px",
        xl: "24px",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        msgIn: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        cursorBlink: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        typingBounce: {
          "0%,60%,100%": { transform: "translateY(0)", opacity: "0.4" },
          "30%": { transform: "translateY(-5px)", opacity: "1" },
        },
        spin: { to: { transform: "rotate(360deg)" } },
        pulseDot: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        chipIn: {
          from: { opacity: "0", transform: "scale(0.9) translateY(4px)" },
          to: { opacity: "1", transform: "scale(1) translateY(0)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.25s ease",
        slideUp: "slideUp 0.3s cubic-bezier(0.4,0,0.2,1)",
        msgIn: "msgIn 0.25s cubic-bezier(0.4,0,0.2,1)",
        cursorBlink: "cursorBlink 0.8s ease-in-out infinite",
        typingBounce: "typingBounce 1.2s infinite",
        spin: "spin 1s linear infinite",
        pulseDot: "pulseDot 2s ease-in-out infinite",
        chipIn: "chipIn 0.18s cubic-bezier(0.4,0,0.2,1)",
      },
    },
  },
  plugins: [],
};

export default config;
