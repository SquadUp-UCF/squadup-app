// Mobile port of squadup-front's src/components/Logo.jsx — same asset, scaled
// to whatever `size` the caller passes.
import { Image } from 'expo-image';

type LogoProps = {
  size?: number;
  // 'cover' is for callers that clip the logo into a rounded badge — the art
  // has to fill the box or the corners round off empty space instead.
  contentFit?: 'contain' | 'cover';
};

export function Logo({ size = 28, contentFit = 'contain' }: LogoProps) {
  return (
    <Image
      source={require('../../../assets/images/logo.png')}
      style={{ width: size, height: size }}
      contentFit={contentFit}
    />
  );
}
