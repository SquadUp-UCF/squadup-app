// Home controls: the Feed/Map view toggle plus separated Filter and Sort.
// Filter sits on the left, Sort on the right; each opens a panel downward and
// turns green (active) while open. Sort is hidden in Map view. All state lives
// in the parent (home); this is presentational. Styled with the shared theme.
import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Switch } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { PulsingDot } from '@/components/ui/pulsing-dot';
import { availableSports, sportLabel } from '@/components/ui/sport-icon';
import { SKILL_LEVELS, type SkillLevel } from '@/constants/skills';
import { colors, fonts, fontSizes, radii, spacing } from '@/constants/theme';

export type ViewMode = 'feed' | 'map';
export type SortKey = 'distance' | 'recent' | 'players';
// The levels and their labels live in constants/skills, shared with the game
// cards so a level can't be called one thing here and another there.
export type SkillFilter = SkillLevel;

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'distance', label: 'Distance' },
  { value: 'recent', label: 'Most Recent' },
  { value: 'players', label: 'Player Count' },
];

type Props = {
  viewMode: ViewMode;
  onViewMode: (mode: ViewMode) => void;
  sports: string[]; // [] = all sports; multiple = OR
  onToggleSport: (sport: string) => void;
  skills: SkillFilter[]; // [] = any skill; multiple = OR
  onToggleSkill: (skill: SkillFilter) => void;
  savedOnly: boolean;
  onSavedOnly: (value: boolean) => void;
  sort: SortKey;
  onSort: (sort: SortKey) => void;
  distanceNote?: string | null;
};

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export function FeedControls({
  viewMode,
  onViewMode,
  sports,
  onToggleSport,
  skills,
  onToggleSkill,
  savedOnly,
  onSavedOnly,
  sort,
  onSort,
  distanceNote,
}: Props) {
  const [openPanel, setOpenPanel] = useState<'filter' | 'sort' | null>(null);
  const filterOpen = openPanel === 'filter';
  const sortOpen = openPanel === 'sort';
  const hasFilters = sports.length > 0 || skills.length > 0;

  function setView(mode: ViewMode) {
    if (mode === 'map' && sortOpen) setOpenPanel(null);
    onViewMode(mode);
  }

  const filterColor = filterOpen || hasFilters ? colors.green : colors.text;
  const sortColor = sortOpen ? colors.green : colors.text;
  const savedColor = savedOnly ? colors.green : colors.text;

  return (
    <View style={styles.wrap}>
      <View style={styles.toggleRow}>
        <Text
          style={[styles.toggleLabel, styles.toggleLabelLeft, viewMode === 'feed' && styles.toggleLabelActive]}
          numberOfLines={1}
        >
          Feed View
        </Text>
        <Switch
          value={viewMode === 'map'}
          onValueChange={(v) => setView(v ? 'map' : 'feed')}
          trackColor={{ false: colors.borderStrong, true: colors.green }}
          thumbColor={colors.white}
          ios_backgroundColor={colors.borderStrong}
          style={styles.toggleSwitch}
        />
        <Text
          style={[styles.toggleLabel, styles.toggleLabelRight, viewMode === 'map' && styles.toggleLabelActive]}
          numberOfLines={1}
        >
          Map View
        </Text>
      </View>

      <View style={styles.controlsRow}>
        <Pressable style={styles.control} onPress={() => setOpenPanel(filterOpen ? null : 'filter')}>
          <Feather name="filter" size={16} color={filterColor} />
          <Text style={[styles.controlText, { color: filterColor }]}>Filter</Text>
        </Pressable>

        {viewMode === 'feed' ? (
          <Pressable style={styles.control} onPress={() => setOpenPanel(sortOpen ? null : 'sort')}>
            <Feather name="chevrons-down" size={18} color={sortColor} />
            <Text style={[styles.controlText, { color: sortColor }]}>Sort</Text>
          </Pressable>
        ) : null}

        <Pressable style={styles.control} onPress={() => onSavedOnly(!savedOnly)}>
          <Ionicons name={savedOnly ? 'heart' : 'heart-outline'} size={17} color={savedColor} />
          <Text style={[styles.controlText, { color: savedColor }]}>Saved</Text>
        </Pressable>

        {viewMode === 'map' ? (
          <View style={styles.liveOnlyBadge}>
            <PulsingDot color={colors.live.color} size={6} />
            <Text style={styles.liveOnlyText}>Live Only</Text>
          </View>
        ) : null}
      </View>

      {filterOpen ? (
        <ScrollView style={styles.panel} contentContainerStyle={styles.panelContent} nestedScrollEnabled>
          <Text style={styles.group}>By Sport</Text>
          <View style={styles.wrapRow}>
            {availableSports.map((s) => (
              <Chip
                key={s}
                label={sportLabel(s)}
                selected={sports.includes(s)}
                onPress={() => onToggleSport(s)}
              />
            ))}
          </View>

          <Text style={styles.group}>By Skill Level</Text>
          <View style={styles.wrapRow}>
            {SKILL_LEVELS.map((s) => (
              <Chip
                key={s.value}
                label={s.label}
                selected={skills.includes(s.value)}
                onPress={() => onToggleSkill(s.value)}
              />
            ))}
          </View>
        </ScrollView>
      ) : null}

      {sortOpen && viewMode === 'feed' ? (
        <View style={styles.panel}>
          <View style={styles.wrapRow}>
            {SORTS.map((s) => (
              <Chip key={s.value} label={s.label} selected={sort === s.value} onPress={() => onSort(s.value)} />
            ))}
          </View>
          {sort === 'distance' && distanceNote ? <Text style={styles.note}>{distanceNote}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  // Bigger Feed/Map toggle, centred: equal-width (flex) labels put the switch on
  // the screen's centre line, and stop it shifting when the active label bolds.
  // Set apart from the Filter/Sort/Saved toolbar below with marginBottom.
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg, paddingVertical: spacing.sm, marginBottom: spacing.md },
  toggleSwitch: { transform: [{ scaleX: 1.3 }, { scaleY: 1.3 }] },
  toggleLabel: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: fontSizes.lg, color: colors.muted },
  toggleLabelLeft: { textAlign: 'right' },
  toggleLabelRight: { textAlign: 'left' },
  toggleLabelActive: { color: colors.text, fontFamily: fonts.bodyBold },
  // Pinned to the right of the Filter/Sort/Saved row (map view only), flagging
  // that the map is scoped to live/soon games.
  liveOnlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginLeft: 'auto',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.live.bg,
  },
  liveOnlyText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.live.color },
  controlsRow: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', gap: spacing.xl },
  control: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  controlText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md },
  panel: {
    maxHeight: 260,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  panelContent: { gap: spacing.sm, paddingBottom: spacing.md },
  group: { fontFamily: fonts.headingBold, fontSize: fontSizes.xs, textTransform: 'uppercase', letterSpacing: 0.6, color: colors.muted, marginTop: 2 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.green, borderColor: colors.green },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.text },
  chipTextSelected: { color: colors.white, fontFamily: fonts.bodyBold },
  note: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.muted, marginTop: spacing.sm },
});
