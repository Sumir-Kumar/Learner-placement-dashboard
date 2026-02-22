import { useState } from 'react';
import LearnerDashboard from './components/LearnerDashboard';

function App() {
  const [email, setEmail] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmittedEmail(email.trim());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Learner Dashboard</h1>
            <p className="text-gray-600 text-sm mt-0.5">
              Learner persona, job eligibility, and placement progress
            </p>
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2 flex-1 min-w-[280px] max-w-md">
            <input
              type="email"
              placeholder="Enter student email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Load Dashboard
            </button>
          </form>
        </div>
      </header>

      <main className="p-6">
        {submittedEmail ? (
          <LearnerDashboard email={submittedEmail} />
        ) : (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <p className="text-gray-600">Enter a student&apos;s email address above to load their dashboard.</p>
            <p className="mt-2 text-sm text-gray-500">
              Run <code className="rounded bg-gray-100 px-1.5 py-0.5">npm run dev</code> from the project root so both the API and this app are running.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
