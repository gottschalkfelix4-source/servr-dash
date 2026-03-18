"use client";

import { useEffect, useRef } from "react";

interface ContainerLogsProps {
  logs: string;
}

export function ContainerLogs({ logs }: ContainerLogsProps) {
  const ref = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [logs]);

  return (
    <pre
      ref={ref}
      className="bg-background rounded-lg p-4 text-xs font-mono text-muted overflow-auto max-h-[500px] whitespace-pre-wrap break-all"
    >
      {logs || "Keine Logs verfügbar."}
    </pre>
  );
}
