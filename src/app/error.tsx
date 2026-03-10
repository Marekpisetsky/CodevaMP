"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route render error", error);
  }, [error]);

  return (
    <main style={{ maxWidth: 760, margin: "8vh auto", padding: "1.5rem", color: "#fff" }}>
      <h1>Se produjo un error al renderizar la pagina.</h1>
      <p style={{ color: "#d1d5db" }}>Digest: {error.digest ?? "no-disponible"}</p>
      <button type="button" onClick={() => reset()}>
        Reintentar
      </button>
    </main>
  );
}
