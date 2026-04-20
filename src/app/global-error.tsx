"use client";

import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="de">
      <body
        style={{
          display: "flex",
          minHeight: "100svh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          backgroundColor: "#FAF7F2",
          color: "#2A2724",
          fontFamily: "Inter, system-ui, sans-serif",
          padding: "1rem",
          textAlign: "center",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#C85A3E"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
        <div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 500, marginBottom: "0.25rem" }}>
            Unerwarteter Fehler
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#6B665E" }}>
            Die App konnte nicht geladen werden.
          </p>
          {error.digest && (
            <p style={{ fontSize: "0.75rem", color: "#6B665E", marginTop: "0.25rem" }}>
              Fehler-ID:{" "}
              <code style={{ fontFamily: "monospace" }}>{error.digest}</code>
            </p>
          )}
        </div>
        <button
          onClick={reset}
          style={{
            borderRadius: "0.5rem",
            border: "1px solid #E8E2D5",
            backgroundColor: "#FFFFFF",
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            cursor: "pointer",
          }}
        >
          Erneut versuchen
        </button>
      </body>
    </html>
  );
}
