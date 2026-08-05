export const metadata = {
  title: "Delete Your NewsBlock Account",
  description: "How to request deletion of your NewsBlock account and associated data.",
};

export default function DeleteAccountPage() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px", fontFamily: "system-ui, sans-serif", color: "#1a1a1a", lineHeight: 1.6 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Delete Your NewsBlock Account</h1>
      <p style={{ color: "#666", marginBottom: 32 }}>NewsBlock — your personalized news reader</p>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>How to delete your account</h2>
      <p>You can delete your account directly from the app at any time:</p>
      <ol style={{ paddingLeft: 24, marginTop: 12, marginBottom: 24 }}>
        <li>Open the <strong>NewsBlock</strong> app</li>
        <li>Tap the <strong>Profile</strong> icon in the top-right corner</li>
        <li>Scroll to the bottom of the Profile page</li>
        <li>Tap <strong>Delete Account</strong></li>
        <li>Confirm the deletion when prompted</li>
      </ol>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>What data is deleted</h2>
      <p>When you delete your account, the following data is <strong>permanently deleted immediately</strong>:</p>
      <ul style={{ paddingLeft: 24, marginTop: 12, marginBottom: 24 }}>
        <li>Your user account and authentication credentials</li>
        <li>Your profile (screen name, selected categories, language preference)</li>
        <li>Your article likes and reactions</li>
        <li>Your reading history and streak data</li>
        <li>Your push notification token</li>
      </ul>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>What data is retained</h2>
      <p>The following data is <strong>not linked to your account</strong> and is retained:</p>
      <ul style={{ paddingLeft: 24, marginTop: 12, marginBottom: 24 }}>
        <li>Comments you posted — these are stored with your screen name only, not your account ID. They will remain visible but cannot be traced back to you after deletion.</li>
      </ul>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Can&apos;t access the app?</h2>
      <p>If you are unable to access the app to delete your account, please contact us and we will delete your account manually within 30 days:</p>
      <p style={{ marginTop: 8 }}>
        <a href="https://sparknotes-production.up.railway.app/support" style={{ color: "#ff2442" }}>Contact Support</a>
      </p>

      <hr style={{ margin: "32px 0", borderColor: "#eee" }} />
      <p style={{ color: "#999", fontSize: 13 }}>NewsBlock · Data deletion is effective immediately upon confirmation in the app.</p>
    </main>
  );
}
