// Suggested positions per sport, keyed by sport slug (see components/ui/
// sport-icon availableSports). Free text; sports not listed here (golf, running,
// …) simply offer no position options.
export const POSITIONS_BY_SPORT: Record<string, readonly string[]> = {
  soccer: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
  football: [
    'Quarterback',
    'Running Back',
    'Wide Receiver',
    'Offensive Line',
    'Defensive Line',
    'Linebacker',
    'Defensive Back',
  ],
  basketball: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'],
  baseball: ['Pitcher', 'Catcher', 'Infield', 'Outfield'],
  tennis: ['Singles', 'Doubles'],
  hockey: ['Goaltender', 'Defense', 'Center', 'Wing'],
  volleyball: ['Setter', 'Outside Hitter', 'Middle Blocker', 'Opposite', 'Libero'],
  rugby: ['Forward', 'Back'],
  cricket: ['Batter', 'Bowler', 'All-rounder', 'Wicketkeeper'],
  'table-tennis': ['Singles', 'Doubles'],
  badminton: ['Singles', 'Doubles'],
};

export function positionsForSport(sport: string): readonly string[] {
  return POSITIONS_BY_SPORT[sport] ?? [];
}
