"use client";

interface ToastProps {
  message: string | null;
}

export default function Toast({ message }: ToastProps) {
  return (
    <div
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#2a2a35] text-text-primary border border-border-input rounded-md px-[1.2rem] py-[0.6rem] text-[0.83rem] font-medium z-[9999] pointer-events-none whitespace-nowrap shadow-[0_8px_24px_rgba(0,0,0,0.4)] transition-all duration-200 ${
        message
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-5"
      }`}
    >
      {message}
    </div>
  );
}
