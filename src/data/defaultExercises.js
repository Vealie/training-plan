export const DEFAULT_EXERCISES = {
  Monday: [
    'Bench Press',
    'Incline Dumbbell Press',
    'Cable Flyes',
    'Tricep Pushdown',
    'Skull Crushers',
    'Dips',
  ],
  Tuesday: [
    'Barbell Squats',
    'Romanian Deadlifts',
    'Leg Press',
    'Leg Curls',
    'Walking Lunges',
    'Calf Raises',
  ],
  Thursday: [
    'Pull-ups',
    'Barbell Rows',
    'Lat Pulldown',
    'Seated Cable Row',
    'Barbell Bicep Curls',
    'Hammer Curls',
  ],
  Friday: [
    'Bench Press',
    'Incline Dumbbell Press',
    'Overhead Press',
    'Lateral Raises',
    'Front Raises',
    'Close-Grip Bench Press',
  ],
  Saturday: [
    'Barbell Squats',
    'Romanian Deadlifts',
    'Leg Press',
    'Hip Thrusts',
    'Leg Curls',
    'Calf Raises',
  ],
};

export const DAY_META = {
  Monday:   { split: 'Chest + Triceps',   emoji: '💪', color: '#4f8ef7' },
  Tuesday:  { split: 'Legs',              emoji: '🦵', color: '#a78bfa' },
  Thursday: { split: 'Back + Biceps',     emoji: '🏋️', color: '#34d399' },
  Friday:   { split: 'Chest + Shoulders', emoji: '💪', color: '#f97316' },
  Saturday: { split: 'Legs',              emoji: '🦵', color: '#a78bfa' },
};

export const WORKOUT_DAYS = ['Monday', 'Tuesday', 'Thursday', 'Friday', 'Saturday'];

// Day index → day name (JS getDay() returns 0=Sun…6=Sat)
export const JS_DAY_TO_NAME = {
  0: null,
  1: 'Monday',
  2: 'Tuesday',
  3: null,
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};
