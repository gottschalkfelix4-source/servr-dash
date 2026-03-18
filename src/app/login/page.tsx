"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Server, LogIn, UserPlus } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/setup")
      .then((r) => r.json())
      .then((d) => setNeedsSetup(d.needsSetup))
      .catch(() => setNeedsSetup(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = needsSetup ? "/api/auth/setup" : "/api/auth/login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Anmeldung fehlgeschlagen");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Verbindungsfehler");
    } finally {
      setLoading(false);
    }
  };

  if (needsSetup === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const inputClass =
    "w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-accent-cyan/50 focus:shadow-[0_0_20px_-5px_rgba(34,211,238,0.3)] transition-all duration-200 placeholder:text-muted";

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-accent-cyan/15 flex items-center justify-center mb-4 shadow-[0_0_20px_-5px_rgba(34,211,238,0.4)]">
            <Server size={28} className="text-accent-cyan" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            Servr Dash
          </h1>
          <p className="text-sm text-muted mt-1">
            {needsSetup ? "Admin-Account erstellen" : "Anmelden"}
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/[0.06] bg-card backdrop-blur-xl p-6 shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)]"
        >
          {needsSetup && (
            <div className="mb-4 p-3 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20 text-sm text-accent-cyan">
              Erstelle deinen Admin-Account um loszulegen.
            </div>
          )}

          <div className="space-y-4 mb-6">
            <div>
              <label className="text-xs text-muted mb-1.5 block">
                Benutzername
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={inputClass}
                placeholder="admin"
                autoComplete="username"
                autoFocus
                required
              />
            </div>
            <div>
              <label className="text-xs text-muted mb-1.5 block">
                Passwort
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
                autoComplete={needsSetup ? "new-password" : "current-password"}
                required
                minLength={4}
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-accent-red/10 border border-accent-red/20 text-sm text-accent-red">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-accent-cyan text-background font-medium text-sm hover:bg-accent-cyan/90 hover:shadow-[0_0_20px_-5px_rgba(34,211,238,0.4)] transition-all duration-200 disabled:opacity-50"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
            ) : needsSetup ? (
              <>
                <UserPlus size={16} />
                Account erstellen
              </>
            ) : (
              <>
                <LogIn size={16} />
                Anmelden
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
