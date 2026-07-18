// Game banner: renders the game's photo when there is one, else the sport's
// stock banner served by the API (/sports/<slug>.jpg), falling back to a green
// gradient with the sport icon if the image is missing or fails to load.
import { useEffect, useState } from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SportIcon } from '@/components/ui/sport-icon';
import { mediaUrl } from '@/lib/api-config';

// Resolve a game's photo_url to a displayable URI:
// - local picks (file://, content://) pass through,
// - stock banners (/sports/<slug>.svg|jpg) resolve under the API, preferring
//   the .jpg (RN Image can't render the .svg placeholder),
// - any other value (http URL / relative path) resolves under the API.
export function bannerUri(photoUrl?: string | null): string | null {
  if (!photoUrl) return null;
  if (/^(file|content):\/\//i.test(photoUrl)) return photoUrl;
  const path = photoUrl.startsWith('/sports/') ? photoUrl.replace(/\.svg$/i, '.jpg') : photoUrl;
  return mediaUrl(path);
}

type Props = {
  sport?: string;
  photoUrl?: string | null;
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
};

export function GameBanner({ sport, photoUrl, iconSize = 64, style }: Props) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [photoUrl]);

  const uri = failed ? null : bannerUri(photoUrl);

  return (
    <View style={[styles.wrap, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <LinearGradient colors={['#2F8F4E', '#1F6B3E']} style={StyleSheet.absoluteFill}>
          <View style={styles.iconWrap}>
            <SportIcon sport={sport} size={iconSize} color="rgba(255,255,255,0.55)" />
          </View>
        </LinearGradient>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden' },
  iconWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
