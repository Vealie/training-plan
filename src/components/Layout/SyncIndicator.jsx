import { CheckCircle, AlertCircle, WifiOff } from 'lucide-react';
import { useSync } from '../../contexts/SyncContext.jsx';

export default function SyncIndicator() {
  const { status, errorMessage } = useSync();

  if (status === 'idle') return null;

  return (
    <div className={`sync-indicator ${status}`} title={errorMessage || ''}>
      {status === 'syncing' && (
        <>
          <div className="sync-spinner" />
          <span className="hidden sm:inline">Saving…</span>
        </>
      )}
      {status === 'success' && (
        <>
          <CheckCircle size={14} />
          <span className="hidden sm:inline">Saved</span>
        </>
      )}
      {status === 'error' && (
        <>
          <WifiOff size={14} />
          <span className="hidden sm:inline">Sync failed</span>
        </>
      )}
    </div>
  );
}
