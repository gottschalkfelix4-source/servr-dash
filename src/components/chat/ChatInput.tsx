"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [value]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex gap-2 items-end p-4 border-t border-white/[0.06] bg-card-solid/40 backdrop-blur-xl">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Nachricht eingeben... (Shift+Enter für neue Zeile)"
        disabled={disabled}
        rows={1}
        className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-accent-cyan/50 focus:shadow-[0_0_15px_-5px_rgba(34,211,238,0.3)] transition-all duration-200 placeholder:text-muted disabled:opacity-50"
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        className="flex-shrink-0 h-11 w-11 rounded-xl bg-accent-cyan/15 text-accent-cyan flex items-center justify-center hover:bg-accent-cyan/25 hover:shadow-[0_0_15px_-5px_rgba(34,211,238,0.4)] transition-all duration-200 disabled:opacity-30 disabled:hover:bg-accent-cyan/15"
      >
        <Send size={18} />
      </button>
    </div>
  );
}
