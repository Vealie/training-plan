import { useState } from 'react';
import { TableProperties, Plus, Link } from 'lucide-react';
import { useData } from '../../contexts/DataContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { ensureToken } from '../../services/googleAuth.js';
import {
  createSpreadsheet,
  initializeSpreadsheet,
  ensureSheetTabs,
} from '../../services/googleSheets.js';
import { DEFAULT_EXERCISES } from '../../data/defaultExercises.js';

export default function SheetSetup() {
  const { setSheetId } = useData();
  const { status: authStatus } = useAuth();

  const [mode, setMode] = useState(null); // null | 'create' | 'existing'
  const [existingId, setExistingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      const token = await ensureToken();
      const id = await createSpreadsheet(token);
      await initializeSpreadsheet(id, DEFAULT_EXERCISES, token);
      setSheetId(id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    const id = existingId.trim();
    if (!id) { setError('Please enter a Sheet ID'); return; }
    setLoading(true);
    setError(null);
    try {
      const token = await ensureToken();
      // Verify the sheet exists and set up any missing tabs
      await ensureSheetTabs(id, token);
      setSheetId(id);
    } catch (err) {
      setError('Could not connect to that sheet. Make sure the ID is correct and you have access.');
    } finally {
      setLoading(false);
    }
  }

  if (authStatus !== 'authenticated') return null;

  return (
    <div className="overlay">
      <div className="overlay-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <TableProperties size={22} color="var(--accent)" />
          <h2>Connect Google Sheet</h2>
        </div>
        <p className="text-sm text-muted" style={{ marginBottom: '1.5rem' }}>
          Your workouts are stored in a Google Sheet in your account.
        </p>

        {mode === null && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button className="btn btn-primary" style={{ justifyContent: 'center', padding: '0.75rem' }} onClick={() => setMode('create')}>
              <Plus size={16} /> Create a new Sheet
            </button>
            <button className="btn btn-ghost" style={{ justifyContent: 'center', padding: '0.75rem' }} onClick={() => setMode('existing')}>
              <Link size={16} /> Connect an existing Sheet
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div>
            <p className="text-sm text-muted mb-3">
              A new Google Sheet named <strong style={{ color: 'var(--text)' }}>"Workout Tracker"</strong> will be created in your Google Drive, pre-populated with default exercises.
            </p>
            <button
              className="btn btn-primary w-full"
              style={{ justifyContent: 'center', padding: '0.75rem' }}
              onClick={handleCreate}
              disabled={loading}
            >
              {loading ? <><div className="sync-spinner" /> Creating…</> : <><Plus size={16} /> Create Sheet</>}
            </button>
            <button className="btn btn-ghost w-full mt-2" style={{ justifyContent: 'center' }} onClick={() => setMode(null)} disabled={loading}>
              Back
            </button>
          </div>
        )}

        {mode === 'existing' && (
          <div>
            <p className="text-sm text-muted mb-2">
              Paste your Google Sheet ID (from the URL: …/spreadsheets/d/<strong style={{ color: 'var(--text)' }}>SHEET_ID</strong>/edit)
            </p>
            <input
              className="input mb-3"
              value={existingId}
              onChange={e => setExistingId(e.target.value)}
              placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
              spellCheck={false}
            />
            <button
              className="btn btn-primary w-full"
              style={{ justifyContent: 'center', padding: '0.75rem' }}
              onClick={handleConnect}
              disabled={loading || !existingId.trim()}
            >
              {loading ? <><div className="sync-spinner" /> Connecting…</> : <><Link size={16} /> Connect Sheet</>}
            </button>
            <button className="btn btn-ghost w-full mt-2" style={{ justifyContent: 'center' }} onClick={() => setMode(null)} disabled={loading}>
              Back
            </button>
          </div>
        )}

        {error && <div className="error-msg">{error}</div>}
      </div>
    </div>
  );
}
