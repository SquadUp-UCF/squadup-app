// Mobile port of squadup-front's src/components/SportIcons.jsx. Same 22-slug
// registry and unknown-sport fallback (a trophy icon), built on the icon sets
// that ship with Expo instead of react-icons.
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

type IconFamily = 'material' | 'community';

const REGISTRY: Record<string, { family: IconFamily; name: string }> = {
  soccer: { family: 'material', name: 'sports-soccer' },
  football: { family: 'material', name: 'sports-football' },
  basketball: { family: 'material', name: 'sports-basketball' },
  baseball: { family: 'material', name: 'sports-baseball' },
  tennis: { family: 'material', name: 'sports-tennis' },
  golf: { family: 'material', name: 'sports-golf' },
  hockey: { family: 'material', name: 'sports-hockey' },
  volleyball: { family: 'material', name: 'sports-volleyball' },
  rugby: { family: 'material', name: 'sports-rugby' },
  cricket: { family: 'material', name: 'sports-cricket' },
  boxing: { family: 'material', name: 'sports-mma' },
  swimming: { family: 'material', name: 'pool' },
  running: { family: 'material', name: 'directions-run' },
  cycling: { family: 'material', name: 'directions-bike' },
  skiing: { family: 'material', name: 'downhill-skiing' },
  snowboard: { family: 'material', name: 'snowboarding' },
  surfing: { family: 'material', name: 'surfing' },
  'table-tennis': { family: 'community', name: 'table-tennis' },
  badminton: { family: 'community', name: 'badminton' },
  bowling: { family: 'community', name: 'bowling' },
  darts: { family: 'community', name: 'bullseye-arrow' },
  esports: { family: 'material', name: 'sports-esports' },
  motorsport: { family: 'material', name: 'sports-motorsports' },
};

const FALLBACK = { family: 'material' as IconFamily, name: 'emoji-events' };

export const availableSports = Object.keys(REGISTRY);

// Turns a registry slug ("table-tennis") into a readable label ("Table Tennis").
export function sportLabel(slug: string) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

type SportIconProps = {
  sport?: string;
  size?: number;
  color?: string;
};

export function SportIcon({ sport, size = 24, color = '#000' }: SportIconProps) {
  const entry = REGISTRY[String(sport || '').toLowerCase()] || FALLBACK;
  if (entry.family === 'community') {
    return <MaterialCommunityIcons name={entry.name as any} size={size} color={color} />;
  }
  return <MaterialIcons name={entry.name as any} size={size} color={color} />;
}
