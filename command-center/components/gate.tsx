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
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--background)" }}>
      <div className="card w-full max-w-md text-center" style={{ padding: "40px 32px" }}>
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
          style={{ background: "var(--primary-soft)", color: "var(--tertiary)" }}
        >
          ⌘
        </div>
        <h1 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>{title}</h1>
        <p className="mb-6 mt-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
          {body}
        </p>
        <a
          href="https://office.ramagiritharun.in/login"
          className="btn solid inline-block"
        >
          Sign in to Workora
        </a>
        <div className="mt-4 text-xs" style={{ color: "var(--muted-foreground)" }}>
          After signing in, reload this page.
        </div>
      </div>
    </div>
  );
}
