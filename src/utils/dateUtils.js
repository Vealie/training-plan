import { WORKOUT_DAYS, JS_DAY_TO_NAME } from '../data/defaultExercises.js';

export function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function dateStr(date) {
  return date.toISOString().split('T')[0];
}

/** Returns the day name for a YYYY-MM-DD string */
export function getDayName(dateString) {
  // Add T12:00:00 to avoid timezone edge cases
  const d = new Date(dateString + 'T12:00:00');
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return names[d.getDay()];
}

/** Formats a date string nicely, e.g. "Mon 15 Jan" */
export function formatDate(dateString) {
  const d = new Date(dateString + 'T12:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

/**
 * Returns the schedule for the current week (Mon…Sat) with status info.
 * Each entry: { date, day, isToday, isPast }
 */
export function getWeekSchedule() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayNum = today.getDay(); // 0=Sun

  // Find the Monday of the current week
  const mondayOffset = (todayNum === 0 ? -6 : 1 - todayNum);
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  const schedule = [];
  // Day offsets from Monday: Mon=0, Tue=1, Thu=3, Fri=4, Sat=5
  const offsets = { Monday: 0, Tuesday: 1, Thursday: 3, Friday: 4, Saturday: 5 };

  for (const day of WORKOUT_DAYS) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + offsets[day]);
    const ds = dateStr(d);
    schedule.push({
      date: ds,
      day,
      isToday: ds === dateStr(today),
      isPast: d < today,
    });
  }

  return schedule;
}

/**
 * Returns the date string for a given workout day name in the current week.
 */
export function dateForDayThisWeek(dayName) {
  const entry = getWeekSchedule().find(s => s.day === dayName);
  return entry ? entry.date : todayStr();
}

/**
 * Detects missed workout days over the past `lookback` days.
 * Returns array of { date, day } for each missed session.
 */
export function getMissedSessions(sessions, lookback = 14) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sessionDates = new Set(sessions.map(s => s.date));
  const missed = [];

  for (let i = 1; i <= lookback; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const jsDay = d.getDay();
    const dayName = JS_DAY_TO_NAME[jsDay];

    if (dayName) {
      const ds = dateStr(d);
      if (!sessionDates.has(ds)) {
        missed.push({ date: ds, day: dayName });
      }
    }
  }

  return missed.slice(0, 3);
}

/**
 * Suggests reschedule dates for missed sessions.
 * Returns an array of { missedDay, suggestedDate } avoiding days already scheduled this week.
 */
export function suggestMakeupDates(missedSessions) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekSchedule = getWeekSchedule();
  const scheduledDates = new Set(weekSchedule.map(s => s.date));
  const suggestions = [];

  // Find free days in the next 7 days
  const freeDays = [];
  for (let i = 0; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const ds = dateStr(d);
    if (!scheduledDates.has(ds)) {
      freeDays.push(ds);
    }
  }

  missedSessions.forEach((missed, idx) => {
    suggestions.push({
      missedDay: missed.day,
      missedDate: missed.date,
      suggestedDate: freeDays[idx] || null,
    });
  });

  return suggestions;
}
