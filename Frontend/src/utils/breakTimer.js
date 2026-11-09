export const getBreakElapsedSeconds = (breakItem, now = Date.now()) => {
  const durationSeconds = Number(breakItem.break_duration_seconds);
  const fallbackMinutes = Number(breakItem.break_duration_minutes) || 0;
  const baseSeconds = Number.isFinite(durationSeconds)
    ? Math.max(0, durationSeconds)
    : Math.max(0, fallbackMinutes * 60);
  const receivedAt = Number(breakItem._durationReceivedAt);

  if (!Number.isFinite(receivedAt)) return baseSeconds;

  return baseSeconds + Math.max(0, Math.floor((now - receivedAt) / 1000));
};
