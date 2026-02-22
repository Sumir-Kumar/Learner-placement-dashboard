import './Section.css';

export default function AppliedJobsTable({ applications }) {
  if (!applications || applications.length === 0) {
    return (
      <section className="dashboard-section">
        <h2>Applied Jobs</h2>
        <div className="section-content">
          <p className="no-data">No applications found for this student.</p>
        </div>
      </section>
    );
  }

  const columns = [
    { key: 'company', label: 'Company' },
    { key: 'jobRole', label: 'Job Role' },
    { key: 'stage', label: 'Stage' },
    { key: 'round', label: 'Round' },
    { key: 'resumeScore', label: 'Resume Score' },
    { key: 'rejectionReason', label: 'Rejection Reason' },
    { key: 'recruiter', label: 'Recruiter' },
    { key: 'jobOwner', label: 'Job Owner' },
    { key: 'applicationDate', label: 'Application Date' },
  ];

  return (
    <section className="dashboard-section">
      <h2>Applied Jobs</h2>
      <div className="section-content table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map(({ key, label }) => (
                <th key={key}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {applications.map((app, i) => (
              <tr key={app.applicationId || i}>
                {columns.map(({ key }) => (
                  <td key={key}>{app[key] ?? '—'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
