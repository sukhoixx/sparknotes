import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support – NewsBlock",
  description: "Get help with NewsBlock",
};

export default function SupportPage() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 640, margin: "0 auto", padding: "60px 24px", color: "#111" }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: "0 0 8px" }}>NewsBlock</h1>
        <p style={{ fontSize: 16, color: "#555", margin: 0 }}>Today's news, explained simply.</p>
      </div>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Support</h2>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: "#333" }}>
          Having trouble with the app? We're here to help. Reach out and we'll get back to you as soon as possible.
        </p>
        <a
          href="mailto:jackgan@gmail.com"
          style={{ display: "inline-block", marginTop: 16, fontSize: 15, color: "#e5342a", fontWeight: 600, textDecoration: "none" }}
        >
          jackgan@gmail.com
        </a>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Privacy Policy</h2>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: "#333" }}>
          NewsBlock collects your Google account information (name and email) solely for authentication purposes.
          We do not sell or share your personal data with third parties.
          Content preferences and reading history are stored to personalize your feed.
          We use Google AdMob to display ads, which may use device identifiers in accordance with Google's privacy policy.
        </p>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: "#333", marginTop: 12 }}>
          For questions about your data, contact us at{" "}
          <a href="mailto:jackgan@gmail.com" style={{ color: "#e5342a", textDecoration: "none" }}>
            jackgan@gmail.com
          </a>.
        </p>
      </section>

      <section>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>About</h2>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: "#333" }}>
          NewsBlock delivers top stories across categories including world news, politics, technology, business, science, and more —
          summarized in a format that's easy to read. Available on iOS.
        </p>
        <a
          href="https://apps.apple.com/app/id6766168195"
          style={{ display: "inline-block", marginTop: 16, fontSize: 15, color: "#e5342a", fontWeight: 600, textDecoration: "none" }}
        >
          Download on the App Store →
        </a>
      </section>

      <footer style={{ marginTop: 60, fontSize: 13, color: "#999" }}>
        © {new Date().getFullYear()} NewsBlock. All rights reserved.
      </footer>
    </main>
  );
}
