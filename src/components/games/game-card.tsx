// game cards — mirrors squadup-front's PostsList.jsx GameCard: banner, status
// badges, join-progress bar, and join/leave or host edit/delete actions.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { Game } from '@/types/game';
import { formatGameDateTime } from '@/utils/format';
import { activeCount, isLive, isNew, statusMeta } from '@/utils/games';
import { SportIcon, sportLabel } from '@/components/ui/sport-icon';
import { GameBanner } from '@/components/games/game-banner';
import { Badge } from '@/components/ui/badge';
import { useSavedGames } from '@/contexts/saved-games-context';
import { colors, fonts, fontSizes, radii, spacing } from '@/constants/theme';

type GameCardProps = {
  game: Game;
  currentUserId?: string;
  onPress?: () => void;
  onJoin?: (game: Game) => void;
  joiningId?: string | null;
  onLeave?: (game: Game) => void;
  leavingId?: string | null;
  onEdit?: (game: Game) => void;
  onDelete?: (game: Game) => void;
  deletingId?: string | null;
};

export function GameCard({
  game,
  currentUserId,
  onPress,
  onJoin,
  joiningId,
  onLeave,
  leavingId,
  onEdit,
  onDelete,
  deletingId,
}: GameCardProps) {
  const { isSaved, toggleSaved } = useSavedGames();
  const liked = isSaved(game.id);
  const meta = statusMeta(game);
  const joined = activeCount(game);
  const live = isLive(game);
  const ratio = game.max_players > 0 ? Math.min(1, joined / game.max_players) : 0;
  // Where min_players sits on the same scale as the fill, so the bar shows how
  // far the game is from going ahead — not just how full it is. Hidden when the
  // minimum is the whole roster, where the marker would sit on the end cap and
  // say nothing.
  const minRatio = game.max_players > 0 ? game.min_players / game.max_players : 0;
  const showMinMarker = minRatio > 0 && minRatio < 1;
  const fillingUp = ratio >= 0.8 && game.status !== 'locked' && game.status !== 'completed';
  const barColor = ratio >= 0.8 ? colors.fillingUp : '#2F8F4E';

  const isHost = Boolean(currentUserId) && game.host === currentUserId;
  const alreadyIn = game.participants.some((p) => p.user === currentUserId && p.status === 'joined');
  const joinable =
    !isHost && !alreadyIn && game.status !== 'locked' && game.status !== 'completed' && game.status !== 'cancelled';

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.banner}>
        <GameBanner sport={game.sport} photoUrl={game.photo_url} iconSize={64} style={StyleSheet.absoluteFill} />

        <View style={styles.badgesLeft}>
          {live ? (
            <Badge label="LIVE" bg={colors.live.bg} color={colors.live.color} />
          ) : (
            isNew(game) && <Badge label="✨ NEW" bg={colors.new.bg} color={colors.new.color} />
          )}
          {fillingUp && <Badge label="Filling up" bg={colors.fillingUp} color={colors.white} />}
        </View>

        <View style={styles.badgesRight}>
          {isHost ? (
            <>
              <IconButton onPress={() => onEdit?.(game)}>
                <Feather name="edit-2" size={16} color={colors.statusOpen.color} />
              </IconButton>
              <IconButton onPress={() => onDelete?.(game)} disabled={deletingId === game.id}>
                <Feather name="trash-2" size={16} color={colors.statusCancelled.color} />
              </IconButton>
            </>
          ) : (
            <IconButton onPress={() => toggleSaved(game.id)}>
              <Feather name="heart" size={16} color={liked ? colors.fillingUp : '#666'} />
            </IconButton>
          )}
        </View>
      </View>

      <View style={styles.body}>
        <View style={[styles.sportPill, { backgroundColor: meta.bg }]}>
          <SportIcon sport={game.sport} size={14} color={meta.color} />
          <Text style={[styles.sportPillLabel, { color: meta.color }]}>{sportLabel(game.sport)}</Text>
        </View>

        <View style={styles.titleRow}>
          <Feather name="map-pin" size={16} color="#2F8F4E" />
          <Text style={styles.title} numberOfLines={1}>
            {game.location}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <View style={[styles.metaItem, styles.metaItemShrink]}>
            <Feather name="clock" size={13} color={colors.muted} />
            <Text style={styles.metaText} numberOfLines={1}>
              {formatGameDateTime(game.start_time)}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="users" size={13} color={colors.muted} />
            <Text style={styles.metaText}>
              {joined} / {game.max_players} · min {game.min_players}
            </Text>
          </View>
        </View>

        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${ratio * 100}%`, backgroundColor: barColor }]} />
          {showMinMarker && (
            <View style={[styles.barMinMarker, { left: `${minRatio * 100}%` }]} />
          )}
        </View>

        {!isHost && alreadyIn && (
          <Pressable
            style={[styles.actionBtn, styles.leaveBtn]}
            onPress={() => onLeave?.(game)}
            disabled={leavingId === game.id}
          >
            <Text style={styles.leaveLabel}>{leavingId === game.id ? 'Leaving…' : "You're in — Leave"}</Text>
          </Pressable>
        )}
        {!isHost && !alreadyIn && (
          <Pressable
            style={[styles.actionBtn, joinable ? styles.joinBtn : styles.joinBtnDisabled]}
            onPress={() => onJoin?.(game)}
            disabled={!joinable || joiningId === game.id}
          >
            <Text style={joinable ? styles.joinLabel : styles.joinLabelDisabled}>
              {game.status === 'locked' ? 'Full' : joiningId === game.id ? 'Joining…' : 'Join game'}
            </Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

function IconButton({
  onPress,
  disabled,
  children,
}: {
  onPress: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Pressable style={[styles.iconBtn, disabled && styles.iconBtnDisabled]} onPress={onPress} disabled={disabled}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  banner: { height: 140, alignItems: 'center', justifyContent: 'center' },
  bannerIcon: { alignItems: 'center', justifyContent: 'center' },
  badgesLeft: { position: 'absolute', top: spacing.sm, left: spacing.sm, gap: 6 },
  badgesRight: { position: 'absolute', top: spacing.sm, right: spacing.sm, flexDirection: 'row', gap: 6 },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnDisabled: { opacity: 0.5 },
  body: { padding: spacing.md, gap: 6 },
  sportPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  sportPillLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, textTransform: 'capitalize' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontFamily: fonts.headingBold, fontSize: fontSizes.lg, color: colors.text, flexShrink: 1 },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  // Only the date gives way when the row is too narrow — truncating the counts
  // would defeat the point of showing them.
  metaItemShrink: { flexShrink: 1 },
  metaText: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.muted },
  barTrack: { height: 5, borderRadius: 3, backgroundColor: '#eee', overflow: 'hidden', marginTop: 4 },
  barFill: { height: '100%', borderRadius: 3 },
  // Notch on the track marking min_players. Sits above the fill and reads
  // against both the filled and empty halves.
  barMinMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    backgroundColor: 'rgba(13, 43, 24, 0.45)',
  },
  actionBtn: { marginTop: spacing.sm, borderRadius: radii.md, paddingVertical: 11, alignItems: 'center' },
  joinBtn: { backgroundColor: colors.green },
  joinBtnDisabled: { backgroundColor: '#E4E4E4' },
  joinLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.white },
  joinLabelDisabled: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: '#999' },
  leaveBtn: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
  leaveLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.green },
});
