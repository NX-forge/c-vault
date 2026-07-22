"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error in root layout:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: "1rem", fontFamily: "system-ui, sans-serif", textAlign: "center", padding: "1.5rem" }}>
          <p style={{ fontSize: "1.125rem", fontWeight: 600 }}>Something went wrong</p>
          <p style={{ maxWidth: "24rem", fontSize: "0.875rem", color: "#64748b" }}>
            C-Vault hit an unexpected error loading the page. Try reloading.
          </p>
          <button
            onClick={reset}
            style={{ borderRadius: "9999px", background: "#4f46e5", color: "white", padding: "0.5rem 1.25rem", fontSize: "0.875rem", fontWeight: 500, border: "none", cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
