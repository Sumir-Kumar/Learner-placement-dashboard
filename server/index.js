import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { google } from 'googleapis';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'] }));
app.use(express.json());

// Spreadsheet IDs from the provided links (override via env if needed)
const STUDENT_MASTER_SHEET_ID = process.env.STUDENT_MASTER_SHEET_ID || '1OE2AxpBiFN_4T2IFMANmJFrY_bO6QnCDwWFD3Z_WWec';
const APPLICATIONS_SHEET_ID = process.env.APPLICATIONS_SHEET_ID || '1Dbc_k3WZlaICcItbMq54GCjxIwzx2OEeZPrLTHGB7ak';
const STUDENT_SHEET_RANGE = process.env.STUDENT_SHEET_RANGE || 'Main';
const APPLICATIONS_SHEET_RANGE = process.env.APPLICATIONS_SHEET_RANGE || 'Main';
// Optional published-to-web CSV URLs (public). Use when you publish the sheet to web.
const STUDENT_PUBLISHED_CSV_URL = process.env.STUDENT_PUBLISHED_CSV_URL || '';
const APPLICATIONS_PUBLISHED_CSV_URL = process.env.APPLICATIONS_PUBLISHED_CSV_URL || '';

/**
 * Get Google Sheets client using Service Account.
 * Credentials must be in GOOGLE_SERVICE_ACCOUNT_JSON env (JSON string)
 * or GOOGLE_APPLICATION_CREDENTIALS pointing to a JSON file.
 */
async function getSheetsClient() {
  let credentials;
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    } catch (e) {
      throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_JSON: must be valid JSON');
    }
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const fs = await import('fs');
    const path = await import('path');
    const credPath = path.resolve(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS);
    const raw = fs.readFileSync(credPath, 'utf8');
    credentials = JSON.parse(raw);
  } else {
    throw new Error(
      'Missing Google credentials. Set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS. See README.'
    );
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  return google.sheets({ version: 'v4', auth });
}

/**
 * Parse sheet rows into objects using first row as headers.
 * Handles various header formats (spaces, underscores, case).
 */
function rowsToObjects(rows) {
  if (!rows || rows.length < 2) return [];
  const rawHeaders = rows[0];
  const headers = rawHeaders.map((h) =>
    String(h || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
  );
  const result = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const obj = {};
    headers.forEach((h, j) => {
      obj[h] = row[j] !== undefined && row[j] !== null ? String(row[j]).trim() : '';
    });
    result.push(obj);
  }
  return result;
}

/**
 * Parse CSV text into array of rows (array of fields).
 * Handles quoted fields and escaped quotes.
 */
function parseCSV(text) {
  const rows = [];
  let cur = '';
  let row = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (ch === '"') {
      if (inQuotes && next === '"') {
        // escaped quote
        cur += '"';
        i++; // skip next
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      row.push(cur);
      cur = '';
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      // handle CRLF
      // if CRLF, skip the LF after CR
      if (ch === '\r' && next === '\n') {
        i++;
      }
      row.push(cur);
      rows.push(row);
      row = [];
      cur = '';
    } else {
      cur += ch;
    }
  }
  // push remaining
  if (cur !== '' || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }
  // Trim trailing empty line if present
  if (rows.length > 0) {
    const last = rows[rows.length - 1];
    if (last.length === 1 && last[0] === '') rows.pop();
  }
  // Trim whitespace from each cell
  return rows.map((r) => r.map((c) => (c === undefined || c === null ? '' : String(c).trim())));
}

async function fetchPublishedCsvRows(url) {
  if (!url) return [];
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch published CSV: ${resp.status}`);
  const text = await resp.text();
  return parseCSV(text);
}

/**
 * Unified row fetcher: prefer Google Sheets API when service account credentials
 * are available. Only fallback to published CSV URLs if no credentials exist.
 */
async function fetchRows({ spreadsheetId, range, publishedUrl }) {
  const hasCreds = Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS);
  if (hasCreds) {
    const sheets = await getSheetsClient();
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    return response.data.values || [];
  }

  if (publishedUrl && publishedUrl.trim() !== '') {
    // No service account available; use published CSV fallback (less secure).
    return await fetchPublishedCsvRows(publishedUrl);
  }

  throw new Error('No Google credentials available and no published CSV URL provided');
}

/**
 * Find a student by email (case-insensitive).
 */
function findStudentByEmail(students, email) {
  const normalized = (email || '').trim().toLowerCase();
  return students.find((s) => {
    const e = (s.email || s.e_mail || '').trim().toLowerCase();
    return e === normalized;
  });
}

// API Key fallback for published sheets (optional)
// If sheets are "Published to web", we can use a simple fetch with API key for public access
// Primary: Service Account (for private sheets)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/student', async (req, res) => {
  const email = req.query.email;
  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const rows = await fetchRows({
      spreadsheetId: STUDENT_MASTER_SHEET_ID,
      range: STUDENT_SHEET_RANGE,
      publishedUrl: STUDENT_PUBLISHED_CSV_URL,
    });
    const students = rowsToObjects(rows);
    const student = findStudentByEmail(students, email);

    if (!student) {
      return res.status(404).json({ error: 'Student not found', code: 'STUDENT_NOT_FOUND' });
    }

    // Normalize keys for frontend
    const normalized = {
      userId: student.userid || student.user_id || student.userid || '',
      name: student.name || '',
      email: student.email || student.e_mail || '',
      phone: student.phone || '',
      program: student.program || '',
      status: student.status || '',
      attendance: student.attendance || '',
      psp: student.psp || '',
      modules: student.modules || '',
      experience: student.experience || '',
      ctc: student.ctc || '',
      noticePeriod: student.noticeperiod || student.notice_period || '',
      skills: student.skills || '',
      jobCounts: student.jobcounts || student.job_counts || '',
      funnelCounts: student.funnelcounts || student.funnel_counts || '',
      raw: student, // Pass through for any extra fields
    };

    res.json(normalized);
  } catch (err) {
    console.error('Error fetching student:', err.message);
    res.status(500).json({
      error: 'Failed to fetch student data',
      message: err.message,
    });
  }
});

app.get('/api/applications', async (req, res) => {
  const userId = req.query.userId;
  if (!userId || !String(userId).trim()) {
    return res.status(400).json({ error: 'UserId is required' });
  }

  try {
    const rows = await fetchRows({
      spreadsheetId: APPLICATIONS_SHEET_ID,
      range: APPLICATIONS_SHEET_RANGE,
      publishedUrl: APPLICATIONS_PUBLISHED_CSV_URL,
    });
    const applications = rowsToObjects(rows);

    const uid = String(userId).trim().toLowerCase();
    const filtered = applications.filter((app) => {
      const appUid = String(app.userid || app.user_id || '').trim().toLowerCase();
      return appUid === uid;
    });

    const normalized = filtered.map((app) => ({
      applicationId: app.applicationid || app.application_id || '',
      userId: app.userid || app.user_id || '',
      jobRole: app.jobrole || app.job_role || '',
      company: app.company || '',
      stage: app.stage || '',
      round: app.round || '',
      resumeScore: app.resumescore || app.resume_score || '',
      rejectionReason: app.rejectionreason || app.rejection_reason || '',
      recruiter: app.recruiter || '',
      jobOwner: app.jobowner || app.job_owner || '',
      applicationDate: app.applicationdate || app.application_date || '',
      raw: app,
    }));

    res.json(normalized);
  } catch (err) {
    console.error('Error fetching applications:', err.message);
    res.status(500).json({
      error: 'Failed to fetch applications',
      message: err.message,
    });
  }
});

/**
 * Combined endpoint: student + applications in one call.
 */
app.get('/api/dashboard', async (req, res) => {
  const email = req.query.email;
  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const [studentRows, applicationRows] = await Promise.all([
      fetchRows({
        spreadsheetId: STUDENT_MASTER_SHEET_ID,
        range: STUDENT_SHEET_RANGE,
        publishedUrl: STUDENT_PUBLISHED_CSV_URL,
      }),
      fetchRows({
        spreadsheetId: APPLICATIONS_SHEET_ID,
        range: APPLICATIONS_SHEET_RANGE,
        publishedUrl: APPLICATIONS_PUBLISHED_CSV_URL,
      }),
    ]);

    const students = rowsToObjects(studentRows || []);
    const applications = rowsToObjects(applicationRows || []);
    const student = findStudentByEmail(students, email);

    if (!student) {
      return res.status(404).json({ error: 'Student not found', code: 'STUDENT_NOT_FOUND' });
    }

    const uid = String(student.userid || student.user_id || '').trim().toLowerCase();
    const userApps = applications.filter((app) => {
      const appUid = String(app.userid || app.user_id || '').trim().toLowerCase();
      return appUid === uid;
    });

    const studentData = {
      userId: student.userid || student.user_id || '',
      name: student.name || '',
      email: student.email || student.e_mail || '',
      phone: student.phone || '',
      program: student.program || '',
      orgYear: student.orgyear || student.org_year || '',
      status: student.status || '',
      attendance: student.attendance || '',
      psp: student.psp || '',
      modules: student.modules || student.modules_done || '',
      currentModule: student.currentmodule || student.current_module || '',
      experience: student.experience || student.totalexperience || student.total_experience || '',
      techExperience: student.techexperience || student.tech_experience || '',
      ctc: student.ctc || student.ctcrange || student.ctc_range || '',
      noticePeriod: student.noticeperiod || student.notice_period || '',
      currentJob: student.currentjob || student.current_job || '',
      skills: student.skills || '',
      jobCounts: student.jobcounts || student.job_counts || '',
      funnelCounts: student.funnelcounts || student.funnel_counts || '',
      totalActiveJobs: student.totalactivejobs || student.total_active_jobs || '',
      eligibleJobs: student.eligiblejobs || student.eligible_jobs || '',
      relevantJobs: student.relevantjobs || student.relevant_jobs || '',
      applications: student.applications ?? '',
      resumeSent: student.resumesent || student.resume_sent || '',
      shortlisted: student.shortlisted ?? '',
      interviewed: student.interviewed ?? '',
      r1: student.r1 ?? '',
      r2: student.r2 ?? '',
      r3: student.r3 ?? '',
      offers: student.offers ?? '',
    };

    const appsData = userApps.map((app) => ({
      applicationId: app.applicationid || app.application_id || '',
      userId: app.userid || app.user_id || '',
      jobRole: app.jobrole || app.job_role || '',
      company: app.company || '',
      stage: app.stage || '',
      round: app.round || '',
      resumeScore: app.resumescore || app.resume_score || '',
      rejectionReason: app.rejectionreason || app.rejection_reason || '',
      recruiter: app.recruiter || '',
      jobOwner: app.jobowner || app.job_owner || '',
      applicationDate: app.applicationdate || app.application_date || '',
    }));

    res.json({ student: studentData, applications: appsData });
  } catch (err) {
    console.error('Error fetching dashboard:', err.message);
    let hint = '';
    if (err.message.includes('permission') || err.message.includes('403')) {
      hint = ' Share both spreadsheets with your service account email (Viewer).';
    } else if (err.message.includes('range') || err.message.includes('Unable to parse')) {
      hint = ' Check that STUDENT_SHEET_RANGE and APPLICATIONS_SHEET_RANGE match your tab names (e.g. Main instead of Sheet1).';
    }
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      message: err.message + hint,
    });
  }
});

const HOST = process.env.HOST || '127.0.0.1';
const server = app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
server.on('error', (err) => {
  console.error('Server error:', err.message);
  process.exit(1);
});
