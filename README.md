# Learner Dashboard

A dynamic learner dashboard powered by Google Sheets. Enter a student's email to load their profile, learning metrics, job stats, placement funnel, and application history from two linked spreadsheets.

## Architecture

- **Frontend**: React (Vite) – email input, dashboard UI, no credentials
- **Backend**: Node.js/Express – secure Google Sheets API proxy
- **Data**: Student Master + Applications spreadsheets, linked by User ID

## Setup

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Configure Google Sheets API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or use existing)
3. Enable **Google Sheets API**
4. Create a **Service Account** (IAM & Admin → Service Accounts)
5. Download the JSON key file
6. Share both spreadsheets with the service account email (`...@....iam.gserviceaccount.com`) as **Viewer**

### 3. Configure server credentials

Create `server/.env`:

**Option A – JSON file path**

```
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json
PORT=3001
```

Place your downloaded key as `server/credentials.json` (add to `.gitignore`).

**Option B – JSON string**

```
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
PORT=3001
```

### 4. Run locally

**IMPORTANT: Open TWO separate terminal windows/tabs. Do NOT reuse the same terminal.**

**Terminal 1 – Start the backend:**

```bash
cd /Users/sumirkumar/Scaler/products
cd server
npm run dev
```

Wait for output: `Server running at http://localhost:3001`  
Keep this terminal open and running.

**Terminal 2 – Start the frontend (NEW terminal window):**

```bash
cd /Users/sumirkumar/Scaler/products
cd client
npm run dev
```

Wait for output: `Local: http://localhost:5173/`  
Keep this terminal open and running.

**Step 3: Open browser and test**

Open http://localhost:5173 in your browser.

Enter a student email (from your Student Master sheet) and click "Load Dashboard".

**Troubleshooting port conflicts:**

If you see `EADDRINUSE: address already in use 127.0.0.1:3001`, kill all Node processes:

```bash
killall node
sleep 2
# Then restart backend and frontend steps above
```

**How it works:**
- Backend (Node/Express) runs on http://localhost:3001 and handles all Google Sheets API calls
- Frontend (React/Vite) runs on http://localhost:5173 and proxies `/api` requests to the backend
- Keep both terminals running simultaneously while developing
- Frontend has no direct access to Google credentials (all requests go through the backend)

## Spreadsheet structure

### Student Master

Expects columns such as: User ID, Name, Email, Phone, Program, Status, Attendance, PSP, Modules, Experience, CTC, Notice Period, Skills, Job counts, Funnel counts.  
First row = headers. Column names are normalized (spaces → underscores, case-insensitive).

### Applications

Expects columns such as: Application ID, User ID, Job Role, Company, Stage, Round, Resume Score, Rejection Reason, Recruiter, Job Owner, Application Date.  
Linked to Student Master via **User ID**.

## Env overrides

| Variable | Description |
|----------|-------------|
| `STUDENT_MASTER_SHEET_ID` | Student Master spreadsheet ID |
| `APPLICATIONS_SHEET_ID` | Applications spreadsheet ID |
| `STUDENT_SHEET_RANGE` | Sheet/tab name (default: Sheet1) |
| `APPLICATIONS_SHEET_RANGE` | Sheet/tab name (default: Sheet1) |

## Security

- Google credentials exist only on the server
- Frontend only calls `/api/*`; no secrets in the browser
