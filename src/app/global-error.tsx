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
    console.error("Global render error", error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0f0f12",
          color: "#f8fafc",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          padding: "1.5rem",
        }}
      >
        <main style={{ width: "min(680px, 100%)", display: "grid", gap: "0.8rem" }}>
          <h1 style={{ margin: 0, fontSize: "1.25rem" }}>Se produjo un error inesperado.</h1>
          <p style={{ margin: 0, color: "#cbd5e1" }}>
            Estamos registrando el incidente. Intenta recargar para continuar.
          </p>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.85rem" }}>
            Digest: {error.digest ?? "no-disponible"}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              justifySelf: "start",
              border: "1px solid #ff8a4c",
              background: "#ff5a1f",
              color: "#fff",
              borderRadius: 999,
              padding: "0.5rem 0.9rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </main>
      </body>
    </html>
  );
}
