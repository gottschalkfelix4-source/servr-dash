"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { PageHeader } from "@/components/layout/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { Bot, RotateCcw, Wifi, WifiOff } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [gatewayStatus, setGatewayStatus] = useState<{
    configured: boolean;
    online: boolean;
    models?: string[];
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Check gateway status
  useEffect(() => {
    fetch("/api/chat/status")
      .then((r) => r.json())
      .then(setGatewayStatus)
      .catch(() => setGatewayStatus({ configured: false, online: false }));
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(
    async (content: string) => {
      if (streaming) return;

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content,
      };

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setStreaming(true);

      const allMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content },
      ];

      try {
        abortRef.current = new AbortController();

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: allMessages, stream: true }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Unbekannter Fehler" }));
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id
                ? { ...m, content: `**Fehler:** ${err.error}` }
                : m
            )
          );
          setStreaming(false);
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No reader");

        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") break;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                accumulated += delta;
                const current = accumulated;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsg.id
                      ? { ...m, content: current }
                      : m
                  )
                );
              }
            } catch {
              // Skip malformed SSE lines
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? {
                  ...m,
                  content: `**Fehler:** ${(err as Error).message || "Verbindungsfehler"}`,
                }
              : m
          )
        );
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, streaming]
  );

  const handleNewChat = () => {
    if (abortRef.current) abortRef.current.abort();
    setMessages([]);
    setStreaming(false);
  };

  // Not configured state
  if (gatewayStatus && !gatewayStatus.configured) {
    return (
      <div>
        <PageHeader title="AI Chat" description="OpenClaw Gateway Chat" />
        <div className="flex flex-col items-center justify-center py-20">
          <Bot size={48} className="text-muted mb-4" />
          <h3 className="text-lg font-medium mb-2">
            OpenClaw Gateway nicht konfiguriert
          </h3>
          <p className="text-sm text-muted mb-4 text-center max-w-md">
            Konfiguriere den OpenClaw Gateway in den Einstellungen um den
            AI Chat zu nutzen.
          </p>
          <a
            href="/settings"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-cyan/10 text-accent-cyan text-sm font-medium hover:bg-accent-cyan/20 transition-colors"
          >
            Zu den Einstellungen
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col -m-3 sm:-m-4 lg:-m-6 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <h1 className="text-base sm:text-lg font-semibold">Chat</h1>
          {gatewayStatus ? (
            <div
              className={`flex items-center gap-1.5 text-xs ${
                gatewayStatus.online ? "text-accent-emerald" : "text-accent-red"
              }`}
            >
              {gatewayStatus.online ? (
                <Wifi size={12} />
              ) : (
                <WifiOff size={12} />
              )}
              <span>{gatewayStatus.online ? "Verbunden" : "Offline"}</span>
            </div>
          ) : (
            <Spinner />
          )}
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted hover:text-foreground hover:bg-white/[0.04] transition-all"
          >
            <RotateCcw size={13} />
            Neuer Chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="h-16 w-16 rounded-2xl bg-accent-purple/10 flex items-center justify-center mb-4 shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)]">
              <Bot size={32} className="text-accent-purple" />
            </div>
            <h2 className="text-lg font-medium mb-2">Wie kann ich helfen?</h2>
            <p className="text-sm text-muted max-w-md">
              Frag mich zu deinen Servern, Docker-Containern, Medien oder
              allem anderen was du wissen möchtest.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            role={msg.role}
            content={msg.content}
            isStreaming={
              streaming &&
              msg.role === "assistant" &&
              msg.id === messages[messages.length - 1]?.id
            }
          />
        ))}

        {streaming && messages[messages.length - 1]?.content === "" && (
          <div className="flex items-center gap-2 text-sm text-muted pl-11">
            <Spinner />
            <span>Denke nach...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={streaming || !gatewayStatus?.online}
      />
    </div>
  );
}
