"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [result, setResult] = useState("Checking /api/item without a session…");

  useEffect(() => {
    fetch("/api/item", { credentials: "include" })
      .then(async (response) => {
        const body = await response.text();
        setResult("GET /api/item → " + response.status + " " + response.statusText + "\n" + body);
      })
      .catch((error) => setResult("Request failed: " + error.message));
  }, []);

  return (
    <main style={{ fontFamily: "Arial, sans-serif", maxWidth: 680, margin: "64px auto", padding: 24 }}>
      <h1>Inventory API</h1>
      <p>Live unauthenticated-access check for the Password Change assignment.</p>
      <pre style={{ background: "#111827", color: "#e5e7eb", borderRadius: 8, padding: 18, whiteSpace: "pre-wrap" }}>
        {result}
      </pre>
    </main>
  );
}
