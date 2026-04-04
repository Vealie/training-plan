/** Epley formula: 1RM = weight × (1 + reps/30) */
export function epley(weight, reps) {
  if (!weight || !reps || reps <= 0) return 0;
  if (reps === 1) return Math.round(weight);
  return Math.round(weight * (1 + reps / 30));
}

/**
 * Computes the best estimated 1RM for an exercise from all logged sessions.
 * Returns null if no data.
 */
export function getBestOneRM(sessions, exerciseName) {
  const sets = sessions.filter(
    s => s.exercise === exerciseName && s.weight > 0 && s.reps > 0
  );
  if (!sets.length) return null;
  return Math.max(...sets.map(s => epley(s.weight, s.reps)));
}

/**
 * Returns the effective 1RM: manual override if set, otherwise computed.
 */
export function getEffectiveOneRM(sessions, exerciseName, oneRMOverrides) {
  const override = oneRMOverrides?.[exerciseName];
  if (override?.manual != null) return override.manual;
  return getBestOneRM(sessions, exerciseName);
}
