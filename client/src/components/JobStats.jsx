import './Section.css';

export default function JobStats({ student, applications }) {
  const totalApplied = applications?.length ?? 0;
  const jobCounts = student?.jobCounts;
  const funnelCounts = student?.funnelCounts;

  const stats = [
    { label: 'Total Applications', value: totalApplied },
    ...(jobCounts ? [{ label: 'Job Counts', value: jobCounts }] : []),
    ...(funnelCounts ? [{ label: 'Funnel Counts', value: funnelCounts }] : []),
  ].filter((s) => s.value != null && String(s.value).trim() !== '');

  if (stats.length === 0) {
    return (
      <section className="dashboard-section">
        <h2>Job Statistics</h2>
        <div className="section-content">
          <p className="no-data">No job statistics available.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-section">
      <h2>Job Statistics</h2>
      <div className="section-content metrics-grid">
        {stats.map(({ label, value }) => (
          <div key={label} className="metric-card">
            <span className="metric-value">{value}</span>
            <span className="metric-label">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
