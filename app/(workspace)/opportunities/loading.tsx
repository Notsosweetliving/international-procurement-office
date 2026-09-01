export default function Loading() {
  return (
    <div className="page">
      <div className="loading-heading" />
      <div className="results-loading">
        {[1, 2, 3, 4].map((x) => (
          <div key={x} />
        ))}
      </div>
    </div>
  );
}
