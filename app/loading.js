export default function Loading() {
  return (
    <div className="loading-shell" role="status" aria-label="Loading expense data">
      <div className="loading-heading" />
      <div className="loading-metrics">
        <div />
        <div />
        <div />
      </div>
      <span>Loading the latest expense view…</span>
    </div>
  );
}
