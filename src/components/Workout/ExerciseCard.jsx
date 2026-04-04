import { useState } from 'react';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import SetRow from './SetRow.jsx';
import { useData } from '../../contexts/DataContext.jsx';
import { epley } from '../../utils/oneRM.js';

export default function ExerciseCard({ exerciseName, date, day, sets }) {
  const { upsertSet, removeSet } = useData();
  const [expanded, setExpanded] = useState(true);

  const bestORM = sets.length
    ? Math.max(...sets.filter(s => s.weight > 0 && s.reps > 0).map(s => epley(s.weight, s.reps)))
    : 0;

  function handleAddSet() {
    const nextNum = sets.length + 1;
    upsertSet({ date, day, exercise: exerciseName, setNumber: nextNum, reps: 0, weight: 0, notes: '' });
  }

  function handleSetChange(updated) {
    upsertSet({ ...updated, date, day, exercise: exerciseName });
  }

  function handleRemove(setNumber) {
    removeSet(date, exerciseName, setNumber);
  }

  const sortedSets = [...sets].sort((a, b) => a.setNumber - b.setNumber);

  return (
    <div className="exercise-card">
      <div className="exercise-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="exercise-name">{exerciseName}</div>
          {sets.length > 0 && (
            <div className="exercise-sets-summary">
              {sets.length} {sets.length === 1 ? 'set' : 'sets'}
              {bestORM > 0 && <> · est. 1RM <strong style={{ color: 'var(--accent)' }}>{bestORM}kg</strong></>}
            </div>
          )}
        </div>
        <button
          className="btn btn-icon btn-ghost"
          onClick={() => setExpanded(v => !v)}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {expanded && (
        <div className="sets-container">
          {sortedSets.map(set => (
            <SetRow
              key={set.setNumber}
              set={set}
              onChange={handleSetChange}
              onRemove={() => handleRemove(set.setNumber)}
            />
          ))}

          <button className="add-set-btn" onClick={handleAddSet}>
            <Plus size={14} />
            {sets.length === 0 ? 'Log first set' : 'Add set'}
          </button>
        </div>
      )}
    </div>
  );
}
