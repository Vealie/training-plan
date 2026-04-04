# 🏋️ Workout Tracker

A personal workout tracking web app — React + Vite frontend, Google Sheets as the database. Runs entirely in the browser with no backend required.

**Live on GitHub Pages → [your-username.github.io/workout-tracker]()**

---

## Features

- 5-day rolling programme (Mon/Tue/Thu/Fri/Sat) with sensible default exercises
- Per-set logging: weight (kg), reps, notes
- Drag-to-reorder exercise lists, add/remove/rename exercises
- Missed session detection with make-up suggestions
- Progress charts (max weight & estimated 1RM over time) via Recharts
- Estimated 1RM via the Epley formula with manual override
- Real-time sync to Google Sheets — every change auto-saves with a spinner → tick indicator
- localStorage cache keeps the UI instant; Sheets is the source of truth
- Dark theme, mobile-first responsive design

---

## Google Cloud Setup

### 1 — Create a Google Cloud project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click **Select a project → New Project**, give it a name, click **Create**

### 2 — Enable the Google Sheets API

1. In the left sidebar: **APIs & Services → Library**
2. Search for **"Google Sheets API"** and click **Enable**

### 3 — Create an OAuth 2.0 Client ID

1. Go to **APIs & Services → Credentials**
2. Click **+ Create Credentials → OAuth client ID**
3. If prompted to configure the consent screen:
   - Choose **External** → fill in App name (e.g. "Workout Tracker") and your email → Save
   - Add your Google account as a **Test user** (under "Test users") so you can use it before publishing
4. Back in **Create OAuth client ID**:
   - Application type: **Web application**
   - Name: anything (e.g. "Workout Tracker Web")
   - **Authorised JavaScript origins** — add both:
     ```
     http://localhost:5173
     https://<your-github-username>.github.io
     ```
5. Click **Create** — copy the **Client ID** (it ends in `.apps.googleusercontent.com`)

> **Note:** You do NOT need a client secret for this app — it uses the implicit OAuth flow in the browser.

---

## Local Development

```bash
# 1. Clone the repo
git clone https://github.com/<your-username>/workout-tracker.git
cd workout-tracker

# 2. Install dependencies
npm install

# 3. Create your env file
cp .env.example .env.local
# Then paste your Client ID into .env.local:
#   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

# 4. Start the dev server
npm run dev
# → http://localhost:5173
```

On first load:
1. Click **Sign in with Google** — a popup asks for Google Sheets permission
2. Choose **Create a new Sheet** — the app creates a "Workout Tracker" sheet in your Drive
3. Start logging sets!

---

## Deployment to GitHub Pages

### 1 — Update the base path

In `vite.config.js`, change `/workout-tracker/` to match **your repository name**:

```js
base: '/<your-repo-name>/',
```

### 2 — Add your GitHub Pages URL as an authorised origin

In Google Cloud Console → Credentials → your OAuth Client ID, add:
```
https://<your-github-username>.github.io
```

### 3 — Deploy

```bash
npm run deploy
```

This builds the app and pushes the `dist/` folder to the `gh-pages` branch.

Enable GitHub Pages in your repo settings: **Settings → Pages → Source → Deploy from branch → `gh-pages`**.

Your app will be live at:
```
https://<your-github-username>.github.io/<your-repo-name>/
```

---

## Google Sheet Structure

The app manages a spreadsheet with four tabs:

| Tab | Columns | Purpose |
|---|---|---|
| **Sessions** | Date, Day, Exercise, Set Number, Reps, Weight (kg), Notes | One row per logged set |
| **Exercises** | Day, Order, Exercise Name | Exercise list per day |
| **OneRM** | Exercise, Manual 1RM, Last Updated | Manual 1RM overrides |
| **Config** | Key, Value | Reserved for app settings |

You can open the sheet directly in Google Sheets at any time — your data is always human-readable and exportable.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + Vite 5 |
| Routing | React Router v6 (HashRouter for GitHub Pages) |
| Charts | Recharts |
| Icons | Lucide React |
| Auth | Google Identity Services (GIS) — OAuth 2.0 token flow |
| Database | Google Sheets API v4 (direct REST from browser) |
| Hosting | GitHub Pages |
| Styling | Plain CSS with custom properties (no Tailwind dependency) |
