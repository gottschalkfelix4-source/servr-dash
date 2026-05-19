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
          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border",
          isUser
            ? "border-accent-cyan/20 bg-accent-cyan/10"
            : "border-accent-purple/20 bg-accent-purple/10"
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
          "max-w-[80%] rounded-lg border px-4 py-3 text-sm",
          isUser
            ? "bg-accent-cyan/5 border-accent-cyan/20"
            : "border-border bg-card-solid"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none prose-p:my-1.5 prose-headings:my-2 prose-pre:my-2 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-code:rounded prose-code:bg-white/[0.06] prose-code:px-1.5 prose-code:py-0.5 prose-code:text-xs prose-code:text-accent-cyan prose-pre:rounded-md prose-pre:border prose-pre:border-border prose-pre:bg-background prose-a:text-accent-cyan">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
            {isStreaming && (
              <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-accent-purple/60" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
