export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: "none", width: "100%", margin: 0 }}>
      {children}
    </div>
  );
}
