"use client";

import { useEffect, useState, useCallback } from "react";

const CATEGORIES = ["news","us","world","politics","military","science","technology","finance","entertainment","celebrity","sports","business","gaming","travel","animals","inventions","health","beauty"];

type Stats = {
  posts: {
    total: number;
    last24h: number;
    last7d: number;
    byCategory: Record<string, number>;
  };
  users: {
    total: number;
    activeLast7d: number;
    byLang: Record<string, number>;
    byCategory: Record<string, number>;
  };
};

type ActionStatus = "idle" | "running" | "done" | "error";

function useAction(secret: string) {
  const [status, setStatus] = useState<Record<string, ActionStatus>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});

  const run = useCallback(async (key: string, url: string, params?: Record<string, string>, body?: object, method = "POST") => {
    setStatus((s) => ({ ...s, [key]: "running" }));
    try {
      const fullUrl = params ? `${url}?${new URLSearchParams(params)}` : url;
      const res = await fetch(fullUrl, {
        method,
        headers: {
          "x-generate-secret": secret,
          "x-admin-secret": secret,
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      setMessages((m) => ({ ...m, [key]: data.message ?? data.error ?? "Done" }));
      setStatus((s) => ({ ...s, [key]: res.ok ? "done" : "error" }));
    } catch {
      setStatus((s) => ({ ...s, [key]: "error" }));
      setMessages((m) => ({ ...m, [key]: "Request failed" }));
    }
  }, [secret]);

  return { status, messages, run };
}

type PendingAction = { key: string; url: string; params?: Record<string, string>; body?: object; method?: string; curlCmd: string };

function buildCurl(url: string, secret: string, params?: Record<string, string>, body?: object, method = "POST"): string {
  const fullUrl = params ? `${url}?${new URLSearchParams(params)}` : url;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const lines = [
    `curl -X ${method} '${origin}${fullUrl}'`,
    `  -H 'x-generate-secret: ${secret}'`,
    `  -H 'x-admin-secret: ${secret}'`,
  ];
  if (body) {
    lines.push(`  -H 'Content-Type: application/json'`);
    lines.push(`  -d '${JSON.stringify(body, null, 2)}'`);
  }
  return lines.join(" \\\n");
}

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [cleanupDays, setCleanupDays] = useState("7");
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [evSlug, setEvSlug] = useState("");
  const [evLabel, setEvLabel] = useState("");
  const [evQuery, setEvQuery] = useState("");
  const [evDesc, setEvDesc] = useState("");
  const [evScore, setEvScore] = useState("10");
  const [evMaxPosts, setEvMaxPosts] = useState("3");
  const [evSlot, setEvSlot] = useState("");
  const { status, messages, run } = useAction(secret);

  function requestRun(key: string, url: string, params?: Record<string, string>, body?: object, method = "POST") {
    setPending({ key, url, params, body, method, curlCmd: buildCurl(url, secret, params, body, method) });
  }

  function confirmRun() {
    if (!pending) return;
    run(pending.key, pending.url, pending.params, pending.body, pending.method);
    setPending(null);
  }

  const loadStats = useCallback(async (s: string) => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/admin/stats", { headers: { "x-admin-secret": s } });
      if (!res.ok) return;
      setStats(await res.json());
    } finally {
      setStatsLoading(false);
    }
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/stats", { headers: { "x-admin-secret": secret } });
    if (res.ok) {
      setAuthed(true);
      setStats(await res.json());
    } else {
      alert("Wrong secret");
    }
  }

  useEffect(() => {
    if (authed) {
      const id = setInterval(() => loadStats(secret), 30000);
      return () => clearInterval(id);
    }
  }, [authed, secret, loadStats]);

  if (!authed) {
    return (
      <div style={styles.loginWrap}>
        <form onSubmit={handleLogin} style={styles.loginForm}>
          <h2 style={styles.loginTitle}>Admin</h2>
          <input
            type="password"
            placeholder="Admin secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            style={styles.input}
            autoFocus
          />
          <button type="submit" style={styles.btnPrimary}>Enter</button>
        </form>
      </div>
    );
  }

  const maxPostCat = Math.max(...CATEGORIES.map((c) => stats?.posts.byCategory[c] ?? 0), 1);
  const maxUserCat = Math.max(...CATEGORIES.map((c) => stats?.users.byCategory[c] ?? 0), 1);

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <h1 style={styles.title}>NewsBlock Admin</h1>
        <button onClick={() => loadStats(secret)} style={styles.btnSmall} disabled={statsLoading}>
          {statsLoading ? "Refreshing…" : "Refresh Stats"}
        </button>
      </div>

      {/* Actions */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Actions</h2>
        <div style={styles.actionGrid}>
          <ActionCard
            label="Generate Posts"
            description="Fetch RSS feeds and generate new posts for all categories"
            status={status["generate"] ?? "idle"}
            message={messages["generate"]}
            onRun={() => requestRun("generate", "/api/generate")}
          />
          <ActionCard
            label="Backfill Chinese"
            description="Translate posts from the last 24h that are missing Chinese"
            status={status["backfill"] ?? "idle"}
            message={messages["backfill"]}
            onRun={() => requestRun("backfill", "/api/backfill-zh")}
          />
          <ActionCard
            label="Cleanup Old Posts"
            description="Delete posts older than N days (min 7)"
            status={status["cleanup"] ?? "idle"}
            message={messages["cleanup"]}
            onRun={() => requestRun("cleanup", "/api/cleanup", { days: cleanupDays })}
            extra={
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <label style={styles.label}>Days:</label>
                <input
                  type="number"
                  min={7}
                  value={cleanupDays}
                  onChange={(e) => setCleanupDays(e.target.value)}
                  style={{ ...styles.input, width: 70, marginBottom: 0 }}
                />
              </div>
            }
          />
          <ActionCard
            label="Detect Hot Event"
            description="Scan current headlines and activate a Breaking tab if warranted"
            status={status["event"] ?? "idle"}
            message={messages["event"]}
            onRun={() => requestRun("event", "/api/admin/event-generate", undefined, undefined, "GET")}
          />
        </div>
      </section>

      {/* Manual event creation */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Create Event Manually</h2>
        <div style={styles.eventForm}>
          <div style={styles.eventRow}>
            <div style={styles.eventField}>
              <label style={styles.label}>Slug *</label>
              <input style={styles.input} placeholder="e.g. trump-tariffs" value={evSlug} onChange={(e) => setEvSlug(e.target.value)} />
            </div>
            <div style={styles.eventField}>
              <label style={styles.label}>Label *</label>
              <input style={styles.input} placeholder="e.g. Trump Tariffs" value={evLabel} onChange={(e) => setEvLabel(e.target.value)} />
            </div>
          </div>
          <div style={styles.eventField}>
            <label style={styles.label}>Query * (used to find relevant articles)</label>
            <input style={styles.input} placeholder="e.g. Trump trade war tariffs China" value={evQuery} onChange={(e) => setEvQuery(e.target.value)} />
          </div>
          <div style={styles.eventField}>
            <label style={styles.label}>Description</label>
            <input style={styles.input} placeholder="Short description shown to users" value={evDesc} onChange={(e) => setEvDesc(e.target.value)} />
          </div>
          <div style={styles.eventRow}>
            <div style={styles.eventField}>
              <label style={styles.label}>Score (urgency 1–10)</label>
              <input style={styles.input} type="number" min={1} max={10} value={evScore} onChange={(e) => setEvScore(e.target.value)} />
            </div>
            <div style={styles.eventField}>
              <label style={styles.label}>Max Posts</label>
              <input style={styles.input} type="number" min={1} value={evMaxPosts} onChange={(e) => setEvMaxPosts(e.target.value)} />
            </div>
            <div style={styles.eventField}>
              <label style={styles.label}>Slot (1–3, auto if blank)</label>
              <input style={styles.input} type="number" min={1} max={3} placeholder="auto" value={evSlot} onChange={(e) => setEvSlot(e.target.value)} />
            </div>
          </div>
          <button
            disabled={!evSlug || !evLabel || !evQuery || status["event-manual"] === "running"}
            style={{ ...styles.btnPrimary, ...(status["event-manual"] === "done" ? { backgroundColor: "#22c55e" } : status["event-manual"] === "error" ? { backgroundColor: "#ef4444" } : {}) }}
            onClick={() => {
              const body: Record<string, unknown> = { slug: evSlug, label: evLabel, query: evQuery };
              if (evDesc) body.description = evDesc;
              if (evScore) body.score = parseInt(evScore);
              if (evMaxPosts) body.maxPosts = parseInt(evMaxPosts);
              if (evSlot) body.slot = parseInt(evSlot);
              requestRun("event-manual", "/api/admin/event-generate", undefined, body);
            }}
          >
            {status["event-manual"] === "running" ? "Creating…" : status["event-manual"] === "done" ? "Created!" : "Create Event"}
          </button>
          {messages["event-manual"] && (
            <div style={{ ...styles.actionMsg, color: status["event-manual"] === "done" ? "#22c55e" : "#ef4444" }}>
              {messages["event-manual"]}
            </div>
          )}
        </div>
      </section>

      {/* Clear event slots */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Clear Event Slots</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {[1, 2, 3].map((slot) => (
            <button
              key={slot}
              style={{ ...styles.btnSmall, padding: "8px 20px", fontSize: 13 }}
              onClick={() => requestRun(`del-slot-${slot}`, "/api/admin/event-generate", { slot: String(slot) }, undefined, "DELETE")}
              disabled={status[`del-slot-${slot}`] === "running"}
            >
              {status[`del-slot-${slot}`] === "running" ? "Clearing…" : `Clear Slot ${slot}`}
            </button>
          ))}
          <button
            style={{ ...styles.btnSmall, padding: "8px 20px", fontSize: 13, color: "#ef4444" }}
            onClick={() => requestRun("del-slot-all", "/api/admin/event-generate", undefined, undefined, "DELETE")}
            disabled={status["del-slot-all"] === "running"}
          >
            {status["del-slot-all"] === "running" ? "Clearing…" : "Clear All"}
          </button>
        </div>
        {[1, 2, 3, "all"].map((slot) => {
          const key = `del-slot-${slot}`;
          return messages[key] ? (
            <div key={key} style={{ ...styles.actionMsg, marginTop: 8, color: status[key] === "done" ? "#22c55e" : "#ef4444" }}>
              Slot {slot}: {messages[key]}
            </div>
          ) : null;
        })}
      </section>

      {/* Post stats */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Posts</h2>
        <div style={styles.statRow}>
          <StatBox label="Total" value={stats?.posts.total ?? "—"} />
          <StatBox label="Last 24h" value={stats?.posts.last24h ?? "—"} />
          <StatBox label="Last 7d" value={stats?.posts.last7d ?? "—"} />
        </div>
        <h3 style={styles.subTitle}>Posts by Category</h3>
        <div style={styles.barList}>
          {CATEGORIES.map((cat) => {
            const val = stats?.posts.byCategory[cat] ?? 0;
            return (
              <BarRow key={cat} label={cat} value={val} max={maxPostCat} color="#6c47ff" />
            );
          })}
        </div>
      </section>

      {/* User stats */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Users</h2>
        <div style={styles.statRow}>
          <StatBox label="Total Profiles" value={stats?.users.total ?? "—"} />
          <StatBox label="Active (7d)" value={stats?.users.activeLast7d ?? "—"} />
          {Object.entries(stats?.users.byLang ?? {}).map(([lang, count]) => (
            <StatBox key={lang} label={lang || "en"} value={count} />
          ))}
        </div>
        <h3 style={styles.subTitle}>Subscribers by Category</h3>
        <div style={styles.barList}>
          {CATEGORIES.map((cat) => {
            const val = stats?.users.byCategory[cat] ?? 0;
            return (
              <BarRow key={cat} label={cat} value={val} max={maxUserCat} color="#00b4d8" />
            );
          })}
        </div>
      </section>

      {pending && (
        <div style={styles.overlayBackdrop} onClick={() => setPending(null)}>
          <div style={styles.overlayBox} onClick={(e) => e.stopPropagation()}>
            <div style={styles.overlayTitle}>Confirm Action</div>
            <pre style={styles.curlBox}>{pending.curlCmd}</pre>
            <div style={styles.overlayBtns}>
              <button style={styles.btnCancel} onClick={() => setPending(null)}>Cancel</button>
              <button style={styles.btnPrimary} onClick={confirmRun}>Run</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionCard({ label, description, status, message, onRun, extra }: {
  label: string;
  description: string;
  status: ActionStatus;
  message?: string;
  onRun: () => void;
  extra?: React.ReactNode;
}) {
  const color = status === "done" ? "#22c55e" : status === "error" ? "#ef4444" : status === "running" ? "#f59e0b" : "#6c47ff";
  return (
    <div style={styles.actionCard}>
      <div style={styles.actionLabel}>{label}</div>
      <div style={styles.actionDesc}>{description}</div>
      {extra}
      <button
        onClick={onRun}
        disabled={status === "running"}
        style={{ ...styles.btnPrimary, marginTop: 12, backgroundColor: color }}
      >
        {status === "running" ? "Running…" : status === "done" ? "Run Again" : "Run"}
      </button>
      {message && <div style={{ ...styles.actionMsg, color }}>{message}</div>}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={styles.statBox}>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={styles.barRow}>
      <div style={styles.barLabel}>{label}</div>
      <div style={styles.barTrack}>
        <div style={{ ...styles.barFill, width: `${pct}%`, backgroundColor: color }} />
      </div>
      <div style={styles.barValue}>{value}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 900, margin: "0 auto", padding: "32px 24px", fontFamily: "system-ui, sans-serif", color: "#f1f5f9", backgroundColor: "#0f172a", minHeight: "100vh" },
  topBar: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 },
  title: { fontSize: 24, fontWeight: 800, margin: 0 },
  section: { marginBottom: 48 },
  sectionTitle: { fontSize: 18, fontWeight: 700, marginBottom: 16, color: "#94a3b8" },
  subTitle: { fontSize: 14, fontWeight: 600, color: "#64748b", margin: "24px 0 12px" },
  actionGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 },
  actionCard: { backgroundColor: "#1e293b", borderRadius: 12, padding: 16 },
  actionLabel: { fontSize: 15, fontWeight: 700, marginBottom: 6 },
  actionDesc: { fontSize: 12, color: "#94a3b8", lineHeight: 1.5 },
  actionMsg: { fontSize: 12, marginTop: 8 },
  statRow: { display: "flex", gap: 16, flexWrap: "wrap" },
  statBox: { backgroundColor: "#1e293b", borderRadius: 12, padding: "16px 24px", minWidth: 100, textAlign: "center" },
  statValue: { fontSize: 28, fontWeight: 800 },
  statLabel: { fontSize: 12, color: "#94a3b8", marginTop: 4 },
  barList: { display: "flex", flexDirection: "column", gap: 8 },
  barRow: { display: "flex", alignItems: "center", gap: 12 },
  barLabel: { width: 110, fontSize: 12, color: "#94a3b8", textAlign: "right", textTransform: "capitalize" },
  barTrack: { flex: 1, height: 8, backgroundColor: "#1e293b", borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4, transition: "width 0.4s" },
  barValue: { width: 36, fontSize: 12, color: "#64748b", textAlign: "right" },
  btnPrimary: { backgroundColor: "#6c47ff", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", width: "100%" },
  btnSmall: { backgroundColor: "#1e293b", color: "#94a3b8", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer" },
  input: { backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px", color: "#f1f5f9", fontSize: 14, width: "100%", marginBottom: 12, boxSizing: "border-box" },
  label: { fontSize: 12, color: "#94a3b8" },
  loginWrap: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "#0f172a" },
  loginForm: { backgroundColor: "#1e293b", borderRadius: 16, padding: 32, width: 300 },
  loginTitle: { fontSize: 20, fontWeight: 800, color: "#f1f5f9", marginBottom: 20, textAlign: "center" },
  overlayBackdrop: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  overlayBox: { backgroundColor: "#1e293b", borderRadius: 16, padding: 28, width: 560, maxWidth: "90vw" },
  overlayTitle: { fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#f1f5f9" },
  curlBox: { backgroundColor: "#0f172a", borderRadius: 8, padding: 16, fontSize: 12, color: "#7dd3fc", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all", margin: "0 0 20px" },
  overlayBtns: { display: "flex", gap: 12, justifyContent: "flex-end" },
  btnCancel: { backgroundColor: "#334155", color: "#94a3b8", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  eventForm: { backgroundColor: "#1e293b", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 0 },
  eventRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  eventField: { display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 },
};
