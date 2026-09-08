export default function Loading() {
  return (
    <div className="loading-content" role="status" aria-label="Memuat data workspace">
      <div className="skeleton" style={{ width: '35%', height: 32 }} />
      <div className="skeleton" style={{ width: '60%', height: 16 }} />
      <div className="stats-grid">
        {[1, 2, 3, 4].map((i) => (
          <div className="skeleton" key={i} style={{ height: 140 }} />
        ))}
      </div>
      <div className="skeleton" style={{ height: 340 }} />
      <span className="sr-only">Memuat data...</span>
    </div>
  );
}
