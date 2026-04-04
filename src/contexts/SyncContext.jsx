import { createContext, useContext, useState, useRef, useCallback } from 'react';

// status: 'idle' | 'syncing' | 'success' | 'error'
const SyncContext = createContext(null);

export function SyncProvider({ children }) {
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState(null);
  const successTimerRef = useRef(null);

  const setSyncing = useCallback(() => {
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    setStatus('syncing');
    setErrorMessage(null);
  }, []);

  const setSuccess = useCallback(() => {
    setStatus('success');
    setErrorMessage(null);
    successTimerRef.current = setTimeout(() => setStatus('idle'), 3000);
  }, []);

  const setError = useCallback((msg) => {
    setStatus('error');
    setErrorMessage(msg || 'Sync failed — data saved locally');
  }, []);

  return (
    <SyncContext.Provider value={{ status, errorMessage, setSyncing, setSuccess, setError }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used inside SyncProvider');
  return ctx;
}
