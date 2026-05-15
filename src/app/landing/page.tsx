import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NewsBlock – Today's News, Explained Simply",
  description: "Get top stories across world news, politics, tech, science, and more — summarized in seconds. Download NewsBlock on iOS.",
};

const APP_STORE_URL = "https://apps.apple.com/app/id6766168195";

const features = [
  { emoji: "⚡️", title: "Instant Summaries", body: "Every story distilled to what matters — no fluff, no clickbait." },
  { emoji: "🌍", title: "All Topics Covered", body: "World, politics, tech, science, business, health, and more." },
  { emoji: "🇹🇼", title: "Multilingual", body: "Read in English, Traditional Chinese, or Simplified Chinese." },
  { emoji: "🔴", title: "Breaking Topics", body: "Hot events get their own live tab so you never miss the story everyone's talking about." },
  { emoji: "🎨", title: "Clean Design", body: "A distraction-free reading experience inspired by the best of modern social apps." },
  { emoji: "🔒", title: "Privacy First", body: "We don't sell your data. Ever." },
];

export default function LandingPage() {
  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", color: "#111", overflowX: "hidden" }}>

      {/* Hero */}
      <section style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #2d1010 100%)", color: "#fff", padding: "80px 24px 72px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📰</div>
          <h1 style={{ fontSize: "clamp(36px, 6vw, 56px)", fontWeight: 900, margin: "0 0 16px", letterSpacing: "-1px", lineHeight: 1.1 }}>
            NewsBlock
          </h1>
          <p style={{ fontSize: "clamp(16px, 2.5vw, 20px)", color: "#ccc", margin: "0 0 36px", lineHeight: 1.5 }}>
            Today's news, explained simply.
          </p>
          <a
            href={APP_STORE_URL}
            style={{
              display: "inline-block",
              background: "#ff2442",
              color: "#fff",
              fontWeight: 700,
              fontSize: 17,
              padding: "16px 36px",
              borderRadius: 50,
              textDecoration: "none",
              letterSpacing: "0.2px",
            }}
          >
            Download on the App Store
          </a>
        </div>
      </section>

      {/* Features */}
      <section style={{ background: "#fff", padding: "72px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, marginBottom: 48 }}>
            Everything you need to stay informed
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 32,
          }}>
            {features.map((f) => (
              <div key={f.title} style={{ padding: "28px 24px", background: "#fafafa", borderRadius: 16 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{f.emoji}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 8px" }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: "#555", lineHeight: 1.6, margin: 0 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "#ff2442", color: "#fff", padding: "72px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, margin: "0 0 16px" }}>
            Start reading smarter today
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.85)", margin: "0 0 32px", lineHeight: 1.5 }}>
            Free to download. No subscription required.
          </p>
          <a
            href={APP_STORE_URL}
            style={{
              display: "inline-block",
              background: "#fff",
              color: "#ff2442",
              fontWeight: 700,
              fontSize: 17,
              padding: "16px 36px",
              borderRadius: 50,
              textDecoration: "none",
            }}
          >
            Download on the App Store
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: "#1a1a1a", color: "#666", padding: "32px 24px", textAlign: "center", fontSize: 13 }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <p style={{ margin: "0 0 8px" }}>© {new Date().getFullYear()} NewsBlock. All rights reserved.</p>
          <p style={{ margin: 0 }}>
            <a href="/support" style={{ color: "#888", textDecoration: "none", marginRight: 16 }}>Support</a>
            <a href="mailto:jackgan@gmail.com" style={{ color: "#888", textDecoration: "none" }}>Contact</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
