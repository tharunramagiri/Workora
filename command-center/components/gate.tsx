"use client";

// Shared sign-in gate: the Command Center reuses the main app's JWT session.
// If there is no token (or it expired), show a clear CTA instead of a wall of
// API errors.

export default function SignInGate({ reason }: { reason: "no-token" | "expired" }) {
  const title = reason === "no-token" ? "Sign in to Workora first" : "Session expired";
  const body =
    reason === "no-token"
      ? "The Command Center reads your Workora session. Sign in at office.ramagiritharun.in, then come back."
      : "Your Workora session token expired. Sign in again, then reload this page.";
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card text-center max-w-md" style={{ padding: "40px 32px" }}>
        <div
          className="mx-auto mb-4 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
        >
          ⌘
        </div>
        <h1 className="text-xl font-semibold mb-2">{title}</h1>
        <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
          {body}
        </p>
        <a
          href="https://office.ramagiritharun.in/login"
          className="inline-block px-6 py-2.5 rounded-full text-sm font-medium"
          style={{ background: "var(--accent)", color: "#0c0a09", textDecoration: "none" }}
        >
          Sign in to Workora
        </a>
        <div className="mt-4 text-xs" style={{ color: "var(--muted)" }}>
          After signing in, reload this page.
        </div>
      </div>
    </div>
  );
}
