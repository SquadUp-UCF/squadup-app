// Custom Spikeball (roundnet) icon — there's no built-in glyph for it, so this
// is drawn to match the line/stroke style of the @expo/vector-icons sport
// icons: a small round net on legs with the ball above it. Driven by `size`
// and `color` like the other icons.
import Svg, { Circle, Ellipse, Line } from 'react-native-svg';

type Props = {
  size?: number;
  color?: string;
};

export function SpikeballIcon({ size = 24, color = '#000' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Ball, mid-bounce above the net */}
      <Circle cx="15.5" cy="5.5" r="2.3" fill={color} />
      {/* Net rim */}
      <Ellipse cx="11" cy="15" rx="8" ry="3.4" stroke={color} strokeWidth="1.6" />
      {/* Netting */}
      <Line x1="3.2" y1="15" x2="18.8" y2="15" stroke={color} strokeWidth="1.1" />
      <Line x1="7" y1="12" x2="9" y2="18" stroke={color} strokeWidth="1" />
      <Line x1="15" y1="12" x2="13" y2="18" stroke={color} strokeWidth="1" />
      {/* Legs */}
      <Line x1="5.5" y1="17.4" x2="4.3" y2="21" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="11" y1="18.4" x2="11" y2="21.6" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="16.5" y1="17.4" x2="17.7" y2="21" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}
