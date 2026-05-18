"use client";

import { useEffect, useState, useCallback, useMemo } from "react";

const CATEGORIES = ["news","us","world","politics","military","science","technology","finance","entertainment","celebrity","sports","business","gaming","travel","animals","inventions","health","beauty"];

type DauPoint = { date: string; count: number };

type Stats = {
  posts: {
    total: number;
    last24h: number;
    last7d: number;
    byCategory: Record<string, number>;
    last24hByCategory: Record<string, number>;
  };
  users: {
    total: number;
    byLang: Record<string, number>;
    byCategory: Record<string, number>;
    dau: DauPoint[];
  };
  feeds: Record<string, string[]>;
};

type ActionStatus = "idle" | "running" | "done" | "error";

type OverlayField = {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "number";
  min?: number;
  max?: number;
  required?: boolean;
  options?: string[];
};

type PendingAction = {
  key: string;
  url: string;
  method: string;
  params?: Record<string, string>;
  body?: object;
  curlCmd?: string;
  fields?: OverlayField[];
  buildFromValues?: (values: Record<string, string>) => { params?: Record<string, string>; body?: object; curlCmd: string };
};

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
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const { status, messages, run } = useAction(secret);

  function requestRun(key: string, url: string, options: {
    params?: Record<string, string>;
    body?: object;
    method?: string;
    fields?: OverlayField[];
    buildFromValues?: (values: Record<string, string>) => { params?: Record<string, string>; body?: object; curlCmd: string };
  } = {}) {
    const { params, body, method = "POST", fields, buildFromValues } = options;
    const curlCmd = buildFromValues ? undefined : buildCurl(url, secret, params, body, method);
    setPending({ key, url, method, params, body, curlCmd, fields, buildFromValues });
  }

  function confirmRun(params?: Record<string, string>, body?: object) {
    if (!pending) return;
    run(pending.key, pending.url, params ?? pending.params, body ?? pending.body, pending.method);
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
            onRun={() => requestRun("cleanup", "/api/cleanup", { params: { days: cleanupDays } })}
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
            description="Scan current headlines and auto-activate a Breaking tab if warranted"
            status={status["event-detect"] ?? "idle"}
            message={messages["event-detect"]}
            onRun={() => requestRun("event-detect", "/api/admin/event-generate", { method: "GET" })}
          />
          <ActionCard
            label="Create Event"
            description="Manually create a Breaking event tab with a custom slug, label, and search query"
            status={status["event-create"] ?? "idle"}
            message={messages["event-create"]}
            onRun={() => requestRun("event-create", "/api/admin/event-generate", {
              method: "POST",
              fields: [
                { key: "slug",        label: "Slug *",                      placeholder: "e.g. trump-tariffs",                required: true },
                { key: "label",       label: "Label *",                     placeholder: "e.g. Trump Tariffs",                required: true },
                { key: "query",       label: "Query *",                     placeholder: "e.g. Trump trade war tariffs China", required: true },
                { key: "description", label: "Description",                 placeholder: "Short description shown to users" },
                { key: "score",       label: "Score (1–10)",   type: "number", min: 1, max: 10, placeholder: "10" },
                { key: "maxPosts",    label: "Max Posts",      type: "number", min: 1,           placeholder: "3" },
                { key: "slot",        label: "Slot (1–3, auto if blank)", type: "number", min: 1, max: 3, placeholder: "auto" },
              ],
              buildFromValues: (values) => {
                const body: Record<string, unknown> = { slug: values.slug, label: values.label, query: values.query };
                if (values.description) body.description = values.description;
                if (values.score)    body.score    = parseInt(values.score);
                if (values.maxPosts) body.maxPosts = parseInt(values.maxPosts);
                if (values.slot)     body.slot     = parseInt(values.slot);
                return { body: body as object, curlCmd: buildCurl("/api/admin/event-generate", secret, undefined, body as object) };
              },
            })}
          />
          <ActionCard
            label="Clear Event Slot"
            description="Remove an active event from a Breaking tab slot"
            status={status["event-clear"] ?? "idle"}
            message={messages["event-clear"]}
            onRun={() => requestRun("event-clear", "/api/admin/event-generate", {
              method: "DELETE",
              fields: [
                { key: "slot", label: "Slot to clear", options: ["1", "2", "3", "All"], required: true },
              ],
              buildFromValues: (values) => {
                const params = values.slot && values.slot !== "All" ? { slot: values.slot } : undefined;
                return { params, curlCmd: buildCurl("/api/admin/event-generate", secret, params, undefined, "DELETE") };
              },
            })}
          />
        </div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Posts</h2>
        <div style={styles.statRow}>
          <StatBox label="Total" value={stats?.posts.total ?? "—"} />
          <StatBox label="Last 24h" value={stats?.posts.last24h ?? "—"} />
          <StatBox label="Last 7d" value={stats?.posts.last7d ?? "—"} />
        </div>
        <h3 style={styles.subTitle}>Posts by Category</h3>
        <div style={styles.barList}>
          {CATEGORIES.map((cat) => (
            <BarRow key={cat} label={cat} value={stats?.posts.byCategory[cat] ?? 0} max={maxPostCat} color="#6c47ff" />
          ))}
        </div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Content Pipeline</h2>
        <div style={styles.pipelineTable}>
          <div style={styles.pipelineHeader}>
            <span style={{ width: 110 }}>Category</span>
            <span style={{ width: 70, textAlign: "center" }}>Sources</span>
            <span style={{ width: 80, textAlign: "center" }}>Last 24h</span>
            <span style={{ width: 80, textAlign: "center" }}>Total</span>
          </div>
          {CATEGORIES.map((cat) => {
            const sources = stats?.feeds?.[cat] ?? [];
            const last24h = stats?.posts.last24hByCategory?.[cat] ?? 0;
            const total = stats?.posts.byCategory?.[cat] ?? 0;
            const expanded = expandedCat === cat;
            return (
              <div key={cat}>
                <div
                  style={{ ...styles.pipelineRow, cursor: "pointer" }}
                  onClick={() => setExpandedCat(expanded ? null : cat)}
                >
                  <span style={{ width: 110, textTransform: "capitalize", color: "#f1f5f9" }}>{cat}</span>
                  <span style={{ width: 70, textAlign: "center", color: "#94a3b8" }}>{sources.length}</span>
                  <span style={{ width: 80, textAlign: "center", color: last24h > 0 ? "#22c55e" : "#64748b", fontWeight: last24h > 0 ? 700 : 400 }}>{last24h}</span>
                  <span style={{ width: 80, textAlign: "center", color: "#64748b" }}>{total}</span>
                  <span style={{ marginLeft: "auto", color: "#475569", fontSize: 11 }}>{expanded ? "▲" : "▼"}</span>
                </div>
                {expanded && sources.length > 0 && (
                  <div style={styles.sourceList}>
                    {sources.map((s) => (
                      <span key={s} style={styles.sourceChip}>{s}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Users</h2>
        <div style={styles.statRow}>
          <StatBox label="Total Profiles" value={stats?.users.total ?? "—"} />
          {Object.entries(stats?.users.byLang ?? {}).map(([lang, count]) => (
            <StatBox key={lang} label={lang || "en"} value={count} />
          ))}
        </div>
        <h3 style={styles.subTitle}>Daily Active Users (14d)</h3>
        <DauChart data={stats?.users.dau ?? []} />
        <h3 style={styles.subTitle}>Subscribers by Category</h3>
        <div style={styles.barList}>
          {CATEGORIES.map((cat) => (
            <BarRow key={cat} label={cat} value={stats?.users.byCategory[cat] ?? 0} max={maxUserCat} color="#00b4d8" />
          ))}
        </div>
      </section>

      {pending && (
        <ConfirmOverlay
          pending={pending}
          onCancel={() => setPending(null)}
          onConfirm={confirmRun}
        />
      )}
    </div>
  );
}

function ConfirmOverlay({ pending, onCancel, onConfirm }: {
  pending: PendingAction;
  onCancel: () => void;
  onConfirm: (params?: Record<string, string>, body?: object) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});

  const computed = useMemo(() => {
    if (pending.buildFromValues) return pending.buildFromValues(values);
    return { params: pending.params, body: pending.body, curlCmd: pending.curlCmd ?? "" };
  }, [pending, values]);

  const canConfirm = !pending.fields ||
    pending.fields.filter((f) => f.required).every((f) => values[f.key]?.trim());

  return (
    <div style={styles.overlayBackdrop} onClick={onCancel}>
      <div style={styles.overlayBox} onClick={(e) => e.stopPropagation()}>
        <div style={styles.overlayTitle}>Confirm Action</div>
        {pending.fields?.map((field, idx) => (
          <div key={field.key} style={{ marginBottom: 12 }}>
            <label style={{ ...styles.label, display: "block", marginBottom: 4 }}>{field.label}</label>
            {field.options ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {field.options.map((opt) => (
                  <button
                    key={opt}
                    style={{ ...styles.btnSmall, padding: "6px 18px", ...(values[field.key] === opt ? { backgroundColor: "#6c47ff", color: "#fff" } : {}) }}
                    onClick={() => setValues((v) => ({ ...v, [field.key]: opt }))}>
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <input
                autoFocus={idx === 0}
                style={{ ...styles.input, marginBottom: 0 }}
                type={field.type ?? "text"}
                placeholder={field.placeholder}
                min={field.min}
                max={field.max}
                value={values[field.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
              />
            )}
          </div>
        ))}
        <pre style={styles.curlBox}>{computed.curlCmd}</pre>
        <div style={styles.overlayBtns}>
          <button style={styles.btnCancel} onClick={onCancel}>Cancel</button>
          <button
            style={{ ...styles.btnPrimary, width: "auto", opacity: canConfirm ? 1 : 0.5 }}
            disabled={!canConfirm}
            onClick={() => onConfirm(computed.params, computed.body)}>
            Run
          </button>
        </div>
      </div>
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

function DauChart({ data }: { data: DauPoint[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 60, marginBottom: 8 }}>
      {data.map(({ date, count }) => {
        const pct = (count / max) * 100;
        const label = date.slice(5); // MM-DD
        return (
          <div key={date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, height: "100%" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
              <div
                title={`${date}: ${count}`}
                style={{
                  width: "100%",
                  height: count === 0 ? 2 : `${pct}%`,
                  backgroundColor: count === 0 ? "#1e293b" : "#6c47ff",
                  borderRadius: 3,
                  transition: "height 0.3s",
                  minHeight: 2,
                }}
              />
            </div>
            <div style={{ fontSize: 9, color: "#475569", whiteSpace: "nowrap" }}>{label}</div>
            {count > 0 && <div style={{ fontSize: 9, color: "#94a3b8" }}>{count}</div>}
          </div>
        );
      })}
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
  input: { backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px", color: "#f1f5f9", fontSize: 14, width: "100%", marginBottom: 12, boxSizing: "border-box" },
  label: { fontSize: 12, color: "#94a3b8" },
  loginWrap: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "#0f172a" },
  loginForm: { backgroundColor: "#1e293b", borderRadius: 16, padding: 32, width: 300 },
  loginTitle: { fontSize: 20, fontWeight: 800, color: "#f1f5f9", marginBottom: 20, textAlign: "center" },
  overlayBackdrop: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  overlayBox: { backgroundColor: "#1e293b", borderRadius: 16, padding: 28, width: 560, maxWidth: "90vw", maxHeight: "90vh", overflowY: "auto" },
  overlayTitle: { fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#f1f5f9" },
  curlBox: { backgroundColor: "#0f172a", borderRadius: 8, padding: 16, fontSize: 12, color: "#7dd3fc", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all", margin: "16px 0 20px" },
  overlayBtns: { display: "flex", gap: 12, justifyContent: "flex-end" },
  btnCancel: { backgroundColor: "#334155", color: "#94a3b8", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  pipelineTable: { display: "flex", flexDirection: "column", gap: 2 },
  pipelineHeader: { display: "flex", alignItems: "center", gap: 12, padding: "6px 12px", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" },
  pipelineRow: { display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", backgroundColor: "#1e293b", borderRadius: 8, fontSize: 13 },
  sourceList: { display: "flex", flexWrap: "wrap" as const, gap: 6, padding: "8px 12px 10px 12px", backgroundColor: "#162032", borderRadius: "0 0 8px 8px", marginTop: -4 },
  sourceChip: { backgroundColor: "#0f172a", color: "#7dd3fc", fontSize: 11, padding: "3px 8px", borderRadius: 4, fontFamily: "monospace" },
};
