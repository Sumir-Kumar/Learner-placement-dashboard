import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import './Section.css';

export default function ActivePipeline({ applications }) {
  const activeApps = useMemo(() => {
    if (!applications || applications.length === 0) return [];
    // Filter out rejected applications
    return applications.filter((app) => {
      const stage = String(app.stage || '').trim().toLowerCase();
      return stage !== 'rejected';
    });
  }, [applications]);

  const activeCount = activeApps.length;

  if (activeCount === 0) {
    return (
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-teal-600" />
          <h2 className="text-lg font-medium text-gray-900">Active Pipeline</h2>
        </div>
        <p className="text-sm text-gray-600">No active applications at the moment.</p>
      </section>
    );
  }

  const columns = [
    { key: 'company', label: 'Company' },
    { key: 'applicationDate', label: 'Application Date' },
    { key: 'stage', label: 'Stage' },
    { key: 'jobOwner', label: 'POC' },
  ];

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-teal-600" />
          <h2 className="text-lg font-medium text-gray-900">Active Pipeline</h2>
        </div>
        <span className="inline-flex items-center rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700">
          {activeCount}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {columns.map(({ key, label }) => (
                <th key={key} className="px-4 py-3 text-left font-medium text-gray-700">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activeApps.map((app, i) => (
              <tr key={app.applicationId || i} className="border-b border-gray-100 hover:bg-gray-50">
                {columns.map(({ key }) => (
                  <td key={key} className="px-4 py-3 text-gray-900">
                    {app[key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
