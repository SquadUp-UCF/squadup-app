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