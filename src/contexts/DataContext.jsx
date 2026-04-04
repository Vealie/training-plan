import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { useAuth } from './AuthContext.jsx';
import { useSync } from './SyncContext.jsx';
import { DEFAULT_EXERCISES, WORKOUT_DAYS } from '../data/defaultExercises.js';
import {
  fetchAllData,
  writeSessions,
  writeExercises,
  writeOneRM,
  writeConfig,
  ensureSheetTabs,
} from '../services/googleSheets.js';
import { ensureToken } from '../services/googleAuth.js';

const DataContext = createContext(null);

const LS_DATA   = 'wt_data';
const LS_SHEET  = 'wt_sheet_id';

function readCache() {
  try {
    const raw = localStorage.getItem(LS_DATA);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(LS_DATA, JSON.stringify(data));
  } catch { /* storage full — ignore */ }
}

/** Merge sheet exercises with defaults for any missing days */
function mergeWithDefaults(sheetExercises) {
  const merged = { ...sheetExercises };
  for (const day of WORKOUT_DAYS) {
    if (!merged[day] || !merged[day].length) {
      merged[day] = DEFAULT_EXERCISES[day];
    }
  }
  return merged;
}

export function DataProvider({ children }) {
  const { token, status: authStatus } = useAuth();
  const { setSyncing, setSuccess, setError: setSyncError } = useSync();

  const [sessions,     setSessions]     = useState([]);
  const [exercises,    setExercises]    = useState(mergeWithDefaults({}));
  const [oneRM,        setOneRM]        = useState({});
  const [skippedDays,  setSkippedDays]  = useState([]);
  const [sheetId,      setSheetIdState] = useState(() => localStorage.getItem(LS_SHEET) || null);
  const [dataReady,    setDataReady]    = useState(false);

  // Refs for debounced sync — always hold the latest state
  const latestSessions    = useRef(sessions);
  const latestExercises   = useRef(exercises);
  const latestOneRM       = useRef(oneRM);
  const latestSkippedDays = useRef(skippedDays);
  const syncTimer         = useRef(null);

  // Keep refs in sync
  useEffect(() => { latestSessions.current    = sessions;    }, [sessions]);
  useEffect(() => { latestExercises.current   = exercises;   }, [exercises]);
  useEffect(() => { latestOneRM.current       = oneRM;       }, [oneRM]);
  useEffect(() => { latestSkippedDays.current = skippedDays; }, [skippedDays]);

  // ── Hydrate from localStorage cache immediately on mount ──
  useEffect(() => {
    const cached = readCache();
    if (cached) {
      if (cached.sessions)    setSessions(cached.sessions);
      if (cached.exercises)   setExercises(mergeWithDefaults(cached.exercises));
      if (cached.oneRM)       setOneRM(cached.oneRM);
      if (cached.skippedDays) setSkippedDays(cached.skippedDays);
    }
  }, []);

  // ── Fetch from Sheets when we have auth + sheetId ──
  useEffect(() => {
    if (authStatus !== 'authenticated' || !sheetId) {
      if (!sheetId) setDataReady(true); // no sheet yet → still show UI
      return;
    }

    async function load() {
      setSyncing();
      try {
        const freshToken = await ensureToken();
        await ensureSheetTabs(sheetId, freshToken);
        const data = await fetchAllData(sheetId, freshToken);

        const merged = mergeWithDefaults(data.exercises);
        setSessions(data.sessions);
        setExercises(merged);
        setOneRM(data.oneRM);
        setSkippedDays(data.skippedDays || []);
        setDataReady(true);

        writeCache({ sessions: data.sessions, exercises: merged, oneRM: data.oneRM, skippedDays: data.skippedDays || [] });
        setSuccess();
      } catch (err) {
        console.error('Initial fetch failed:', err);
        setSyncError(err.message);
        setDataReady(true); // use cache
      }
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus, sheetId]);

  // ── Debounced sync to Sheets ──
  const scheduleSync = useCallback(() => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    setSyncing();

    syncTimer.current = setTimeout(async () => {
      if (!sheetId) return;
      try {
        const freshToken = await ensureToken();
        const skipped = latestSkippedDays.current;
        await Promise.all([
          writeSessions(sheetId,  latestSessions.current,  freshToken),
          writeExercises(sheetId, latestExercises.current, freshToken),
          writeOneRM(sheetId,     latestOneRM.current,     freshToken),
          writeConfig(sheetId, { skipped_days: skipped.join(',') }, freshToken),
        ]);
        setSuccess();

        // Update localStorage cache
        writeCache({
          sessions:  latestSessions.current,
          exercises: latestExercises.current,
          oneRM:     latestOneRM.current,
        });
      } catch (err) {
        console.error('Sync error:', err);
        setSyncError(err.message);
      }
    }, 1500);
  }, [sheetId, setSyncing, setSuccess, setSyncError]);

  // ── Mutation helpers ──

  /** Add or update a set. setObj = { date, day, exercise, setNumber, reps, weight, notes } */
  const upsertSet = useCallback((setObj) => {
    setSessions(prev => {
      const filtered = prev.filter(
        s => !(s.date === setObj.date && s.exercise === setObj.exercise && s.setNumber === setObj.setNumber)
      );
      const next = [...filtered, setObj].sort((a, b) =>
        a.date.localeCompare(b.date) || a.exercise.localeCompare(b.exercise) || a.setNumber - b.setNumber
      );
      writeCache({ sessions: next, exercises: latestExercises.current, oneRM: latestOneRM.current });
      return next;
    });
    scheduleSync();
  }, [scheduleSync]);

  /** Remove a specific set */
  const removeSet = useCallback((date, exercise, setNumber) => {
    setSessions(prev => {
      // Remove the set, then renumber remaining sets for that exercise+date
      const others = prev.filter(
        s => !(s.date === date && s.exercise === exercise && s.setNumber === setNumber)
      );
      const remaining = others
        .filter(s => s.date === date && s.exercise === exercise)
        .map((s, i) => ({ ...s, setNumber: i + 1 }));
      const unrelated = others.filter(s => !(s.date === date && s.exercise === exercise));
      const next = [...unrelated, ...remaining];
      writeCache({ sessions: next, exercises: latestExercises.current, oneRM: latestOneRM.current });
      return next;
    });
    scheduleSync();
  }, [scheduleSync]);

  /** Replace exercises for all days */
  const saveExercises = useCallback((newExercises) => {
    setExercises(newExercises);
    writeCache({ sessions: latestSessions.current, exercises: newExercises, oneRM: latestOneRM.current });
    scheduleSync();
  }, [scheduleSync]);

  /** Save a manual 1RM override */
  const saveOneRM = useCallback((exercise, manual) => {
    setOneRM(prev => {
      const next = {
        ...prev,
        [exercise]: { manual, lastUpdated: new Date().toISOString().split('T')[0] },
      };
      writeCache({ sessions: latestSessions.current, exercises: latestExercises.current, oneRM: next });
      return next;
    });
    scheduleSync();
  }, [scheduleSync]);

  /** Toggle a date as intentionally skipped (removes red missed indicator) */
  const toggleSkippedDay = useCallback((date) => {
    setSkippedDays(prev => {
      const next = prev.includes(date)
        ? prev.filter(d => d !== date)
        : [...prev, date];
      writeCache({ sessions: latestSessions.current, exercises: latestExercises.current, oneRM: latestOneRM.current, skippedDays: next });
      return next;
    });
    scheduleSync();
  }, [scheduleSync]);

  const setSheetId = useCallback((id) => {
    localStorage.setItem(LS_SHEET, id);
    setSheetIdState(id);
  }, []);

  return (
    <DataContext.Provider value={{
      sessions,
      exercises,
      oneRM,
      skippedDays,
      sheetId,
      dataReady,
      setSheetId,
      upsertSet,
      removeSet,
      saveExercises,
      saveOneRM,
      toggleSkippedDay,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside DataProvider');
  return ctx;
}
