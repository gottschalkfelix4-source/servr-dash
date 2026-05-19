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
    <div className="flex items-end gap-2 border-t border-border bg-card-solid p-4">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Nachricht eingeben... (Shift+Enter für neue Zeile)"
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none rounded-md border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted transition-colors duration-150 focus:border-accent-cyan focus:outline-none disabled:opacity-50"
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md border border-accent-cyan/20 bg-accent-cyan/10 text-accent-cyan transition-colors duration-150 hover:bg-accent-cyan/20 disabled:opacity-30 disabled:hover:bg-accent-cyan/10"
      >
        <Send size={18} />
      </button>
    </div>
  );
}
