import { useState } from 'react';
import { Plus, Trash2, GripVertical, Check, X } from 'lucide-react';
import { useData } from '../../contexts/DataContext.jsx';

export default function ExerciseEditor({ day, onClose }) {
  const { exercises, saveExercises } = useData();
  const [list, setList] = useState([...(exercises[day] || [])]);
  const [newName, setNewName] = useState('');
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  function addExercise() {
    const name = newName.trim();
    if (!name || list.includes(name)) return;
    setList(prev => [...prev, name]);
    setNewName('');
  }

  function removeExercise(idx) {
    setList(prev => prev.filter((_, i) => i !== idx));
  }

  function renameExercise(idx, val) {
    setList(prev => prev.map((n, i) => (i === idx ? val : n)));
  }

  // Drag-to-reorder
  function onDragStart(idx) { setDragging(idx); }
  function onDragEnter(idx) { setDragOver(idx); }
  function onDragEnd() {
    if (dragging !== null && dragOver !== null && dragging !== dragOver) {
      const next = [...list];
      const [item] = next.splice(dragging, 1);
      next.splice(dragOver, 0, item);
      setList(next);
    }
    setDragging(null);
    setDragOver(null);
  }

  function handleSave() {
    const filtered = list.filter(n => n.trim());
    const updated = { ...exercises, [day]: filtered };
    saveExercises(updated);
    onClose();
  }

  return (
    <div style={{ padding: '0 0.25rem' }}>
      <div className="editor-list">
        {list.map((name, idx) => (
          <div
            key={idx}
            className="editor-item"
            draggable
            onDragStart={() => onDragStart(idx)}
            onDragEnter={() => onDragEnter(idx)}
            onDragEnd={onDragEnd}
            onDragOver={e => e.preventDefault()}
            style={{
              opacity: dragging === idx ? 0.4 : 1,
              background: dragOver === idx ? 'var(--surface-3)' : undefined,
            }}
          >
            <GripVertical size={16} className="drag-handle" />
            <input
              className="input"
              style={{ flex: 1 }}
              value={name}
              onChange={e => renameExercise(idx, e.target.value)}
            />
            <button
              className="btn btn-icon btn-ghost"
              onClick={() => removeExercise(idx)}
              style={{ color: 'var(--red)', flexShrink: 0 }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Add new exercise */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
        <input
          className="input"
          placeholder="Add exercise…"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addExercise()}
        />
        <button className="btn btn-primary btn-icon" onClick={addExercise} disabled={!newName.trim()}>
          <Plus size={16} />
        </button>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleSave}>
          <Check size={15} /> Save exercises
        </button>
        <button className="btn btn-ghost" onClick={onClose}>
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
