"use client";

import { useState, useMemo, memo } from "react";
import type { ProcessInfo } from "@/types/server";

interface ProcessTableProps {
  processes: ProcessInfo[];
}

type SortKey = "cpu" | "mem" | "pid";

export const ProcessTable = memo(function ProcessTable({ processes }: ProcessTableProps) {
  const [sortBy, setSortBy] = useState<SortKey>("cpu");
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = useMemo(
    () =>
      [...processes].sort((a, b) => {
        const mul = sortAsc ? 1 : -1;
        return (a[sortBy] - b[sortBy]) * mul;
      }),
    [processes, sortBy, sortAsc]
  );

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(key);
      setSortAsc(false);
    }
  };

  const SortHeader = ({
    label,
    sortKey,
  }: {
    label: string;
    sortKey: SortKey;
  }) => (
    <th
      className="px-3 py-2.5 text-left text-xs font-medium text-muted cursor-pointer hover:text-foreground transition-colors"
      onClick={() => handleSort(sortKey)}
    >
      {label} {sortBy === sortKey && (sortAsc ? "↑" : "↓")}
    </th>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.06]">
            <SortHeader label="PID" sortKey="pid" />
            <th className="px-3 py-2.5 text-left text-xs font-medium text-muted">
              User
            </th>
            <SortHeader label="CPU%" sortKey="cpu" />
            <SortHeader label="MEM%" sortKey="mem" />
            <th className="px-3 py-2.5 text-left text-xs font-medium text-muted">
              Command
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((proc, i) => (
            <tr
              key={proc.pid}
              className={`border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors ${
                i % 2 === 0 ? "bg-white/[0.01]" : ""
              }`}
            >
              <td className="px-3 py-2 font-mono text-xs text-muted">
                {proc.pid}
              </td>
              <td className="px-3 py-2 text-xs">{proc.user}</td>
              <td className="px-3 py-2 text-xs">
                <span
                  className={
                    proc.cpu > 50
                      ? "text-accent-red font-medium"
                      : proc.cpu > 20
                      ? "text-accent-amber font-medium"
                      : ""
                  }
                >
                  {proc.cpu.toFixed(1)}
                </span>
              </td>
              <td className="px-3 py-2 text-xs">{proc.mem.toFixed(1)}</td>
              <td className="px-3 py-2 text-xs font-mono truncate max-w-[300px] text-muted">
                {proc.command}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
