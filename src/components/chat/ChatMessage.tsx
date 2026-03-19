"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center",
          isUser
            ? "bg-accent-cyan/15 shadow-[0_0_10px_-3px_rgba(34,211,238,0.3)]"
            : "bg-accent-purple/15 shadow-[0_0_10px_-3px_rgba(168,85,247,0.3)]"
        )}
      >
        {isUser ? (
          <User size={16} className="text-accent-cyan" />
        ) : (
          <Bot size={16} className="text-accent-purple" />
        )}
      </div>

      <div
        className={cn(
          "max-w-[80%] rounded-xl px-4 py-3 text-sm",
          "border backdrop-blur-sm",
          isUser
            ? "bg-accent-cyan/5 border-accent-cyan/20"
            : "bg-white/[0.02] border-white/[0.06]"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none prose-p:my-1.5 prose-headings:my-2 prose-pre:my-2 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-code:text-accent-cyan prose-code:bg-white/[0.06] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/[0.08] prose-pre:rounded-lg prose-a:text-accent-cyan">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-accent-purple/60 animate-pulse ml-0.5" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
