import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { useData } from '../contexts/DataContext.jsx';
import { WORKOUT_DAYS } from '../data/defaultExercises.js';
import { formatDate } from '../utils/dateUtils.js';
import { epley } from '../utils/oneRM.js';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--surface-2)',
      border: '1px solid var(--border-2)',
      borderRadius: 8,
      padding: '0.6rem 0.8rem',
      fontSize: '0.8rem',
    }}>
      <p style={{ color: 'var(--text-3)', marginBottom: '0.25rem' }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {p.value}kg
        </p>
      ))}
    </div>
  );
}

export default function ProgressPage() {
  const { sessions, exercises } = useData();

  // Build flat list of all exercise names
  const allExercises = useMemo(() => {
    const names = new Set();
    WORKOUT_DAYS.forEach(d => (exercises[d] || []).forEach(n => names.add(n)));
    sessions.forEach(s => names.add(s.exercise));
    return [...names].sort();
  }, [exercises, sessions]);

  const [selectedExercise, setSelectedExercise] = useState(allExercises[0] || '');
  const [metric, setMetric] = useState('weight'); // 'weight' | 'orm'

  // Chart data: max weight per session for selected exercise
  const chartData = useMemo(() => {
    if (!selectedExercise) return [];

    const byDate = {};
    sessions
      .filter(s => s.exercise === selectedExercise && s.weight > 0)
      .forEach(s => {
        const key = s.date;
        if (!byDate[key]) byDate[key] = { date: s.date, sets: [] };
        byDate[key].sets.push(s);
      });

    return Object.values(byDate)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(({ date, sets }) => {
        const maxWeight = Math.max(...sets.map(s => s.weight));
        const bestORM = Math.max(...sets.filter(s => s.reps > 0).map(s => epley(s.weight, s.reps)));
        return {
          date: formatDate(date),
          weight: maxWeight,
          orm: bestORM > 0 ? bestORM : undefined,
        };
      });
  }, [sessions, selectedExercise]);

  // History log: all sessions for selected exercise, grouped by date
  const historyByDate = useMemo(() => {
    if (!selectedExercise) return [];

    const byDate = {};
    sessions
      .filter(s => s.exercise === selectedExercise)
      .forEach(s => {
        if (!byDate[s.date]) byDate[s.date] = [];
        byDate[s.date].push(s);
      });

    return Object.entries(byDate)
      .sort(([a], [b]) => b.localeCompare(a)) // newest first
      .map(([date, sets]) => ({ date, sets: sets.sort((a, b) => a.setNumber - b.setNumber) }));
  }, [sessions, selectedExercise]);

  const lineColor = '#4f8ef7';

  return (
    <main className="page-content">
      <h1 style={{ marginBottom: '1.25rem' }}>Progress</h1>

      {/* Exercise selector */}
      <div style={{ marginBottom: '1rem' }}>
        <label className="settings-label" style={{ display: 'block', marginBottom: '0.4rem' }}>Exercise</label>
        <select
          className="select"
          value={selectedExercise}
          onChange={e => setSelectedExercise(e.target.value)}
        >
          {allExercises.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {/* Metric toggle */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          className={`btn btn-sm ${metric === 'weight' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setMetric('weight')}
        >
          Max Weight
        </button>
        <button
          className={`btn btn-sm ${metric === 'orm' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setMetric('orm')}
        >
          Est. 1RM
        </button>
      </div>

      {/* Chart */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        {chartData.length < 2 ? (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <div className="empty-state-icon">📈</div>
            <p>Log at least 2 sessions to see a chart.</p>
          </div>
        ) : (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={v => `${v}kg`}
                  domain={['auto', 'auto']}
                  width={48}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey={metric}
                  name={metric === 'orm' ? 'Est. 1RM' : 'Weight'}
                  stroke={lineColor}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: lineColor, strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* History log */}
      <h2 style={{ marginBottom: '0.75rem' }}>Session history</h2>

      {historyByDate.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p>No sessions logged for {selectedExercise || 'this exercise'} yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {historyByDate.map(({ date, sets }) => {
            const totalVol = sets.reduce((acc, s) => acc + s.weight * s.reps, 0);
            const bestSet = sets.reduce((best, s) =>
              epley(s.weight, s.reps) > epley(best.weight, best.reps) ? s : best, sets[0]);

            return (
              <div key={date} className="card">
                <div className="card-header" style={{ paddingBottom: '0.5rem' }}>
                  <div>
                    <div className="font-semibold">{formatDate(date)}</div>
                    <div className="text-xs text-dim">
                      {sets.length} sets · {totalVol.toFixed(0)}kg total volume
                      {bestSet.weight > 0 && (
                        <> · Best: {bestSet.weight}kg × {bestSet.reps} reps</>
                      )}
                    </div>
                  </div>
                  <span className="badge badge-blue">{sets.length}×</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Set</th>
                        <th>Weight</th>
                        <th>Reps</th>
                        <th>Est. 1RM</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sets.map(s => (
                        <tr key={s.setNumber}>
                          <td>{s.setNumber}</td>
                          <td><strong style={{ color: 'var(--text)' }}>{s.weight}kg</strong></td>
                          <td>{s.reps}</td>
                          <td style={{ color: 'var(--accent)' }}>
                            {s.weight > 0 && s.reps > 0 ? `${epley(s.weight, s.reps)}kg` : '—'}
                          </td>
                          <td style={{ maxWidth: '160px', wordBreak: 'break-word' }}>
                            {s.notes || <span style={{ color: 'var(--text-3)' }}>—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
