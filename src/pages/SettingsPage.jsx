import { useState } from 'react';
import { LogOut, ExternalLink, RefreshCw, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useData } from '../contexts/DataContext.jsx';
import { useSync } from '../contexts/SyncContext.jsx';
import { ensureToken } from '../services/googleAuth.js';
import { fetchAllData } from '../services/googleSheets.js';

export default function SettingsPage() {
  const { signOut } = useAuth();
  const { sheetId, setSheetId } = useData();
  const { setSyncing, setSuccess, setError: setSyncError } = useSync();
  const [newSheetId, setNewSheetId] = useState('');
  const [editingSheet, setEditingSheet] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  async function handleRefresh() {
    if (!sheetId) return;
    setRefreshing(true);
    setSyncing();
    try {
      const token = await ensureToken();
      await fetchAllData(sheetId, token);
      setSuccess();
    } catch (err) {
      setSyncError(err.message);
    } finally {
      setRefreshing(false);
    }
  }

  function handleSignOut() {
    if (!confirmSignOut) { setConfirmSignOut(true); return; }
    signOut();
    setConfirmSignOut(false);
  }

  function handleChangeSheet() {
    const id = newSheetId.trim();
    if (!id) return;
    setSheetId(id);
    setNewSheetId('');
    setEditingSheet(false);
  }

  function handleDisconnectSheet() {
    localStorage.removeItem('wt_sheet_id');
    setSheetId(null);
  }

  const sheetUrl = sheetId
    ? `https://docs.google.com/spreadsheets/d/${sheetId}/edit`
    : null;

  return (
    <main className="page-content">
      <h1 style={{ marginBottom: '1.25rem' }}>Settings</h1>

      {/* Google Sheet */}
      <div className="settings-section">
        <div className="settings-label">Google Sheet</div>
        {sheetId ? (
          <>
            <div className="settings-value" style={{ marginBottom: '0.75rem' }}>{sheetId}</div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <a
                href={sheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-sm"
              >
                <ExternalLink size={13} /> Open in Sheets
              </a>
              <button className="btn btn-ghost btn-sm" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw size={13} className={refreshing ? 'spin' : ''} /> Refresh data
              </button>
              <button
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--text-3)' }}
                onClick={() => setEditingSheet(v => !v)}
              >
                Change Sheet
              </button>
            </div>
            {editingSheet && (
              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                <input
                  className="input"
                  placeholder="New Sheet ID…"
                  value={newSheetId}
                  onChange={e => setNewSheetId(e.target.value)}
                />
                <button className="btn btn-primary btn-sm" onClick={handleChangeSheet} disabled={!newSheetId.trim()}>
                  Save
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="settings-value" style={{ color: 'var(--text-3)' }}>No sheet connected</div>
        )}
      </div>

      {/* About */}
      <div className="settings-section">
        <div className="settings-label">About</div>
        <p className="text-sm text-muted" style={{ lineHeight: 1.7 }}>
          Workout Tracker v0.1.0 — built with React + Vite.<br />
          All data is stored in your personal Google Sheet.<br />
          No data is stored on any external server.
        </p>
      </div>

      {/* Danger zone */}
      <div className="settings-section" style={{ borderColor: 'rgba(255,85,85,0.25)' }}>
        <div className="settings-label" style={{ color: 'var(--red)' }}>Account</div>

        <button
          className={`btn btn-sm ${confirmSignOut ? 'btn-danger' : 'btn-ghost'}`}
          onClick={handleSignOut}
          style={{ marginBottom: '0.5rem' }}
        >
          <LogOut size={13} /> {confirmSignOut ? 'Confirm sign out' : 'Sign out of Google'}
        </button>
        {confirmSignOut && (
          <p className="text-xs text-dim" style={{ marginTop: '0.25rem' }}>
            Click again to confirm. Your data will remain in your Google Sheet.
          </p>
        )}
      </div>
    </main>
  );
}
