const BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

// ---------------------------------------------------------------------------
// Low-level helpers
// ---------------------------------------------------------------------------

async function req(url, token, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      message = err.error?.message || message;
    } catch { /* ignore */ }
    throw new Error(`Sheets API: ${message}`);
  }

  // Some endpoints (clear) return 200 with a body; others might be empty
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

async function getValues(spreadsheetId, range, token) {
  const url = `${BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  const data = await req(url, token);
  return data.values || [];
}

async function putValues(spreadsheetId, range, values, token) {
  const url = `${BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  return req(url, token, { method: 'PUT', body: JSON.stringify({ values }) });
}

async function clearRange(spreadsheetId, range, token) {
  const url = `${BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`;
  return req(url, token, { method: 'POST', body: '{}' });
}

// ---------------------------------------------------------------------------
// Sheet creation & initialisation
// ---------------------------------------------------------------------------

/**
 * Creates a new Google Spreadsheet named "Workout Tracker" with four tabs.
 * Returns the spreadsheetId.
 */
export async function createSpreadsheet(token) {
  const data = await req(BASE, token, {
    method: 'POST',
    body: JSON.stringify({
      properties: { title: 'Workout Tracker' },
      sheets: [
        { properties: { title: 'Sessions' } },
        { properties: { title: 'Exercises' } },
        { properties: { title: 'OneRM' } },
        { properties: { title: 'Config' } },
      ],
    }),
  });
  return data.spreadsheetId;
}

/**
 * Writes headers + default exercise data to a freshly created spreadsheet.
 */
export async function initializeSpreadsheet(spreadsheetId, defaultExercises, token) {
  // Headers
  await putValues(spreadsheetId, 'Sessions!A1:G1',
    [['Date', 'Day', 'Exercise', 'Set Number', 'Reps', 'Weight (kg)', 'Notes']], token);

  await putValues(spreadsheetId, 'Exercises!A1:C1',
    [['Day', 'Order', 'Exercise Name']], token);

  await putValues(spreadsheetId, 'OneRM!A1:C1',
    [['Exercise', 'Manual 1RM', 'Last Updated']], token);

  await putValues(spreadsheetId, 'Config!A1:B1',
    [['Key', 'Value']], token);

  // Default exercises
  const rows = [];
  for (const [day, names] of Object.entries(defaultExercises)) {
    names.forEach((name, i) => rows.push([day, i + 1, name]));
  }

  if (rows.length) {
    await putValues(spreadsheetId, 'Exercises!A2', rows, token);
  }
}

/**
 * Verifies that the required sheet tabs exist. If not, adds them and writes headers.
 * This handles the case where the user connects an existing sheet.
 */
export async function ensureSheetTabs(spreadsheetId, token) {
  const url = `${BASE}/${spreadsheetId}?fields=sheets.properties.title`;
  const data = await req(url, token);
  const existing = new Set((data.sheets || []).map(s => s.properties.title));

  const required = ['Sessions', 'Exercises', 'OneRM', 'Config'];
  const missing = required.filter(t => !existing.has(t));

  if (!missing.length) return;

  // Add missing tabs
  await req(`${BASE}/${spreadsheetId}:batchUpdate`, token, {
    method: 'POST',
    body: JSON.stringify({
      requests: missing.map(title => ({
        addSheet: { properties: { title } },
      })),
    }),
  });

  // Write headers for missing tabs
  const headers = {
    Sessions:  [['Date', 'Day', 'Exercise', 'Set Number', 'Reps', 'Weight (kg)', 'Notes']],
    Exercises: [['Day', 'Order', 'Exercise Name']],
    OneRM:     [['Exercise', 'Manual 1RM', 'Last Updated']],
    Config:    [['Key', 'Value']],
  };

  for (const tab of missing) {
    await putValues(spreadsheetId, `${tab}!A1`, headers[tab], token);
  }
}

// ---------------------------------------------------------------------------
// High-level data operations
// ---------------------------------------------------------------------------

/** Fetches all app data from the sheet in parallel. */
export async function fetchAllData(spreadsheetId, token) {
  const [sessionRows, exerciseRows, oneRMRows] = await Promise.all([
    getValues(spreadsheetId, 'Sessions!A2:G', token),
    getValues(spreadsheetId, 'Exercises!A2:C', token),
    getValues(spreadsheetId, 'OneRM!A2:C', token),
  ]);

  // Parse sessions
  const sessions = sessionRows
    .map(row => ({
      date:      row[0] || '',
      day:       row[1] || '',
      exercise:  row[2] || '',
      setNumber: parseInt(row[3]) || 0,
      reps:      parseInt(row[4]) || 0,
      weight:    parseFloat(row[5]) || 0,
      notes:     row[6] || '',
    }))
    .filter(s => s.date && s.exercise);

  // Parse exercises  — keyed by day
  const exercises = {};
  exerciseRows.forEach(row => {
    const [day, , name] = row;
    if (day && name) {
      if (!exercises[day]) exercises[day] = [];
      exercises[day].push(name);
    }
  });

  // Parse 1RM overrides
  const oneRM = {};
  oneRMRows.forEach(row => {
    const [exercise, manual, lastUpdated] = row;
    if (exercise) {
      oneRM[exercise] = {
        manual: manual !== '' && manual != null ? parseFloat(manual) : null,
        lastUpdated: lastUpdated || null,
      };
    }
  });

  return { sessions, exercises, oneRM };
}

/**
 * Overwrites the Sessions tab (rows 2+) with the provided sessions array.
 */
export async function writeSessions(spreadsheetId, sessions, token) {
  await clearRange(spreadsheetId, 'Sessions!A2:G', token);
  if (!sessions.length) return;
  const rows = sessions.map(s => [
    s.date, s.day, s.exercise, s.setNumber, s.reps, s.weight, s.notes || '',
  ]);
  await putValues(spreadsheetId, 'Sessions!A2', rows, token);
}

/**
 * Overwrites the Exercises tab (rows 2+) with the provided exercises object.
 */
export async function writeExercises(spreadsheetId, exercises, token) {
  await clearRange(spreadsheetId, 'Exercises!A2:C', token);
  const rows = [];
  for (const [day, names] of Object.entries(exercises)) {
    names.forEach((name, i) => rows.push([day, i + 1, name]));
  }
  if (rows.length) {
    await putValues(spreadsheetId, 'Exercises!A2', rows, token);
  }
}

/**
 * Overwrites the OneRM tab (rows 2+) with the provided overrides object.
 */
export async function writeOneRM(spreadsheetId, oneRM, token) {
  await clearRange(spreadsheetId, 'OneRM!A2:C', token);
  const rows = Object.entries(oneRM)
    .filter(([, d]) => d.manual != null)
    .map(([exercise, d]) => [exercise, d.manual, d.lastUpdated || '']);
  if (rows.length) {
    await putValues(spreadsheetId, 'OneRM!A2', rows, token);
  }
}
