import { useMemo } from 'react';
import './Section.css';

export default function PlacementFunnel({ applications }) {
  const stageCounts = useMemo(() => {
    if (!applications || applications.length === 0) return [];
    const counts = {};
    applications.forEach((app) => {
      const stage = app.stage || 'Unknown';
      counts[stage] = (counts[stage] || 0) + 1;
    });
    return Object.entries(counts).map(([stage, count]) => ({ stage, count }));
  }, [applications]);

  if (stageCounts.length === 0) {
    return (
      <section className="dashboard-section">
        <h2>Placement Funnel</h2>
        <div className="section-content">
          <p className="no-data">No application records to display in the funnel.</p>
        </div>
      </section>
    );
  }

  const maxCount = Math.max(...stageCounts.map((s) => s.count));

  return (
    <section className="dashboard-section">
      <h2>Placement Funnel</h2>
      <div className="section-content">
        <div className="funnel-chart">
          {stageCounts.map(({ stage, count }) => (
            <div key={stage} className="funnel-row">
              <span className="funnel-label">{stage}</span>
              <div className="funnel-bar-wrap">
                <div
                  className="funnel-bar"
                  style={{ width: `${maxCount ? (count / maxCount) * 100 : 0}%` }}
                />
              </div>
              <span className="funnel-count">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
