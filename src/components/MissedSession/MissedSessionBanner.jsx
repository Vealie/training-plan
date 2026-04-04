import { AlertTriangle, ChevronRight } from 'lucide-react';
import { getMissedSessions, suggestMakeupDates, formatDate } from '../../utils/dateUtils.js';
import { useData } from '../../contexts/DataContext.jsx';
import { DAY_META } from '../../data/defaultExercises.js';

export default function MissedSessionBanner({ onSelectDay }) {
  const { sessions } = useData();
  const missed = getMissedSessions(sessions);
  if (!missed.length) return null;

  const suggestions = suggestMakeupDates(missed);

  return (
    <div className="missed-banner">
      <div className="missed-banner-title">
        <AlertTriangle size={15} />
        Missed {missed.length === 1 ? 'session' : 'sessions'}
      </div>

      {suggestions.map(({ missedDay, missedDate, suggestedDate }) => (
        <div key={missedDate} className="missed-item">
          <div>
            <span style={{ color: 'var(--text)' }}>{DAY_META[missedDay]?.emoji} {missedDay}</span>
            <span className="text-dim text-xs" style={{ marginLeft: '0.4rem' }}>
              ({formatDate(missedDate)})
            </span>
            <div className="text-xs text-dim" style={{ marginTop: '0.1rem' }}>
              {DAY_META[missedDay]?.split}
              {suggestedDate && (
                <> · Suggested make-up: <strong style={{ color: 'var(--text-2)' }}>{formatDate(suggestedDate)}</strong></>
              )}
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onSelectDay(missedDay)}
            style={{ color: 'var(--accent)', borderColor: 'var(--accent-dim)', flexShrink: 0 }}
          >
            Log it <ChevronRight size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
