import './Section.css';

export default function PersonalInfo({ student }) {
  const fields = [
    { label: 'Name', value: student?.name },
    { label: 'Email', value: student?.email },
    { label: 'Phone', value: student?.phone },
    { label: 'User ID', value: student?.userId },
    { label: 'Program', value: student?.program },
    { label: 'Status', value: student?.status },
    { label: 'Experience', value: student?.experience },
    { label: 'CTC', value: student?.ctc },
    { label: 'Notice Period', value: student?.noticePeriod },
    { label: 'Skills', value: student?.skills },
  ].filter((f) => f.value != null && String(f.value).trim() !== '');

  return (
    <section className="dashboard-section">
      <h2>Personal Information</h2>
      <div className="section-content grid">
        {fields.map(({ label, value }) => (
          <div key={label} className="field">
            <span className="field-label">{label}</span>
            <span className="field-value">{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
