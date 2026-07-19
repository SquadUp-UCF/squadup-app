// Ported from squadup-front's --su-* palette (AuthShell.css) and status
// colors (utils/games.js STATUS_META), so mobile and web read as one product.

export const colors = {
  green: '#1b7a32',
  greenDeep: '#0d4a1e',
  greenAccent: '#a8e6b8',
  text: '#0d2b18',
  muted: '#6b9478',
  surface: '#eaf4e4',
  border: 'rgba(13, 80, 40, 0.14)',
  borderStrong: 'rgba(13, 80, 40, 0.22)',
  white: '#ffffff',
  danger: '#c42828',
  dangerBg: '#fdeaea',

  statusOpen: { bg: '#E4F3E8', color: '#1F6B3E', label: 'Open' },
  statusConfirmed: { bg: '#DCEAFB', color: '#1B5FA8', label: 'Confirmed' },
  statusLocked: { bg: '#FBE9DC', color: '#A85B1B', label: 'Full' },
  statusCompleted: { bg: '#ECECEC', color: '#555555', label: 'Completed' },
  statusCancelled: { bg: '#F8DCDC', color: '#A81B1B', label: 'Cancelled' },
  live: { bg: '#FDE6E6', color: '#C81E1E' },
  fillingUp: '#E4572E',
  new: { bg: '#E4F3E8', color: '#1F6B3E' },

  // Skill level, as a difficulty gradient: green is easy going, red is serious.
  // Deliberately their own entries rather than borrowed status colors — a game
  // can be both `open` (green status) and `pro` (red skill), so the two scales
  // have to be free to disagree. The text tones are dark rather than the pure
  // hue so each clears WCAG AA against its own background; a literal yellow
  // would be unreadable at this size.
  skillBeginner: { bg: '#E4F3E8', color: '#1F6B3E' },
  skillIntermediate: { bg: '#FBF0D0', color: '#7A5807' },
  skillPro: { bg: '#F8DCDC', color: '#A81B1B' },
} as const;

export const fonts = {
  heading: 'Outfit_800ExtraBold',
  headingBold: 'Outfit_700Bold',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodyBold: 'DMSans_700Bold',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const fontSizes = {
  xs: 12,
  sm: 13,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 28,
  display: 30,
} as const;
