import { Trash2 } from 'lucide-react';

export default function SetRow({ set, onChange, onRemove }) {
  const { setNumber, reps, weight, notes } = set;

  function update(field, value) {
    onChange({ ...set, [field]: value });
  }

  return (
    <div>
      <div className="set-row">
        <div className="set-number">{setNumber}</div>

        <input
          className="input input-num"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.5"
          placeholder="0"
          value={weight || ''}
          onChange={e => update('weight', parseFloat(e.target.value) || 0)}
          aria-label={`Set ${setNumber} weight (kg)`}
        />
        <span className="set-label">kg</span>

        <span className="set-x">×</span>

        <input
          className="input input-num"
          type="number"
          inputMode="numeric"
          min="0"
          placeholder="0"
          value={reps || ''}
          onChange={e => update('reps', parseInt(e.target.value) || 0)}
          aria-label={`Set ${setNumber} reps`}
        />
        <span className="set-label">reps</span>

        <button
          className="btn btn-icon btn-ghost"
          onClick={onRemove}
          aria-label={`Remove set ${setNumber}`}
          style={{ marginLeft: 'auto', color: 'var(--text-3)' }}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Per-set notes */}
      <div style={{ paddingLeft: '0.75rem', paddingRight: '0.75rem', marginTop: '0.25rem', marginBottom: '0.25rem' }}>
        <textarea
          className="set-notes-input"
          rows={1}
          placeholder="Notes for this set…"
          value={notes || ''}
          onChange={e => update('notes', e.target.value)}
        />
      </div>
    </div>
  );
}
