import { useState, useMemo } from 'react';
import { Edit2, X, ChevronDown, ChevronUp } from 'lucide-react';
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
  const { sessions, exercises } = useData();
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

  return (
    <main className="page-content">
      {/* Week strip */}
      <div className="week-strip" style={{ marginBottom: '1.25rem' }}>
        {schedule.map(({ date, day, isToday, isPast }) => {
          const done = sessionDoneFor(date, day);
          const missed = isPast && !done;
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
              {done && <span className="day-chip-dot done" />}
              {missed && <span className="day-chip-dot missed" />}
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
            {sessionDoneFor(activeDate, activeDay) && <span className="badge badge-green">Done ✓</span>}
          </div>
        </div>
        <button
          className={`btn btn-sm ${editing ? 'btn-ghost' : 'btn-ghost'}`}
          onClick={() => setEditing(v => !v)}
          style={{ alignSelf: 'flex-start' }}
        >
          {editing ? <><X size={13} /> Done</> : <><Edit2 size={13} /> Edit</>}
        </button>
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
