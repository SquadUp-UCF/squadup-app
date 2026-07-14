// Mobile port of squadup-front's src/components/Logo.jsx — same asset, scaled
// to whatever `size` the caller passes.
import { Image } from 'expo-image';

type LogoProps = {
  size?: number;
};

export function Logo({ size = 28 }: LogoProps) {
  return (
    <Image
      source={require('../../../assets/images/logo.png')}
      style={{ width: size, height: size }}
      contentFit="contain"
    />
  );
}
