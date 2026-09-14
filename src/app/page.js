export default function Home() {
  return (
    <main style={{ fontFamily: "Arial, sans-serif", maxWidth: 680, margin: "64px auto", padding: 24 }}>
      <h1>Inventory API</h1>
      <p>This backend is used by the Password Change assignment frontend.</p>
      <p>
        <a href="/api/item">Open the protected item API</a>
      </p>
    </main>
  );
}
