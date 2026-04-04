import { useState } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import { useData } from '../../contexts/DataContext.jsx';
import { getBestOneRM, epley } from '../../utils/oneRM.js';

const KEY_LIFTS = ['Bench Press', 'Barbell Squats'];

function ORMCard({ exerciseName }) {
  const { sessions, oneRM, saveOneRM } = useData();
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState('');

  const override = oneRM[exerciseName];
  const computed = getBestOneRM(sessions, exerciseName);
  const display = override?.manual != null ? override.manual : computed;
  const isManual = override?.manual != null;

  function startEdit() {
    setInputVal(display || '');
    setEditing(true);
  }

  function save() {
    const val = parseFloat(inputVal);
    if (!isNaN(val) && val > 0) {
      saveOneRM(exerciseName, val);
    }
    setEditing(false);
  }

  function clearOverride() {
    saveOneRM(exerciseName, null);
    setEditing(false);
  }

  return (
    <div className="orm-card">
      <div className="orm-label">{exerciseName}</div>

      {editing ? (
        <div style={{ margin: '0.75rem 0', display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
          <input
            className="input input-num"
            style={{ width: '80px' }}
            type="number"
            inputMode="decimal"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            autoFocus
            onKeyDown={e => e.key === 'Enter' && save()}
          />
          <button className="btn btn-primary btn-icon" onClick={save}><Check size={14} /></button>
          <button className="btn btn-ghost btn-icon" onClick={() => setEditing(false)}><X size={14} /></button>
        </div>
      ) : (
        <>
          <div className="orm-value">
            {display ? display : '—'}
            {display ? <span className="orm-unit">kg</span> : null}
          </div>
          <div className="orm-source">
            {isManual ? 'Manual override' : computed ? 'Epley formula' : 'No data yet'}
          </div>
        </>
      )}

      {!editing && (
        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', marginTop: '0.6rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={startEdit}>
            <Edit2 size={12} /> Override
          </button>
          {isManual && (
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text-3)' }} onClick={clearOverride}>
              <X size={12} /> Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function OneRMSection() {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <h2>Key Lifts — Estimated 1RM</h2>
        <span className="badge badge-blue">Epley</span>
      </div>
      <div className="orm-grid">
        {KEY_LIFTS.map(name => (
          <ORMCard key={name} exerciseName={name} />
        ))}
      </div>
    </div>
  );
}
