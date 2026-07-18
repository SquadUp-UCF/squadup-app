// Handles part of game card display 
export function formatGameDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }) + ', ' + date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function activePlayerCount(game: { participants: { status: string }[] }): number {
  return game.participants.filter((p) => p.status === 'joined').length;
}

// Compact age stamp for notification rows ("now", "5m", "3h", "2d"), falling
// back to a date once a week has passed.
export function formatRelativeTime(isoString: string): string {
  const then = new Date(isoString).getTime();
  if (Number.isNaN(then)) return '';

  const minutes = Math.round((Date.now() - then) / 60000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;

  return new Date(then).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}