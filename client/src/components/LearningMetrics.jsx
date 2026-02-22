import './Section.css';

export default function LearningMetrics({ student }) {
  const metrics = [
    { label: 'Attendance', value: student?.attendance },
    { label: 'PSP', value: student?.psp },
    { label: 'Modules', value: student?.modules },
  ].filter((m) => m.value != null && String(m.value).trim() !== '');

  if (metrics.length === 0) {
    return (
      <section className="dashboard-section">
        <h2>Learning Metrics</h2>
        <div className="section-content">
          <p className="no-data">No learning metrics available.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-section">
      <h2>Learning Metrics</h2>
      <div className="section-content metrics-grid">
        {metrics.map(({ label, value }) => (
          <div key={label} className="metric-card">
            <span className="metric-value">{value}</span>
            <span className="metric-label">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
