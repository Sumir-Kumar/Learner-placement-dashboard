import { useState, useMemo } from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import RejectionPieChart from './RejectionPieChart';

function parseDate(str) {
  if (!str || typeof str !== 'string') return null;
  const trimmed = str.trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
}

function stageBadgeClass(stage) {
  const s = (stage || '').toLowerCase();
  if (s.includes('reject')) return 'bg-red-50 text-red-700';
  if (s.includes('interview') || s.includes('r1') || s.includes('r2') || s.includes('r3')) return 'bg-yellow-50 text-yellow-700';
  if (s.includes('resume') || s.includes('sent')) return 'bg-blue-50 text-blue-700';
  if (s.includes('shortlist')) return 'bg-green-50 text-green-700';
  return 'bg-gray-100 text-gray-700';
}

export default function AppliedJobsSummary({ applications }) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [expanded, setExpanded] = useState(true);

  const stages = useMemo(() => {
    if (!applications?.length) return [];
    const set = new Set();
    applications.forEach((a) => {
      const s = (a.stage || '').trim();
      if (s) set.add(s);
    });
    return ['', ...Array.from(set).sort()];
  }, [applications]);

  const filtered = useMemo(() => {
    if (!applications?.length) return [];
    let list = applications;
    if (dateFrom) {
      const from = parseDate(dateFrom);
      if (from) list = list.filter((a) => parseDate(a.applicationDate) >= from);
    }
    if (dateTo) {
      const to = parseDate(dateTo);
      if (to) {
        to.setHours(23, 59, 59, 999);
        list = list.filter((a) => parseDate(a.applicationDate) <= to);
      }
    }
    if (stageFilter) {
      list = list.filter((a) => (a.stage || '').trim().toLowerCase() === stageFilter.trim().toLowerCase());
    }
    return list;
  }, [applications, dateFrom, dateTo, stageFilter]);

  if (!applications?.length) {
    return (
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-medium text-gray-900">Rejection Analysis</h2>
        </div>
        <p className="text-sm text-gray-500">No applications for this learner.</p>
      </section>
    );
  }

  const rowsToShow = expanded ? filtered : filtered.slice(0, 5);
  const hasMore = !expanded && filtered.length > 5;

  return (
    <>
      {/* Rejection Analysis box */}
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mb-4 flex w-full items-center justify-between gap-2 text-left focus:outline-none"
        >
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-medium text-gray-900">Rejection Analysis</h2>
          </div>
          <span className="flex items-center gap-1.5 text-sm text-indigo-600">
            {expanded ? (
              <>
                Show less <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Show more <ChevronDown className="h-4 w-4" />
              </>
            )}
          </span>
        </button>

        <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-gray-100 pb-4">
          <span className="text-sm font-medium text-gray-600">Filters:</span>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">From</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">To</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Stage</span>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All</option>
              {stages.filter(Boolean).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          {(dateFrom || dateTo || stageFilter) && (
            <button
              type="button"
              onClick={() => {
                setDateFrom('');
                setDateTo('');
                setStageFilter('');
              }}
              className="text-sm text-indigo-600 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="pb-2 pr-4">Job</th>
                <th className="pb-2 pr-4">Resume Score</th>
                <th className="pb-2 pr-4">Stage</th>
                <th className="pb-2 pr-4">Rejection Reason</th>
                <th className="pb-2">POC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rowsToShow.map((app, i) => (
                <tr key={app.applicationId || i} className="align-top">
                  <td className="py-2 pr-4">
                    <span className="font-medium text-gray-900">{app.company || '–'}</span>
                    {app.jobRole && <span className="block text-gray-500 text-xs">{app.jobRole}</span>}
                  </td>
                  <td className="py-2 pr-4">{app.resumeScore ?? '–'}</td>
                  <td className="py-2 pr-4">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${stageBadgeClass(app.stage)}`}>
                      {app.stage || '–'}
                      {app.round ? ` – ${app.round}` : ''}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-gray-600">{app.rejectionReason || '–'}</td>
                  <td className="py-2">{app.recruiter || app.jobOwner || '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {hasMore && (
          <p className="mt-2 text-xs text-gray-500">
            Showing 5 of {filtered.length} applications — click Show more to see all
          </p>
        )}
        {expanded && filtered.length !== applications.length && (
          <p className="mt-2 text-xs text-gray-500">
            Showing {filtered.length} of {applications.length} applications
          </p>
        )}
      </section>

      {/* Pie chart in separate box below */}
      <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        <RejectionPieChart applications={filtered} />
      </section>
    </>
  );
}
