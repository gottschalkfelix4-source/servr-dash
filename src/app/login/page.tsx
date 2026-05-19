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
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-cyan border-t-transparent" />
      </div>
    );
  }

  const inputClass =
    "w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted transition-colors duration-150 focus:border-accent-cyan focus:outline-none";

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md border border-border bg-card">
            <Server size={28} className="text-accent-cyan" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Servr Dash</h1>
          <p className="mt-1 text-sm text-muted">
            {needsSetup ? "Admin-Account erstellen" : "Anmelden"}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-border bg-card p-5"
        >
          {needsSetup && (
            <div className="mb-4 rounded-md border border-accent-cyan/20 bg-accent-cyan/10 p-3 text-sm text-accent-cyan">
              Erstelle deinen Admin-Account um loszulegen.
            </div>
          )}

          <div className="mb-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs text-muted">
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
              <label className="mb-1.5 block text-xs text-muted">
                Passwort
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="********"
                autoComplete={needsSetup ? "new-password" : "current-password"}
                required
                minLength={8}
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-accent-red/20 bg-accent-red/10 p-3 text-sm text-accent-red">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-accent-cyan py-2.5 text-sm font-medium text-background transition-colors duration-150 hover:bg-accent-cyan/90 disabled:opacity-50"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
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
