const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export async function fetchDashboard(email) {
  let res;
  try {
    // If VITE_API_BASE already includes `/api`, avoid doubling.
    const base = API_BASE.replace(/\/+$/, '');
    const path = base.endsWith('/api') ? `${base}/dashboard` : `${base}/api/dashboard`;
    res = await fetch(`${path}?email=${encodeURIComponent(email)}`);
  } catch (err) {
    throw new Error(
      err.message === 'Failed to fetch'
        ? 'Cannot reach the server. Start both the backend and frontend (run "npm run dev" from the project root).'
        : err.message
    );
  }
  const contentType = res.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await res.json() : {};
  if (!res.ok) {
    const msg = [data.error, data.message].filter(Boolean).join(' — ') || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}
