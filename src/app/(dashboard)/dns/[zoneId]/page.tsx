"use client";

import { use, useState } from "react";
import { createPortal } from "react-dom";
import {
  Globe,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  Search,
  Shield,
  ShieldOff,
  X,
  Save,
  Check,
  AlertCircle,
  Copy,
} from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  useCloudflareRecords,
  createDnsRecord,
  updateDnsRecord,
  deleteDnsRecord,
} from "@/hooks/useCloudflare";
import type { CFDnsRecord, CFCreateRecord } from "@/types/cloudflare";
import { DNS_RECORD_TYPES } from "@/types/cloudflare";

const TYPE_COLORS: Record<string, string> = {
  A: "bg-accent-cyan/15 text-accent-cyan",
  AAAA: "bg-accent-purple/15 text-accent-purple",
  CNAME: "bg-accent-emerald/15 text-accent-emerald",
  MX: "bg-accent-amber/15 text-accent-amber",
  TXT: "bg-white/[0.08] text-muted",
  NS: "bg-accent-red/15 text-accent-red",
  SRV: "bg-blue-500/15 text-blue-400",
  CAA: "bg-orange-500/15 text-orange-400",
};

export default function ZoneDetailPage({
  params,
}: {
  params: Promise<{ zoneId: string }>;
}) {
  const { zoneId } = use(params);
  const [filter, setFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [editing, setEditing] = useState<CFDnsRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const { data: records, isLoading, mutate } = useCloudflareRecords(zoneId);

  const zoneName = records?.[0]?.zone_name || zoneId;

  const filtered = (records || []).filter((r) => {
    if (typeFilter && r.type !== typeFilter) return false;
    if (filter) {
      const q = filter.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.content.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Get unique types for filter
  const usedTypes = [...new Set((records || []).map((r) => r.type))].sort();

  const handleDelete = async (record: CFDnsRecord) => {
    if (!confirm(`DNS Record "${record.name}" (${record.type}) wirklich löschen?`)) return;
    try {
      await deleteDnsRecord(zoneId, record.id);
      setFeedback({ type: "success", message: `"${record.name}" gelöscht.` });
      mutate();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Löschen fehlgeschlagen",
      });
    }
  };

  return (
    <div>
      <Link
        href="/dns"
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft size={14} />
        Zurück zu Domains
      </Link>

      <PageHeader
        title={zoneName}
        description="DNS Records verwalten"
        actions={
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-cyan/10 text-accent-cyan text-sm font-medium hover:bg-accent-cyan/20 transition-colors"
          >
            <Plus size={14} />
            Record erstellen
          </button>
        }
      />

      {/* Feedback */}
      {feedback && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-lg mb-4 text-sm ${
            feedback.type === "success"
              ? "bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20"
              : "bg-accent-red/10 text-accent-red border border-accent-red/20"
          }`}
        >
          {feedback.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
          {feedback.message}
          <button onClick={() => setFeedback(null)} className="ml-auto">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Records filtern..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm focus:outline-none focus:border-accent-cyan/50 transition-all"
          />
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setTypeFilter("")}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              !typeFilter
                ? "bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30"
                : "bg-white/[0.03] text-muted border border-white/[0.06] hover:text-foreground"
            }`}
          >
            Alle
          </button>
          {usedTypes.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(typeFilter === t ? "" : t)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                typeFilter === t
                  ? "bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30"
                  : "bg-white/[0.03] text-muted border border-white/[0.06] hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Records table */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      ) : (
        <Card>
          {/* Header */}
          <div className="hidden md:grid grid-cols-[80px_1fr_1fr_80px_60px_80px] gap-3 px-4 py-2 text-[10px] uppercase tracking-wider text-muted border-b border-white/[0.04]">
            <span>Typ</span>
            <span>Name</span>
            <span>Inhalt</span>
            <span>TTL</span>
            <span>Proxy</span>
            <span></span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-white/[0.04]">
            {filtered.map((record) => (
              <div
                key={record.id}
                className="grid grid-cols-1 md:grid-cols-[80px_1fr_1fr_80px_60px_80px] gap-2 md:gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors group items-center"
              >
                {/* Type */}
                <span
                  className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold w-fit ${
                    TYPE_COLORS[record.type] || "bg-white/[0.06] text-muted"
                  }`}
                >
                  {record.type}
                </span>

                {/* Name */}
                <span className="text-sm font-mono truncate" title={record.name}>
                  {record.name.replace(`.${zoneName}`, "")}
                  {record.name === zoneName && (
                    <span className="text-muted ml-1">(@)</span>
                  )}
                </span>

                {/* Content */}
                <span
                  className="text-sm text-muted font-mono truncate"
                  title={record.content}
                >
                  {record.content}
                </span>

                {/* TTL */}
                <span className="text-xs text-muted">
                  {record.ttl === 1 ? "Auto" : `${record.ttl}s`}
                </span>

                {/* Proxied */}
                <span>
                  {record.proxiable && (
                    record.proxied ? (
                      <Shield size={14} className="text-accent-amber" />
                    ) : (
                      <ShieldOff size={14} className="text-muted" />
                    )
                  )}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditing(record)}
                    className="p-1.5 rounded hover:bg-white/[0.06] text-muted hover:text-foreground transition-colors"
                    title="Bearbeiten"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => handleDelete(record)}
                    className="p-1.5 rounded hover:bg-accent-red/20 text-muted hover:text-accent-red transition-colors"
                    title="Löschen"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-8 text-sm text-muted">
                {records?.length
                  ? "Keine Records für den Filter"
                  : "Keine DNS Records gefunden"}
              </div>
            )}
          </div>

          <div className="px-4 py-2 border-t border-white/[0.04] text-xs text-muted">
            {filtered.length} von {records?.length || 0} Records
          </div>
        </Card>
      )}

      {/* Create Modal */}
      {creating && (
        <RecordModal
          zoneId={zoneId}
          zoneName={zoneName}
          onClose={() => setCreating(false)}
          onSaved={(msg) => {
            setCreating(false);
            setFeedback({ type: "success", message: msg });
            mutate();
          }}
          onError={(msg) => setFeedback({ type: "error", message: msg })}
        />
      )}

      {/* Edit Modal */}
      {editing && (
        <RecordModal
          zoneId={zoneId}
          zoneName={zoneName}
          record={editing}
          onClose={() => setEditing(null)}
          onSaved={(msg) => {
            setEditing(null);
            setFeedback({ type: "success", message: msg });
            mutate();
          }}
          onError={(msg) => setFeedback({ type: "error", message: msg })}
        />
      )}
    </div>
  );
}

// --- Record Create/Edit Modal ---

function RecordModal({
  zoneId,
  zoneName,
  record,
  onClose,
  onSaved,
  onError,
}: {
  zoneId: string;
  zoneName: string;
  record?: CFDnsRecord;
  onClose: () => void;
  onSaved: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const isEdit = !!record;
  const [type, setType] = useState(record?.type || "A");
  const [name, setName] = useState(
    record ? record.name.replace(`.${zoneName}`, "").replace(zoneName, "@") : ""
  );
  const [content, setContent] = useState(record?.content || "");
  const [ttl, setTtl] = useState(record?.ttl || 1);
  const [proxied, setProxied] = useState(record?.proxied ?? false);
  const [priority, setPriority] = useState(record?.priority || 10);
  const [comment, setComment] = useState(record?.comment || "");
  const [saving, setSaving] = useState(false);

  const needsPriority = type === "MX" || type === "SRV";
  const canProxy = ["A", "AAAA", "CNAME"].includes(type);

  const handleSave = async () => {
    if (!name || !content) return;
    setSaving(true);
    try {
      const fullName = name === "@" ? zoneName : `${name}.${zoneName}`;
      const data: CFCreateRecord = {
        type,
        name: fullName,
        content,
        ttl,
        proxied: canProxy ? proxied : false,
        comment: comment || undefined,
        ...(needsPriority ? { priority } : {}),
      };

      if (isEdit && record) {
        await updateDnsRecord(zoneId, record.id, data);
        onSaved(`"${fullName}" aktualisiert.`);
      } else {
        await createDnsRecord(zoneId, data);
        onSaved(`"${fullName}" erstellt.`);
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-cyan/50 transition-all";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.08] bg-card-solid/95 backdrop-blur-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h2 className="font-semibold">
            {isEdit ? "Record bearbeiten" : "Neuer DNS Record"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-white/[0.06] text-muted">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Type */}
          <div>
            <label className="text-[10px] text-muted uppercase tracking-wide mb-1 block">
              Typ
            </label>
            <select
              className={inputClass}
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={isEdit}
            >
              {DNS_RECORD_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div>
            <label className="text-[10px] text-muted uppercase tracking-wide mb-1 block">
              Name
            </label>
            <div className="flex items-center gap-2">
              <input
                className={inputClass}
                placeholder="@ oder subdomain"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <span className="text-xs text-muted shrink-0">.{zoneName}</span>
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="text-[10px] text-muted uppercase tracking-wide mb-1 block">
              {type === "A" || type === "AAAA"
                ? "IP-Adresse"
                : type === "CNAME"
                  ? "Ziel"
                  : type === "MX"
                    ? "Mailserver"
                    : "Inhalt"}
            </label>
            <input
              className={inputClass}
              placeholder={
                type === "A"
                  ? "192.168.1.1"
                  : type === "AAAA"
                    ? "2001:db8::1"
                    : type === "CNAME"
                      ? "target.example.com"
                      : type === "MX"
                        ? "mail.example.com"
                        : "Wert"
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* TTL */}
            <div>
              <label className="text-[10px] text-muted uppercase tracking-wide mb-1 block">
                TTL
              </label>
              <select
                className={inputClass}
                value={ttl}
                onChange={(e) => setTtl(Number(e.target.value))}
              >
                <option value={1}>Auto</option>
                <option value={60}>1 Min</option>
                <option value={300}>5 Min</option>
                <option value={600}>10 Min</option>
                <option value={1800}>30 Min</option>
                <option value={3600}>1 Std</option>
                <option value={14400}>4 Std</option>
                <option value={86400}>1 Tag</option>
              </select>
            </div>

            {/* Priority (MX/SRV) */}
            {needsPriority && (
              <div>
                <label className="text-[10px] text-muted uppercase tracking-wide mb-1 block">
                  Priorität
                </label>
                <input
                  className={inputClass}
                  type="number"
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  min={0}
                  max={65535}
                />
              </div>
            )}

            {/* Proxied */}
            {canProxy && (
              <div>
                <label className="text-[10px] text-muted uppercase tracking-wide mb-1 block">
                  Cloudflare Proxy
                </label>
                <button
                  onClick={() => setProxied(!proxied)}
                  className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    proxied
                      ? "bg-accent-amber/15 text-accent-amber border border-accent-amber/20"
                      : "bg-white/[0.04] text-muted border border-white/[0.08]"
                  }`}
                >
                  {proxied ? <Shield size={14} /> : <ShieldOff size={14} />}
                  {proxied ? "Proxied" : "DNS only"}
                </button>
              </div>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="text-[10px] text-muted uppercase tracking-wide mb-1 block">
              Kommentar (optional)
            </label>
            <input
              className={inputClass}
              placeholder="Notiz zum Record..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/[0.06] flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving || !name || !content}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent-cyan text-background text-sm font-semibold hover:bg-accent-cyan/90 transition-colors disabled:opacity-50"
          >
            {saving ? <Spinner className="h-4 w-4" /> : <Save size={14} />}
            {saving ? "Speichern..." : isEdit ? "Aktualisieren" : "Erstellen"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-white/[0.08] text-sm hover:bg-white/[0.04] transition-colors"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
