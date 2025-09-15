"use client";

// Error boundary page for Next.js App Router
// Must be a Client Component and accept `error` and `reset` props
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error for debugging; replace with observability tooling if configured
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Something went wrong</h1>
      {error?.digest && (
        <p style={{ color: "#6b7280", marginTop: "0.5rem" }}>Error ID: {error.digest}</p>
      )}
      <button
        onClick={() => reset()}
        style={{
          marginTop: "1rem",
          padding: "0.5rem 0.75rem",
          borderRadius: 8,
          background: "#111827",
          color: "white",
        }}
        aria-label="Try to recover from the error"
      >
        Try again
      </button>
    </div>
  );
}
