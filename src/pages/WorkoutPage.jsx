import { useState, useMemo } from 'react';
import { Edit2, X, MinusCircle, RotateCcw } from 'lucide-react';
import { useData } from '../contexts/DataContext.jsx';
import { getWeekSchedule, dateForDayThisWeek, todayStr, formatDate } from '../utils/dateUtils.js';
import { DAY_META, WORKOUT_DAYS, JS_DAY_TO_NAME } from '../data/defaultExercises.js';
import ExerciseCard from '../components/Workout/ExerciseCard.jsx';
import ExerciseEditor from '../components/Workout/ExerciseEditor.jsx';
import MissedSessionBanner from '../components/MissedSession/MissedSessionBanner.jsx';
import OneRMSection from '../components/OneRM/OneRMSection.jsx';

function getDefaultActiveDay() {
  const jsDay = new Date().getDay();
  const name = JS_DAY_TO_NAME[jsDay];
  if (name) return name;
  // Find next workout day
  for (let i = 1; i <= 7; i++) {
    const next = JS_DAY_TO_NAME[(jsDay + i) % 7];
    if (next) return next;
  }
  return 'Monday';
}

export default function WorkoutPage() {
  const { sessions, exercises, skippedDays, toggleSkippedDay } = useData();
  const [activeDay, setActiveDay] = useState(getDefaultActiveDay());
  const [editing, setEditing] = useState(false);

  const schedule = getWeekSchedule();
  const today = todayStr();

  // The date to log sets against for the active day
  const activeDate = useMemo(() => {
    const entry = schedule.find(s => s.day === activeDay);
    return entry ? entry.date : dateForDayThisWeek(activeDay);
  }, [activeDay, schedule]);

  // Sessions for active day+date, grouped by exercise
  const dayExercises = exercises[activeDay] || [];
  const daySets = useMemo(
    () => sessions.filter(s => s.date === activeDate && s.day === activeDay),
    [sessions, activeDate, activeDay]
  );

  function getSetsForExercise(name) {
    return daySets.filter(s => s.exercise === name);
  }

  function sessionDoneFor(date, day) {
    return sessions.some(s => s.date === date && s.day === day);
  }

  const meta = DAY_META[activeDay] || {};
  const activeSkipped = skippedDays.includes(activeDate);
  const activeDone = sessionDoneFor(activeDate, activeDay);
  const activePast = new Date(activeDate + 'T12:00:00') < new Date(today + 'T00:00:00');
  const showSkipToggle = activePast && !activeDone;

  return (
    <main className="page-content">
      {/* Week strip */}
      <div className="week-strip" style={{ marginBottom: '1.25rem' }}>
        {schedule.map(({ date, day, isToday, isPast }) => {
          const done = sessionDoneFor(date, day);
          const skipped = skippedDays.includes(date);
          const missed = isPast && !done && !skipped;
          return (
            <button
              key={day}
              className={[
                'day-chip',
                activeDay === day ? 'active' : '',
                isToday ? 'today' : '',
                done ? 'done' : '',
                missed ? 'missed' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => { setActiveDay(day); setEditing(false); }}
            >
              {done    && <span className="day-chip-dot done" />}
              {missed  && <span className="day-chip-dot missed" />}
              {skipped && <span className="day-chip-dot" style={{ background: 'var(--text-3)' }} />}
              <span className="day-chip-name">{day.slice(0, 3)}</span>
              <span className="day-chip-date">
                {new Date(date + 'T12:00:00').getDate()}
              </span>
            </button>
          );
        })}
      </div>

      {/* Missed session banner */}
      <MissedSessionBanner onSelectDay={day => { setActiveDay(day); setEditing(false); }} />

      {/* 1RM cards */}
      <OneRMSection />

      {/* Day header */}
      <div className="day-header">
        <div>
          <div className="day-title">{activeDay}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
            <span className="day-split-badge">{meta.emoji} {meta.split}</span>
            <span className="text-xs text-dim">{formatDate(activeDate)}</span>
            {activeDate === today && <span className="badge badge-blue">Today</span>}
            {activeDone    && <span className="badge badge-green">Done ✓</span>}
            {activeSkipped && <span className="badge" style={{ background: 'rgba(96,96,128,0.2)', color: 'var(--text-3)' }}>Skipped</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', alignSelf: 'flex-start' }}>
          {showSkipToggle && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => toggleSkippedDay(activeDate)}
              title={activeSkipped ? 'Mark as missed' : 'Mark as skipped (rest day)'}
              style={{ color: activeSkipped ? 'var(--text-3)' : 'var(--text-3)' }}
            >
              {activeSkipped ? <><RotateCcw size={13} /> Unskip</> : <><MinusCircle size={13} /> Skip</>}
            </button>
          )}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setEditing(v => !v)}
          >
            {editing ? <><X size={13} /> Done</> : <><Edit2 size={13} /> Edit</>}
          </button>
        </div>
      </div>

      {/* Exercise editor (edit mode) */}
      {editing && (
        <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>Edit exercises — {activeDay}</h3>
          <ExerciseEditor day={activeDay} onClose={() => setEditing(false)} />
        </div>
      )}

      {/* Exercise cards */}
      {!editing && (
        <>
          {dayExercises.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏋️</div>
              <p>No exercises yet.</p>
              <button className="btn btn-primary mt-3" onClick={() => setEditing(true)}>
                <Edit2 size={14} /> Add exercises
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {dayExercises.map(name => (
                <ExerciseCard
                  key={name}
                  exerciseName={name}
                  date={activeDate}
                  day={activeDay}
                  sets={getSetsForExercise(name)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
