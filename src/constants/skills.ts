// The skill level a game is pitched at. Shared between the feed's filter and
// the game cards so the two can never label the same level differently.
import { colors } from '@/constants/theme';
import type { Game } from '@/types/game';

export type SkillLevel = NonNullable<Game['skill_level']>;

export const SKILL_LEVELS: { value: SkillLevel; label: string }[] = [
  { value: 'all', label: 'Everyone' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'pro', label: 'Pro' },
];

const LABELS = new Map(SKILL_LEVELS.map((s) => [s.value, s.label]));

type SkillBadge = { label: string; bg: string; color: string };

// `all` has no entry: it isn't a rung on the ladder, it's the absence of one.
const BADGES: Partial<Record<SkillLevel, { bg: string; color: string }>> = {
  beginner: colors.skillBeginner,
  intermediate: colors.skillIntermediate,
  pro: colors.skillPro,
};

/**
 * How a game should advertise its level, or null when it shouldn't.
 *
 * `all` is the API's default for a game that never named a level, so it means
 * "no restriction" rather than a deliberate choice — a badge saying "Everyone"
 * would put a qualifier on the majority of cards while telling the reader
 * nothing they wouldn't already assume. Those show the sport alone.
 *
 * A level this build doesn't know — a newer one added server-side — is also
 * left off rather than guessed at, since inventing a colour for it would be
 * asserting a difficulty we can't actually place on the scale.
 */
export function gameSkillBadge(level: Game['skill_level']): SkillBadge | null {
  if (!level || level === 'all') return null;
  const label = LABELS.get(level);
  const badge = BADGES[level];
  if (!label || !badge) return null;
  return { label, ...badge };
}
