import { useState, useEffect } from 'react';
import { User, TrendingUp, Briefcase, FileText } from 'lucide-react';
import { fetchDashboard } from '../api';
import AppliedJobsSummary from './AppliedJobsSummary';
import ActivePipeline from './ActivePipeline';
import ExpandableText from './ExpandableText';

function Field({ label, value, placeholder = '–' }) {
  const v = value != null && String(value).trim() !== '' ? value : placeholder;
  return (
    <li className="flex items-start gap-2 text-sm">
      <b className="text-gray-700 shrink-0">{label}:</b>
      <span className="text-gray-900">{v}</span>
    </li>
  );
}

function StatusBadge({ value, green }) {
  const v = value != null && String(value).trim() !== '' ? value : '–';
  const isActive = green ?? ['active', 'yes', 'eligible'].includes(String(v).toLowerCase());
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium ${
        isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'
      }`}
    >
      {v}
    </span>
  );
}

/** Parse number from string; return null if not a number. */
function parseNum(s) {
  if (s == null || s === '') return null;
  const n = typeof s === 'number' ? s : parseFloat(String(s).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

/** Total / tech experience: assume months, show years (÷12). */
function formatExperience(value) {
  const n = parseNum(value);
  if (n == null) return '–';
  const years = n / 12;
  return years % 1 === 0 ? `${years} years` : `${years.toFixed(1)} years`;
}

/** CTC: append LPA. */
function formatCtc(value) {
  const v = value != null && String(value).trim() !== '' ? value : null;
  if (!v) return '–';
  const n = parseNum(v);
  if (n != null) return `${n} LPA`;
  return `${v} LPA`;
}

/** Notice period: assume months, show days (×30). */
function formatNoticePeriod(value) {
  const n = parseNum(value);
  if (n == null) return '–';
  const days = Math.round(n * 30);
  return `${days} days`;
}

export default function LearnerDashboard({ email }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchDashboard(email)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setData(null);
        setLoading(false);
      });
  }, [email]);

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl bg-white shadow-sm">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
          <p className="mt-3 text-gray-600">Loading dashboard for {email}…</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isNotFound = error.toLowerCase().includes('not found');
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl bg-white shadow-sm">
        <div className="text-center">
          <div className="text-4xl">{isNotFound ? '👤' : '⚠️'}</div>
          <h2 className="mt-2 text-lg font-semibold text-gray-900">
            {isNotFound ? 'Student not found' : 'Something went wrong'}
          </h2>
          <p className="mt-1 text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const { student, applications } = data;

  const resumeSent = parseNum(student?.resumeSent);
  const shortlisted = parseNum(student?.shortlisted);
  const interviewed = parseNum(student?.interviewed);
  const offers = parseNum(student?.offers);
  const resumeToShortlistPct =
    resumeSent != null && resumeSent > 0 && shortlisted != null
      ? ((shortlisted / resumeSent) * 100).toFixed(1)
      : null;
  const i2hPct =
    interviewed != null && interviewed > 0 && offers != null
      ? ((offers / interviewed) * 100).toFixed(1)
      : null;

  return (
    <div className="space-y-8">
      {/* Top Grid: Personal / Learning / Preferences */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-medium text-gray-900">Personal Info</h2>
          </div>
          <ul className="space-y-2">
            <Field label="Name" value={student?.name} />
            <Field label="Email" value={student?.email} />
            <Field label="Phone" value={student?.phone} />
            <Field label="Program" value={student?.program} />
            <Field label="Age / Org Year" value={student?.orgYear} />
            <li className="flex items-center gap-2 text-sm">
              <b className="text-gray-700">Status:</b>
              <StatusBadge value={student?.status} green />
            </li>
          </ul>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-medium text-gray-900">Learning Outcomes</h2>
          </div>
          <ul className="space-y-2">
            <Field label="Attendance" value={student?.attendance} />
            <Field label="PSP" value={student?.psp} />
            <ExpandableText label="Modules Done" value={student?.modules} />
            <Field label="Current Module" value={student?.currentModule} />
            <li className="flex items-center gap-2 text-sm">
              <b className="text-gray-700">Job Eligibility:</b>
              <StatusBadge value={student?.eligibleJobs != null && student?.eligibleJobs !== '' ? 'Yes' : null} />
            </li>
          </ul>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-teal-600" />
            <h2 className="text-lg font-medium text-gray-900">Job Preferences</h2>
          </div>
          <ul className="space-y-2">
            <Field label="Total Experience" value={formatExperience(student?.experience)} />
            <Field label="Tech Experience" value={formatExperience(student?.techExperience)} />
            <Field label="CTC Range" value={formatCtc(student?.ctc)} />
            <Field label="Notice Period" value={formatNoticePeriod(student?.noticePeriod)} />
            <Field label="Current Job" value={student?.currentJob} />
            <ExpandableText label="Skills" value={student?.skills} />
          </ul>
        </section>
      </div>

      {/* Currently Available Jobs + Placement Funnel (Placement before Rejection) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-medium text-gray-900">Currently Available Jobs</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-xl bg-blue-50 p-4">
              <p className="text-2xl font-semibold text-blue-700">{student?.totalActiveJobs ?? '–'}</p>
              <p className="text-sm text-blue-600">Total</p>
            </div>
            <div className="rounded-xl bg-green-50 p-4">
              <p className="text-2xl font-semibold text-green-700">{student?.eligibleJobs ?? '–'}</p>
              <p className="text-sm text-green-600">Eligible</p>
            </div>
            <div className="rounded-xl bg-purple-50 p-4">
              <p className="text-2xl font-semibold text-purple-700">{student?.relevantJobs ?? '–'}</p>
              <p className="text-sm text-purple-600">Relevant</p>
            </div>
          </div>
        </section>

        {/* Placement Funnel + Resume to shortlist % and I2H % */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-medium text-gray-900">Placement Funnel</h2>
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="grid flex-1 grid-cols-2 gap-4 text-center md:grid-cols-5">
              <div>
                <p className="text-xl font-semibold text-gray-900">{student?.applications ?? '–'}</p>
                <p className="text-sm text-gray-600">Applications</p>
              </div>
              <div>
                <p className="text-xl font-semibold text-gray-900">{student?.resumeSent ?? '–'}</p>
                <p className="text-sm text-gray-600">Resume Sent</p>
              </div>
              <div>
                <p className="text-xl font-semibold text-gray-900">{student?.shortlisted ?? '–'}</p>
                <p className="text-sm text-gray-600">Shortlisted</p>
              </div>
              <div>
                <p className="text-xl font-semibold text-gray-900">{student?.interviewed ?? '–'}</p>
                <p className="text-sm text-gray-600">Interviews</p>
              </div>
              <div>
                <p className="text-xl font-semibold text-gray-900">{student?.offers ?? '–'}</p>
                <p className="text-sm text-gray-600">Offers</p>
              </div>
            </div>
            <div className="shrink-0 space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4 md:w-48">
              <div>
                <p className="text-xs font-medium text-gray-500">Resume → Shortlist %</p>
                <p className="text-xl font-semibold text-gray-900">{resumeToShortlistPct != null ? `${resumeToShortlistPct}%` : '–'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">I2H %</p>
                <p className="text-xl font-semibold text-gray-900">{i2hPct != null ? `${i2hPct}%` : '–'}</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Active Pipeline (before Rejection Analysis) */}
      <ActivePipeline applications={applications} />

      {/* Rejection Analysis (table + pie chart, expand/collapse) */}
      <AppliedJobsSummary applications={applications} />
    </div>
  );
}
